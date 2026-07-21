export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function decodeDuckRedirect(href: string): string | null {
  try {
    let raw = href.replace(/&amp;/g, "&");
    if (raw.startsWith("//")) raw = `https:${raw}`;
    const u = new URL(raw, "https://duckduckgo.com");
    const uddg = u.searchParams.get("uddg");
    if (uddg) return decodeURIComponent(uddg);
    if (/^https?:\/\//i.test(raw) && !/duckduckgo\.com/i.test(raw)) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

function isJunkUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "") || "/";
    if (
      host === "facebook.com" ||
      host === "fb.com" ||
      host === "m.facebook.com"
    ) {
      if (
        path === "/" ||
        /^\/(login|sharer|share|dialog|plugins|watch|reel|stories|people\/?$)/i.test(
          path,
        )
      ) {
        return true;
      }
    }
    if (host.includes("messenger.com") || host.includes("outlook.com")) {
      return true;
    }
    if (host.includes("linkedin.com")) {
      if (
        path === "/" ||
        /^\/(login|signup|feed|jobs|school|learning|company\/?$)/i.test(path)
      ) {
        return true;
      }
    }
    if (host.includes("instagram.com") && (path === "/" || path === "/accounts")) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function pushUnique(
  out: WebSearchResult[],
  seen: Set<string>,
  url: string,
  limit: number,
) {
  if (out.length >= limit) return;
  let cleaned = url.replace(/&amp;/g, "&").split("#")[0];
  // Brave sometimes wraps URLs
  const m = cleaned.match(/https?:\/\/(?:www\.)?(?:linkedin|facebook|instagram|fb)\.com[^"'\s<>]*/i);
  if (m && !cleaned.startsWith("http")) cleaned = m[0];
  if (!/^https?:\/\//i.test(cleaned)) return;
  if (isJunkUrl(cleaned)) return;
  const key = cleaned.split("?")[0].toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push({ title: "", url: cleaned, snippet: "" });
}

/** Free: Brave Search HTML — most reliable no-key option right now. */
async function searchBrave(
  query: string,
  limit: number,
): Promise<WebSearchResult[]> {
  try {
    const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8_000),
      redirect: "follow",
    });
    if (!response.ok) return [];
    const html = await response.text();
    const seen = new Set<string>();
    const out: WebSearchResult[] = [];

    // Prefer result anchors
    for (const m of html.matchAll(
      /(?:cite|result-header|snippet)[^>]*>[\s\S]{0,200}?https?:\/\/(?:www\.)?(?:linkedin|facebook|fb|instagram)\.com[^"'<\s]*/gi,
    )) {
      const found = m[0].match(
        /https?:\/\/(?:www\.)?(?:linkedin|facebook|fb|instagram)\.com[^"'<\s]*/i,
      );
      if (found) pushUnique(out, seen, found[0], limit);
    }

    // Broad extract of social URLs from the page
    for (const m of html.matchAll(
      /https?:\/\/(?:[a-z]+\.)?(?:linkedin|facebook|fb|instagram)\.com\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]+/gi,
    )) {
      pushUnique(out, seen, m[0], limit);
    }

    return out;
  } catch {
    return [];
  }
}

/** Free: DuckDuckGo HTML (often bot-challenged under load). */
async function searchDuckDuckGo(
  query: string,
  limit: number,
): Promise<WebSearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(7_000),
      redirect: "follow",
    });
    // 202 = challenge page
    if (!response.ok || response.status === 202) return [];
    const html = await response.text();
    if (/anomaly|challenge|bots/i.test(html) && !/result__a/i.test(html)) {
      return [];
    }
    const seen = new Set<string>();
    const out: WebSearchResult[] = [];

    for (const m of html.matchAll(
      /class="result__a"[^>]*href="([^"]+)"/gi,
    )) {
      const decoded = decodeDuckRedirect(m[1]);
      if (decoded) pushUnique(out, seen, decoded, limit);
    }
    if (out.length < limit) {
      for (const m of html.matchAll(/[?&]uddg=([^&"]+)/gi)) {
        try {
          pushUnique(out, seen, decodeURIComponent(m[1]), limit);
        } catch {
          /* skip */
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Paid/fast path when SERPER_API_KEY is set. */
async function searchSerper(
  query: string,
  limit: number,
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

function mergeResults(
  batches: WebSearchResult[][],
  limit: number,
): WebSearchResult[] {
  const seen = new Set<string>();
  const out: WebSearchResult[] = [];
  for (const batch of batches) {
    for (const item of batch) {
      if (isJunkUrl(item.url)) continue;
      const key = item.url.split("?")[0].toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Public web search for LinkedIn / social discovery.
 * Prefers Serper when keyed; otherwise free Brave (+ DuckDuckGo) HTML — no paid APIs.
 */
export async function searchPublicWeb(
  query: string,
  limit = 5,
): Promise<WebSearchResult[]> {
  const serper = await searchSerper(query, limit);
  if (serper.length > 0) return serper;

  // Brave first (stable); DDG only if Brave empty (rate-limit sensitive)
  const brave = await searchBrave(query, limit);
  if (brave.length > 0) return brave;

  const ddg = await searchDuckDuckGo(query, limit);
  return mergeResults([ddg], limit);
}

/**
 * Targeted free searches for LinkedIn + FB/IG when the social filter is on.
 * Two focused queries (not four) to stay fast and avoid search-engine bans.
 */
export async function discoverSocialProfiles(
  businessName: string,
  location: string,
): Promise<{
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
}> {
  const name = businessName.trim();
  const loc = location.trim();

  const [liHits, socialHits] = await Promise.all([
    searchPublicWeb(`site:linkedin.com/company "${name}" ${loc}`, 8),
    searchPublicWeb(
      `"${name}" ${loc} (facebook OR instagram OR "linkedin.com/company")`,
      10,
    ),
  ]);

  return pickSocialFromHits([...liHits, ...socialHits]);
}

/** Parse LinkedIn / FB / IG URLs out of search hits. */
export function pickSocialFromHits(hits: WebSearchResult[]): {
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
} {
  let linkedin: string | null = null;
  let facebook: string | null = null;
  let instagram: string | null = null;
  for (const hit of hits) {
    if (isJunkUrl(hit.url)) continue;
    const lower = hit.url.toLowerCase();
    const clean = hit.url.split("?")[0];
    if (
      !linkedin &&
      (lower.includes("linkedin.com/company") ||
        lower.includes("linkedin.com/in/"))
    ) {
      linkedin = clean;
    }
    if (
      !facebook &&
      (lower.includes("facebook.com/") || lower.includes("fb.com/"))
    ) {
      facebook = clean;
    }
    if (!instagram && lower.includes("instagram.com/")) {
      instagram = clean;
    }
  }
  return { linkedin, facebook, instagram };
}
