import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveMetaAccessTokenForUser } from "@/lib/facebook-oauth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import {
  classifyAdPlacements,
  searchFacebookAdsLibrary,
} from "@/lib/services/facebook";

const ALLOWED_COUNTRIES = new Set(["US", "CA", "GB", "AU", "NZ", "ALL"]);

/**
 * POST /api/facebook/search
 * Body: { query: string; country?: string }
 * Searches the Meta Ads Library by Page name. Wrap the name in double quotes
 * for an exact page-name match.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`facebook-search:${user.id}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return tooManyRequests(
      limit.retryAfterSeconds,
      "Too many Ads Library searches. Please wait a moment and try again.",
    );
  }

  let body: { query?: unknown; country?: unknown };
  try {
    body = (await request.json()) as { query?: unknown; country?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json(
      { error: "Enter a Facebook Page name to search." },
      { status: 400 },
    );
  }
  if (query.length > 200) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }

  const rawCountry =
    typeof body.country === "string" ? body.country.trim().toUpperCase() : "US";
  const country = ALLOWED_COUNTRIES.has(rawCountry) ? rawCountry : "US";

  try {
    const accessToken = await resolveMetaAccessTokenForUser(user.id);
    const result = await searchFacebookAdsLibrary(query, country, { accessToken });

    const ads = result.ads.map((ad) => {
      const placements = classifyAdPlacements(ad.publisherPlatforms);
      return {
        ...ad,
        hasStory: placements.hasStory,
        placementLabels: placements.labels,
      };
    });

    return NextResponse.json({ ...result, ads, country });
  } catch (e) {
    console.error("[facebook/search]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Could not search the Meta Ads Library. Please try again.",
      },
      { status: 500 },
    );
  }
}
