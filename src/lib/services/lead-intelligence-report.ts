import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getOpenAIApiKey } from "@/lib/openai-config";
import { auditWebsite, type WebsiteAudit } from "@/lib/services/website-audit";

export const LEAD_REPORT_TYPES = [
  "full",
  "seo",
  "marketing",
  "ads",
  "local",
] as const;

export type LeadReportType = (typeof LEAD_REPORT_TYPES)[number];

export const LEAD_REPORT_SCRIPT_TYPE = "lead_intelligence_report";

export const LEAD_REPORT_TYPE_META: Record<
  LeadReportType,
  { label: string; description: string }
> = {
  full: {
    label: "Full intelligence",
    description: "Website, SEO, ads, marketing, local presence, and pitch",
  },
  seo: {
    label: "SEO & website",
    description: "Technical SEO, content, schema, and conversion gaps",
  },
  marketing: {
    label: "Marketing",
    description: "Brand, content, social, and demand-gen opportunity",
  },
  ads: {
    label: "Ads & PPC",
    description: "Paid search, local services ads, and creative angles",
  },
  local: {
    label: "Local presence",
    description: "Google Business Profile, reviews, and local SEO",
  },
};

export function isLeadReportType(value: unknown): value is LeadReportType {
  return (
    typeof value === "string" &&
    (LEAD_REPORT_TYPES as readonly string[]).includes(value)
  );
}

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
    scoreLine("Website quality", lead.websiteQualityScore),
    scoreLine("SEO opportunity", lead.seoOpportunityScore),
    scoreLine("Marketing opportunity", lead.marketingOpportunityScore),
    scoreLine("PPC opportunity", lead.ppcOpportunityScore),
    `Stored outreach angle: ${lead.outreachAngle || "n/a"}`,
    socialLine("Facebook", lead.facebook),
    socialLine("Instagram", lead.instagram),
    socialLine("LinkedIn", linkedinUrl(lead)),
    socialLine("Yelp", lead.yelpUrl),
    audit
      ? `Live website audit: ${JSON.stringify({
          reachable: audit.reachable,
          https: audit.https,
          title: audit.title,
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
          websiteQualityScore: audit.websiteQualityScore,
          seoOpportunityScore: audit.seoOpportunityScore,
          marketingOpportunityScore: audit.marketingOpportunityScore,
          ppcOpportunityScore: audit.ppcOpportunityScore,
        })}`
      : "Live website audit: unavailable (no website or crawl failed)",
  ].join("\n");
}

const SECTION_PROMPTS: Record<LeadReportType, string> = {
  full: [
    "Write a professional contractor-lead intelligence report with these sections:",
    "1) Executive summary",
    "2) Business & local presence snapshot",
    "3) Website & technical SEO findings",
    "4) Organic / local SEO opportunity",
    "5) Paid ads & PPC opportunity",
    "6) Marketing & content opportunity",
    "7) Priority recommendations (ranked, high ROI first)",
    "8) 30-day action plan (week-by-week)",
    "9) Suggested agency outreach pitch (ready to send)",
    "Be specific to this business. Use the live audit signals when available.",
    "If there is no website, focus on website build + GBP + ads opportunity instead of inventing on-page SEO.",
    "Target length: 900–1400 words. Use clear headings and bullet lists. No fluff.",
  ].join("\n"),
  seo: [
    "Write a professional Website + SEO audit report with:",
    "1) Executive summary",
    "2) Technical SEO scorecard",
    "3) On-page & content gaps",
    "4) Local SEO / schema findings",
    "5) Top 10 fixes (highest ROI first)",
    "6) 30-day SEO sprint",
    "7) Suggested SEO outreach pitch",
    "If no website exists, recommend a conversion-ready local site build and GBP foundations.",
    "Target length: 700–1100 words.",
  ].join("\n"),
  marketing: [
    "Write a professional Marketing opportunity report with:",
    "1) Executive summary",
    "2) Brand & trust signals",
    "3) Content / social gaps",
    "4) Demand-gen opportunities",
    "5) Recommended channels & offers",
    "6) 30-day marketing plan",
    "7) Suggested marketing outreach pitch",
    "Target length: 700–1100 words.",
  ].join("\n"),
  ads: [
    "Write a professional Ads & PPC opportunity report with:",
    "1) Executive summary",
    "2) Paid search readiness",
    "3) Local Services Ads / Google Ads angles",
    "4) Creative & landing-page recommendations",
    "5) Budget & tracking guidance",
    "6) 30-day ads launch plan",
    "7) Suggested ads outreach pitch",
    "Target length: 700–1100 words.",
  ].join("\n"),
  local: [
    "Write a professional Local presence & Google Business Profile report with:",
    "1) Executive summary",
    "2) Reviews & reputation snapshot",
    "3) GBP / citation / directory gaps",
    "4) Local SEO opportunity",
    "5) Review-growth and NAP consistency plan",
    "6) 30-day local dominance plan",
    "7) Suggested local-SEO outreach pitch",
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
    lead.marketingOpportunityScore ??
    audit?.marketingOpportunityScore ??
    null;
  const ppc = lead.ppcOpportunityScore ?? audit?.ppcOpportunityScore ?? null;
  const location = [lead.city, lead.state].filter(Boolean).join(", ");

  return [
    `${title} — ${lead.businessName}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Website: ${website}`,
    "",
    "1) Executive summary",
    `${lead.businessName} is a ${lead.industry || lead.serviceCategory || "home-service"} contractor${
      location ? ` in ${location}` : ""
    }. Lead score ${lead.leadScore ?? "n/a"}/100. Website quality ${webQ ?? "n/a"}/100 with SEO opportunity ${seo ?? "n/a"}/100, marketing ${mkt ?? "n/a"}/100, and PPC ${ppc ?? "n/a"}/100. ${
      lead.website
        ? "The largest agency upside is tightening technical SEO, local schema, and conversion paths."
        : "There is no usable website — the highest-value offer is a conversion-ready local site plus Google Business Profile and call tracking."
    }`,
    "",
    "2) Scorecard",
    `- Google rating: ${lead.googleRating ?? "n/a"} (${lead.reviewCount ?? 0} reviews)`,
    `- Website quality: ${webQ ?? "n/a"}/100`,
    `- SEO opportunity: ${seo ?? "n/a"}/100`,
    `- Marketing opportunity: ${mkt ?? "n/a"}/100`,
    `- PPC opportunity: ${ppc ?? "n/a"}/100`,
    `- HTTPS: ${audit?.https ? "Yes" : audit ? "No" : "n/a"}`,
    `- Title tag: ${audit?.title ? "Present" : audit ? "Missing" : "n/a"}`,
    `- Meta description: ${audit?.metaDescription ? "Present" : audit ? "Missing" : "n/a"}`,
    `- LocalBusiness schema: ${audit?.hasLocalBusinessSchema ? "Present" : audit ? "Missing" : "n/a"}`,
    `- Contact form: ${audit?.hasContactForm ? "Present" : audit ? "Missing" : "n/a"}`,
    `- Content depth: ${audit ? `${audit.wordCount} words` : "n/a"}`,
    "",
    "3) Priority recommendations",
    lead.website
      ? [
          "1) Fix title/meta uniqueness on home + top service pages.",
          "2) Add LocalBusiness + service-area schema.",
          "3) Strengthen above-the-fold quote CTA and phone click-to-call.",
          "4) Build/optimize city + service landing pages.",
          "5) Launch or tighten Google Ads / Local Services Ads with call tracking.",
          "6) Systematize review requests from completed jobs.",
          "7) Publish weekly local proof content (projects, FAQs, before/after).",
          "8) Connect CRM / form notifications so leads never sit unanswered.",
        ].join("\n")
      : [
          "1) Launch a fast, mobile-first local website with service + city pages.",
          "2) Claim and fully optimize Google Business Profile.",
          "3) Add call tracking + quote form on every page.",
          "4) Seed reviews from recent customers.",
          "5) Stand up Local Services Ads / Google Ads once the site converts.",
          "6) Build citation consistency (NAP) across major directories.",
          "7) Add Facebook/Instagram proof posts weekly.",
          "8) Package a 90-day launch retainer around site + ads + reviews.",
        ].join("\n"),
    "",
    "4) 30-day action plan",
    "Week 1: Audit cleanup / foundation (site or GBP + tracking).",
    "Week 2: Conversion pages + offers live.",
    "Week 3: Ads / local SEO push + review engine.",
    "Week 4: Measure booked estimates; expand winning services/cities.",
    "",
    "5) Suggested outreach pitch",
    lead.outreachAngle ||
      `Noticed ${lead.businessName} has room to book more estimates from local search and paid demand. Happy to share a short plan for website, SEO, and ads — open to a quick call this week?`,
  ].join("\n");
}

export async function generateLeadIntelligenceReport(
  lead: LeadReportInput,
  reportType: LeadReportType = "full",
) {
  const audit = lead.website?.trim()
    ? await auditWebsite(lead.website)
    : null;

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return {
      content: buildFallbackReport(lead, reportType, audit),
      audit,
      source: "fallback" as const,
    };
  }

  const openai = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a senior agency strategist specializing in home-service contractor acquisition: local SEO, websites, Google Ads, Local Services Ads, reputation, and outbound sales. Write client-ready reports agencies can forward or present. Be concrete, numbered, and revenue-oriented. Never invent contact details or claim you saw ads that were not provided.",
    prompt: [
      SECTION_PROMPTS[reportType],
      "",
      "Agency context (sender):",
      lead.agencyContext?.trim() ||
        "Independent marketing agency selling to contractors.",
      "",
      "Lead data:",
      buildLeadSnapshot(lead, audit),
    ].join("\n"),
  });

  const content = text.trim() || buildFallbackReport(lead, reportType, audit);
  return {
    content,
    audit,
    source: text.trim() ? ("ai" as const) : ("fallback" as const),
  };
}

export function reportTitle(businessName: string, reportType: LeadReportType) {
  return `${LEAD_REPORT_TYPE_META[reportType].label} — ${businessName}`;
}
