import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getOpenAIApiKey } from "@/lib/openai-config";
import { auditWebsite, type WebsiteAudit } from "@/lib/services/website-audit";
import {
  LEAD_REPORT_TYPE_META,
  type LeadReportType,
} from "@/lib/services/lead-intelligence-report-meta";
import { scrubReportMarkdown } from "@/lib/services/report-format";

export {
  LEAD_REPORT_TYPES,
  LEAD_REPORT_SCRIPT_TYPE,
  LEAD_REPORT_TYPE_META,
  isLeadReportType,
  type LeadReportType,
} from "@/lib/services/lead-intelligence-report-meta";

export { scrubReportMarkdown } from "@/lib/services/report-format";

export type LeadReportInput = {
  businessName: string;
  ownerName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  industry?: string | null;
  serviceCategory?: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  yearsInBusiness?: number | null;
  leadScore?: number | null;
  websiteQualityScore?: number | null;
  seoOpportunityScore?: number | null;
  marketingOpportunityScore?: number | null;
  ppcOpportunityScore?: number | null;
  outreachAngle?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedinUrl?: string | null;
  linkedinCompanyUrl?: string | null;
  linkedinOwnerUrl?: string | null;
  yelpUrl?: string | null;
  yelpRating?: number | null;
  yelpReviews?: number | null;
  agencyContext?: string | null;
};

function scoreLine(label: string, value: number | null | undefined) {
  return `${label}: ${value == null ? "n/a" : `${value}/100`}`;
}

function socialLine(label: string, value: string | null | undefined) {
  return `${label}: ${value?.trim() || "not found"}`;
}

function linkedinUrl(lead: LeadReportInput) {
  return lead.linkedinOwnerUrl || lead.linkedinCompanyUrl || lead.linkedinUrl;
}

function pageLines(audit: WebsiteAudit | null) {
  if (!audit?.pages?.length) return "Site pages: not crawled";
  return audit.pages
    .map((p) => {
      const status = p.reachable
        ? `found (${p.wordCount} words${p.hasForm ? ", has form" : ""}${p.hasPhone ? ", has phone" : ""})`
        : p.found
          ? "linked but unreachable"
          : "not found";
      return `- ${p.key}: ${status}${p.url ? ` · ${p.url}` : ""}`;
    })
    .join("\n");
}

function buildLeadSnapshot(lead: LeadReportInput, audit: WebsiteAudit | null) {
  return [
    `Business: ${lead.businessName}`,
    `Owner: ${lead.ownerName || "unknown"}`,
    `Industry: ${lead.industry || lead.serviceCategory || "home services"}`,
    `Location: ${[lead.city, lead.state].filter(Boolean).join(", ") || lead.address || "unknown"}`,
    `Phone: ${lead.phone || "unknown"}`,
    `Email: ${lead.email || "unknown"}`,
    `Website: ${lead.website || "none"}`,
    `Google: ${lead.googleRating ?? "n/a"} (${lead.reviewCount ?? 0} reviews)`,
    `Yelp: ${lead.yelpRating ?? "n/a"} (${lead.yelpReviews ?? 0} reviews)`,
    `Years in business: ${lead.yearsInBusiness ?? "unknown"}`,
    `Lead score: ${lead.leadScore ?? "n/a"}`,
    scoreLine("Website quality", lead.websiteQualityScore ?? audit?.websiteQualityScore),
    scoreLine("SEO opportunity", lead.seoOpportunityScore ?? audit?.seoOpportunityScore),
    scoreLine(
      "Marketing opportunity",
      lead.marketingOpportunityScore ?? audit?.marketingOpportunityScore,
    ),
    scoreLine("PPC opportunity", lead.ppcOpportunityScore ?? audit?.ppcOpportunityScore),
    `Stored outreach angle: ${lead.outreachAngle || "n/a"}`,
    socialLine("Facebook", lead.facebook),
    socialLine("Instagram", lead.instagram),
    socialLine("LinkedIn", linkedinUrl(lead)),
    socialLine("Yelp", lead.yelpUrl),
    audit
      ? [
          "Live website audit (measured — do not invent beyond this):",
          JSON.stringify(
            {
              reachable: audit.reachable,
              https: audit.https,
              finalUrl: audit.finalUrl,
              title: audit.title,
              h1Text: audit.h1Text,
              metaDescription: Boolean(audit.metaDescription),
              hasViewport: audit.hasViewport,
              hasCanonical: audit.hasCanonical,
              hasOpenGraph: audit.hasOpenGraph,
              hasJsonLd: audit.hasJsonLd,
              hasLocalBusinessSchema: audit.hasLocalBusinessSchema,
              h1Count: audit.h1Count,
              wordCount: audit.wordCount,
              imageCount: audit.imageCount,
              imagesMissingAlt: audit.imagesMissingAlt,
              hasPhoneOnPage: audit.hasPhoneOnPage,
              hasEmailOnPage: audit.hasEmailOnPage,
              hasContactForm: audit.hasContactForm,
              hasBlogHint: audit.hasBlogHint,
              responseTimeMs: audit.responseTimeMs,
              speedBand: audit.speedBand,
              htmlBytes: audit.htmlBytes,
              scriptCount: audit.scriptCount,
              hasHeroSection: audit.hasHeroSection,
              heroSignals: audit.heroSignals,
              hasInstagramLink: audit.hasInstagramLink,
              hasFacebookLink: audit.hasFacebookLink,
              hasGoogleAdsHint: audit.hasGoogleAdsHint,
              likelySpaShell: audit.likelySpaShell,
              websiteQualityScore: audit.websiteQualityScore,
              seoOpportunityScore: audit.seoOpportunityScore,
              marketingOpportunityScore: audit.marketingOpportunityScore,
              ppcOpportunityScore: audit.ppcOpportunityScore,
              findings: audit.findings,
            },
            null,
            2,
          ),
          "Page inventory:",
          pageLines(audit),
        ].join("\n")
      : "Live website audit: unavailable (no website or crawl failed)",
  ].join("\n");
}

const FORMAT_RULES = [
  "Write in plain professional prose only.",
  "Do NOT use markdown: no # headings, no **, no __, no backticks, no emoji.",
  "Use numbered sections like: 1) Title",
  "Use simple bullet lines starting with • when listing items.",
  "Every claim must be justified by the measured audit or provided lead fields.",
  "If a signal is missing, say it was not detected — never invent page content, rankings, or ad spend.",
  "Do not mention AI, GPT, ChatGPT, or language models.",
].join("\n");

const SECTION_PROMPTS: Record<LeadReportType, string> = {
  website: [
    "Write a Website Audit Report ONLY (not SEO/ads/marketing).",
    "Justify the website quality score using measured signals.",
    "Required sections:",
    "1) Score summary — what the website quality score means for this contractor",
    "2) Speed & performance — TTFB, HTML size, script load band",
    "3) Hero section — whether headline/media/CTA were detected and what that means",
    "4) Homepage content — title, H1, word count, trust signals",
    "5) Key pages inventory — Contact, About, Services, Gallery/Projects, Blog (found or missing)",
    "6) Conversion paths — phone, email, quote forms",
    "7) Priority website fixes ranked by ROI",
    "8) Suggested agency pitch focused on website rebuild or polish",
    "Target length: 800–1200 words.",
  ].join("\n"),
  seo: [
    "Write an SEO Complete Report ONLY (not a full marketing deck).",
    "Treat the SEO opportunity score as agency upside from on-page / technical / local SEO gaps.",
    "Be clear this is a crawl-based SEO readiness analysis, not live Google keyword rankings (unless ranking data was provided — it was not).",
    "Required sections:",
    "1) Score summary — why SEO opportunity is this number",
    "2) Technical SEO scorecard — HTTPS, title, meta, viewport, canonical, schema, H1",
    "3) Content & on-page gaps — depth, services pages, alt text, crawlability",
    "4) Local SEO readiness — LocalBusiness schema, city/service page signals",
    "5) Ranking opportunity narrative — what must improve before ranking for local service terms",
    "6) Top 10 SEO fixes (highest ROI first)",
    "7) 30-day SEO sprint",
    "8) Suggested SEO pitch",
    "Target length: 800–1200 words.",
  ].join("\n"),
  marketing: [
    "Write an Instagram & Social Media Optimization report ONLY.",
    "Focus on Instagram presence, social proof, content cadence, and demand-gen from social.",
    "Use lead Instagram/Facebook fields and whether those links appear on the website.",
    "Required sections:",
    "1) Score summary — marketing opportunity score meaning",
    "2) Instagram presence — URL found or missing; site link status",
    "3) Social proof gaps — gallery/projects, Open Graph, content hubs",
    "4) Content & posting recommendations for a contractor brand",
    "5) Profile and bio optimization checklist",
    "6) 30-day Instagram / social plan",
    "7) Suggested social marketing pitch",
    "Target length: 700–1100 words.",
  ].join("\n"),
  ads: [
    "Write a Google Ads / PPC Opportunity report ONLY.",
    "Focus on paid search and Local Services Ads readiness.",
    "Justify the PPC opportunity score from landing-page conversion readiness (HTTPS, forms, phone, hero, speed).",
    "Do not invent current ad accounts, budgets, or Quality Scores.",
    "Required sections:",
    "1) Score summary — what the PPC opportunity score means",
    "2) Landing page readiness for Google Ads",
    "3) Tracking & conversion signals detected or missing",
    "4) Google Ads vs Local Services Ads recommendation",
    "5) Creative and offer angles for this trade/city",
    "6) Budget & launch guidance (ranges only, clearly labeled as estimates)",
    "7) 30-day ads launch plan",
    "8) Suggested ads pitch",
    "Target length: 700–1100 words.",
  ].join("\n"),
  local: [
    "Write a Local Presence & Google Business Profile report ONLY.",
    "Required sections:",
    "1) Score context from reviews and local signals",
    "2) Reviews & reputation snapshot",
    "3) GBP / citation / directory gaps",
    "4) Local SEO opportunity tied to the site crawl",
    "5) Review-growth and NAP consistency plan",
    "6) 30-day local dominance plan",
    "7) Suggested local SEO pitch",
    "Target length: 700–1100 words.",
  ].join("\n"),
};

function buildFallbackReport(
  lead: LeadReportInput,
  reportType: LeadReportType,
  audit: WebsiteAudit | null,
) {
  const title = LEAD_REPORT_TYPE_META[reportType].label;
  const website = lead.website || "No website found";
  const seo = lead.seoOpportunityScore ?? audit?.seoOpportunityScore ?? null;
  const webQ = lead.websiteQualityScore ?? audit?.websiteQualityScore ?? null;
  const mkt =
    lead.marketingOpportunityScore ?? audit?.marketingOpportunityScore ?? null;
  const ppc = lead.ppcOpportunityScore ?? audit?.ppcOpportunityScore ?? null;
  const location = [lead.city, lead.state].filter(Boolean).join(", ");
  const findings = audit?.findings?.length
    ? audit.findings.map((f, i) => `${i + 1}. ${f}`).join("\n")
    : "1. Live crawl signals were limited.";

  if (reportType === "website") {
    return [
      `${title} — ${lead.businessName}`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      `Website: ${website}`,
      "",
      "1) Score summary",
      `Website quality score: ${webQ ?? "n/a"}/100 for ${lead.businessName}${location ? ` in ${location}` : ""}. This score comes from a live crawl of speed, hero/CTA structure, homepage content, and whether Contact, About, Services, Gallery, and Blog pages exist.`,
      "",
      "2) Speed & performance",
      `Speed band: ${audit?.speedBand ?? "unknown"}. TTFB: ${audit?.responseTimeMs ?? "n/a"} ms. HTML size: ${audit ? Math.round(audit.htmlBytes / 1024) : "n/a"} KB. Scripts detected: ${audit?.scriptCount ?? "n/a"}.`,
      "",
      "3) Hero section",
      audit?.hasHeroSection
        ? `Hero signals detected: ${(audit.heroSignals || []).join("; ") || "present"}.`
        : "A clear hero (headline + media + CTA) was not detected on the homepage.",
      "",
      "4) Homepage content",
      `Title: ${audit?.title || "missing"}. H1 count: ${audit?.h1Count ?? "n/a"}${audit?.h1Text ? ` (“${audit.h1Text}”)` : ""}. Crawlable words: ${audit?.wordCount ?? "n/a"}. HTTPS: ${audit?.https ? "yes" : audit ? "no" : "n/a"}. Contact form on home: ${audit?.hasContactForm ? "yes" : audit ? "no" : "n/a"}.`,
      "",
      "5) Key pages inventory",
      pageLines(audit),
      "",
      "6) Findings that drive the score",
      findings,
      "",
      "7) Priority website fixes",
      "1) Make Contact / Quote reachable with a phone + form above the fold.",
      "2) Strengthen the hero with one clear service promise and CTA.",
      "3) Ensure HTTPS, title, meta, and a single H1.",
      "4) Add or improve Services and About pages with local proof.",
      "5) Reduce heavy scripts / oversized HTML if speed is moderate or slow.",
      "",
      "8) Suggested pitch",
      lead.outreachAngle ||
        `Reviewed ${lead.businessName}'s site structure and conversion path — happy to walk through a short website fix plan.`,
    ].join("\n");
  }

  if (reportType === "marketing") {
    return [
      `${title} — ${lead.businessName}`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "1) Score summary",
      `Marketing opportunity score: ${mkt ?? "n/a"}/100. Higher scores mean more room to win booked jobs with Instagram, social proof, and content.`,
      "",
      "2) Instagram presence",
      `Lead Instagram field: ${lead.instagram?.trim() || "not listed"}. Instagram link on website: ${audit?.hasInstagramLink ? "detected" : audit ? "not detected" : "n/a"}. Facebook on website: ${audit?.hasFacebookLink ? "detected" : audit ? "not detected" : "n/a"}.`,
      "",
      "3) Social proof gaps",
      findings,
      "",
      "4) Recommendations",
      "1) Claim or optimize Instagram with trade + city keywords in the bio.",
      "2) Post weekly project proof (before/after) with location tags.",
      "3) Link Instagram in site header/footer and match Open Graph previews.",
      "4) Drive DMs and profile link to a quote form / click-to-call.",
      "",
      "5) Suggested pitch",
      `Noticed ${lead.businessName} can book more estimates with a tighter Instagram and project-proof system — open to a 15-minute walkthrough?`,
    ].join("\n");
  }

  if (reportType === "ads") {
    return [
      `${title} — ${lead.businessName}`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "1) Score summary",
      `PPC opportunity score: ${ppc ?? "n/a"}/100 based on landing-page conversion readiness (not invented ad account data).`,
      "",
      "2) Landing page readiness",
      `HTTPS: ${audit?.https ? "yes" : audit ? "no" : "n/a"}. Form: ${audit?.hasContactForm ? "yes" : audit ? "no" : "n/a"}. Phone on page: ${audit?.hasPhoneOnPage ? "yes" : audit ? "no" : "n/a"}. Hero: ${audit?.hasHeroSection ? "yes" : audit ? "no" : "n/a"}. Speed: ${audit?.speedBand ?? "unknown"}. Ads/analytics hints: ${audit?.hasGoogleAdsHint ? "detected" : audit ? "not detected" : "n/a"}.`,
      "",
      "3) Findings",
      findings,
      "",
      "4) Priority PPC fixes before spend",
      "1) Fix conversion path (form + click-to-call) on the landing page.",
      "2) Improve speed if moderate/slow.",
      "3) Add call tracking and thank-you / conversion events.",
      "4) Launch Local Services Ads and/or tightly geo-fenced Search campaigns.",
      "",
      "5) Suggested pitch",
      `Reviewed ${lead.businessName} for Google Ads readiness — can share a launch plan once the landing page converts.`,
    ].join("\n");
  }

  if (reportType === "seo") {
    return [
      `${title} — ${lead.businessName}`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      `Website: ${website}`,
      "",
      "1) Score summary",
      `SEO opportunity score: ${seo ?? "n/a"}/100. This is a crawl-based readiness / gap score, not a live keyword ranking export.`,
      "",
      "2) Technical SEO scorecard",
      `HTTPS: ${audit?.https ? "yes" : audit ? "no" : "n/a"}`,
      `Title: ${audit?.title || "missing"}`,
      `Meta description: ${audit?.metaDescription ? "present" : audit ? "missing" : "n/a"}`,
      `Canonical: ${audit?.hasCanonical ? "present" : audit ? "missing" : "n/a"}`,
      `LocalBusiness schema: ${audit?.hasLocalBusinessSchema ? "present" : audit ? "missing" : "n/a"}`,
      `H1 count: ${audit?.h1Count ?? "n/a"}`,
      `Homepage words: ${audit?.wordCount ?? "n/a"}`,
      "",
      "3) Findings",
      findings,
      "",
      "4) Top fixes",
      "1) Unique title/meta on home + top service pages.",
      "2) Add LocalBusiness + service-area schema.",
      "3) Build/optimize city + service landing pages.",
      "4) Fix H1 hierarchy and thin copy.",
      "5) Improve crawlable content and internal links to Contact/Services.",
      "",
      "5) Suggested pitch",
      lead.outreachAngle ||
        `Happy to share a 30-day SEO sprint for ${lead.businessName} based on the live site gaps we measured.`,
    ].join("\n");
  }

  // local default
  return [
    `${title} — ${lead.businessName}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "1) Executive summary",
    `${lead.businessName} is a ${lead.industry || lead.serviceCategory || "home-service"} contractor${
      location ? ` in ${location}` : ""
    }. Google ${lead.googleRating ?? "n/a"} (${lead.reviewCount ?? 0} reviews). Website quality ${webQ ?? "n/a"}/100; SEO opportunity ${seo ?? "n/a"}/100.`,
    "",
    "2) Findings",
    findings,
    "",
    "3) Priority recommendations",
    "1) Fully optimize Google Business Profile categories, services, and photos.",
    "2) Systematize review requests after completed jobs.",
    "3) Align NAP across site and directories.",
    "4) Add local landing pages for top cities/services.",
    "",
    "4) Suggested pitch",
    lead.outreachAngle ||
      `Noticed ${lead.businessName} can win more local search share with GBP + review velocity — open to a quick plan?`,
  ].join("\n");
}

export async function generateLeadIntelligenceReport(
  lead: LeadReportInput,
  reportType: LeadReportType = "website",
) {
  const audit = lead.website?.trim()
    ? await auditWebsite(lead.website, { timeoutMs: 14000 })
    : null;

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return {
      content: scrubReportMarkdown(buildFallbackReport(lead, reportType, audit)),
      audit,
      source: "fallback" as const,
    };
  }

  const openai = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: [
      "You are a senior agency strategist specializing in home-service contractor acquisition.",
      "Write client-ready reports agencies can forward. Be concrete, numbered, and revenue-oriented.",
      FORMAT_RULES,
    ].join(" "),
    prompt: [
      SECTION_PROMPTS[reportType],
      "",
      FORMAT_RULES,
      "",
      "Agency context (sender):",
      lead.agencyContext?.trim() ||
        "Independent marketing agency selling to contractors.",
      "",
      "Lead data:",
      buildLeadSnapshot(lead, audit),
    ].join("\n"),
  });

  const content =
    scrubReportMarkdown(text.trim()) ||
    scrubReportMarkdown(buildFallbackReport(lead, reportType, audit));
  return {
    content,
    audit,
    source: text.trim() ? ("ai" as const) : ("fallback" as const),
  };
}

export function reportTitle(businessName: string, reportType: LeadReportType) {
  return `${LEAD_REPORT_TYPE_META[reportType].label} — ${businessName}`;
}
