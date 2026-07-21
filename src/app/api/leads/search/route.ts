import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, logActivity } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/constants";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";
import { resolveSearchCriteria, formatSearchLabel } from "@/lib/search-criteria";
import { sendLeadScrapeEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/email-brand";

/** Large volume searches can run several minutes. */
export const maxDuration = 300;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const resolved = resolveSearchCriteria(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const {
      industry,
      country,
      locationScope,
      state,
      city,
      zip,
      customLocation,
      radius,
      requireSocialPresence,
      targetLeadCount,
    } = resolved.criteria;

    const creditCost =
      CREDIT_COSTS.search *
      Math.max(1, Math.ceil(targetLeadCount / 50));

    if (user.creditsRemaining < creditCost) {
      return NextResponse.json(
        {
          error: `Insufficient credits. This search costs ${creditCost.toFixed(2)} credits (${targetLeadCount} leads).`,
        },
        { status: 402 }
      );
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your environment.",
        },
        { status: 503 }
      );
    }

    const result = await runLeadPipeline({
      userId: user.id,
      industry,
      country,
      locationScope,
      state,
      city,
      zip,
      customLocation,
      radius,
      requireSocialPresence,
      targetLeadCount,
    });

    await deductCredits(user.id, creditCost, "lead_generation");

    const filterNote =
      result.meta.requireSocialPresence && result.meta.skippedNoSocial > 0
        ? ` (${result.meta.skippedNoSocial} skipped — missing LinkedIn, social, or owner)`
        : "";

    await logActivity(
      user.id,
      "search",
      `Generated ${result.leads.length} leads for ${industry} in ${
        locationScope === "country" ? country : state || city || country
      }${filterNote}`,
      { searchId: result.search.id }
    );

    const hotCount = result.leads.filter((l) => l.qualityTier === "hot").length;
    const warmCount = result.leads.filter((l) => l.qualityTier === "warm").length;
    void sendLeadScrapeEmail({
      userId: user.id,
      to: user.email,
      name: user.name,
      industry,
      locationLabel: formatSearchLabel({
        industry,
        country,
        locationScope,
        state,
        city,
        customLocation,
      }).replace(`${industry} `, ""),
      leadCount: result.leads.length,
      hotCount,
      warmCount,
      sampleNames: result.leads.slice(0, 5).map((l) => l.businessName),
      searchUrl: `${appBaseUrl()}/leads/search`,
    });

    const credits = await prisma.user.findUnique({
      where: { id: user.id },
      select: { creditsRemaining: true },
    });

    return NextResponse.json({
      search: result.search,
      leads: result.leads,
      creditsRemaining: credits?.creditsRemaining,
      meta: result.meta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    if (message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        { error: "Insufficient credits. Upgrade your plan to continue." },
        { status: 402 }
      );
    }
    const isPlaces =
      err instanceof Error &&
      (err.name === "GooglePlacesError" ||
        message.includes("Google Places") ||
        message.includes("Billing"));
    return NextResponse.json(
      { error: message },
      { status: isPlaces ? 503 : 500 }
    );
  }
}
