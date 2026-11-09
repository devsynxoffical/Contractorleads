import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { getWaterfallEnrichCreditCost } from "@/lib/plans";
import { insufficientCreditsPayload } from "@/lib/lead-access";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { enrichInline, overlayWorkspaceContacts } from "@/lib/enrichment/inline";

export const maxDuration = 60;

/**
 * Enrich one lead with the provider waterfall. Runs on the shared enrichment engine:
 * per-field stop rules, verified-only acceptance, a single charge per lead, and the paid
 * person data saved to this workspace only (never onto the shared lead record).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const creditCost = await getWaterfallEnrichCreditCost();
  if (creditCost > 0 && user.creditsRemaining < creditCost) {
    return NextResponse.json(
      insufficientCreditsPayload(creditCost, user.creditsRemaining),
      { status: 402 },
    );
  }

  try {
    const { jobId, results, handedOff } = await enrichInline({
      userId: user.id,
      source: "leads",
      name: lead.businessName,
      feePerRow: creditCost,
      timeBudgetMs: 50_000,
      rows: [
        {
          leadId: lead.id,
          businessName: lead.businessName,
          website: lead.website,
          ownerName: lead.ownerName,
          ownerTitle: lead.ownerTitle,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          country: lead.country,
        },
      ],
    });
    const waterfall = results[0];
    const charged = waterfall?.charged ?? 0;

    if (charged > 0) {
      await logActivity(
        user.id,
        "waterfall_enrich",
        `Waterfall enriched ${lead.businessName} via ${waterfall.winningSource || "multi-source"} (${charged} credits)`,
        { leadId: lead.id, winningSource: waterfall.winningSource, newlyFoundFields: waterfall.newlyFoundFields, charged, jobId },
      ).catch(() => null);
    }

    const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { creditsRemaining: true } });
    const [withContact] = await overlayWorkspaceContacts(user.id, [lead]);
    const pending = handedOff > 0;

    return NextResponse.json({
      ok: true,
      lead: withContact,
      waterfall: waterfall
        ? { ...waterfall, found: waterfall.foundVerifiedContact, sourceLabel: waterfall.winningSource ?? "waterfall" }
        : null,
      jobId,
      pending,
      charged,
      creditCost,
      creditsRemaining: fresh?.creditsRemaining ?? user.creditsRemaining,
      message: pending
        ? "Still waiting on a provider: the result will appear in Enrichment jobs shortly."
        : waterfall?.newlyFoundFields.length
          ? `Found ${waterfall.newlyFoundFields.join(", ")} via ${waterfall.winningSource || "the waterfall"}`
          : waterfall?.emailForReview
            ? `Found ${waterfall.emailForReview} (${waterfall.emailStatus === "catch_all" ? "catch-all domain" : "unconfirmed"}), kept for review; 0 credits charged`
            : "No new verified contact data found across providers; 0 credits charged",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Waterfall enrichment failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
