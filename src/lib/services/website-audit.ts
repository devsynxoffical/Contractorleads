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
  websiteQualityScore: 18,
  seoOpportunityScore: 88,
  marketingOpportunityScore: 82,
  ppcOpportunityScore: 78,
  outreachAngle:
    "No live website found — pitch a conversion-ready local site plus Google Business Profile and call tracking.",
};

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, n)));
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
    /localbusiness|homeandconstructionbusiness|electrician|plumber|hvac|roofing|generalcontractor|professionalservice/.test(
      jsonLdBlob,
    ) || /"@type"\s*:\s*"[^"]*business/i.test(jsonLdBlob);

  const h1Count = $("h1").length;
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;

  let imageCount = 0;
  let imagesMissingAlt = 0;
  $("img").each((_, el) => {
    imageCount += 1;
    const alt = ($(el).attr("alt") || "").trim();
    if (!alt) imagesMissingAlt += 1;
  });

  const htmlLower = html.toLowerCase();
  const hasPhoneOnPage =
    /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(bodyText) ||
    /tel:/i.test(html);
  const hasEmailOnPage =
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(bodyText) ||
    /mailto:/i.test(html);
  const hasContactForm = Boolean(
    $("form").length &&
      ($("form input[type='email']").length ||
        $("form textarea").length ||
        /contact|quote|estimate|book/i.test(
          $("form").text() + ($("form").attr("action") || ""),
        )),
  );
  const hasBlogHint =
    /\/(blog|news|articles|resources)(\/|"|'|\s|>)/i.test(html) ||
    Boolean(
      $('a[href*="blog"], a[href*="/news"], a[href*="articles"]').length,
    );

  const htmlBytes = Buffer.byteLength(html, "utf8");

  // —— Website quality: how solid is the live site? ——
  let quality = 22;
  if (https) quality += 10;
  else quality -= 8;
  if (title && title.length >= 8) quality += 10;
  else if (title) quality += 4;
  if (metaDescription && metaDescription.length >= 50) quality += 10;
  else if (metaDescription) quality += 4;
  if (hasViewport) quality += 6;
  if (hasCanonical) quality += 5;
  if (hasOpenGraph) quality += 5;
  if (hasJsonLd) quality += 6;
  if (hasLocalBusinessSchema) quality += 8;
  if (h1Count === 1) quality += 8;
  else if (h1Count > 1) quality += 3;
  else quality -= 6;
  if (wordCount >= 400) quality += 10;
  else if (wordCount >= 150) quality += 5;
  else if (wordCount < 60) quality -= 10;
  if (hasPhoneOnPage) quality += 5;
  if (hasEmailOnPage || hasContactForm) quality += 6;
  if (hasBlogHint) quality += 4;
  if (imageCount > 0) {
    const missingRatio = imagesMissingAlt / imageCount;
    if (missingRatio < 0.25) quality += 5;
    else if (missingRatio > 0.7) quality -= 5;
  }
  if (htmlBytes > 2_500_000) quality -= 8;
  if (/under construction|coming soon|domain for sale/i.test(bodyText)) {
    quality = Math.min(quality, 28);
  }

  const websiteQualityScore = clamp(quality);

  // —— SEO opportunity: gaps an agency can sell ——
  let seoOpp = 40;
  if (!https) seoOpp += 12;
  if (!title || title.length < 8) seoOpp += 14;
  if (!metaDescription || metaDescription.length < 50) seoOpp += 14;
  if (!hasViewport) seoOpp += 6;
  if (!hasCanonical) seoOpp += 6;
  if (!hasLocalBusinessSchema) seoOpp += 12;
  if (h1Count !== 1) seoOpp += 8;
  if (wordCount < 200) seoOpp += 10;
  if (imageCount > 0 && imagesMissingAlt / imageCount > 0.5) seoOpp += 6;
  if (!hasBlogHint) seoOpp += 5;
  // Strong sites still have some local SEO upside, but lower
  seoOpp -= Math.round(websiteQualityScore * 0.25);
  const seoOpportunityScore = clamp(seoOpp, 18, 95);

  // —— Marketing opportunity ——
  let mkt = 45;
  if (!hasOpenGraph) mkt += 8;
  if (!hasBlogHint) mkt += 8;
  if (!hasContactForm) mkt += 10;
  if (!hasPhoneOnPage) mkt += 6;
  if (wordCount < 250) mkt += 8;
  mkt += Math.round((100 - websiteQualityScore) * 0.2);
  const marketingOpportunityScore = clamp(mkt, 25, 95);

  // —— PPC opportunity: need a usable landing surface ——
  let ppc = 55;
  if (websiteQualityScore >= 70 && hasContactForm) ppc += 12;
  else if (websiteQualityScore < 40) ppc += 18; // rebuild + ads bundle
  if (hasPhoneOnPage) ppc += 5;
  if (!https) ppc += 6;
  const ppcOpportunityScore = clamp(ppc, 30, 95);

  const gaps: string[] = [];
  if (!https) gaps.push("HTTP-only site");
  if (!metaDescription) gaps.push("missing meta description");
  if (!hasLocalBusinessSchema) gaps.push("no LocalBusiness schema");
  if (h1Count !== 1) gaps.push(h1Count === 0 ? "no H1" : "messy H1s");
  if (!hasContactForm) gaps.push("weak quote/contact capture");
  if (wordCount < 200) gaps.push("thin service copy");

  const outreachAngle =
    gaps.length > 0
      ? `Live site audit: ${gaps.slice(0, 3).join(", ")} — pitch fixes plus local SEO / ads to capture search demand.`
      : "Live site looks decent — pitch Google Ads + review velocity and service-area landing pages on top of what they have.";

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
export async function auditWebsite(website: string): Promise<WebsiteAudit> {
  const homepage = website.startsWith("http") ? website : `https://${website}`;
  try {
    const response = await safeFetch(
      homepage,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        timeoutMs: 5000,
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
    return auditHomepageHtml(html, homepage);
  } catch {
    return emptyWebsiteAudit();
  }
}
