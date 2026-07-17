export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

/**
 * Optional Serper fallback for public web profiles.
 * Create a key at serper.dev and set SERPER_API_KEY.
 */
export async function searchPublicWeb(
  query: string,
  limit = 5
): Promise<WebSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: Math.min(limit, 10) }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return [];

    const data = (await response.json()) as {
      organic?: Array<{ title?: string; link?: string; snippet?: string }>;
    };
    return (data.organic ?? [])
      .filter((item) => item.title && item.link)
      .slice(0, limit)
      .map((item) => ({
        title: item.title ?? "",
        url: item.link ?? "",
        snippet: item.snippet ?? "",
      }));
  } catch {
    return [];
  }
}
