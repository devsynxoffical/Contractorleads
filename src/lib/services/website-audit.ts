import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/safe-fetch";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export type SitePageKey =
  | "home"
  | "contact"
  | "about"
  | "services"
  | "gallery"
  | "blog";

export type SitePageFinding = {
  key: SitePageKey;
  url: string | null;
  found: boolean;
  reachable: boolean;
  title: string | null;
  wordCount: number;
  hasPhone: boolean;
  hasForm: boolean;
};

/** Live signals scraped from a business site (not AI guesses). */
export type WebsiteAudit = {
  reachable: boolean;
  https: boolean;
  finalUrl: string | null;
  title: string | null;
  metaDescription: string | null;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasJsonLd: boolean;
  hasLocalBusinessSchema: boolean;
  h1Count: number;
  h1Text: string | null;
  wordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasPhoneOnPage: boolean;
  hasEmailOnPage: boolean;
  hasContactForm: boolean;
  hasBlogHint: boolean;
  htmlBytes: number;
  /** Approx homepage TTFB from our crawl (ms). */
  responseTimeMs: number | null;
  /** Rough speed band from bytes + TTFB (not Lighthouse). */
  speedBand: "fast" | "moderate" | "slow" | "unknown";
  scriptCount: number;
  stylesheetCount: number;
  hasHeroSection: boolean;
  heroSignals: string[];
  hasInstagramLink: boolean;
  hasFacebookLink: boolean;
  hasGoogleAdsHint: boolean;
  pages: SitePageFinding[];
  /** Thin HTML that looks like a JS shell (SPA) — scores are less reliable. */
  likelySpaShell: boolean;
  /** How strong the live site is (0–100). */
  websiteQualityScore: number;
  /** Agency upside: weaker SEO hygiene → higher opportunity. */
  seoOpportunityScore: number;
  marketingOpportunityScore: number;
  ppcOpportunityScore: number;
  outreachAngle: string;
  findings: string[];
};

const EMPTY_PAGES: SitePageFinding[] = (
  ["home", "contact", "about", "services", "gallery", "blog"] as const
).map((key) => ({
  key,
  url: null,
  found: false,
  reachable: false,
  title: null,
  wordCount: 0,
  hasPhone: false,
  hasForm: false,
}));

const EMPTY_AUDIT: WebsiteAudit = {
  reachable: false,
  https: false,
  finalUrl: null,
  title: null,
  metaDescription: null,
  hasViewport: false,
  hasCanonical: false,
  hasOpenGraph: false,
  hasJsonLd: false,
  hasLocalBusinessSchema: false,
  h1Count: 0,
  h1Text: null,
  wordCount: 0,
  imageCount: 0,
  imagesMissingAlt: 0,
  hasPhoneOnPage: false,
  hasEmailOnPage: false,
  hasContactForm: false,
  hasBlogHint: false,
  htmlBytes: 0,
  responseTimeMs: null,
  speedBand: "unknown",
  scriptCount: 0,
  stylesheetCount: 0,
  hasHeroSection: false,
  heroSignals: [],
  hasInstagramLink: false,
  hasFacebookLink: false,
  hasGoogleAdsHint: false,
  pages: EMPTY_PAGES,
  likelySpaShell: false,
  websiteQualityScore: 18,
  seoOpportunityScore: 88,
  marketingOpportunityScore: 82,
  ppcOpportunityScore: 78,
  outreachAngle:
    "No live website found — pitch a conversion-ready local site plus Google Business Profile and call tracking.",
  findings: ["Website URL missing or unreachable."],
};

/** Honest mid-band scores when a URL exists but we have not measured the page yet. */
export function pendingWebsiteAudit(): WebsiteAudit {
  return {
    ...EMPTY_AUDIT,
    reachable: false,
    websiteQualityScore: 50,
    seoOpportunityScore: 55,
    marketingOpportunityScore: 55,
    ppcOpportunityScore: 55,
    outreachAngle:
      "Website is listed but not measured yet — refresh the site audit before pitching SEO or ads.",
    findings: ["Audit pending — refresh to crawl the live site."],
  };
}

export function emptyWebsiteAudit(): WebsiteAudit {
  return {
    ...EMPTY_AUDIT,
    pages: EMPTY_PAGES.map((p) => ({ ...p })),
    heroSignals: [],
    findings: [...EMPTY_AUDIT.findings],
  };
}

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, n)));
}

function detectPhone(bodyText: string, html: string): boolean {
  if (/tel:\s*\+?[\d().\-\s]{7,}/i.test(html)) return true;
  return (
    /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(bodyText) ||
    /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(bodyText)
  );
}

function detectContactForm($: cheerio.CheerioAPI, html: string): boolean {
  if ($("form").length) {
    const formBlob =
      $("form").text() +
      " " +
      ($("form").map((_, el) => $(el).attr("action") || "").get().join(" "));
    if (
      $("form input[type='email'], form input[type='tel'], form textarea")
        .length ||
      /contact|quote|estimate|book|schedule|appoint/i.test(formBlob) ||
      $(
        "form input[name*='email' i], form input[name*='phone' i], form input[name*='name' i]",
      ).length
    ) {
      return true;
    }
  }
  if (
    /jobber|housecall|servicetitan|hubspot|formspree|typeform|calendly|podium|birdeye|lsa\.google|google\.com\/maps\/embed/i.test(
      html,
    )
  ) {
    return true;
  }
  return $("a, button")
    .toArray()
    .some((el) =>
      /get\s*(a\s*)?(free\s*)?(quote|estimate)|book\s*(now|online)|request\s*(a\s*)?(quote|estimate)|contact\s*us|schedule/i.test(
        ($(el).text() || "").trim(),
      ),
    );
}

function speedBandFrom(
  responseTimeMs: number | null,
  htmlBytes: number,
  scriptCount: number,
): WebsiteAudit["speedBand"] {
  if (responseTimeMs == null && htmlBytes <= 0) return "unknown";
  let penalty = 0;
  if (responseTimeMs != null) {
    if (responseTimeMs > 2500) penalty += 2;
    else if (responseTimeMs > 1200) penalty += 1;
  }
  if (htmlBytes > 2_000_000) penalty += 2;
  else if (htmlBytes > 900_000) penalty += 1;
  if (scriptCount > 25) penalty += 1;
  if (penalty >= 3) return "slow";
  if (penalty >= 1) return "moderate";
  return "fast";
}

function detectHero(
  $: cheerio.CheerioAPI,
  html: string,
): {
  hasHeroSection: boolean;
  heroSignals: string[];
} {
  const signals: string[] = [];
  const h1 = $("h1").first().text().trim();
  if (h1.length >= 4) signals.push(`H1 present: "${h1.slice(0, 80)}"`);

  const heroLike =
    $(
      "header img, .hero img, [class*='hero' i] img, [id*='hero' i] img, .banner img, video",
    ).length > 0 ||
    /class=["'][^"']*hero|id=["'][^"']*hero|class=["'][^"']*banner/i.test(html);
  if (heroLike) signals.push("Hero/banner media detected");

  const ctaNearTop = $("a, button")
    .toArray()
    .slice(0, 40)
    .some((el) =>
      /quote|estimate|call|book|contact|schedule/i.test(
        ($(el).text() || "").trim(),
      ),
    );
  if (ctaNearTop) signals.push("Primary CTA near top of page");

  return {
    hasHeroSection: signals.length >= 2 || (Boolean(h1) && heroLike),
    heroSignals: signals,
  };
}

function resolveUrl(base: string, href: string | undefined): string | null {
  if (!href) return null;
  const cleaned = href.trim();
  if (
    !cleaned ||
    cleaned.startsWith("#") ||
    cleaned.startsWith("mailto:") ||
    cleaned.startsWith("tel:") ||
    cleaned.startsWith("javascript:")
  ) {
    return null;
  }
  try {
    return new URL(cleaned, base).toString();
  } catch {
    return null;
  }
}

function classifyLink(text: string, href: string): SitePageKey | null {
  const blob = `${text} ${href}`.toLowerCase();
  if (/contact|get[-_]?quote|request[-_]?quote|estimate/.test(blob)) {
    return "contact";
  }
  if (/about|our[-_]?story|who[-_]?we[-_]?are|team/.test(blob)) return "about";
  if (/service|what[-_]?we[-_]?do|solutions/.test(blob)) return "services";
  if (/gallery|projects|portfolio|before[-_]?after|our[-_]?work/.test(blob)) {
    return "gallery";
  }
  if (/blog|news|articles|resources|tips/.test(blob)) return "blog";
  return null;
}

const FALLBACK_PATHS: Record<Exclude<SitePageKey, "home">, string[]> = {
  contact: ["/contact", "/contact-us", "/contactus", "/get-a-quote", "/quote"],
  about: ["/about", "/about-us", "/aboutus", "/our-story", "/company"],
  services: ["/services", "/our-services", "/what-we-do"],
  gallery: ["/gallery", "/projects", "/portfolio", "/our-work"],
  blog: ["/blog", "/news", "/resources", "/articles"],
};

async function fetchHtml(
  url: string,
  timeoutMs: number,
): Promise<{ html: string; finalUrl: string; responseTimeMs: number } | null> {
  const started = Date.now();
  try {
    const response = await safeFetch(
      url,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        timeoutMs,
      },
      { allowHttp: true },
    );
    const responseTimeMs = Date.now() - started;
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "";
    if (type && !type.includes("text/html") && !type.includes("text/plain")) {
      return null;
    }
    const html = await response.text();
    if (!html?.trim()) return null;
    return {
      html,
      finalUrl: response.url || url,
      responseTimeMs,
    };
  } catch {
    return null;
  }
}

function summarizePage(
  key: SitePageKey,
  url: string,
  html: string,
): SitePageFinding {
  const $ = cheerio.load(html);
  const $clone = cheerio.load(html);
  $clone("script, style, noscript, svg, nav, footer, header").remove();
  const bodyText = $clone("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;
  return {
    key,
    url,
    found: true,
    reachable: true,
    title: ($("title").first().text() || "").trim() || null,
    wordCount,
    hasPhone: detectPhone(bodyText, html),
    hasForm: detectContactForm($, html),
  };
}

/**
 * Score a homepage from raw HTML. Same HTML the social scraper already fetched.
 */
export function auditHomepageHtml(
  html: string,
  pageUrl: string,
  extras?: {
    responseTimeMs?: number | null;
    pages?: SitePageFinding[];
  },
): WebsiteAudit {
  const $ = cheerio.load(html);
  let https = false;
  try {
    https = new URL(pageUrl).protocol === "https:";
  } catch {
    https = pageUrl.startsWith("https");
  }

  const title = ($("title").first().text() || "").trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;
  const hasViewport = Boolean($('meta[name="viewport"]').attr("content"));
  const hasCanonical = Boolean($('link[rel="canonical"]').attr("href"));
  const hasOpenGraph = Boolean(
    $('meta[property^="og:"]').length || $('meta[name^="og:"]').length,
  );

  const jsonLdBlocks: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (raw?.trim()) jsonLdBlocks.push(raw);
  });
  const jsonLdBlob = jsonLdBlocks.join("\n").toLowerCase();
  const hasJsonLd = jsonLdBlocks.length > 0;
  const hasLocalBusinessSchema =
    /localbusiness|homeandconstructionbusiness|electrician|plumber|hvac|roofing|generalcontractor|professionalservice|organization/.test(
      jsonLdBlob,
    ) || /"@type"\s*:\s*"[^"]*business/i.test(jsonLdBlob);

  const $clone = cheerio.load(html);
  $clone("script, style, noscript, svg, nav, footer, header").remove();
  const bodyText = $clone("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;
  const h1Count = $("h1").length;
  const h1Text = $("h1").first().text().replace(/\s+/g, " ").trim() || null;

  let imageCount = 0;
  let imagesMissingAlt = 0;
  $("img").each((_, el) => {
    imageCount += 1;
    const alt = ($(el).attr("alt") || "").trim();
    if (!alt) imagesMissingAlt += 1;
  });

  const htmlLower = html.toLowerCase();
  const hasPhoneOnPage = detectPhone(bodyText, html);
  const hasEmailOnPage =
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(bodyText) ||
    /mailto:/i.test(html);
  const hasContactForm = detectContactForm($, html);
  const hasBlogHint =
    /\/(blog|news|articles|resources|projects|gallery)(\/|"|'|\s|>)/i.test(
      html,
    ) ||
    Boolean(
      $(
        'a[href*="blog"], a[href*="/news"], a[href*="articles"], a[href*="projects"], a[href*="gallery"]',
      ).length,
    );

  const htmlBytes = Buffer.byteLength(html, "utf8");
  const scriptCount = $("script[src]").length + $("script:not([src])").length;
  const stylesheetCount = $('link[rel="stylesheet"]').length;
  const responseTimeMs = extras?.responseTimeMs ?? null;
  const speedBand = speedBandFrom(responseTimeMs, htmlBytes, scriptCount);
  const { hasHeroSection, heroSignals } = detectHero($, html);

  const hasInstagramLink = /instagram\.com/i.test(html);
  const hasFacebookLink = /facebook\.com|fb\.com/i.test(html);
  const hasGoogleAdsHint =
    /googletagmanager|gtag\(|google-analytics|googleadservices|google_conversion|adsbygoogle|gtm\.js/i.test(
      html,
    );

  const rootApp =
    $("#root, #__next, #app, [data-reactroot]").length > 0 ||
    /id=["']__next["']|id=["']root["']/.test(htmlLower);
  const likelySpaShell =
    rootApp && wordCount < 80 && $("h1, h2, p").length < 4;

  const pages =
    extras?.pages ??
    EMPTY_PAGES.map((p) =>
      p.key === "home"
        ? {
            key: "home" as const,
            url: pageUrl,
            found: true,
            reachable: true,
            title,
            wordCount,
            hasPhone: hasPhoneOnPage,
            hasForm: hasContactForm,
          }
        : { ...p },
    );

  const contactPage = pages.find((p) => p.key === "contact");
  const aboutPage = pages.find((p) => p.key === "about");
  const servicesPage = pages.find((p) => p.key === "services");
  const galleryPage = pages.find((p) => p.key === "gallery");
  const blogPage = pages.find((p) => p.key === "blog");

  let quality = 22;
  if (https) quality += 10;
  else quality -= 10;
  if (title && title.length >= 8) quality += 8;
  else if (title) quality += 3;
  else quality -= 6;
  if (metaDescription && metaDescription.length >= 50) quality += 8;
  else if (metaDescription) quality += 3;
  else quality -= 4;
  if (hasViewport) quality += 5;
  else quality -= 4;
  if (hasCanonical) quality += 4;
  if (hasOpenGraph) quality += 4;
  if (hasJsonLd) quality += 4;
  if (hasLocalBusinessSchema) quality += 8;
  if (h1Count === 1) quality += 7;
  else if (h1Count > 1) quality += 2;
  else quality -= 8;
  if (wordCount >= 400) quality += 10;
  else if (wordCount >= 200) quality += 6;
  else if (wordCount >= 100) quality += 3;
  else if (wordCount < 60 && !likelySpaShell) quality -= 12;
  if (likelySpaShell) quality -= 8;
  if (hasPhoneOnPage) quality += 5;
  if (hasEmailOnPage) quality += 3;
  if (hasContactForm) quality += 7;
  if (hasBlogHint || blogPage?.reachable) quality += 3;
  if (hasHeroSection) quality += 6;
  else quality -= 4;
  if (contactPage?.reachable) quality += 6;
  else quality -= 5;
  if (aboutPage?.reachable) quality += 3;
  if (servicesPage?.reachable) quality += 4;
  if (galleryPage?.reachable) quality += 2;
  if (speedBand === "fast") quality += 5;
  else if (speedBand === "slow") quality -= 10;
  else if (speedBand === "moderate") quality -= 5;
  // Heavy script payloads rarely deserve a perfect score
  if (scriptCount > 60) quality -= 6;
  else if (scriptCount > 35) quality -= 3;
  if (htmlBytes > 900_000) quality -= 3;
  if (imageCount > 0) {
    const missingRatio = imagesMissingAlt / imageCount;
    if (missingRatio < 0.25) quality += 4;
    else if (missingRatio > 0.7) quality -= 5;
  }
  if (htmlBytes > 2_500_000) quality -= 8;
  if (
    /under construction|coming soon|domain for sale|parked domain/i.test(
      bodyText,
    )
  ) {
    quality = Math.min(quality, 24);
  }

  let websiteQualityScore = clamp(quality);
  // Never award a perfect score when crawl still flags speed / bloat
  if (speedBand === "slow") {
    websiteQualityScore = Math.min(websiteQualityScore, 78);
  } else if (speedBand === "moderate" || scriptCount > 50) {
    websiteQualityScore = Math.min(websiteQualityScore, 92);
  }

  let seoOpp = 32;
  if (!https) seoOpp += 12;
  if (!title || title.length < 8) seoOpp += 12;
  if (!metaDescription || metaDescription.length < 50) seoOpp += 10;
  if (!hasViewport) seoOpp += 5;
  if (!hasCanonical) seoOpp += 5;
  if (!hasLocalBusinessSchema) seoOpp += 12;
  if (h1Count !== 1) seoOpp += 7;
  if (wordCount < 200) seoOpp += 10;
  if (imageCount > 0 && imagesMissingAlt / imageCount > 0.5) seoOpp += 5;
  if (!hasBlogHint && !blogPage?.reachable) seoOpp += 6;
  if (!servicesPage?.reachable) seoOpp += 8;
  if (likelySpaShell) seoOpp += 10;
  if (speedBand === "slow") seoOpp += 8;
  seoOpp -= Math.round(websiteQualityScore * 0.2);
  const seoOpportunityScore = clamp(seoOpp, 15, 95);

  let mkt = 38;
  if (!hasOpenGraph) mkt += 8;
  if (!hasInstagramLink) mkt += 12;
  if (!hasFacebookLink) mkt += 6;
  if (!hasBlogHint && !blogPage?.reachable) mkt += 8;
  if (!galleryPage?.reachable) mkt += 6;
  if (!hasContactForm && !contactPage?.hasForm) mkt += 10;
  if (!hasPhoneOnPage) mkt += 5;
  if (wordCount < 250) mkt += 6;
  mkt += Math.round((100 - websiteQualityScore) * 0.15);
  const marketingOpportunityScore = clamp(mkt, 20, 95);

  let ppc = 38;
  if (!https) ppc += 8;
  if (!hasContactForm && !contactPage?.hasForm) ppc += 14;
  if (!hasPhoneOnPage) ppc += 6;
  if (!hasHeroSection) ppc += 6;
  if (speedBand === "slow") ppc += 8;
  else if (speedBand === "moderate") ppc += 3;
  if (websiteQualityScore < 45) ppc += 14; // rebuild + ads bundle
  else if (
    websiteQualityScore >= 70 &&
    (hasContactForm || contactPage?.hasForm)
  ) {
    // Landing page is ready — still a strong agency opportunity to launch/scale ads
    ppc += 16;
  } else if (websiteQualityScore >= 55) ppc += 7;
  if (likelySpaShell) ppc += 8;
  if (!hasGoogleAdsHint) ppc += 4;
  const ppcOpportunityScore = clamp(ppc, 25, 95);

  const findings: string[] = [];
  if (!https) findings.push("Site is not served over HTTPS.");
  if (!title || title.length < 8) {
    findings.push("Title tag is missing or too short.");
  }
  if (!metaDescription || metaDescription.length < 50) {
    findings.push("Meta description is missing or thin.");
  }
  if (!hasHeroSection) {
    findings.push(
      "Clear hero section (headline + media + CTA) was not detected.",
    );
  }
  if (speedBand === "slow") {
    findings.push(
      `Homepage load looks slow (TTFB ~${responseTimeMs ?? "n/a"} ms, ${Math.round(htmlBytes / 1024)} KB HTML, ${scriptCount} scripts).`,
    );
  } else if (speedBand === "moderate") {
    findings.push(
      `Homepage speed is moderate (TTFB ~${responseTimeMs ?? "n/a"} ms, ${Math.round(htmlBytes / 1024)} KB HTML, ${scriptCount} scripts) — not a rebuild issue, but worth tightening before heavy ad spend.`,
    );
  }
  if (!contactPage?.reachable) {
    findings.push("No dedicated Contact / Quote page was found.");
  } else if (!contactPage.hasForm && !hasContactForm) {
    findings.push("Contact page exists but no clear quote form was detected.");
  }
  if (!aboutPage?.reachable) findings.push("About page not found.");
  if (!servicesPage?.reachable) findings.push("Services page not found.");
  if (!galleryPage?.reachable) {
    findings.push("Projects / gallery page not found.");
  }
  if (!hasLocalBusinessSchema) {
    findings.push("LocalBusiness schema not detected.");
  }
  if (h1Count !== 1) {
    findings.push(
      h1Count === 0
        ? "No H1 heading on the homepage."
        : `${h1Count} H1 tags on the homepage.`,
    );
  }
  if (wordCount < 200) {
    findings.push(`Thin homepage copy (${wordCount} crawlable words).`);
  }
  if (!hasInstagramLink) {
    findings.push("No Instagram link found on the website.");
  }
  if (likelySpaShell) {
    findings.push(
      "Page looks like a JavaScript shell with little crawlable content.",
    );
  }
  if (!findings.length) {
    findings.push(
      "Core site structure looks solid — upside is service-area pages, reviews, and paid acquisition.",
    );
  }

  const missingCore = [
    !contactPage?.reachable && "Contact",
    !aboutPage?.reachable && "About",
    !servicesPage?.reachable && "Services",
  ].filter(Boolean) as string[];

  const outreachAngle =
    websiteQualityScore >= 85
      ? `Strong local site (${websiteQualityScore}/100)${
          speedBand === "moderate" || speedBand === "slow"
            ? " with room to tighten page speed"
            : ""
        }. Pitch Google Ads / Local Services Ads, review velocity, and city/service expansion — not a website rebuild.`
      : missingCore.length || !hasContactForm || !https
        ? `Live site audit: ${findings.slice(0, 3).join(" ")} Pitch website fixes plus local SEO / ads to capture search demand.`
        : `Live site audit: ${findings.slice(0, 3).join(" ")} Pitch local SEO, ads, and conversion improvements.`;

  return {
    reachable: true,
    https,
    finalUrl: pageUrl,
    title,
    metaDescription,
    hasViewport,
    hasCanonical,
    hasOpenGraph,
    hasJsonLd,
    hasLocalBusinessSchema,
    h1Count,
    h1Text,
    wordCount,
    imageCount,
    imagesMissingAlt,
    hasPhoneOnPage,
    hasEmailOnPage,
    hasContactForm,
    hasBlogHint,
    htmlBytes,
    responseTimeMs,
    speedBand,
    scriptCount,
    stylesheetCount,
    hasHeroSection,
    heroSignals,
    hasInstagramLink,
    hasFacebookLink,
    hasGoogleAdsHint,
    pages,
    likelySpaShell,
    websiteQualityScore,
    seoOpportunityScore,
    marketingOpportunityScore,
    ppcOpportunityScore,
    outreachAngle,
    findings,
  };
}

/** Fetch homepage + key secondary pages, then audit. */
export async function auditWebsite(
  website: string,
  opts?: { timeoutMs?: number },
): Promise<WebsiteAudit> {
  const homepage = website.startsWith("http") ? website : `https://${website}`;
  const timeoutMs = opts?.timeoutMs ?? 10000;

  const home = await fetchHtml(homepage, timeoutMs);
  if (!home) return emptyWebsiteAudit();

  const $ = cheerio.load(home.html);
  const origin = (() => {
    try {
      return new URL(home.finalUrl).origin;
    } catch {
      return homepage;
    }
  })();

  const linkDiscovered = new Map<Exclude<SitePageKey, "home">, string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = ($(el).text() || "").trim();
    const absolute = resolveUrl(home.finalUrl, href);
    if (!absolute) return;
    try {
      if (new URL(absolute).origin !== new URL(origin).origin) return;
    } catch {
      return;
    }
    const key = classifyLink(text, absolute);
    if (key && key !== "home" && !linkDiscovered.has(key)) {
      linkDiscovered.set(key, absolute);
    }
  });

  const keys = Object.keys(FALLBACK_PATHS) as Array<
    Exclude<SitePageKey, "home">
  >;
  const secondary = await Promise.all(
    keys.map(async (key) => {
      const candidates = [
        ...(linkDiscovered.has(key) ? [linkDiscovered.get(key)!] : []),
        ...FALLBACK_PATHS[key].map((path) => new URL(path, origin).toString()),
      ];
      let fetched: Awaited<ReturnType<typeof fetchHtml>> = null;
      for (const candidate of candidates) {
        fetched = await fetchHtml(candidate, Math.min(timeoutMs, 7000));
        if (fetched) break;
      }
      if (!fetched) {
        return {
          key,
          url: candidates[0] ?? null,
          found: linkDiscovered.has(key),
          reachable: false,
          title: null,
          wordCount: 0,
          hasPhone: false,
          hasForm: false,
        } satisfies SitePageFinding;
      }
      return summarizePage(key, fetched.finalUrl, fetched.html);
    }),
  );

  const homePage: SitePageFinding = {
    key: "home",
    url: home.finalUrl,
    found: true,
    reachable: true,
    title: null,
    wordCount: 0,
    hasPhone: false,
    hasForm: false,
  };

  const pages = [homePage, ...secondary];
  const audit = auditHomepageHtml(home.html, home.finalUrl, {
    responseTimeMs: home.responseTimeMs,
    pages,
  });

  audit.pages = audit.pages.map((p) =>
    p.key === "home"
      ? {
          ...p,
          title: audit.title,
          wordCount: audit.wordCount,
          hasPhone: audit.hasPhoneOnPage,
          hasForm: audit.hasContactForm,
        }
      : p,
  );

  return audit;
}
