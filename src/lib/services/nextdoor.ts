/**
 * Nextdoor enrichment — best-effort, non-blocking (PRD §1.5).
 */
import { searchPublicWeb } from "./web-search";
import { matchesBusinessName } from "./linkedin";
import type { DirectListingResult } from "./yelp";

export type NextdoorMatch = {
  url: string;
};

export async function matchNextdoorBusiness(
  name: string,
  location: string,
): Promise<NextdoorMatch | null> {
  const endpoint = process.env.NEXTDOOR_SEARCH_ENDPOINT;
  const apiKey = process.env.NEXTDOOR_API_KEY;

  if (!endpoint) {
    const query = `(site:nextdoor.com/pages OR site:nextdoor.co.uk/pages OR site:nextdoor.ca/pages OR site:nextdoor.com.au/pages) "${name}" ${location}`;
    const results = await searchPublicWeb(query, 5);

    for (const hit of results) {
      if (!matchesBusinessName(`${hit.url} ${hit.title} ${hit.snippet}`, name)) {
        continue;
      }

      try {
        const parsed = new URL(hit.url);
        const host = parsed.hostname.toLowerCase();
        if (
          host.includes("nextdoor.com") ||
          host.includes("nextdoor.co.uk") ||
          host.includes("nextdoor.ca") ||
          host.includes("nextdoor.com.au")
        ) {
          if (parsed.pathname.startsWith("/pages/")) {
            return { url: hit.url.split("?")[0] };
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
    url.searchParams.set("limit", "3");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: Array<{ name?: string; url?: string }>;
    };

    const match = data.results?.find((r) => {
      if (!r.name || !r.url) return false;
      return matchesBusinessName(`${r.name} ${r.url}`, name);
    });

    return match?.url ? { url: match.url.split("?")[0] } : null;
  } catch {
    return null;
  }
}

export async function searchNextdoorDirect(params: {
  industry: string;
  location: string;
  limit?: number;
  targetSolo?: boolean;
}): Promise<DirectListingResult[]> {
  const limit = Math.min(params.limit ?? 25, 50);
  const results: DirectListingResult[] = [];

  try {
    const query = `site:nextdoor.com/pages "${params.industry}" "${params.location}" "recommendations"`;
    const hits = await searchPublicWeb(query, limit);

    for (const hit of hits) {
      if (!hit.url.includes("/pages/")) continue;
      // e.g. "Bob's Plumbing - Dallas, TX - Nextdoor"
      const name = hit.title
        .replace(/\s*-\s*Nextdoor.*$/i, "")
        .replace(/\s*\|\s*Nextdoor.*$/i, "")
        .replace(/\s*-\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*$/i, "")
        .trim();
      if (!name || name.length < 3) continue;

      let reviewCount: number | undefined;
      const recMatch = hit.snippet.match(/([0-9]+)\s*recommendations?/i);
      if (recMatch?.[1]) reviewCount = parseInt(recMatch[1], 10);

      if (params.targetSolo && reviewCount && (reviewCount < 1 || reviewCount > 20)) {
        // Keep in target 1-15 recommendation band for under-marketed contractors
        continue;
      }

      const phoneMatch = hit.snippet.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

      results.push({
        source: "nextdoor",
        name,
        phone,
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
