import * as cheerio from "cheerio";
import { resolvePlatformKey } from "@/lib/platform-keys";
import { matchesBusinessName } from "./linkedin";

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
    if (host.includes("yelp.")) {
      if (path === "/" || !path.includes("/biz/")) return true;
    }
    if (host.includes("houzz.")) {
      if (
        path === "/" ||
        (!path.includes("/pro/") &&
          !path.includes("/professionals/") &&
          !path.includes("/user/"))
      ) {
        return true;
      }
    }
    if (host.includes("nextdoor.")) {
      if (path === "/" || !path.includes("/pages/")) return true;
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
  title = "",
  snippet = "",
) {
  if (out.length >= limit) return;
  let cleaned = url.replace(/&amp;/g, "&").split("#")[0];
  const m = cleaned.match(
    /https?:\/\/(?:www\.)?(?:linkedin|facebook|instagram|fb|yelp|houzz|nextdoor)\.[^"'\s<>]*/i,
  );
  if (m && !cleaned.startsWith("http")) cleaned = m[0];
  if (!/^https?:\/\//i.test(cleaned)) return;
  if (isJunkUrl(cleaned)) return;
  const key = cleaned.split("?")[0].toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push({
    title: title.replace(/\s+/g, " ").trim(),
    url: cleaned,
    snippet: snippet.replace(/\s+/g, " ").trim(),
  });
}

/** Free: Brave Search HTML — with full title & snippet parsing. */
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
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    if (!response.ok) return [];
    const html = await response.text();
    const seen = new Set<string>();
    const out: WebSearchResult[] = [];

    const $ = cheerio.load(html);
    $(".snippet[data-type='web'], .snippet, .result, .svelte-1vjtx7a").each((_, el) => {
      if (out.length >= limit) return;
      const titleEl = $(el).find(".title, .heading-serpresult, h4, h3, .url").first();
      const title = titleEl.text().trim();
      const href = titleEl.attr("href") || $(el).find("a[href]").first().attr("href");
      const snippet = $(el).find(".snippet-content, .snippet-description, .description, p").first().text().trim();
      if (href && /^https?:\/\//i.test(href) && !isJunkUrl(href)) {
        pushUnique(out, seen, href, limit, title, snippet);
      }
    });

    // Fallback link extraction
    if (out.length === 0) {
      for (const m of html.matchAll(
        /https?:\/\/(?:[a-z0-9-]+\.)?(?:linkedin|facebook|fb|instagram|yelp|houzz|nextdoor)\.(?:com|co\.uk|ca|com\.au)\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]+/gi,
      )) {
        pushUnique(out, seen, m[0], limit);
      }
    }

    return out;
  } catch {
    return [];
  }
}

/** Free: DuckDuckGo HTML — with full title & snippet parsing. */
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
    if (!response.ok || response.status === 202) return [];
    const html = await response.text();
    if (/anomaly|challenge|bots/i.test(html) && !/result__a/i.test(html)) {
      return [];
    }
    const seen = new Set<string>();
    const out: WebSearchResult[] = [];

    const $ = cheerio.load(html);
    $(".result, .results_links, .result__body").each((_, el) => {
      if (out.length >= limit) return;
      const a = $(el).find(".result__a");
      const title = a.text().trim();
      const href = a.attr("href");
      const snippet = $(el).find(".result__snippet").text().trim();
      const decoded = href ? decodeDuckRedirect(href) : null;
      if (decoded && !isJunkUrl(decoded)) {
        pushUnique(out, seen, decoded, limit, title, snippet);
      }
    });

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
  const apiKey = (await resolvePlatformKey("serperApiKey")).trim();
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
      knowledgeGraph?: {
        title?: string;
        type?: string;
        description?: string;
        knowledgeGraphUrl?: string;
      };
      answerBox?: {
        title?: string;
        link?: string;
        snippet?: string;
      };
    };

    const out: WebSearchResult[] = [];

    // Google Knowledge Panel — snippet usually says "Founded by <owner>"
    // or names the owner/principal, which owner-discovery parses.
    if (data.knowledgeGraph?.title) {
      const kgText =
        `${data.knowledgeGraph.type ?? ""} ${data.knowledgeGraph.description ?? ""}`.trim();
      out.push({
        title: data.knowledgeGraph.title,
        url: data.knowledgeGraph.knowledgeGraphUrl ?? "",
        snippet: kgText || data.knowledgeGraph.title,
      });
    }

    if (data.answerBox?.link) {
      out.push({
        title: data.answerBox.title ?? "",
        url: data.answerBox.link,
        snippet: data.answerBox.snippet ?? "",
      });
    }

    for (const item of data.organic ?? []) {
      if (item.title && item.link) {
        out.push({
          title: item.title,
          url: item.link,
          snippet: item.snippet ?? "",
        });
      }
    }

    return out.slice(0, limit);
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
 * Single combined query keeps enrichment under ~1 Brave round-trip.
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
  const hits = await searchPublicWeb(
    `"${name}" ${loc} (site:linkedin.com/company OR site:facebook.com OR site:instagram.com)`,
    10,
  );
  return pickSocialFromHits(hits, name);
}

/** Parse LinkedIn / FB / IG URLs out of search hits with strict business name validation. */
export function pickSocialFromHits(
  hits: WebSearchResult[],
  businessName?: string,
): {
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
} {
  let linkedin: string | null = null;
  let facebook: string | null = null;
  let instagram: string | null = null;
  for (const hit of hits) {
    if (isJunkUrl(hit.url)) continue;

    // Validate hit matches the business name if businessName is provided
    if (businessName) {
      const textToMatch = `${hit.url} ${hit.title} ${hit.snippet}`;
      if (!matchesBusinessName(textToMatch, businessName)) {
        continue;
      }
    }

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
