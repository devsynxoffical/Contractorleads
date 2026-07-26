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
  unlockLeads,
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

    // Bill only for leads actually returned (e.g. request 50 → get 48 → charge 48).
    // allowPartial covers rare concurrent races without double-billing.
    let billedCharged = 0;
    let billedCreditsRemaining: number | null = null;
    let unlockedIds = new Set<string>();
    let leadsBilled = 0;
    let skippedForCredits = 0;
    if (result.leads.length > 0) {
      try {
        const billed = await unlockLeads({
          userId: user.id,
          leadIds: result.leads.map((l) => l.id),
          action: "lead_generate",
          allowPartial: true,
        });
        billedCharged = billed.charged;
        billedCreditsRemaining = billed.creditsRemaining;
        unlockedIds = new Set(billed.unlockedIds);
        leadsBilled = billed.newlyUnlocked.length;
        skippedForCredits = billed.skippedForCredits;

        // Zero affordable slots (balance race) — unlockLeads throws; if it
        // returned empty newlyUnlocked with no prior unlocks, treat as fail.
        if (
          billed.newlyUnlocked.length === 0 &&
          billed.unlockedIds.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                "Not enough credits to bill the leads that were found. Purchase more on Billing, then export them.",
              code: "INSUFFICIENT_CREDITS",
              search: result.search,
              leadsFound: result.leads.length,
              upgradeUrl: "/billing",
            },
            { status: 402 },
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "INSUFFICIENT_CREDITS") {
          return NextResponse.json(
            {
              error:
                "Not enough credits to bill the leads that were found. Purchase more on Billing, then export them.",
              code: "INSUFFICIENT_CREDITS",
              search: result.search,
              leadsFound: result.leads.length,
              upgradeUrl: "/billing",
            },
            { status: 402 },
          );
        }
        throw err;
      }
    }

    const filterNote =
      result.meta.requireSocialPresence && result.meta.skippedNoSocial > 0
        ? ` (${result.meta.skippedNoSocial} skipped — missing LinkedIn, social, or owner)`
        : "";
    const capNote = capped
      ? ` (capped to ${targetLeadCount} by lead limit)`
      : "";
    const billNote =
      billedCharged > 0
        ? ` · ${billedCharged} credits for ${leadsBilled} lead${leadsBilled === 1 ? "" : "s"}`
        : "";

    await logActivity(
      user.id,
      "search",
      `Found ${result.leads.length} leads for ${industry} in ${
        locationScope === "country" ? country : state || city || country
      }${filterNote}${capNote}${billNote}`,
      {
        searchId: result.search.id,
        charged: billedCharged,
        leadsReturned: result.leads.length,
        leadsBilled,
        skippedForCredits,
        requestedLeadCount: requestedCount,
      },
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
      unlocked: unlockedIds.has(lead.id),
    }));

    return NextResponse.json({
      search: result.search,
      leads: redacted,
      creditsRemaining: billedCreditsRemaining ?? freshCapacity.balance,
      capacity: freshCapacity,
      meta: {
        ...result.meta,
        requestedLeadCount: requestedCount,
        targetLeadCount,
        leadsReturned: result.leads.length,
        leadsBilled,
        skippedForCredits,
        cappedByLeadLimit: capped,
        billing: {
          searchCharged: billedCharged,
          leadsBilled,
          costPerLead: CREDIT_COSTS.lead,
          note: `Charged for ${leadsBilled} lead${leadsBilled === 1 ? "" : "s"} returned (${CREDIT_COSTS.lead} credits each). Re-export is free.`,
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
