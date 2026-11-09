import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolvePlatformKey } from "@/lib/platform-keys";
import { plausiblePersonName } from "@/lib/services/owner-discovery";
import { cleanDomain, splitFullName } from "@/lib/services/sme-intelligence";
import { evaluateEmail, normalizePhone } from "./acceptance";
import { ADAPTERS, getEnrichmentSettings, orderFor, type EnrichmentSettings } from "./registry";
import type {
  AcceptedField,
  AdapterOutcome,
  EnrichmentTarget,
  FoundFields,
  NormalizedInput,
  ProviderAdapter,
  ProviderId,
  RowResult,
  TrackState,
} from "./types";

/**
 * Waterfall orchestrator (blueprint p.5 and p.10).
 *
 * One row is processed track by track. Each track walks its provider order and stops as
 * soon as its own field passes acceptance; other tracks are never extended to "fill"
 * another field. Every provider call is an attempt with a unique key, so a retry, a worker
 * restart or a re-claimed row reuses the stored outcome instead of paying again.
 */

export type JobPreset = {
  order?: Partial<Record<EnrichmentTarget, ProviderId[]>>;
  /** Pay for an owner mobile reveal (Prospeo: 10 vendor credits) */
  revealMobile: boolean;
};

export type RowInput = {
  businessName: string;
  website?: string | null;
  ownerName?: string | null;
  ownerTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  linkedinUrl?: string | null;
};

type RowState = {
  tracks: Partial<Record<EnrichmentTarget, TrackState>>;
  /** Customer credit reserved for this row (released if nothing new is accepted) */
  reserved: number;
  /** Providers that failed with auth / no_credit during this job: skip them */
  unusable: Partial<Record<ProviderId, string>>;
};

const MAX_RATE_RETRIES = 3;
const LOCK_STALE_MINUTES = 5;
const ATTEMPT_TERMINAL = new Set(["succeeded", "not_found", "error", "no_credit", "unknown", "skipped"]);

// ---------------------------------------------------------------------------
// Input normalization
// ---------------------------------------------------------------------------

export function normalizeInput(raw: RowInput): NormalizedInput {
  const website = raw.website?.trim() || null;
  const domain = cleanDomain(website);
  const businessName = (raw.businessName || "").trim();
  const ownerName =
    raw.ownerName && plausiblePersonName(raw.ownerName, businessName) ? raw.ownerName.trim() : null;
  const { firstName, lastName } = splitFullName(ownerName);
  return {
    businessName,
    domain,
    website: website ? (website.startsWith("http") ? website : `https://${website}`) : null,
    ownerName,
    ownerFirstName: firstName,
    ownerLastName: lastName,
    ownerTitle: raw.ownerTitle?.trim() || null,
    email: raw.email?.trim().toLowerCase() || null,
    phone: raw.phone?.trim() || null,
    city: raw.city?.trim() || null,
    state: raw.state?.trim() || null,
    country: (raw.country?.trim() || "US").toUpperCase().slice(0, 2),
    linkedinUrl: raw.linkedinUrl?.trim() || null,
  };
}

function withOwner(input: NormalizedInput, name: string, title?: string | null): NormalizedInput {
  const { firstName, lastName } = splitFullName(name);
  return { ...input, ownerName: name, ownerFirstName: firstName, ownerLastName: lastName, ownerTitle: title ?? input.ownerTitle };
}

function inputHash(input: NormalizedInput, target: EnrichmentTarget): string {
  const key = [target, input.businessName, input.domain, input.ownerFirstName, input.ownerLastName].join("|").toLowerCase();
  return createHash("sha256").update(key).digest("hex").slice(0, 24);
}

// ---------------------------------------------------------------------------
// Provider concurrency (per vendor account, shared by all jobs on this server)
// ---------------------------------------------------------------------------

const inFlight = new Map<ProviderId, number>();
const waiters = new Map<ProviderId, Array<() => void>>();

async function acquire(adapter: ProviderAdapter): Promise<() => void> {
  const id = adapter.id;
  while ((inFlight.get(id) ?? 0) >= adapter.concurrency) {
    await new Promise<void>((resolve) => {
      const q = waiters.get(id) ?? [];
      q.push(resolve);
      waiters.set(id, q);
    });
  }
  inFlight.set(id, (inFlight.get(id) ?? 0) + 1);
  return () => {
    inFlight.set(id, Math.max(0, (inFlight.get(id) ?? 1) - 1));
    waiters.get(id)?.shift()?.();
  };
}

// ---------------------------------------------------------------------------
// Budget and charging
// ---------------------------------------------------------------------------

/** Atomically reserve the per-row fee within the job budget. Concurrent workers cannot overshoot. */
async function reserveRowBudget(jobId: string, fee: number): Promise<boolean> {
  if (fee <= 0) return true;
  const n = await prisma.$executeRaw`
    UPDATE "EnrichmentJob"
    SET "creditsReserved" = "creditsReserved" + ${fee}
    WHERE id = ${jobId} AND "creditsReserved" + "creditsUsed" + ${fee} <= "budgetCredits" + 0.000001`;
  return n === 1;
}

async function releaseReserve(jobId: string, amount: number) {
  if (amount <= 0) return;
  await prisma.$executeRaw`
    UPDATE "EnrichmentJob" SET "creditsReserved" = GREATEST(0, "creditsReserved" - ${amount}) WHERE id = ${jobId}`;
}

/**
 * Charge the customer once for this row. The unique EnrichmentCharge.rowId plus the balance
 * update and ledger entry run in one transaction: a retry can never bill twice.
 * Returns the amount charged (0 if already charged) or throws INSUFFICIENT_CREDITS.
 */
export async function chargeRowOnce(
  userId: string,
  jobId: string,
  rowId: string,
  amount: number,
  releaseReserved = 0,
): Promise<number> {
  if (amount <= 0) return 0;
  if (await prisma.enrichmentCharge.findUnique({ where: { rowId }, select: { id: true } })) return 0;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.enrichmentCharge.create({ data: { rowId, jobId, userId, credits: amount } });
      const updated = await tx.user.updateMany({
        where: { id: userId, creditsRemaining: { gte: amount } },
        data: { creditsRemaining: { decrement: amount } },
      });
      if (updated.count !== 1) throw new Error("INSUFFICIENT_CREDITS");
      await tx.creditLedger.create({
        data: { userId, amount: -amount, action: "waterfall_enrich", reference: `enrich:${jobId}:${rowId}` },
      });
      // Move the row's reservation into "used" in the same transaction.
      await tx.$executeRaw`
        UPDATE "EnrichmentJob"
        SET "creditsUsed" = "creditsUsed" + ${amount},
            "creditsReserved" = GREATEST(0, "creditsReserved" - ${releaseReserved})
        WHERE id = ${jobId}`;
    });
    return amount;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return 0;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

type StoredOutcome = AdapterOutcome;

async function recordAttempt(
  base: { attemptKey: string; rowId: string; jobId: string; userId: string; provider: ProviderId; target: EnrichmentTarget; adapterVersion: string; inputHash: string },
  outcome: AdapterOutcome | null,
  status: string,
  extra: { retryCount?: number; nextCheckAt?: Date | null; error?: string | null } = {},
) {
  const cost =
    outcome && (outcome.kind === "found" || outcome.kind === "not_found") ? outcome.vendorCost : null;
  const data = {
    status,
    providerStatus:
      outcome && (outcome.kind === "found" || outcome.kind === "not_found") ? outcome.providerStatus : null,
    upstreamRequestId:
      outcome && (outcome.kind === "pending" || outcome.kind === "found") ? outcome.upstreamRequestId ?? null : null,
    sanitizedError: extra.error ?? (outcome?.kind === "error" ? outcome.message : null),
    vendorUnits: cost ? cost.units : null,
    vendorUnit: cost ? cost.unit : null,
    resultJson: outcome ? JSON.stringify(outcome) : null,
    retryCount: extra.retryCount ?? 0,
    nextCheckAt: extra.nextCheckAt ?? null,
  };
  await prisma.providerAttempt.upsert({
    where: { attemptKey: base.attemptKey },
    update: data,
    create: { ...base, ...data },
  });
}

// ---------------------------------------------------------------------------
// Row processing
// ---------------------------------------------------------------------------

function accepted(
  value: string,
  provider: ProviderId | "input",
  extra: Partial<AcceptedField> = {},
): AcceptedField {
  return { value, provider, checkedAt: new Date().toISOString(), preExisting: provider === "input", ...extra };
}

function requestedTracks(targets: EnrichmentTarget[]): EnrichmentTarget[] {
  // Email and mobile lookups need the owner's name first.
  const set = new Set(targets);
  if (set.has("work_email") || set.has("mobile")) set.add("owner");
  return (["owner", "work_email", "phone", "mobile"] as EnrichmentTarget[]).filter((t) => set.has(t));
}

function harvestExtras(result: RowResult, fields: FoundFields) {
  if (fields.ownerTitle && !result.ownerTitle) result.ownerTitle = fields.ownerTitle;
  if (fields.linkedinUrl && !result.linkedinUrl) result.linkedinUrl = fields.linkedinUrl;
  if (fields.facebook && !result.facebook) result.facebook = fields.facebook;
  if (fields.instagram && !result.instagram) result.instagram = fields.instagram;
  if (fields.website && !result.website) result.website = fields.website;
}

export type ProcessDeps = {
  fetchImpl?: typeof fetch;
  /** Test hook: replaces the platform verifier */
  verify?: (userId: string, email: string) => Promise<{ status: AcceptedField["status"] & string; source: string }>;
  settings?: EnrichmentSettings;
  keys?: Partial<Record<string, string>>;
};

export type ProcessResult = { status: string; waiting: boolean };

/** Process (or resume) one row. Safe to call repeatedly: completed work is never repeated. */
export async function processRow(rowId: string, deps: ProcessDeps = {}): Promise<ProcessResult> {
  const row = await prisma.enrichmentRow.findUnique({ where: { id: rowId }, include: { job: true } });
  if (!row) return { status: "missing", waiting: false };
  const job = row.job;
  const userId = job.userId;

  if (["succeeded", "partial", "not_found", "needs_input", "budget_exceeded", "failed", "cancelled"].includes(row.status)) {
    return { status: row.status, waiting: false };
  }

  const state: RowState = row.trackStateJson
    ? (JSON.parse(row.trackStateJson) as RowState)
    : { tracks: {}, reserved: 0, unusable: {} };
  const result: RowResult = row.resultJson ? (JSON.parse(row.resultJson) as RowResult) : {};
  const targets = JSON.parse(job.targetsJson) as EnrichmentTarget[];
  const preset = JSON.parse(job.presetJson) as JobPreset;
  const settings = deps.settings ?? (await getEnrichmentSettings());

  const persist = async (patch: Partial<{ status: string; nextRunAt: Date; lastError: string | null; charged: number }> = {}) => {
    await prisma.enrichmentRow.update({
      where: { id: row.id },
      data: {
        trackStateJson: JSON.stringify(state),
        resultJson: JSON.stringify(result),
        ...patch,
        ...(patch.status && patch.status !== "running" ? { lockedAt: null, lockedBy: null } : {}),
      },
    });
  };

  // Cancelled job: no new provider calls.
  if (job.cancelRequested) {
    await releaseReserve(job.id, state.reserved);
    state.reserved = 0;
    await persist({ status: "cancelled" });
    await finishRowAccounting(job.id);
    return { status: "cancelled", waiting: false };
  }

  let input = normalizeInput(JSON.parse(row.inputJson) as RowInput);

  // Values already on the input count as satisfied (and are never charged).
  if (input.ownerName && !result.owner) result.owner = accepted(input.ownerName, "input");
  if (result.owner?.value) input = withOwner(input, result.owner.value, result.ownerTitle ?? input.ownerTitle);
  const inputPhone = normalizePhone(input.phone, input.country);
  if (inputPhone && !result.phone) result.phone = accepted(inputPhone, "input", { status: "office" });

  for (const target of requestedTracks(targets)) {
    const track: TrackState = state.tracks[target] ?? { next: 0, done: false };
    state.tracks[target] = track;
    if (track.done) continue;

    // Input email: verify once; only a valid, person-level address satisfies the email track.
    if (target === "work_email" && input.email && track.next === 0 && !result.work_email) {
      const d = await evaluateEmail(
        { value: input.email, providerStatus: null, providerVerified: false, catchAll: false, sourceUrl: null },
        input,
        { userId, fromBusinessWebsite: true, verify: deps.verify as never },
      );
      if (d.decision === "accept") {
        result.work_email = accepted(d.value, "input", { status: d.status, verifiedBy: d.verifiedBy });
      }
    }

    if (isSatisfied(target, result)) {
      track.done = true;
      track.outcome = "accepted";
      continue;
    }

    const order = orderFor(target, settings, preset.order);
    let skippedForInput = 0;
    let anyRan = false;

    for (; track.next < order.length; track.next++) {
      if (isSatisfied(target, result)) break;
      const providerId = order[track.next];
      const adapter = ADAPTERS[providerId];
      const attemptKey = `${row.id}:${target}:${providerId}`;
      const base = {
        attemptKey,
        rowId: row.id,
        jobId: job.id,
        userId,
        provider: providerId,
        target,
        adapterVersion: adapter.version,
        inputHash: inputHash(input, target),
      };

      if (state.unusable[providerId]) continue;

      // Key configured?
      let apiKey = "";
      if (adapter.keyField) {
        apiKey = (deps.keys?.[adapter.keyField] ?? (await resolvePlatformKey(adapter.keyField))).trim();
        if (!apiKey) continue; // not connected: silently not part of this waterfall
      }

      const elig = adapter.eligible(input, target);
      if (!elig.ok) {
        skippedForInput++;
        await recordAttempt(base, null, "skipped", { error: elig.reason });
        continue;
      }

      // Reserve the customer fee before the first paid call on this row.
      if (adapter.paid && state.reserved === 0 && job.feePerRow > 0) {
        const fresh = await prisma.user.findUnique({ where: { id: userId }, select: { creditsRemaining: true } });
        const okBalance = (fresh?.creditsRemaining ?? 0) >= job.feePerRow;
        if (!okBalance || !(await reserveRowBudget(job.id, job.feePerRow))) {
          track.done = true;
          track.outcome = "budget";
          track.reason = okBalance ? "job budget reached" : "not enough credits";
          await settleRow({ row: { id: row.id, jobId: job.id }, userId, fee: job.feePerRow, state, result, targets, persist, budgetStop: true });
          return { status: "budget_exceeded", waiting: false };
        }
        state.reserved = job.feePerRow;
        await persist();
      }

      // Reuse an existing attempt (retry, restart or re-claimed row) instead of paying again.
      const prior = await prisma.providerAttempt.findUnique({ where: { attemptKey } });
      let outcome: AdapterOutcome | null = null;
      const ctx = { apiKey, revealMobile: preset.revealMobile, fetchImpl: deps.fetchImpl };

      if (prior && ATTEMPT_TERMINAL.has(prior.status)) {
        outcome = prior.resultJson ? (JSON.parse(prior.resultJson) as StoredOutcome) : null;
        if (!outcome) continue;
      } else if (prior?.status === "submitting") {
        // Crashed mid-call: the vendor may have charged. Never resubmit blindly.
        await recordAttempt(base, null, "unknown", { error: "outcome unknown after interruption; not resubmitted" });
        continue;
      } else if (prior?.status === "pending" && prior.upstreamRequestId) {
        if (prior.nextCheckAt && prior.nextCheckAt > new Date()) {
          await persist({ status: "waiting_provider", nextRunAt: prior.nextCheckAt });
          return { status: "waiting_provider", waiting: true };
        }
        if (!adapter.resume) {
          await recordAttempt(base, null, "error", { error: "provider cannot resume" });
          continue;
        }
        const release = await acquire(adapter);
        try {
          outcome = await adapter.resume(prior.upstreamRequestId, ctx);
        } finally {
          release();
        }
        anyRan = true;
      } else {
        if (prior?.status === "rate_limited" && prior.nextCheckAt && prior.nextCheckAt > new Date()) {
          await persist({ status: "waiting_provider", nextRunAt: prior.nextCheckAt });
          return { status: "waiting_provider", waiting: true };
        }
        await recordAttempt(base, null, "submitting", { retryCount: prior?.retryCount ?? 0 });
        const release = await acquire(adapter);
        try {
          outcome = await adapter.run(input, target, ctx);
        } catch (err) {
          outcome = { kind: "error", code: "upstream", message: err instanceof Error ? err.message.slice(0, 200) : "adapter error", outcomeUnknown: true };
        } finally {
          release();
        }
        anyRan = true;
      }

      // ---- Interpret the outcome ----
      if (outcome.kind === "pending") {
        const nextCheckAt = new Date(Date.now() + outcome.retryAfterMs);
        await recordAttempt(base, outcome, "pending", { nextCheckAt });
        await persist({ status: "waiting_provider", nextRunAt: nextCheckAt });
        return { status: "waiting_provider", waiting: true };
      }

      if (outcome.kind === "error") {
        if (outcome.code === "rate_limited") {
          const retryCount = (prior?.retryCount ?? 0) + 1;
          if (retryCount <= MAX_RATE_RETRIES) {
            const nextCheckAt = new Date(Date.now() + (outcome.retryAfterMs ?? 60_000));
            await recordAttempt(base, outcome, "rate_limited", { retryCount, nextCheckAt });
            await persist({ status: "waiting_provider", nextRunAt: nextCheckAt });
            return { status: "waiting_provider", waiting: true };
          }
          await recordAttempt(base, outcome, "error", { retryCount });
          continue;
        }
        if (outcome.code === "auth" || outcome.code === "no_credit") {
          state.unusable[providerId] = outcome.code;
          await recordAttempt(base, outcome, outcome.code === "no_credit" ? "no_credit" : "error");
          continue;
        }
        await recordAttempt(base, outcome, outcome.outcomeUnknown ? "unknown" : "error");
        continue;
      }

      if (outcome.kind === "not_found") {
        if (!prior || !ATTEMPT_TERMINAL.has(prior.status)) await recordAttempt(base, outcome, "not_found");
        continue;
      }

      // found
      if (!prior || !ATTEMPT_TERMINAL.has(prior.status)) await recordAttempt(base, outcome, "succeeded");
      const fields = outcome.fields;
      harvestExtras(result, fields);
      await applyFound(target, providerId, fields, { input, result, userId, deps, evidence: fields.matchEvidence ?? null });
      if (target === "owner" && result.owner?.value) {
        input = withOwner(input, result.owner.value, result.ownerTitle);
      }
      // An owner lookup can return the email in the same response: use it, no new call.
      if (target === "owner" && fields.email && targets.includes("work_email") && !result.work_email) {
        await applyFound("work_email", providerId, { email: fields.email }, { input, result, userId, deps, evidence: fields.matchEvidence ?? null });
      }
      await persist();
    }

    track.done = true;
    if (isSatisfied(target, result)) track.outcome = "accepted";
    else if (target === "work_email" && result.emailForReview) track.outcome = "review";
    else if (!anyRan && skippedForInput > 0) {
      track.outcome = "needs_input";
      track.reason =
        target === "work_email" || target === "mobile"
          ? "needs the owner's full name and a company domain"
          : "needs a website or business name";
    } else track.outcome = "not_found";
    await persist();
  }

  return settleRow({ row: { id: row.id, jobId: job.id }, userId, fee: job.feePerRow, state, result, targets, persist, budgetStop: false, leadId: row.leadId });
}

function isSatisfied(target: EnrichmentTarget, result: RowResult): boolean {
  return Boolean(result[target]?.value);
}

async function applyFound(
  target: EnrichmentTarget,
  providerId: ProviderId,
  fields: FoundFields,
  c: { input: NormalizedInput; result: RowResult; userId: string; deps: ProcessDeps; evidence: string | null },
) {
  const { input, result } = c;
  if (target === "owner" && fields.ownerName && !result.owner) {
    if (plausiblePersonName(fields.ownerName, input.businessName)) {
      result.owner = accepted(fields.ownerName, providerId, { evidence: c.evidence });
      if (fields.ownerTitle) result.ownerTitle = fields.ownerTitle;
    }
  }
  if (target === "work_email" && fields.email && !result.work_email) {
    const d = await evaluateEmail(fields.email, input, {
      userId: c.userId,
      fromBusinessWebsite: providerId === "website",
      verify: c.deps.verify as never,
    });
    if (d.decision === "accept") {
      result.work_email = accepted(d.value, providerId, {
        status: d.status,
        verifiedBy: d.verifiedBy,
        sourceUrl: fields.email.sourceUrl,
        evidence: c.evidence,
      });
    } else if (d.decision === "review" && !result.emailForReview) {
      result.emailForReview = accepted(d.value, providerId, {
        status: d.status,
        verifiedBy: d.verifiedBy,
        sourceUrl: fields.email.sourceUrl,
        evidence: `${c.evidence ?? ""}${c.evidence ? "; " : ""}${d.reason}`,
      });
    }
  }
  if (target === "phone" && fields.phone && !result.phone && fields.phone.type !== "mobile") {
    const p = normalizePhone(fields.phone.value, input.country);
    if (p) result.phone = accepted(p, providerId, { status: "office", evidence: c.evidence });
  }
  if (target === "mobile" && fields.phone?.type === "mobile" && !result.mobile) {
    const p = normalizePhone(fields.phone.value, input.country);
    if (p) result.mobile = accepted(p, providerId, { status: "mobile", evidence: c.evidence });
  }
}

/** Decide the row's final status, charge or release the reserve, save private results. */
async function settleRow(c: {
  row: { id: string; jobId: string };
  userId: string;
  fee: number;
  state: RowState;
  result: RowResult;
  targets: EnrichmentTarget[];
  persist: (patch?: Partial<{ status: string; nextRunAt: Date; lastError: string | null; charged: number }>) => Promise<void>;
  budgetStop: boolean;
  leadId?: string | null;
}): Promise<ProcessResult> {
  const { result, targets, state } = c;
  const newlyAccepted = targets.filter((t) => result[t]?.value && !result[t]?.preExisting);
  const satisfied = targets.filter((t) => result[t]?.value);
  const needsInput = targets.every((t) => state.tracks[t]?.outcome === "needs_input" || result[t]?.value);

  let status: string;
  if (c.budgetStop && newlyAccepted.length === 0) status = "budget_exceeded";
  else if (satisfied.length === targets.length) status = "succeeded";
  // "Partly found" only when this run added something (values from the file don't count).
  else if (newlyAccepted.length > 0 || result.emailForReview) status = "partial";
  else if (needsInput) status = "needs_input";
  else status = "not_found";

  let charged = 0;
  let lastError: string | null = null;
  // Free sources alone can produce a result: it still has to fit inside the job budget.
  if (newlyAccepted.length > 0 && c.fee > 0 && state.reserved === 0) {
    const already = await prisma.enrichmentCharge.findUnique({ where: { rowId: c.row.id } });
    if (!already) {
      if (await reserveRowBudget(c.row.jobId, c.fee)) state.reserved = c.fee;
      else {
        for (const t of newlyAccepted) delete result[t];
        newlyAccepted.length = 0;
        status = "budget_exceeded";
        lastError = "Job budget reached";
      }
    }
  }
  if (newlyAccepted.length > 0 && c.fee > 0) {
    try {
      charged = await chargeRowOnce(c.userId, c.row.jobId, c.row.id, c.fee, state.reserved);
      if (charged === 0) await releaseReserve(c.row.jobId, state.reserved);
      state.reserved = 0;
    } catch (err) {
      lastError = err instanceof Error && err.message === "INSUFFICIENT_CREDITS" ? "Not enough credits to save this result" : "Charge failed";
      await releaseReserve(c.row.jobId, state.reserved);
      state.reserved = 0;
      status = "budget_exceeded";
      for (const t of newlyAccepted) delete result[t];
    }
  } else {
    await releaseReserve(c.row.jobId, state.reserved);
    state.reserved = 0;
  }

  if (status !== "budget_exceeded" || charged > 0) {
    await savePrivateContact(c.userId, c.leadId ?? null, result);
  }
  await c.persist({ status, charged, lastError });
  await finishRowAccounting(c.row.jobId);
  return { status, waiting: false };
}

/** Paid person-level data stays in the workspace; never written to the shared Lead. */
async function savePrivateContact(userId: string, leadId: string | null, result: RowResult) {
  if (!leadId) return;
  const paid = (f?: AcceptedField) => (f && f.provider !== "input" ? f : undefined);
  const owner = paid(result.owner);
  const email = paid(result.work_email);
  const mobile = paid(result.mobile);
  if (!owner && !email && !mobile) return;
  const provenance = { owner, work_email: email, mobile };
  await prisma.workspaceLeadContact
    .upsert({
      where: { userId_leadId: { userId, leadId } },
      update: {
        ...(owner ? { ownerName: owner.value, ownerTitle: result.ownerTitle ?? undefined } : {}),
        ...(email ? { email: email.value, emailStatus: email.status ?? null, emailProvider: email.provider, emailCheckedAt: new Date(email.checkedAt) } : {}),
        ...(mobile ? { mobile: mobile.value, mobileProvider: mobile.provider } : {}),
        ...(result.linkedinUrl ? { linkedinUrl: result.linkedinUrl } : {}),
        provenanceJson: JSON.stringify(provenance),
      },
      create: {
        userId,
        leadId,
        ownerName: owner?.value ?? null,
        ownerTitle: owner ? result.ownerTitle ?? null : null,
        email: email?.value ?? null,
        emailStatus: email?.status ?? null,
        emailProvider: email?.provider ?? null,
        emailCheckedAt: email ? new Date(email.checkedAt) : null,
        mobile: mobile?.value ?? null,
        mobileProvider: mobile?.provider ?? null,
        linkedinUrl: result.linkedinUrl ?? null,
        provenanceJson: JSON.stringify(provenance),
      },
    })
    .catch(() => null);
}

/** Recount finished rows and close the job when every row is final. */
async function finishRowAccounting(jobId: string) {
  const [done, total] = await Promise.all([
    prisma.enrichmentRow.count({
      where: { jobId, status: { in: ["succeeded", "partial", "not_found", "needs_input", "budget_exceeded", "failed", "cancelled"] } },
    }),
    prisma.enrichmentRow.count({ where: { jobId } }),
  ]);
  const job = await prisma.enrichmentJob.findUnique({ where: { id: jobId }, select: { cancelRequested: true, status: true } });
  const finished = done >= total;
  await prisma.enrichmentJob.update({
    where: { id: jobId },
    data: {
      doneRows: done,
      ...(finished
        ? { status: job?.cancelRequested ? "cancelled" : "completed", finishedAt: new Date(), creditsReserved: 0 }
        : job?.status === "queued"
          ? { status: "running", startedAt: new Date() }
          : {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Worker: claim due rows with row locks so several workers never process the same row
// ---------------------------------------------------------------------------

export async function claimDueRows(workerId: string, limit: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE "EnrichmentRow" SET "lockedAt" = now(), "lockedBy" = ${workerId}, "runCount" = "runCount" + 1,
      status = CASE WHEN status = 'queued' THEN 'running' ELSE status END
    WHERE id IN (
      SELECT r.id FROM "EnrichmentRow" r
      JOIN "EnrichmentJob" j ON j.id = r."jobId"
      WHERE r.status IN ('queued', 'running', 'waiting_provider')
        AND r."nextRunAt" <= now()
        AND (r."lockedAt" IS NULL OR r."lockedAt" < now() - (${LOCK_STALE_MINUTES} * interval '1 minute'))
        AND j.status IN ('queued', 'running')
      ORDER BY r."nextRunAt" ASC, r."rowIndex" ASC
      LIMIT ${limit}
      FOR UPDATE OF r SKIP LOCKED
    )
    RETURNING id`;
  return rows.map((r) => r.id);
}

/** Process due rows until the time budget runs out. Returns how many rows were processed. */
export async function runEnrichmentTick(opts: { budgetMs: number; batch?: number; deps?: ProcessDeps } = { budgetMs: 40_000 }) {
  const started = Date.now();
  const workerId = `w-${process.pid}-${started}`;
  let processed = 0;
  while (Date.now() - started < opts.budgetMs) {
    const ids = await claimDueRows(workerId, opts.batch ?? 4);
    if (!ids.length) break;
    await Promise.all(
      ids.map(async (id) => {
        try {
          await processRow(id, opts.deps);
        } catch (err) {
          await prisma.enrichmentRow
            .update({
              where: { id },
              data: {
                lockedAt: null,
                lockedBy: null,
                lastError: err instanceof Error ? err.message.slice(0, 300) : "processing error",
                nextRunAt: new Date(Date.now() + 60_000),
              },
            })
            .catch(() => null);
        }
      }),
    );
    processed += ids.length;
  }
  return { processed };
}
