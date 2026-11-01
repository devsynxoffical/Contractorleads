import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, logActivity } from "@/lib/credits";
import { getWaterfallEnrichCreditCost } from "@/lib/plans";
import { insufficientCreditsPayload } from "@/lib/lead-access";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { runWaterfallEnrichment } from "@/lib/services/waterfall-enrichment";

export const maxDuration = 60;

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
    const waterfall = await runWaterfallEnrichment({
      leadId: lead.id,
      businessName: lead.businessName,
      website: lead.website,
      ownerName: lead.ownerName,
      ownerTitle: lead.ownerTitle,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      country: lead.country,
      address: lead.address,
      industry: lead.industry,
    });

    const shouldBill =
      creditCost > 0 &&
      (waterfall.newlyFoundFields.length > 0 ||
        (waterfall.emailVerified && !lead.email));

    let creditsRemaining = user.creditsRemaining;
    let charged = 0;

    if (shouldBill) {
      creditsRemaining = await deductCredits(
        user.id,
        creditCost,
        "waterfall_enrich",
        lead.id,
      );
      charged = creditCost;

      await logActivity(
        user.id,
        "waterfall_enrich",
        `Waterfall enriched ${lead.businessName} via ${waterfall.winningSource || "Multi-Source"} (${charged} credits)`,
        {
          leadId: lead.id,
          winningSource: waterfall.winningSource,
          newlyFoundFields: waterfall.newlyFoundFields,
          charged,
        },
      );
    }

    const updatedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
    });

    return NextResponse.json({
      ok: true,
      lead: updatedLead ?? lead,
      waterfall,
      charged,
      creditCost,
      creditsRemaining,
      message:
        waterfall.newlyFoundFields.length > 0
          ? `Found ${waterfall.newlyFoundFields.join(", ")} via ${waterfall.winningSource || "Waterfall API"}`
          : waterfall.foundVerifiedContact
            ? `Verified existing contact data (${waterfall.winningSource || "Internal DB"}) — 0 extra credits charged`
            : "No additional verified contact data found across providers — 0 credits charged",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Waterfall enrichment failed";
    if (msg === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        insufficientCreditsPayload(creditCost, user.creditsRemaining),
        { status: 402 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
