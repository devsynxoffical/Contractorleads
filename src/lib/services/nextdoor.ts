/**
 * Nextdoor enrichment — best-effort, non-blocking (PRD §1.5).
 */
import { searchPublicWeb } from "./web-search";
import { matchesBusinessName } from "./linkedin";

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
