/**
 * Houzz enrichment — verified link + rating/reviews, or blank.
 */
import { searchPublicWeb } from "./web-search";
import { matchesBusinessName } from "./linkedin";
import type { DirectListingResult } from "./yelp";

export type HouzzMatch = {
  url: string;
  rating?: number;
  reviewCount?: number;
};

export async function matchHouzzBusiness(
  name: string,
  location: string,
): Promise<HouzzMatch | null> {
  const endpoint = process.env.HOUZZ_SEARCH_ENDPOINT;
  const apiKey = process.env.HOUZZ_API_KEY;

  if (!endpoint) {
    const query = `(site:houzz.com/pro OR site:houzz.com/professionals OR site:houzz.co.uk/pro OR site:houzz.co.uk/professionals OR site:houzz.ca/pro OR site:houzz.com.au/pro) "${name}" ${location}`;
    const results = await searchPublicWeb(query, 5);

    for (const hit of results) {
      if (!matchesBusinessName(`${hit.url} ${hit.title} ${hit.snippet}`, name)) {
        continue;
      }

      try {
        const parsed = new URL(hit.url);
        const host = parsed.hostname.toLowerCase();
        if (
          host.includes("houzz.com") ||
          host.includes("houzz.co.uk") ||
          host.includes("houzz.ca") ||
          host.includes("houzz.com.au")
        ) {
          if (
            parsed.pathname.startsWith("/pro/") ||
            parsed.pathname.startsWith("/professionals/") ||
            parsed.pathname.startsWith("/pro-reviews/")
          ) {
            let rating: number | undefined;
            let reviewCount: number | undefined;

            const ratingMatch = hit.snippet.match(/([1-5](?:\.[0-9])?)\s*(?:star|\/5)/i);
            if (ratingMatch?.[1]) rating = parseFloat(ratingMatch[1]);

            const reviewMatch = hit.snippet.match(/([0-9]+)\s*reviews?/i);
            if (reviewMatch?.[1]) reviewCount = parseInt(reviewMatch[1], 10);

            return {
              url: hit.url.split("?")[0],
              rating,
              reviewCount,
            };
          }
        }
      } catch {
        /* skip invalid url */
      }
    }
    return null;
  }

  try {
    const url = new URL(endpoint);
    url.searchParams.set("q", `${name} ${location}`);
    url.searchParams.set("limit", "5");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: Array<{
        name?: string;
        url?: string;
        rating?: number;
        reviewCount?: number;
        review_count?: number;
      }>;
    };

    const match = data.results?.find((r) => {
      if (!r.name || !r.url) return false;
      return matchesBusinessName(`${r.name} ${r.url}`, name);
    });

    if (!match?.url) return null;

    return {
      url: match.url.split("?")[0],
      rating: match.rating,
      reviewCount: match.reviewCount ?? match.review_count,
    };
  } catch {
    return null;
  }
}

export async function searchHouzzDirect(params: {
  industry: string;
  location: string;
  limit?: number;
  targetSolo?: boolean;
}): Promise<DirectListingResult[]> {
  const limit = Math.min(params.limit ?? 25, 50);
  const results: DirectListingResult[] = [];

  try {
    const query = `(site:houzz.com/professionals OR site:houzz.com/pro) "${params.industry}" "${params.location}" "reviews"`;
    const hits = await searchPublicWeb(query, limit);

    for (const hit of hits) {
      if (!hit.url.includes("/pro/") && !hit.url.includes("/professionals/")) continue;
      // e.g. "Apex Roofing Pro - Reviews & Project Photos - Houzz"
      const name = hit.title
        .replace(/\s*-\s*Reviews\s*&.*Houzz.*$/i, "")
        .replace(/\s*-\s*Projects\s*&.*Houzz.*$/i, "")
        .replace(/\s*\|\s*Houzz.*$/i, "")
        .replace(/\s*-\s*Houzz.*$/i, "")
        .trim();
      if (!name || name.length < 3) continue;

      let rating: number | undefined;
      let reviewCount: number | undefined;
      const ratingMatch = hit.snippet.match(/([1-5](?:\.[0-9])?)\s*(?:star|\/5)/i);
      if (ratingMatch?.[1]) rating = parseFloat(ratingMatch[1]);
      const reviewMatch = hit.snippet.match(/([0-9]+)\s*reviews?/i);
      if (reviewMatch?.[1]) reviewCount = parseInt(reviewMatch[1], 10);

      if (params.targetSolo && reviewCount && (reviewCount < 3 || reviewCount > 45)) {
        continue;
      }

      const phoneMatch = hit.snippet.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

      results.push({
        source: "houzz",
        name,
        phone,
        rating,
        reviewCount,
        isClaimed: false,
        url: hit.url.split("?")[0],
      });
    }
  } catch {
    /* ignore */
  }

  return results;
}
