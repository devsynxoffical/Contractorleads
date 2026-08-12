import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { EXPERT_COPYWRITER_SYSTEM_PROMPT } from "@/lib/constants";
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
      return `• ${p.key}: ${status}${p.url ? ` · ${p.url}` : ""}`;
    })
    .join("\n");
}

function agencyNameFromContext(agencyContext?: string | null) {
  const line = agencyContext
    ?.split("\n")
    .map((l) => l.trim())
    .find((l) => /^company\s*:/i.test(l) || /^agency\s*:/i.test(l));
  if (!line) return "our team";
  return line.replace(/^[^:]+:\s*/i, "").trim() || "our team";
}

function buildLeadSnapshot(lead: LeadReportInput, audit: WebsiteAudit | null) {
  return [
    `Business (client): ${lead.businessName}`,
    `Owner / contact: ${lead.ownerName || "unknown"}`,
    `Trade: ${lead.industry || lead.serviceCategory || "home services"}`,
    `Location: ${[lead.city, lead.state].filter(Boolean).join(", ") || lead.address || "unknown"}`,
    `Phone: ${lead.phone || "unknown"}`,
    `Email: ${lead.email || "unknown"}`,
    `Website: ${lead.website || "none"}`,
    `Google: ${lead.googleRating ?? "n/a"} (${lead.reviewCount ?? 0} reviews)`,
    `Yelp: ${lead.yelpRating ?? "n/a"} (${lead.yelpReviews ?? 0} reviews)`,
    socialLine("Facebook", lead.facebook),
    socialLine("Instagram", lead.instagram),
    socialLine("LinkedIn", linkedinUrl(lead)),
    audit
      ? [
          "Live website audit (FACTUAL ONLY — do not invent beyond this):",
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
              hasLocalBusinessSchema: audit.hasLocalBusinessSchema,
              h1Count: audit.h1Count,
              wordCount: audit.wordCount,
              hasPhoneOnPage: audit.hasPhoneOnPage,
              hasEmailOnPage: audit.hasEmailOnPage,
              hasContactForm: audit.hasContactForm,
              responseTimeMs: audit.responseTimeMs,
              speedBand: audit.speedBand,
              htmlBytes: audit.htmlBytes,
              scriptCount: audit.scriptCount,
              hasHeroSection: audit.hasHeroSection,
              heroSignals: audit.heroSignals,
              hasInstagramLink: audit.hasInstagramLink,
              hasFacebookLink: audit.hasFacebookLink,
              hasGoogleAdsHint: audit.hasGoogleAdsHint,
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
  "Audience: the CONTRACTOR / business owner (the client). Write TO them, not about them as a lead.",
  "Purpose: a professional service proposal they can read and say yes to.",
  "Tone: confident, respectful, clear. No hype, no slang, no emojis.",
  "Do NOT use markdown: no # headings, no **, no __, no backticks.",
  "Use numbered sections like: 1) Cover note",
  "For steps inside a section, use 1. 2. 3. (period) — never 1) 2) 3) inside a section.",
  "Use simple bullet lines starting with • when listing items.",
  "Do NOT mention lead scores, opportunity scores, SDRs, CRM, pipeline, or 'agency upside'.",
  "Do NOT mention AI, GPT, ChatGPT, or language models.",
  "Every problem must come from the live audit or provided fields. Never invent rankings, ad spend, or page content.",
  "If something looks strong, say so honestly — then explain the growth opportunity, not fake problems.",
].join("\n");

const SHARED_SECTIONS = [
  "Required structure (keep these section numbers and titles):",
  "1) Cover note — personal greeting; 2–3 short paragraphs",
  "2) What we reviewed — factual channels/pages checked; include what already looks strong",
  "3) Issues we found — 5–8 specific problems; each issue = bold one-line title + 2–4 sentence explanation",
  "4) Why this costs you jobs — plain-language business impact (quotes, phone calls, seasonality)",
  "5) How we help — group fixes by channel (Website / SEO / Social / Ads as relevant); be concrete",
  "6) What you get — deliverables + week-by-week 30-day timeline",
  "7) Recommended next step — soft CTA + what happens on the kickoff call",
  "Be DETAILED and specific. Target a thorough client proposal, not a short summary.",
].join("\n");

const SECTION_PROMPTS: Record<LeadReportType, string> = {
  full: [
    "Write a DETAILED CLIENT-FACING All-Services Growth Proposal for this contractor.",
    "Service being pitched: a combined package — website, local SEO, Instagram/social, and Google Ads.",
    SHARED_SECTIONS,
    "Cover each channel specifically from the audit: website conversion, SEO foundations, social proof, and paid search readiness.",
    "Organize issues and fixes so the owner sees one clear growth plan, not four separate pitches.",
    "Target length: 1400–2000 words. Prefer depth and clarity over filler.",
  ].join("\n"),
  website: [
    "Write a DETAILED CLIENT-FACING Website Growth Proposal for this contractor.",
    "Service being pitched: Website design, speed, conversion, and quote capture.",
    SHARED_SECTIONS,
    "Focus on: speed, hero/CTA, missing pages, forms, phone, HTTPS, content trust.",
    "Frame issues as obstacles to getting more estimates — then map each to what we will build or improve.",
    "Target length: 1200–1700 words.",
  ].join("\n"),
  seo: [
    "Write a DETAILED CLIENT-FACING Local SEO Growth Proposal for this contractor.",
    "Service being pitched: Local SEO to win more search demand in their city/trade.",
    SHARED_SECTIONS,
    "Focus on: title/meta, schema, H1, content depth, services pages, local SEO foundations.",
    "Be clear this is based on a live site review, not a full keyword rank export.",
    "Target length: 1200–1700 words.",
  ].join("\n"),
  marketing: [
    "Write a DETAILED CLIENT-FACING Instagram & Social Growth Proposal for this contractor.",
    "Service being pitched: Instagram / social content that turns project proof into booked jobs.",
    SHARED_SECTIONS,
    "Focus on: Instagram presence, site social links, gallery/proof, posting system, bio CTA.",
    "Target length: 1100–1600 words.",
  ].join("\n"),
  ads: [
    "Write a DETAILED CLIENT-FACING Google Ads Growth Proposal for this contractor.",
    "Service being pitched: Google Ads and/or Local Services Ads to capture high-intent searchers.",
    SHARED_SECTIONS,
    "Focus on: landing-page readiness (HTTPS, form, phone, hero, speed), tracking, launch plan.",
    "Do not invent budgets as facts — label any ranges as estimates.",
    "Target length: 1100–1600 words.",
  ].join("\n"),
};

function pitchFixesFromAudit(
  reportType: LeadReportType,
  audit: WebsiteAudit | null,
): string[] {
  const fixes: string[] = [];
  if (!audit?.reachable) {
    return [
      "Build or restore a fast, mobile-friendly website with clear services and a quote form.",
      "Set up call tracking and a simple lead notification so no estimate request is missed.",
    ];
  }

  if (
    reportType === "full" ||
    reportType === "website" ||
    reportType === "seo" ||
    reportType === "ads"
  ) {
    if (!audit.https) fixes.push("Move the site to secure HTTPS hosting.");
    if (!audit.hasContactForm) {
      fixes.push("Add a clear Get a Quote form with click-to-call on every key page.");
    }
    if (!audit.hasHeroSection) {
      fixes.push("Rewrite the homepage hero with one promise, proof, and primary CTA.");
    }
    if (audit.speedBand === "slow" || audit.speedBand === "moderate") {
      fixes.push(
        `Improve page speed (currently ${audit.speedBand}) so visitors and ads convert better.`,
      );
    }
  }

  if (
    reportType === "full" ||
    reportType === "website" ||
    reportType === "seo"
  ) {
    const contact = audit.pages?.find((p) => p.key === "contact");
    const about = audit.pages?.find((p) => p.key === "about");
    const services = audit.pages?.find((p) => p.key === "services");
    if (!contact?.reachable) fixes.push("Create a dedicated Contact / Quote page.");
    if (!about?.reachable) fixes.push("Add an About page that builds trust.");
    if (!services?.reachable) {
      fixes.push("Add a Services page with city and service coverage.");
    }
    if (!audit.hasLocalBusinessSchema) {
      fixes.push("Add LocalBusiness schema so Google understands the company.");
    }
    if (!audit.title || audit.title.length < 8) {
      fixes.push("Write stronger title tags for home and top service pages.");
    }
  }

  if (reportType === "full" || reportType === "marketing") {
    if (!audit.hasInstagramLink) {
      fixes.push("Connect Instagram to the website and optimize the profile bio CTA.");
    }
    if (!audit.pages?.find((p) => p.key === "gallery")?.reachable) {
      fixes.push("Build a project gallery feed for before/after social proof.");
    }
    fixes.push("Run a weekly posting system with location tags and quote CTAs.");
  }

  if (reportType === "full" || reportType === "ads") {
    if (audit.hasContactForm && audit.https && audit.hasPhoneOnPage) {
      fixes.push("Launch geo-fenced Google Search and/or Local Services Ads.");
      fixes.push("Install call tracking and conversion events before scaling spend.");
    } else {
      fixes.push("Fix conversion path first, then launch paid campaigns.");
    }
  }

  if (!fixes.length) {
    fixes.push(
      "Keep the strong foundation and layer growth work: service-area pages, reviews, and demand capture.",
    );
  }
  return fixes.slice(0, reportType === "full" ? 8 : 6);
}

function buildFallbackReport(
  lead: LeadReportInput,
  reportType: LeadReportType,
  audit: WebsiteAudit | null,
) {
  const meta = LEAD_REPORT_TYPE_META[reportType];
  const agency = agencyNameFromContext(lead.agencyContext);
  const location = [lead.city, lead.state].filter(Boolean).join(", ");
  const owner = lead.ownerName?.trim() || "there";
  const findings = audit?.findings?.length
    ? audit.findings
    : ["We could not fully crawl the live website — that alone is a risk for customers searching online."];
  const fixes = pitchFixesFromAudit(reportType, audit);
  const date = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return [
    `${meta.label}`,
    `Prepared for: ${lead.businessName}`,
    location ? `Location: ${location}` : null,
    `Prepared by: ${agency}`,
    `Date: ${date}`,
    lead.website ? `Website reviewed: ${lead.website}` : null,
    "",
    "1) Cover note",
    `Hi ${owner},`,
    "",
    `We reviewed how ${lead.businessName} shows up online for ${lead.industry || lead.serviceCategory || "your trade"} customers${location ? ` in ${location}` : ""}. This short proposal highlights what is holding back more booked estimates — and exactly how ${agency} can help through ${meta.serviceName.toLowerCase()}.`,
    "",
    "2) What we reviewed",
    audit?.reachable
      ? `• Live website crawl of ${audit.finalUrl || lead.website}`
      : `• Website URL on file: ${lead.website || "not provided"}`,
    `• Homepage signals: HTTPS, titles, hero/CTA, forms, phone, speed`,
    `• Key pages: Contact, About, Services, Gallery, Blog`,
    reportType === "marketing" || reportType === "full"
      ? `• Social presence: Instagram ${lead.instagram || (audit?.hasInstagramLink ? "linked on site" : "not detected")}, Facebook ${lead.facebook || (audit?.hasFacebookLink ? "linked on site" : "not detected")}`
      : null,
    reportType === "full"
      ? `• Public reputation: Google ${lead.googleRating ?? "n/a"} (${lead.reviewCount ?? 0} reviews)`
      : null,
    "",
    "3) Issues we found",
    ...findings.map((f, i) => `${i + 1}. ${f}`),
    "",
    "4) Why this costs you jobs",
    "When the online experience is slow, unclear, or missing trust and quote paths, homeowners move on to the next contractor. Every weak CTA, missing page, or thin local signal is a quote that never reaches your phone.",
    "",
    "5) How we help",
    `Here is what ${agency} will do under ${meta.serviceName}:`,
    ...fixes.map((f, i) => `${i + 1}) ${f}`),
    "",
    "6) What you get",
    "• A clear punch-list of fixes prioritized by impact on booked jobs",
    "• Implementation support for the items above (copy, pages, tracking, or campaigns as relevant)",
    "• A 30-day action plan with weekly checkpoints",
    "• Simple reporting so you can see calls, forms, and progress",
    "",
    "7) Recommended next step",
    `If this matches what you want for ${lead.businessName}, reply to this report or book a short call with ${agency}. We will walk through the issues on your site, confirm priorities, and outline kickoff within one business day.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function generateLeadIntelligenceReport(
  lead: LeadReportInput,
  reportType: LeadReportType = "full",
) {
  const audit = lead.website?.trim()
    ? await auditWebsite(lead.website, { timeoutMs: 14000 })
    : null;

  const apiKey = await getOpenAIApiKey();
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
      EXPERT_COPYWRITER_SYSTEM_PROMPT,
      "You write polished client proposals the contractor can forward to a partner or print for a meeting.",
      "You diagnose real problems from the audit, explain business impact, and clearly pitch the agency's service as the solution.",
      FORMAT_RULES,
    ].join(" "),
    prompt: [
      SECTION_PROMPTS[reportType],
      "",
      FORMAT_RULES,
      "",
      "Agency writing this proposal (sender — use their name/services when pitching):",
      lead.agencyContext?.trim() ||
        "Independent marketing agency helping contractors get more booked jobs.",
      "",
      "Client / business data:",
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
