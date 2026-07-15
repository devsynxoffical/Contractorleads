/**
 * Nextdoor enrichment — best-effort, non-blocking (PRD §1.5).
 * No public API; never fabricate. Timeout/fail → blank.
 */

export type NextdoorMatch = {
  url: string;
};

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Optional: NEXTDOOR_SEARCH_ENDPOINT returns { results: [{ name, url }] }.
 * Pipeline must not wait long — hard timeout 5s.
 */
export async function matchNextdoorBusiness(
  name: string,
  location: string
): Promise<NextdoorMatch | null> {
  const endpoint = process.env.NEXTDOOR_SEARCH_ENDPOINT;
  const apiKey = process.env.NEXTDOOR_API_KEY;

  if (!endpoint) return null;

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

    const needle = normalize(name);
    const match = data.results?.find((r) => {
      if (!r.name || !r.url) return false;
      if (!/^https?:\/\/(www\.)?nextdoor\.com\//i.test(r.url)) return false;
      const candidate = normalize(r.name);
      return (
        candidate === needle ||
        candidate.includes(needle) ||
        needle.includes(candidate)
      );
    });

    return match?.url ? { url: match.url } : null;
  } catch {
    return null;
  }
}
