import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { getWaterfallEnrichCreditCost } from "@/lib/plans";
import { insufficientCreditsPayload } from "@/lib/lead-access";
import { enrichInline, type LegacyWaterfallResult } from "@/lib/enrichment/inline";
import type { RowInput } from "@/lib/enrichment/engine";

export const maxDuration = 300;

/**
 * Returns the current admin-configured Waterfall Enrichment credit fee
 * and the signed-in user's remaining credit balance.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCostPerLead = await getWaterfallEnrichCreditCost();
  return NextResponse.json({
    creditCostPerLead,
    creditsRemaining: user.creditsRemaining,
  });
}

const s = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Bulk waterfall enrichment for uploaded rows or selected leads, run now on the shared
 * enrichment engine (same stop rules, acceptance, one charge per row that gains a field).
 * Rows that wait on an async provider, or run past the request time, finish in the
 * background job returned as jobId. Larger files should use /api/enrichment/jobs.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawItems: unknown[] = Array.isArray(body.items) ? body.items : [];
  const items: Array<RowInput & { leadId?: string | null }> = rawItems
    .filter((it): it is Record<string, unknown> => Boolean(it) && typeof it === "object" && typeof (it as { businessName?: unknown }).businessName === "string")
    .map((it) => ({
      leadId: s(it.leadId, 40),
      businessName: s(it.businessName, 200) ?? "",
      website: s(it.website),
      ownerName: s(it.ownerName, 120),
      ownerTitle: s(it.ownerTitle, 120),
      email: s(it.email, 200),
      phone: s(it.phone, 40),
      city: s(it.city, 100),
      state: s(it.state, 60),
      country: s(it.country, 60),
    }))
    .filter((it) => it.businessName)
    .slice(0, 500);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Please provide at least one lead or datasheet row to enrich." },
      { status: 400 },
    );
  }

  const creditCostPerLead = await getWaterfallEnrichCreditCost();
  if (creditCostPerLead > 0 && user.creditsRemaining < creditCostPerLead) {
    return NextResponse.json(
      insufficientCreditsPayload(creditCostPerLead, user.creditsRemaining),
      { status: 402 },
    );
  }

  const balance = async () =>
    (await prisma.user.findUnique({ where: { id: user.id }, select: { creditsRemaining: true } }))?.creditsRemaining ??
    user.creditsRemaining;

  const summarize = async (results: LegacyWaterfallResult[], jobId: string, handedOff: number) => {
    const done = results.filter(Boolean).map((r, i) => ({ ...r, rowIndex: i }));
    const totalCharged = Math.round(done.reduce((a, r) => a + r.charged, 0) * 100) / 100;
    const enrichedCount = done.filter((r) => r.foundVerifiedContact).length;
    if (totalCharged > 0 || enrichedCount > 0) {
      await logActivity(
        user.id,
        "waterfall_enrich_bulk",
        `Waterfall enriched ${enrichedCount}/${items.length} leads (${totalCharged} credits charged)`,
        { totalItems: items.length, enrichedCount, totalCharged, creditCostPerLead, jobId },
      ).catch(() => null);
    }
    return {
      ok: true,
      jobId,
      results: done,
      stats: {
        totalProcessed: done.length,
        enrichedCount,
        withVerifiedEmail: done.filter((r) => r.email && r.emailVerified).length,
        withEmailForReview: done.filter((r) => r.emailForReview).length,
        withPhone: done.filter((r) => Boolean(r.phone)).length,
        withOwner: done.filter((r) => Boolean(r.ownerName)).length,
        totalCharged,
        creditCostPerLead,
        creditsRemaining: await balance(),
        stoppedForCredits: done.some((r) => r.rowStatus === "budget_exceeded"),
        continuingInBackground: handedOff,
      },
    };
  };

  const wantsStream =
    body.stream === true || request.headers.get("accept")?.includes("text/event-stream");

  if (!wantsStream) {
    const { jobId, results, handedOff } = await enrichInline({
      userId: user.id,
      rows: items,
      feePerRow: creditCostPerLead,
      source: items.some((i) => i.leadId) ? "leads" : "upload",
    });
    return NextResponse.json(await summarize(results, jobId, handedOff));
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();
  const sendEvent = async (event: string, data: unknown) => {
    try {
      await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch {
      /* client disconnected */
    }
  };
  void writer.write(encoder.encode(": connected\n\n"));

  (async () => {
    try {
      await sendEvent("start", { total: items.length, creditCostPerLead, creditsRemaining: user.creditsRemaining });
      let current = 0;
      let totalCharged = 0;
      const { jobId, results, handedOff } = await enrichInline({
        userId: user.id,
        rows: items,
        feePerRow: creditCostPerLead,
        source: items.some((i) => i.leadId) ? "leads" : "upload",
        onRow: async (rowIndex, result) => {
          current++;
          totalCharged = Math.round((totalCharged + result.charged) * 100) / 100;
          await sendEvent("row", {
            current,
            total: items.length,
            rowIndex,
            result: { ...result, rowIndex },
            totalCharged,
            creditsRemaining: await balance(),
          });
        },
      });
      await sendEvent("done", await summarize(results, jobId, handedOff));
    } catch (err) {
      await sendEvent("error", { error: err instanceof Error ? err.message : "Bulk waterfall enrichment failed" });
    } finally {
      try {
        await writer.close();
      } catch {
        /* ignore */
      }
    }
  })();

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
