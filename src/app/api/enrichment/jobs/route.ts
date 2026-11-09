import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/credits";
import { getWaterfallEnrichCreditCost } from "@/lib/plans";
import { insufficientCreditsPayload } from "@/lib/lead-access";
import { rateLimit } from "@/lib/rate-limit";
import { createEnrichmentJob, JobInputError, listJobs, MAX_ROWS_PER_JOB } from "@/lib/enrichment/jobs";
import type { RowInput } from "@/lib/enrichment/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = await listJobs(user.id);
  return NextResponse.json({
    jobs: jobs.map((j) => ({ ...j, targets: JSON.parse(j.targetsJson), targetsJson: undefined })),
  });
}

const str = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Create an enrichment job. Returns 202 with the job id; rows are processed by the
 * background worker. Send an Idempotency-Key header so a retried request never creates
 * (or bills) a second job.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`enrich-job:${user.id}`, { limit: 20, windowMs: 60_000 }).ok) {
    return NextResponse.json({ error: "Too many jobs started. Try again in a minute." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const rawRows = Array.isArray(body.rows) ? body.rows : [];
  if (rawRows.length > MAX_ROWS_PER_JOB) {
    return NextResponse.json({ error: `A job can hold up to ${MAX_ROWS_PER_JOB} rows. Split the file.` }, { status: 400 });
  }
  const rows: Array<RowInput & { leadId?: string | null }> = rawRows
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map((r) => ({
      businessName: str(r.businessName, 200) ?? "",
      website: str(r.website),
      ownerName: str(r.ownerName, 120),
      ownerTitle: str(r.ownerTitle, 120),
      email: str(r.email, 200),
      phone: str(r.phone, 40),
      city: str(r.city, 100),
      state: str(r.state, 60),
      country: str(r.country, 60),
      linkedinUrl: str(r.linkedinUrl),
      leadId: str(r.leadId, 40),
    }));

  const feePerRow = await getWaterfallEnrichCreditCost();
  const valid = rows.filter((r) => r.businessName).length;
  const maxSpend = valid * feePerRow;
  const requested = Number(body.budgetCredits);
  const budgetCredits = Number.isFinite(requested) && requested >= 0 ? Math.min(requested, maxSpend) : maxSpend;

  if (feePerRow > 0 && user.creditsRemaining < feePerRow) {
    return NextResponse.json(insufficientCreditsPayload(feePerRow, user.creditsRemaining), { status: 402 });
  }

  try {
    const job = await createEnrichmentJob({
      userId: user.id,
      name: str(body.name, 120),
      source: body.source === "leads" ? "leads" : "upload",
      targets: body.targets as never,
      preset: {
        revealMobile: body.revealMobile === true,
        order: (body.order as never) ?? undefined,
      },
      budgetCredits,
      feePerRow,
      rows,
      idempotencyKey: request.headers.get("idempotency-key"),
    });
    if (job.created) {
      await logActivity(user.id, "enrichment_job", `Started enrichment job for ${valid} row(s)`).catch(() => null);
    }
    return NextResponse.json({ id: job.id, created: job.created }, { status: 202 });
  } catch (err) {
    if (err instanceof JobInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
