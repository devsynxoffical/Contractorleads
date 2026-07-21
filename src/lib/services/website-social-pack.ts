import * as cheerio from "cheerio";
import {
  normalizeLinkedInCompanyUrl,
  normalizeLinkedInProfileUrl,
} from "./linkedin";

export type WebsiteSocialPack = {
  linkedinCompany: string | null;
  linkedinOwner: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  pagesChecked: string[];
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const PROFILE_PATH =
  /\b(about|contact|team|our-team|staff|leadership|company|connect|social|footer|who-we-are|meet-the-team)\b/i;

const EMPTY: WebsiteSocialPack = {
  linkedinCompany: null,
  linkedinOwner: null,
  facebook: null,
  instagram: null,
  youtube: null,
  tiktok: null,
  pagesChecked: [],
};

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(9000),
      redirect: "follow",
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "";
    if (type && !type.includes("text/html") && !type.includes("text/plain")) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

function absUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function cleanFacebook(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "facebook.com" && host !== "fb.com" && host !== "m.facebook.com") {
      return null;
    }
    const path = u.pathname.replace(/\/+$/, "");
    if (
      !path ||
      path === "/" ||
      /^\/(sharer|share|dialog|plugins|login|watch|reel|stories)/i.test(path)
    ) {
      return null;
    }
    return `https://www.facebook.com${path}`;
  } catch {
    return null;
  }
}

function cleanInstagram(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!u.hostname.replace(/^www\./, "").endsWith("instagram.com")) return null;
    const match = u.pathname.match(/^\/([A-Za-z0-9._]+)\/?/);
    if (!match?.[1] || ["p", "reel", "stories", "explore", "accounts"].includes(match[1])) {
      return null;
    }
    return `https://www.instagram.com/${match[1]}/`;
  } catch {
    return null;
  }
}

function cleanYoutube(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (
      !u.hostname.replace(/^www\./, "").includes("youtube.com") &&
      !u.hostname.includes("youtu.be")
    ) {
      return null;
    }
    if (!/\/(@|channel\/|c\/|user\/)/i.test(u.pathname) && !u.hostname.includes("youtu.be")) {
      return null;
    }
    return u.toString().split("?")[0];
  } catch {
    return null;
  }
}

function cleanTiktok(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!u.hostname.replace(/^www\./, "").endsWith("tiktok.com")) return null;
    const match = u.pathname.match(/^\/@([A-Za-z0-9._]+)\/?/);
    if (!match?.[1]) return null;
    return `https://www.tiktok.com/@${match[1]}`;
  } catch {
    return null;
  }
}

function extractFromHtml(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const linkedinCompany = new Set<string>();
  const linkedinOwner = new Set<string>();
  const facebook = new Set<string>();
  const instagram = new Set<string>();
  const youtube = new Set<string>();
  const tiktok = new Set<string>();
  const nextPages: string[] = [];

  const consider = (raw: string | undefined | null) => {
    if (!raw) return;
    const href = raw.trim();
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:")) return;

    const absolute = absUrl(pageUrl, href) || href;
    const lower = absolute.toLowerCase();

    if (lower.includes("linkedin.com")) {
      const company = normalizeLinkedInCompanyUrl(absolute);
      if (company) linkedinCompany.add(company);
      const owner = normalizeLinkedInProfileUrl(absolute);
      if (owner) linkedinOwner.add(owner);
    }
    if (lower.includes("facebook.com") || lower.includes("fb.com")) {
      const fb = cleanFacebook(absolute);
      if (fb) facebook.add(fb);
    }
    if (lower.includes("instagram.com")) {
      const ig = cleanInstagram(absolute);
      if (ig) instagram.add(ig);
    }
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      const yt = cleanYoutube(absolute);
      if (yt) youtube.add(yt);
    }
    if (lower.includes("tiktok.com")) {
      const tt = cleanTiktok(absolute);
      if (tt) tiktok.add(tt);
    }
  };

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    consider(href);
    const text = ($(el).text() || "").toLowerCase();
    if (PROFILE_PATH.test(href || "") || PROFILE_PATH.test(text)) {
      const next = absUrl(pageUrl, href || "");
      if (next) nextPages.push(next);
    }
  });

  // Raw regex pass for JSON-LD / script-embedded URLs
  const patterns: Array<[RegExp, (v: string) => void]> = [
    [
      /https?:\/\/(?:[a-z]{2}\.)?(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9._%-]+/gi,
      (v) => {
        const n = normalizeLinkedInCompanyUrl(v);
        if (n) linkedinCompany.add(n);
      },
    ],
    [
      /https?:\/\/(?:[a-z]{2}\.)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9._%-]+/gi,
      (v) => {
        const n = normalizeLinkedInProfileUrl(v);
        if (n) linkedinOwner.add(n);
      },
    ],
    [
      /https?:\/\/(?:www\.|m\.)?(?:facebook|fb)\.com\/[a-zA-Z0-9._/-]+/gi,
      (v) => {
        const n = cleanFacebook(v);
        if (n) facebook.add(n);
      },
    ],
    [
      /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+/gi,
      (v) => {
        const n = cleanInstagram(v);
        if (n) instagram.add(n);
      },
    ],
  ];

  for (const [re, add] of patterns) {
    for (const match of html.match(re) ?? []) add(match);
  }

  return {
    linkedinCompany: [...linkedinCompany],
    linkedinOwner: [...linkedinOwner],
    facebook: [...facebook],
    instagram: [...instagram],
    youtube: [...youtube],
    tiktok: [...tiktok],
    nextPages: [...new Set(nextPages)].slice(0, 5),
  };
}

/**
 * Deep scrape of a business website for LinkedIn + social profile URLs.
 * Trusts links published on the site (no live LinkedIn HTML verification —
 * LinkedIn blocks most server bots).
 */
export async function scrapeWebsiteSocialPack(
  website: string,
): Promise<WebsiteSocialPack> {
  const homepage = website.startsWith("http") ? website : `https://${website}`;
  const homeHtml = await fetchHtml(homepage);
  if (!homeHtml) return { ...EMPTY, pagesChecked: [homepage] };

  const home = extractFromHtml(homeHtml, homepage);
  const pages = [homepage, ...home.nextPages];
  const pack = {
    linkedinCompany: home.linkedinCompany[0] ?? null,
    linkedinOwner: home.linkedinOwner[0] ?? null,
    facebook: home.facebook[0] ?? null,
    instagram: home.instagram[0] ?? null,
    youtube: home.youtube[0] ?? null,
    tiktok: home.tiktok[0] ?? null,
    pagesChecked: [homepage],
  };

  const extras = await Promise.all(
    pages.slice(1, 4).map(async (url) => {
      const html = await fetchHtml(url);
      return html ? { url, data: extractFromHtml(html, url) } : null;
    }),
  );

  for (const extra of extras) {
    if (!extra) continue;
    pack.pagesChecked.push(extra.url);
    pack.linkedinCompany ||= extra.data.linkedinCompany[0] ?? null;
    pack.linkedinOwner ||= extra.data.linkedinOwner[0] ?? null;
    pack.facebook ||= extra.data.facebook[0] ?? null;
    pack.instagram ||= extra.data.instagram[0] ?? null;
    pack.youtube ||= extra.data.youtube[0] ?? null;
    pack.tiktok ||= extra.data.tiktok[0] ?? null;
  }

  return pack;
}
