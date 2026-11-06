/**
 * Engine acceptance tests (blueprint p.14) against a real Postgres with mocked vendors.
 * Needs DATABASE_URL; skipped when no database is configured.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { claimDueRows, processRow, type ProcessDeps } from "@/lib/enrichment/engine";
import { cancelEnrichmentJob, createEnrichmentJob, getJobView, jobToCsv } from "@/lib/enrichment/jobs";
import type { EnrichmentSettings } from "@/lib/enrichment/registry";
import type { EnrichmentTarget, ProviderId } from "@/lib/enrichment/types";

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

const KEYS = {
  apolloApiKey: "",
  hunterApiKey: "k-hunter",
  prospeoApiKey: "k-prospeo",
  ninjapearApiKey: "",
  findymailApiKey: "k-findymail",
  leadmagicApiKey: "k-leadmagic",
  icypeasApiKey: "k-icypeas",
};

type Route = (url: string, body: unknown) => { status: number; body?: unknown; headers?: Record<string, string> } | null;

/** A vendor simulator: routes by URL and counts calls per host. */
function vendors(route: Route) {
  const calls: Record<string, number> = {};
  const impl = (async (url: string | URL, init: RequestInit = {}) => {
    const u = String(url);
    const host = new URL(u).host;
    calls[host] = (calls[host] ?? 0) + 1;
    const body = init.body ? JSON.parse(String(init.body)) : null;
    const r = route(u, body) ?? { status: 404, body: {} };
    return new Response(r.body === undefined ? "" : JSON.stringify(r.body), { status: r.status, headers: r.headers });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

function deps(fetchImpl: typeof fetch, order: Partial<Record<EnrichmentTarget, ProviderId[]>>, verify?: ProcessDeps["verify"]): ProcessDeps {
  const settings: EnrichmentSettings = { disabledProviders: ["website", "web_search"], order };
  return {
    fetchImpl,
    settings,
    keys: KEYS,
    verify: verify ?? (async () => ({ status: "valid", source: "test_verifier" })),
  };
}

const ROW = { businessName: "Acme Roofing", website: "acmeroofing.com", ownerName: "John Smith" };

async function makeUser(credits = 100) {
  return prisma.user.create({
    data: { email: `t-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`, passwordHash: "x", creditsRemaining: credits },
  });
}

const created: string[] = [];
async function user(credits = 100) {
  const u = await makeUser(credits);
  created.push(u.id);
  return u;
}

async function rowsOf(jobId: string) {
  return prisma.enrichmentRow.findMany({ where: { jobId }, orderBy: { rowIndex: "asc" } });
}

d("enrichment engine", () => {
  beforeEach(() => undefined);
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("first accepted email stops the email track (no further paid calls)", async () => {
    const u = await user();
    const v = vendors((url) => {
      if (url.includes("hunter.io")) {
        return { status: 200, headers: { "X-Credits-Used": "1" }, body: { data: { email: "john@acmeroofing.com", verification: { status: "valid" } } } };
      }
      if (url.includes("findymail")) return { status: 200, body: { contact: { email: "other@acmeroofing.com" } } };
      return null;
    });
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [ROW] });
    const [row] = await rowsOf(job.id);
    const r = await processRow(row.id, deps(v.impl, { work_email: ["hunter", "findymail"], owner: [] }));
    expect(r.status).toBe("succeeded");
    expect(v.calls["api.hunter.io"]).toBe(1);
    expect(v.calls["app.findymail.com"]).toBeUndefined();
    const after = await prisma.enrichmentRow.findUnique({ where: { id: row.id } });
    const result = JSON.parse(after!.resultJson!);
    expect(result.work_email).toMatchObject({ value: "john@acmeroofing.com", provider: "hunter", status: "valid", verifiedBy: "provider:valid" });
    expect(after!.charged).toBe(1);
  });

  it("no double billing on retries or a worker restart", async () => {
    const u = await user(10);
    const v = vendors((url) =>
      url.includes("findymail") ? { status: 200, body: { contact: { email: "john@acmeroofing.com" } } } : null,
    );
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 2, rows: [ROW] });
    const [row] = await rowsOf(job.id);
    const dp = deps(v.impl, { work_email: ["findymail"], owner: [] });
    await processRow(row.id, dp);
    await processRow(row.id, dp); // retry of a finished row
    // Simulated restart: the row's progress is lost, attempts and charge survive.
    await prisma.enrichmentRow.update({ where: { id: row.id }, data: { status: "running", trackStateJson: null, resultJson: null } });
    const again = await processRow(row.id, dp);
    expect(again.status).toBe("succeeded");
    expect(v.calls["app.findymail.com"]).toBe(1);
    const fresh = await prisma.user.findUnique({ where: { id: u.id } });
    expect(fresh!.creditsRemaining).toBe(8);
    expect(await prisma.enrichmentCharge.count({ where: { rowId: row.id } })).toBe(1);
    expect(await prisma.creditLedger.count({ where: { userId: u.id, action: "waterfall_enrich" } })).toBe(1);
    const j = await prisma.enrichmentJob.findUnique({ where: { id: job.id } });
    expect(j!.creditsUsed).toBe(2);
    expect(j!.creditsReserved).toBe(0);
  });

  it("an interrupted call is never resubmitted", async () => {
    const u = await user();
    const v = vendors(() => ({ status: 200, body: { contact: { email: "john@acmeroofing.com" } } }));
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [ROW] });
    const [row] = await rowsOf(job.id);
    await prisma.providerAttempt.create({
      data: { attemptKey: `${row.id}:work_email:findymail`, rowId: row.id, jobId: job.id, userId: u.id, provider: "findymail", target: "work_email", adapterVersion: "1.0", inputHash: "x", status: "submitting" },
    });
    const r = await processRow(row.id, deps(v.impl, { work_email: ["findymail"], owner: [] }));
    expect(v.calls["app.findymail.com"]).toBeUndefined();
    expect(r.status).toBe("not_found");
    const a = await prisma.providerAttempt.findUnique({ where: { attemptKey: `${row.id}:work_email:findymail` } });
    expect(a!.status).toBe("unknown");
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.creditsRemaining).toBe(100);
  });

  it("catch-all stays reviewable, is not called verified and is not charged", async () => {
    const u = await user();
    const v = vendors((url) => {
      if (url.includes("hunter.io")) {
        return { status: 200, body: { data: { email: "john@acmeroofing.com", accept_all: true, verification: { status: "accept_all" } } } };
      }
      if (url.includes("leadmagic")) return { status: 200, body: { email: null, status: null, credits_consumed: 0 } };
      return null;
    });
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [ROW] });
    const [row] = await rowsOf(job.id);
    const r = await processRow(row.id, deps(v.impl, { work_email: ["hunter", "leadmagic"], owner: [] }));
    // Kept looking after the catch-all result.
    expect(v.calls["api.leadmagic.io"]).toBe(1);
    expect(r.status).toBe("partial");
    const after = await prisma.enrichmentRow.findUnique({ where: { id: row.id } });
    const res = JSON.parse(after!.resultJson!);
    expect(res.work_email).toBeUndefined();
    expect(res.emailForReview).toMatchObject({ value: "john@acmeroofing.com", status: "catch_all" });
    expect(after!.charged).toBe(0);
    const tracks = JSON.parse(after!.trackStateJson!).tracks;
    expect(tracks.work_email.outcome).toBe("review");
  });

  it("rejects an address on another company's domain and role addresses", async () => {
    const u = await user();
    const v = vendors((url) => {
      if (url.includes("findymail")) return { status: 200, body: { contact: { email: "john@otherco.com" } } };
      if (url.includes("leadmagic")) return { status: 200, body: { email: "info@acmeroofing.com", status: "valid", credits_consumed: 1 } };
      return null;
    });
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [ROW] });
    const [row] = await rowsOf(job.id);
    const r = await processRow(row.id, deps(v.impl, { work_email: ["findymail", "leadmagic"], owner: [] }));
    expect(r.status).toBe("not_found");
    const res = JSON.parse((await prisma.enrichmentRow.findUnique({ where: { id: row.id } }))!.resultJson!);
    expect(res.work_email).toBeUndefined();
  });

  it("budget is never exceeded under concurrency", async () => {
    const u = await user(100);
    const v = vendors((url) =>
      url.includes("findymail") ? { status: 200, body: { contact: { email: "john@acmeroofing.com" } } } : null,
    );
    const rows = Array.from({ length: 8 }, (_, i) => ({ ...ROW, businessName: `Acme ${i}` }));
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 3, feePerRow: 1, rows });
    const all = await rowsOf(job.id);
    const dp = deps(v.impl, { work_email: ["findymail"], owner: [] });
    await Promise.all(all.map((r) => processRow(r.id, dp)));
    const j = await prisma.enrichmentJob.findUnique({ where: { id: job.id } });
    expect(j!.creditsUsed).toBeLessThanOrEqual(3);
    expect(j!.creditsUsed).toBe(3);
    expect(j!.status).toBe("completed");
    const statuses = (await rowsOf(job.id)).map((r) => r.status).sort();
    expect(statuses.filter((s) => s === "succeeded").length).toBe(3);
    expect(statuses.filter((s) => s === "budget_exceeded").length).toBe(5);
    // Rows that hit the budget made no vendor call.
    expect(v.calls["app.findymail.com"]).toBe(3);
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.creditsRemaining).toBe(97);
  });

  it("async provider: pending, then resumed with the same submission (no second submit)", async () => {
    const u = await user();
    let reads = 0;
    const v = vendors((url) => {
      if (url.endsWith("/api/email-search")) return { status: 200, body: { success: true, item: { _id: "ic-1", status: "NONE" } } };
      if (url.endsWith("/bulk-single-searchs/read")) {
        reads++;
        return reads === 1
          ? { status: 200, body: { success: true, items: [{ _id: "ic-1", status: "IN_PROGRESS" }] } }
          : { status: 200, body: { success: true, items: [{ _id: "ic-1", status: "DEBITED", results: { emails: [{ email: "john@acmeroofing.com", certainty: "very_sure" }] } }] } };
      }
      return null;
    });
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [ROW] });
    const [row] = await rowsOf(job.id);
    const dp = deps(v.impl, { work_email: ["icypeas"], owner: [] });
    const due = async () => {
      await prisma.providerAttempt.updateMany({ where: { rowId: row.id }, data: { nextCheckAt: new Date(Date.now() - 1000) } });
    };
    expect((await processRow(row.id, dp)).status).toBe("waiting_provider");
    // Not due yet: no read happens.
    expect((await processRow(row.id, dp)).status).toBe("waiting_provider");
    expect(reads).toBe(0);
    await due();
    expect((await processRow(row.id, dp)).status).toBe("waiting_provider");
    await due();
    expect((await processRow(row.id, dp)).status).toBe("succeeded");
    expect(reads).toBe(2);
    expect(v.calls["app.icypeas.com"]).toBe(3); // 1 submit + 2 reads
  });

  it("a provider out of credits is skipped for the rest of the job, next provider used", async () => {
    const u = await user();
    const v = vendors((url) => {
      if (url.includes("findymail")) return { status: 402, body: { error: "Not enough credits" } };
      if (url.includes("leadmagic")) return { status: 200, body: { email: "john@acmeroofing.com", status: "valid", credits_consumed: 1 } };
      return null;
    });
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [ROW] });
    const [row] = await rowsOf(job.id);
    const r = await processRow(row.id, deps(v.impl, { work_email: ["findymail", "leadmagic"], owner: [] }));
    expect(r.status).toBe("succeeded");
    const view = await getJobView(u.id, job.id, { rows: true });
    const attempts = view!.rows![0].attempts;
    expect(attempts.map((a) => [a.provider, a.status])).toEqual([
      ["findymail", "no_credit"],
      ["leadmagic", "succeeded"],
    ]);
  });

  it("missing name is needs_input, never charged, no vendor call", async () => {
    const u = await user();
    const v = vendors(() => ({ status: 200, body: {} }));
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [{ businessName: "Acme Roofing", website: "acmeroofing.com" }] });
    const [row] = await rowsOf(job.id);
    const r = await processRow(row.id, deps(v.impl, { work_email: ["findymail"], owner: [] }));
    expect(r.status).toBe("needs_input");
    expect(Object.keys(v.calls)).toHaveLength(0);
  });

  it("tenant isolation: jobs, results and private contacts stay in their workspace", async () => {
    const a = await user();
    const b = await user();
    const lead = await prisma.lead.create({ data: { businessName: "Acme Roofing", website: "https://acmeroofing.com" } });
    try {
      const v = vendors((url) =>
        url.includes("findymail") ? { status: 200, body: { contact: { email: "john@acmeroofing.com" } } } : null,
      );
      const job = await createEnrichmentJob({ userId: a.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 10, feePerRow: 1, rows: [{ ...ROW, leadId: lead.id }] });
      const [row] = await rowsOf(job.id);
      await processRow(row.id, deps(v.impl, { work_email: ["findymail"], owner: [] }));
      expect(await getJobView(b.id, job.id)).toBeNull();
      expect(await cancelEnrichmentJob(b.id, job.id)).toBe(false);
      const contactA = await prisma.workspaceLeadContact.findUnique({ where: { userId_leadId: { userId: a.id, leadId: lead.id } } });
      expect(contactA?.email).toBe("john@acmeroofing.com");
      expect(await prisma.workspaceLeadContact.findUnique({ where: { userId_leadId: { userId: b.id, leadId: lead.id } } })).toBeNull();
      // The shared lead record is not given the paid email.
      expect((await prisma.lead.findUnique({ where: { id: lead.id } }))!.email).toBeNull();
    } finally {
      await prisma.lead.delete({ where: { id: lead.id } });
    }
  });

  it("idempotency key returns the same job", async () => {
    const u = await user();
    const one = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 5, feePerRow: 1, rows: [ROW], idempotencyKey: "abc" });
    const two = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 5, feePerRow: 1, rows: [ROW], idempotencyKey: "abc" });
    expect(two).toEqual({ id: one.id, created: false });
    expect(await prisma.enrichmentJob.count({ where: { userId: u.id } })).toBe(1);
  });

  it("concurrent workers never claim the same row", async () => {
    const u = await user();
    const rows = Array.from({ length: 6 }, (_, i) => ({ ...ROW, businessName: `Claim ${i}` }));
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 0, feePerRow: 0, rows });
    // Only this job's rows are due in this test.
    await prisma.enrichmentRow.updateMany({ where: { jobId: { not: job.id }, status: { in: ["queued", "running", "waiting_provider"] } }, data: { nextRunAt: new Date(Date.now() + 3600_000) } });
    const [x, y] = await Promise.all([claimDueRows("w1", 4), claimDueRows("w2", 4)]);
    const mine = new Set((await rowsOf(job.id)).map((r) => r.id));
    const xs = x.filter((id) => mine.has(id));
    const ys = y.filter((id) => mine.has(id));
    expect(xs.filter((id) => ys.includes(id))).toHaveLength(0);
    expect(xs.length + ys.length).toBe(6);
  });

  it("cancel stops queued rows; CSV export neutralizes formulas", async () => {
    const u = await user();
    const job = await createEnrichmentJob({ userId: u.id, targets: ["work_email"], preset: { revealMobile: false }, budgetCredits: 5, feePerRow: 1, rows: [{ businessName: "=HYPERLINK(\"x\")" }, ROW] });
    expect(await cancelEnrichmentJob(u.id, job.id)).toBe(true);
    const view = await getJobView(u.id, job.id, { rows: true });
    expect(view!.status).toBe("cancelled");
    expect(view!.rows!.every((r) => r.status === "cancelled")).toBe(true);
    const csv = jobToCsv(view!);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
