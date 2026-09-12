import { resolvePlatformKey } from "@/lib/platform-keys";
import { searchPublicWeb } from "./web-search";
import { matchesBusinessName } from "./linkedin";

export type YelpMatch = {
  url: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
};

export async function matchYelpBusiness(
  name: string,
  location: string,
): Promise<YelpMatch | null> {
  const apiKey = (await resolvePlatformKey("yelpFusionApiKey")).trim();

  // Strategy 1: Official Yelp Fusion API (when API key exists)
  if (apiKey) {
    try {
      const url = new URL("https://api.yelp.com/v3/businesses/search");
      url.searchParams.set("term", name);
      url.searchParams.set("location", location);
      url.searchParams.set("limit", "3");

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          businesses?: Array<{
            name: string;
            url: string;
            rating?: number;
            review_count?: number;
            is_closed?: boolean;
          }>;
        };

        const match = data.businesses?.find((b) => {
          return matchesBusinessName(b.name, name);
        });

        if (match && !match.is_closed) {
          return {
            url: match.url.split("?")[0],
            rating: match.rating,
            reviewCount: match.review_count,
            isActive: true,
          };
        }
      }
    } catch {
      /* fallback to web search */
    }
  }

  // Strategy 2: Free Public Web Search fallback
  try {
    const query = `(site:yelp.com/biz OR site:yelp.co.uk/biz OR site:yelp.ca/biz OR site:yelp.com.au/biz) "${name}" ${location}`;
    const hits = await searchPublicWeb(query, 5);

    for (const hit of hits) {
      if (!matchesBusinessName(`${hit.url} ${hit.title} ${hit.snippet}`, name)) {
        continue;
      }

      try {
        const parsed = new URL(hit.url);
        if (
          (parsed.hostname.includes("yelp.com") ||
            parsed.hostname.includes("yelp.co.uk") ||
            parsed.hostname.includes("yelp.ca") ||
            parsed.hostname.includes("yelp.com.au")) &&
          parsed.pathname.startsWith("/biz/")
        ) {
          // Parse rating / reviews from snippet if available (e.g. "4.5 star rating · 23 reviews")
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
            isActive: true,
          };
        }
      } catch {
        /* skip invalid url */
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}
