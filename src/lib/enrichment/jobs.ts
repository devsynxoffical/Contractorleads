import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JobPreset, RowInput } from "./engine";
import { ADAPTERS } from "./registry";
import { ENRICHMENT_TARGETS, type EnrichmentTarget, type ProviderId, type RowResult, type TrackState } from "./types";

/**
 * Job creation and read models shared by the API routes, the UI and the tests.
 * Every query is scoped by userId: a workspace can never see another workspace's job.
 */

export const MAX_ROWS_PER_JOB = 5000;

export type CreateJobInput = {
  userId: string;
  name?: string | null;
  source?: "upload" | "leads";
  targets: EnrichmentTarget[];
  preset: JobPreset;
  /** Customer credits this job may spend at most */
  budgetCredits: number;
  feePerRow: number;
  rows: Array<RowInput & { leadId?: string | null }>;
  idempotencyKey?: string | null;
};

export class JobInputError extends Error {}

function cleanTargets(targets: unknown): EnrichmentTarget[] {
  const list = Array.isArray(targets) ? targets : [];
  const out = ENRICHMENT_TARGETS.filter((t) => list.includes(t));
  if (!out.length) throw new JobInputError("Choose at least one field to find.");
  return out;
}

function cleanOrder(order: unknown): JobPreset["order"] {
  if (!order || typeof order !== "object") return undefined;
  const out: NonNullable<JobPreset["order"]> = {};
  for (const t of ENRICHMENT_TARGETS) {
    const ids = (order as Record<string, unknown>)[t];
    if (!Array.isArray(ids)) continue;
    const valid = ids.filter(
      (x): x is ProviderId => typeof x === "string" && x in ADAPTERS && ADAPTERS[x as ProviderId].targets.includes(t),
    );
    if (valid.length) out[t] = Array.from(new Set(valid));
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Create a job and its rows in one transaction. The same Idempotency-Key from the same
 * workspace returns the existing job instead of creating (and later billing) a second one.
 */
export async function createEnrichmentJob(input: CreateJobInput): Promise<{ id: string; created: boolean }> {
  const targets = cleanTargets(input.targets);
  const rows = input.rows
    .filter((r) => r && typeof r.businessName === "string" && r.businessName.trim())
    .slice(0, MAX_ROWS_PER_JOB);
  if (!rows.length) throw new JobInputError("Add at least one row with a business name.");
  const preset: JobPreset = {
    revealMobile: Boolean(input.preset?.revealMobile) && targets.includes("mobile"),
    order: cleanOrder(input.preset?.order),
  };
  const budget = Math.max(0, Number.isFinite(input.budgetCredits) ? input.budgetCredits : 0);
  const key = input.idempotencyKey?.trim().slice(0, 120) || null;

  if (key) {
    const existing = await prisma.enrichmentJob.findUnique({
      where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: key } },
      select: { id: true },
    });
    if (existing) return { id: existing.id, created: false };
  }

  try {
    const job = await prisma.$transaction(async (tx) => {
      const j = await tx.enrichmentJob.create({
        data: {
          userId: input.userId,
          name: input.name?.trim().slice(0, 120) || null,
          source: input.source ?? "upload",
          targetsJson: JSON.stringify(targets),
          presetJson: JSON.stringify(preset),
          idempotencyKey: key,
          budgetCredits: budget,
          feePerRow: Math.max(0, input.feePerRow),
          totalRows: rows.length,
        },
      });
      await tx.enrichmentRow.createMany({
        data: rows.map((r, i) => {
          const { leadId, ...raw } = r;
          return { jobId: j.id, rowIndex: i, leadId: leadId ?? null, inputJson: JSON.stringify(raw) };
        }),
      });
      return j;
    });
    return { id: job.id, created: true };
  } catch (err) {
    if (key && err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.enrichmentJob.findUnique({
        where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: key } },
        select: { id: true },
      });
      if (existing) return { id: existing.id, created: false };
    }
    throw err;
  }
}

/** Request cancellation: queued/waiting rows stop now, a row mid-call stops after that call. */
export async function cancelEnrichmentJob(userId: string, jobId: string): Promise<boolean> {
  const job = await prisma.enrichmentJob.findFirst({ where: { id: jobId, userId }, select: { id: true, status: true } });
  if (!job) return false;
  if (job.status === "completed" || job.status === "cancelled") return true;
  await prisma.enrichmentJob.update({ where: { id: job.id }, data: { cancelRequested: true } });
  // Rows that are not locked by a worker right now can be cancelled immediately.
  const stale = new Date(Date.now() - 5 * 60_000);
  await prisma.enrichmentRow.updateMany({
    where: {
      jobId: job.id,
      status: { in: ["queued", "waiting_provider"] },
      OR: [{ lockedAt: null }, { lockedAt: { lt: stale } }],
    },
    data: { status: "cancelled" },
  });
  const [open, done] = await Promise.all([
    prisma.enrichmentRow.count({ where: { jobId: job.id, status: { in: ["queued", "running", "waiting_provider"] } } }),
    prisma.enrichmentRow.count({ where: { jobId: job.id, status: { notIn: ["queued", "running", "waiting_provider"] } } }),
  ]);
  await prisma.enrichmentJob.update({
    where: { id: job.id },
    data: {
      doneRows: done,
      ...(open === 0 ? { status: "cancelled", finishedAt: new Date(), creditsReserved: 0 } : {}),
    },
  });
  return true;
}

export type AttemptView = {
  provider: ProviderId;
  providerName: string;
  target: EnrichmentTarget;
  status: string;
  providerStatus: string | null;
  vendorUnits: number | null;
  vendorUnit: string | null;
  error: string | null;
  at: string;
};

export type RowView = {
  id: string;
  rowIndex: number;
  leadId: string | null;
  status: string;
  charged: number;
  lastError: string | null;
  input: RowInput;
  result: RowResult;
  tracks: Partial<Record<EnrichmentTarget, TrackState>>;
  attempts: AttemptView[];
};

export type JobView = {
  id: string;
  name: string | null;
  status: string;
  targets: EnrichmentTarget[];
  preset: JobPreset;
  totalRows: number;
  doneRows: number;
  budgetCredits: number;
  creditsUsed: number;
  creditsReserved: number;
  feePerRow: number;
  cancelRequested: boolean;
  createdAt: string;
  finishedAt: string | null;
  counts: Record<string, number>;
  /** Vendor units spent per provider (unknown units are counted separately, never as zero) */
  providerUsage: Array<{ provider: ProviderId; name: string; calls: number; found: number; units: number; unknownUnits: number; unit: string | null }>;
  rows?: RowView[];
};

function parse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function getJobView(
  userId: string,
  jobId: string,
  opts: { rows?: boolean; rowLimit?: number; rowOffset?: number } = {},
): Promise<JobView | null> {
  const job = await prisma.enrichmentJob.findFirst({ where: { id: jobId, userId } });
  if (!job) return null;
  const [byStatus, usage] = await Promise.all([
    prisma.enrichmentRow.groupBy({ by: ["status"], where: { jobId: job.id }, _count: { _all: true } }),
    prisma.providerAttempt.findMany({
      where: { jobId: job.id, status: { not: "skipped" } },
      select: { provider: true, status: true, vendorUnits: true, vendorUnit: true },
    }),
  ]);
  const counts: Record<string, number> = {};
  for (const g of byStatus) counts[g.status] = g._count._all;

  const usageMap = new Map<string, JobView["providerUsage"][number]>();
  for (const a of usage) {
    const id = a.provider as ProviderId;
    const u = usageMap.get(id) ?? { provider: id, name: ADAPTERS[id]?.name ?? id, calls: 0, found: 0, units: 0, unknownUnits: 0, unit: null };
    u.calls++;
    if (a.status === "succeeded") u.found++;
    if (a.vendorUnits === null || a.vendorUnits === undefined) {
      if (ADAPTERS[id]?.paid && ["succeeded", "not_found", "unknown"].includes(a.status)) u.unknownUnits++;
    } else u.units += a.vendorUnits;
    if (a.vendorUnit) u.unit = a.vendorUnit;
    usageMap.set(id, u);
  }

  const view: JobView = {
    id: job.id,
    name: job.name,
    status: job.status,
    targets: parse(job.targetsJson, [] as EnrichmentTarget[]),
    preset: parse(job.presetJson, { revealMobile: false } as JobPreset),
    totalRows: job.totalRows,
    doneRows: job.doneRows,
    budgetCredits: job.budgetCredits,
    creditsUsed: job.creditsUsed,
    creditsReserved: job.creditsReserved,
    feePerRow: job.feePerRow,
    cancelRequested: job.cancelRequested,
    createdAt: job.createdAt.toISOString(),
    finishedAt: job.finishedAt?.toISOString() ?? null,
    counts,
    providerUsage: Array.from(usageMap.values()),
  };

  if (opts.rows) {
    const rows = await prisma.enrichmentRow.findMany({
      where: { jobId: job.id },
      orderBy: { rowIndex: "asc" },
      take: opts.rowLimit ?? 500,
      skip: opts.rowOffset ?? 0,
      include: { attempts: { orderBy: { createdAt: "asc" } } },
    });
    view.rows = rows.map((r) => {
      const state = parse(r.trackStateJson, { tracks: {} } as { tracks: Partial<Record<EnrichmentTarget, TrackState>> });
      return {
        id: r.id,
        rowIndex: r.rowIndex,
        leadId: r.leadId,
        status: r.status,
        charged: r.charged,
        lastError: r.lastError,
        input: parse(r.inputJson, { businessName: "" } as RowInput),
        result: parse(r.resultJson, {} as RowResult),
        tracks: state.tracks ?? {},
        attempts: r.attempts.map((a) => ({
          provider: a.provider as ProviderId,
          providerName: ADAPTERS[a.provider as ProviderId]?.name ?? a.provider,
          target: a.target as EnrichmentTarget,
          status: a.status,
          providerStatus: a.providerStatus,
          vendorUnits: a.vendorUnits,
          vendorUnit: a.vendorUnit,
          error: a.sanitizedError,
          at: a.updatedAt.toISOString(),
        })),
      };
    });
  }
  return view;
}

export async function listJobs(userId: string, limit = 20) {
  return prisma.enrichmentJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      status: true,
      totalRows: true,
      doneRows: true,
      creditsUsed: true,
      budgetCredits: true,
      targetsJson: true,
      createdAt: true,
      finishedAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// CSV export: original columns + accepted fields with provenance
// ---------------------------------------------------------------------------

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralize spreadsheet formulas (CSV injection) and quote when needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function jobToCsv(view: JobView): string {
  const rows = view.rows ?? [];
  const inputCols = Array.from(
    rows.reduce((set, r) => {
      for (const k of Object.keys(r.input)) set.add(k);
      return set;
    }, new Set<string>(["businessName", "website", "ownerName", "email", "phone", "city", "state", "country"])),
  );
  const header = [
    ...inputCols.map((c) => `input_${c}`),
    "status",
    "owner_name",
    "owner_title",
    "owner_source",
    "work_email",
    "email_status",
    "email_source",
    "email_verified_by",
    "email_checked_at",
    "email_for_review",
    "email_for_review_status",
    "business_phone",
    "phone_source",
    "owner_mobile",
    "mobile_source",
    "linkedin_url",
    "credits_charged",
    "providers_tried",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const res = r.result;
    const tried = Array.from(new Set(r.attempts.filter((a) => a.status !== "skipped").map((a) => `${a.providerName}:${a.target}:${a.status}`)));
    lines.push(
      [
        ...inputCols.map((c) => (r.input as Record<string, unknown>)[c]),
        r.status,
        res.owner?.value,
        res.ownerTitle,
        res.owner?.provider,
        res.work_email?.value,
        res.work_email?.status,
        res.work_email?.provider,
        res.work_email?.verifiedBy,
        res.work_email?.checkedAt,
        res.emailForReview?.value,
        res.emailForReview?.status,
        res.phone?.value,
        res.phone?.provider,
        res.mobile?.value,
        res.mobile?.provider,
        res.linkedinUrl,
        r.charged,
        tried.join(" | "),
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}
