import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/safe-fetch";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** Live signals scraped from a business homepage (not AI guesses). */
export type WebsiteAudit = {
  reachable: boolean;
  https: boolean;
  title: string | null;
  metaDescription: string | null;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasJsonLd: boolean;
  hasLocalBusinessSchema: boolean;
  h1Count: number;
  wordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasPhoneOnPage: boolean;
  hasEmailOnPage: boolean;
  hasContactForm: boolean;
  hasBlogHint: boolean;
  htmlBytes: number;
  /** Thin HTML that looks like a JS shell (SPA) — scores are less reliable. */
  likelySpaShell: boolean;
  /** How strong the live site is (0–100). */
  websiteQualityScore: number;
  /** Agency upside: weaker SEO hygiene → higher opportunity. */
  seoOpportunityScore: number;
  marketingOpportunityScore: number;
  ppcOpportunityScore: number;
  outreachAngle: string;
};

const EMPTY_AUDIT: WebsiteAudit = {
  reachable: false,
  https: false,
  title: null,
  metaDescription: null,
  hasViewport: false,
  hasCanonical: false,
  hasOpenGraph: false,
  hasJsonLd: false,
  hasLocalBusinessSchema: false,
  h1Count: 0,
  wordCount: 0,
  imageCount: 0,
  imagesMissingAlt: 0,
  hasPhoneOnPage: false,
  hasEmailOnPage: false,
  hasContactForm: false,
  hasBlogHint: false,
  htmlBytes: 0,
  likelySpaShell: false,
  websiteQualityScore: 18,
  seoOpportunityScore: 88,
  marketingOpportunityScore: 82,
  ppcOpportunityScore: 78,
  outreachAngle:
    "No live website found — pitch a conversion-ready local site plus Google Business Profile and call tracking.",
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
  };
}

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, n)));
}

function detectPhone(bodyText: string, html: string): boolean {
  if (/tel:\s*\+?[\d().\-\s]{7,}/i.test(html)) return true;
  // Require separators so bare zips / years don't match
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
      $("form input[type='email'], form input[type='tel'], form textarea").length ||
      /contact|quote|estimate|book|schedule|appoint/i.test(formBlob) ||
      $("form input[name*='email' i], form input[name*='phone' i], form input[name*='name' i]")
        .length
    ) {
      return true;
    }
  }
  // Common contractor booking / CRM embeds
  if (
    /jobber|housecall|servicetitan|hubspot|formspree|typeform|calendly|podium|birdeye|lsa\.google|google\.com\/maps\/embed/i.test(
      html,
    )
  ) {
    return true;
  }
  // CTA buttons that imply a capture path
  const cta = $("a, button")
    .toArray()
    .some((el) =>
      /get\s*(a\s*)?(free\s*)?(quote|estimate)|book\s*(now|online)|request\s*(a\s*)?(quote|estimate)|contact\s*us|schedule/i.test(
        ($(el).text() || "").trim(),
      ),
    );
  return cta;
}

/**
 * Score a homepage from raw HTML. Same HTML the social scraper already fetched.
 */
export function auditHomepageHtml(
  html: string,
  pageUrl: string,
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

  // Strip nav/footer noise for word count
  const $clone = cheerio.load(html);
  $clone("script, style, noscript, svg, nav, footer, header").remove();
  const bodyText = $clone("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;
  const h1Count = $("h1").length;

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
  const rootApp =
    $("#root, #__next, #app, [data-reactroot]").length > 0 ||
    /id=["']__next["']|id=["']root["']/.test(htmlLower);
  const likelySpaShell =
    rootApp && wordCount < 80 && $("h1, h2, p").length < 4;

  // —— Website quality: how solid is the live site? ——
  let quality = 28;
  if (https) quality += 10;
  else quality -= 10;
  if (title && title.length >= 8) quality += 10;
  else if (title) quality += 3;
  else quality -= 6;
  if (metaDescription && metaDescription.length >= 50) quality += 10;
  else if (metaDescription) quality += 3;
  else quality -= 4;
  if (hasViewport) quality += 6;
  else quality -= 4;
  if (hasCanonical) quality += 5;
  if (hasOpenGraph) quality += 5;
  if (hasJsonLd) quality += 5;
  if (hasLocalBusinessSchema) quality += 10;
  if (h1Count === 1) quality += 8;
  else if (h1Count > 1) quality += 2;
  else quality -= 8;
  if (wordCount >= 400) quality += 12;
  else if (wordCount >= 200) quality += 7;
  else if (wordCount >= 100) quality += 3;
  else if (wordCount < 60 && !likelySpaShell) quality -= 12;
  if (likelySpaShell) quality -= 8; // can't trust thin SPA shells
  if (hasPhoneOnPage) quality += 6;
  if (hasEmailOnPage) quality += 4;
  if (hasContactForm) quality += 8;
  if (hasBlogHint) quality += 4;
  if (imageCount > 0) {
    const missingRatio = imagesMissingAlt / imageCount;
    if (missingRatio < 0.25) quality += 5;
    else if (missingRatio > 0.7) quality -= 5;
  }
  if (htmlBytes > 2_500_000) quality -= 8;
  if (/under construction|coming soon|domain for sale|parked domain/i.test(bodyText)) {
    quality = Math.min(quality, 24);
  }

  const websiteQualityScore = clamp(quality);

  // —— SEO opportunity: gaps an agency can sell ——
  let seoOpp = 35;
  if (!https) seoOpp += 14;
  if (!title || title.length < 8) seoOpp += 14;
  if (!metaDescription || metaDescription.length < 50) seoOpp += 12;
  if (!hasViewport) seoOpp += 6;
  if (!hasCanonical) seoOpp += 5;
  if (!hasLocalBusinessSchema) seoOpp += 14;
  if (h1Count !== 1) seoOpp += 8;
  if (wordCount < 200) seoOpp += 12;
  if (imageCount > 0 && imagesMissingAlt / imageCount > 0.5) seoOpp += 6;
  if (!hasBlogHint) seoOpp += 6;
  if (likelySpaShell) seoOpp += 10;
  seoOpp -= Math.round(websiteQualityScore * 0.22);
  const seoOpportunityScore = clamp(seoOpp, 15, 95);

  // —— Marketing opportunity (funnel / content / social readiness) ——
  let mkt = 40;
  if (!hasOpenGraph) mkt += 8;
  if (!hasBlogHint) mkt += 10;
  if (!hasContactForm) mkt += 12;
  if (!hasPhoneOnPage) mkt += 6;
  if (wordCount < 250) mkt += 8;
  if (!hasLocalBusinessSchema) mkt += 4;
  mkt += Math.round((100 - websiteQualityScore) * 0.18);
  const marketingOpportunityScore = clamp(mkt, 20, 95);

  // —— PPC readiness opportunity ——
  // High when site can convert paid traffic OR when rebuild+ads is the pitch.
  let ppc = 40;
  if (!https) ppc += 8;
  if (!hasContactForm) ppc += 14;
  if (!hasPhoneOnPage) ppc += 6;
  if (websiteQualityScore < 45) ppc += 16; // rebuild + ads bundle
  else if (websiteQualityScore >= 70 && hasContactForm) ppc += 18; // ready to scale
  else if (websiteQualityScore >= 55) ppc += 8;
  if (likelySpaShell) ppc += 8;
  const ppcOpportunityScore = clamp(ppc, 25, 95);

  const gaps: string[] = [];
  if (!https) gaps.push("HTTP-only site");
  if (!metaDescription || metaDescription.length < 50) {
    gaps.push("missing/thin meta description");
  }
  if (!hasLocalBusinessSchema) gaps.push("no LocalBusiness schema");
  if (h1Count !== 1) gaps.push(h1Count === 0 ? "no H1" : "messy H1s");
  if (!hasContactForm) gaps.push("weak quote/contact capture");
  if (wordCount < 200) gaps.push("thin service copy");
  if (likelySpaShell) gaps.push("JS-heavy page with little crawlable copy");

  const outreachAngle =
    gaps.length > 0
      ? `Live site audit: ${gaps.slice(0, 3).join(", ")} — pitch fixes plus local SEO / ads to capture search demand.`
      : "Live site looks solid — pitch Google Ads, review velocity, and service-area landing pages on top of what they have.";

  return {
    reachable: true,
    https,
    title,
    metaDescription,
    hasViewport,
    hasCanonical,
    hasOpenGraph,
    hasJsonLd,
    hasLocalBusinessSchema,
    h1Count,
    wordCount,
    imageCount,
    imagesMissingAlt,
    hasPhoneOnPage,
    hasEmailOnPage,
    hasContactForm,
    hasBlogHint,
    htmlBytes,
    likelySpaShell,
    websiteQualityScore,
    seoOpportunityScore,
    marketingOpportunityScore,
    ppcOpportunityScore,
    outreachAngle,
  };
}

export function emptyWebsiteAudit(): WebsiteAudit {
  return { ...EMPTY_AUDIT };
}

/** Fetch homepage once and audit it (when not already scraping). */
export async function auditWebsite(
  website: string,
  opts?: { timeoutMs?: number },
): Promise<WebsiteAudit> {
  const homepage = website.startsWith("http") ? website : `https://${website}`;
  const timeoutMs = opts?.timeoutMs ?? 10000;
  try {
    const response = await safeFetch(
      homepage,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        timeoutMs,
      },
      { allowHttp: true },
    );
    if (!response.ok) return emptyWebsiteAudit();
    const type = response.headers.get("content-type") || "";
    if (type && !type.includes("text/html") && !type.includes("text/plain")) {
      return emptyWebsiteAudit();
    }
    const html = await response.text();
    if (!html?.trim()) return emptyWebsiteAudit();
    return auditHomepageHtml(html, response.url || homepage);
  } catch {
    return emptyWebsiteAudit();
  }
}
