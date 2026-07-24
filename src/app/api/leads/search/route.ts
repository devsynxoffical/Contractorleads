import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/credits";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";
import { resolveSearchCriteria, formatSearchLabel } from "@/lib/search-criteria";
import { sendLeadScrapeEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/email-brand";
import {
  assertSearchRateLimit,
  getLeadGenerationCapacity,
  leadLimitPayload,
} from "@/lib/lead-access";
import { CREDIT_COSTS } from "@/lib/constants";

/** Large volume searches can run several minutes. */
export const maxDuration = 300;

/** Remaining lead generation capacity for the signed-in user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const capacity = await getLeadGenerationCapacity(user.id);
  return NextResponse.json({ capacity });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rate = await assertSearchRateLimit(user.id);
    if (!rate.ok) {
      return NextResponse.json({ error: rate.error }, { status: 429 });
    }

    const body = await request.json();
    const resolved = resolveSearchCriteria(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const capacity = await getLeadGenerationCapacity(user.id);
    if (capacity.available < 1) {
      return NextResponse.json(leadLimitPayload(capacity), { status: 402 });
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
      targetLeadCount: requestedCount,
    } = resolved.criteria;

    const targetLeadCount = Math.min(requestedCount, capacity.available);
    const capped = targetLeadCount < requestedCount;

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your environment.",
        },
        { status: 503 },
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

    const filterNote =
      result.meta.requireSocialPresence && result.meta.skippedNoSocial > 0
        ? ` (${result.meta.skippedNoSocial} skipped — missing LinkedIn, social, or owner)`
        : "";
    const capNote = capped
      ? ` (capped to ${targetLeadCount} by lead limit)`
      : "";

    await logActivity(
      user.id,
      "search",
      `Found ${result.leads.length} leads for ${industry} in ${
        locationScope === "country" ? country : state || city || country
      }${filterNote}${capNote}`,
      { searchId: result.search.id },
    );

    const hotCount = result.leads.filter((l) => l.qualityTier === "hot").length;
    const warmCount = result.leads.filter(
      (l) => l.qualityTier === "warm",
    ).length;
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

    const freshCapacity = await getLeadGenerationCapacity(user.id);

    const redacted = result.leads.map((lead) => ({
      ...lead,
      unlocked: true,
    }));

    return NextResponse.json({
      search: result.search,
      leads: redacted,
      creditsRemaining: freshCapacity.balance,
      capacity: freshCapacity,
      meta: {
        ...result.meta,
        requestedLeadCount: requestedCount,
        targetLeadCount,
        cappedByLeadLimit: capped,
        billing: {
          searchCharged: 0,
          exportCostPerLead: CREDIT_COSTS.lead,
          note: "You can generate up to your remaining lead limit. Viewing is free; export spends 1.33 credits per lead.",
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    const isPlaces =
      err instanceof Error &&
      (err.name === "GooglePlacesError" ||
        message.includes("Google Places") ||
        message.includes("Billing"));
    return NextResponse.json(
      { error: message },
      { status: isPlaces ? 503 : 500 },
    );
  }
}
