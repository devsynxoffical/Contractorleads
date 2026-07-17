/**
 * Houzz enrichment — verified link + rating/reviews, or blank.
 * Houzz has no public Fusion-style API; do not invent URLs from business names.
 * When HOUZZ lookup is unavailable, return null (never fabricate).
 */
import { searchPublicWeb } from "./web-search";

export type HouzzMatch = {
  url: string;
  rating?: number;
  reviewCount?: number;
};

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function namesMatch(a: string, b: string) {
  const left = normalize(a);
  const right = normalize(b);
  return (
    left === right ||
    left.includes(right) ||
    right.includes(left)
  );
}

/**
 * Optional: set HOUZZ_SEARCH_ENDPOINT to a licensed/proxy search URL that
 * returns JSON { results: [{ name, url, rating?, reviewCount? }] }.
 * Without it, Houzz stays blank (PRD-compliant).
 */
export async function matchHouzzBusiness(
  name: string,
  location: string
): Promise<HouzzMatch | null> {
  const endpoint = process.env.HOUZZ_SEARCH_ENDPOINT;
  const apiKey = process.env.HOUZZ_API_KEY;

  if (!endpoint) {
    const results = await searchPublicWeb(
      `site:houzz.com/professionals "${name}" "${location}"`,
      5
    );
    const needle = normalize(name);
    const match = results.find((result) => {
      try {
        const host = new URL(result.url).hostname.toLowerCase();
        if (host !== "houzz.com" && !host.endsWith(".houzz.com")) return false;
      } catch {
        return false;
      }
      return normalize(`${result.title} ${result.snippet}`).includes(needle);
    });
    return match ? { url: match.url } : null;
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
      if (!/^https?:\/\/(www\.)?houzz\.com\//i.test(r.url)) return false;
      return namesMatch(name, r.name);
    });

    if (!match?.url) return null;

    return {
      url: match.url,
      rating: match.rating,
      reviewCount: match.reviewCount ?? match.review_count,
    };
  } catch {
    return null;
  }
}
