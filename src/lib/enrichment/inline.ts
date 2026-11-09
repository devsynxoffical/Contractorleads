import { prisma } from "@/lib/prisma";
import { processRow, type RowInput } from "./engine";
import { createEnrichmentJob, getJobView, type RowView } from "./jobs";
import type { EnrichmentTarget } from "./types";

/**
 * Run a small job right away inside the request (single lead, legacy streaming upload),
 * on the same engine, ledger and attempt records as background jobs. Rows that wait on an
 * async provider or run past the time budget are handed to the background worker.
 */

export type LegacyWaterfallResult = {
  leadId: string | null;
  businessName: string;
  ownerName: string | null;
  ownerTitle: string | null;
  email: string | null;
  emailVerified: boolean;
  /** catch-all / unknown address kept for review (not counted as found) */
  emailForReview: string | null;
  emailStatus: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string;
  industry: string | null;
  linkedinUrl: string | null;
  facebook: string | null;
  instagram: string | null;
  foundVerifiedContact: boolean;
  newlyFoundFields: Array<"email" | "phone" | "ownerName" | "website" | "linkedin">;
  winningSource: string | null;
  sourcesChecked: string[];
  trace: Array<{ step: string; provider: string; status: "hit" | "partial" | "miss" | "skipped"; foundFields: string[] }>;
  rowStatus: string;
  charged: number;
};

export const LEGACY_TARGETS: EnrichmentTarget[] = ["owner", "work_email", "phone"];

const FIELD_NAME: Record<EnrichmentTarget, "ownerName" | "email" | "phone" | null> = {
  owner: "ownerName",
  work_email: "email",
  phone: "phone",
  mobile: null,
};

export function toLegacyResult(row: RowView): LegacyWaterfallResult {
  const r = row.result;
  const input = row.input;
  const newly = (["owner", "work_email", "phone"] as EnrichmentTarget[]).filter((t) => r[t]?.value && !r[t]?.preExisting);
  const newlyFoundFields = newly.map((t) => FIELD_NAME[t]).filter(Boolean) as LegacyWaterfallResult["newlyFoundFields"];
  if (r.linkedinUrl && !input.linkedinUrl) newlyFoundFields.push("linkedin");
  const ran = row.attempts.filter((a) => a.status !== "skipped");
  return {
    leadId: row.leadId,
    businessName: input.businessName,
    ownerName: r.owner?.value ?? input.ownerName ?? null,
    ownerTitle: r.ownerTitle ?? input.ownerTitle ?? null,
    email: r.work_email?.value ?? null,
    emailVerified: r.work_email?.status === "valid",
    emailForReview: r.emailForReview?.value ?? null,
    emailStatus: (r.work_email?.status ?? r.emailForReview?.status ?? null) as string | null,
    phone: r.phone?.value ?? input.phone ?? null,
    website: input.website ?? r.website ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    country: input.country ?? "US",
    industry: null,
    linkedinUrl: r.linkedinUrl ?? input.linkedinUrl ?? null,
    facebook: r.facebook ?? null,
    instagram: r.instagram ?? null,
    foundVerifiedContact: newly.length > 0,
    newlyFoundFields,
    winningSource: newly.length ? r[newly[0]]!.provider : null,
    sourcesChecked: Array.from(new Set(ran.map((a) => a.providerName))),
    trace: row.attempts.map((a) => ({
      step: a.target,
      provider: a.providerName,
      status: a.status === "succeeded" ? "hit" : a.status === "skipped" ? "skipped" : "miss",
      foundFields: a.status === "succeeded" ? [a.target] : [],
    })),
    rowStatus: row.status,
    charged: row.charged,
  };
}

export async function enrichInline(opts: {
  userId: string;
  rows: Array<RowInput & { leadId?: string | null }>;
  targets?: EnrichmentTarget[];
  feePerRow: number;
  source?: "upload" | "leads";
  name?: string | null;
  timeBudgetMs?: number;
  concurrency?: number;
  onRow?: (index: number, result: LegacyWaterfallResult) => Promise<void> | void;
}): Promise<{ jobId: string; results: LegacyWaterfallResult[]; handedOff: number }> {
  const targets = opts.targets ?? LEGACY_TARGETS;
  const job = await createEnrichmentJob({
    userId: opts.userId,
    name: opts.name ?? null,
    source: opts.source ?? "upload",
    targets,
    preset: { revealMobile: false },
    budgetCredits: opts.rows.length * opts.feePerRow,
    feePerRow: opts.feePerRow,
    rows: opts.rows,
  });
  // Hold the rows so the background worker does not pick them up while we run them here.
  await prisma.enrichmentRow.updateMany({ where: { jobId: job.id }, data: { lockedAt: new Date(), lockedBy: "inline" } });
  const rows = await prisma.enrichmentRow.findMany({ where: { jobId: job.id }, orderBy: { rowIndex: "asc" }, select: { id: true, rowIndex: true } });

  const started = Date.now();
  const budget = opts.timeBudgetMs ?? 240_000;
  const results: LegacyWaterfallResult[] = new Array(rows.length);
  let handedOff = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      if (Date.now() - started > budget) {
        handedOff++;
        await prisma.enrichmentRow.update({ where: { id: row.id }, data: { lockedAt: null, lockedBy: null } });
        continue;
      }
      try {
        await processRow(row.id);
      } catch (err) {
        await prisma.enrichmentRow
          .update({
            where: { id: row.id },
            data: { lockedAt: null, lockedBy: null, lastError: err instanceof Error ? err.message.slice(0, 300) : "error" },
          })
          .catch(() => null);
      }
      const view = await getJobView(opts.userId, job.id, { rows: true, rowOffset: row.rowIndex, rowLimit: 1 });
      const rv = view?.rows?.[0];
      if (rv) {
        if (["queued", "running", "waiting_provider"].includes(rv.status)) handedOff++;
        results[row.rowIndex] = toLegacyResult(rv);
        await opts.onRow?.(row.rowIndex, results[row.rowIndex]);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.concurrency ?? 3, rows.length)) }, worker));
  return { jobId: job.id, results, handedOff };
}

export { overlayWorkspaceContacts } from "./workspace-contacts";
