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

export type DirectListingResult = {
  source: "yelp" | "nextdoor" | "houzz" | "google";
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
  priceTier?: string; // "$" | "$$" | "$$$" | "$$$$"
  isClaimed?: boolean;
  hasAds?: boolean;
  yearsInBusiness?: number;
};

export async function searchYelpDirect(params: {
  industry: string;
  location: string;
  limit?: number;
  targetSolo?: boolean;
}): Promise<DirectListingResult[]> {
  const apiKey = (await resolvePlatformKey("yelpFusionApiKey")).trim();
  const limit = Math.min(params.limit ?? 25, 50);
  const results: DirectListingResult[] = [];

  // Strategy 1: Official Yelp Fusion API
  if (apiKey) {
    try {
      const url = new URL("https://api.yelp.com/v3/businesses/search");
      url.searchParams.set("term", params.industry);
      url.searchParams.set("location", params.location);
      url.searchParams.set("limit", String(limit));
      if (params.targetSolo) {
        url.searchParams.set("price", "1"); // "$" tier
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          businesses?: Array<{
            name: string;
            url: string;
            phone?: string;
            display_phone?: string;
            rating?: number;
            review_count?: number;
            price?: string;
            is_claimed?: boolean;
            is_closed?: boolean;
            location?: {
              address1?: string;
              city?: string;
              state?: string;
              zip_code?: string;
              display_address?: string[];
            };
          }>;
        };

        for (const b of data.businesses ?? []) {
          if (b.is_closed) continue;
          if (params.targetSolo && b.review_count && (b.review_count < 3 || b.review_count > 45)) {
            // Keep in the 5-40 review sweet spot
            continue;
          }

          results.push({
            source: "yelp",
            name: b.name.trim(),
            phone: b.display_phone || b.phone || undefined,
            address: b.location?.display_address?.join(", ") || b.location?.address1 || undefined,
            city: b.location?.city || undefined,
            state: b.location?.state || undefined,
            zip: b.location?.zip_code || undefined,
            rating: b.rating,
            reviewCount: b.review_count,
            priceTier: b.price || "$",
            isClaimed: b.is_claimed ?? false,
            url: b.url.split("?")[0],
          });
        }

        if (results.length > 0) return results;
      }
    } catch {
      /* fallback to web search */
    }
  }

  // Strategy 2: Web Search Direct Scraper
  try {
    const query = `site:yelp.com/biz "${params.industry}" "${params.location}" "reviews"`;
    const hits = await searchPublicWeb(query, limit);

    for (const hit of hits) {
      if (!hit.url.includes("/biz/")) continue;
      // Extract clean business name from title (e.g. "JOHN DOE ROOFING - Updated 2026 - Yelp")
      const name = hit.title
        .replace(/\s*-\s*(?:Updated\s*\d{4}\s*-\s*)?Yelp.*$/i, "")
        .replace(/\s*\|\s*Yelp.*$/i, "")
        .trim();
      if (!name || name.length < 3) continue;

      let rating: number | undefined;
      let reviewCount: number | undefined;
      const ratingMatch = hit.snippet.match(/([1-5](?:\.[0-9])?)\s*(?:star|\/5)/i);
      if (ratingMatch?.[1]) rating = parseFloat(ratingMatch[1]);
      const reviewMatch = hit.snippet.match(/([0-9]+)\s*reviews?/i);
      if (reviewMatch?.[1]) reviewCount = parseInt(reviewMatch[1], 10);

      // Extract phone number from snippet if present
      const phoneMatch = hit.snippet.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

      results.push({
        source: "yelp",
        name,
        phone,
        rating,
        reviewCount,
        priceTier: "$",
        isClaimed: false,
        url: hit.url.split("?")[0],
      });
    }
  } catch {
    /* ignore */
  }

  return results;
}
