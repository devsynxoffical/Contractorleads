import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getOpenAIApiKey } from "@/lib/openai-config";
import type { WebsiteAudit } from "@/lib/services/website-audit";
import { emptyWebsiteAudit } from "@/lib/services/website-audit";

export const QUALIFICATION_SCORE_KEYS = [
  "websiteQuality",
  "seoOpportunity",
  "marketingOpportunity",
  "ppcOpportunity",
] as const;

export type QualificationScoreKey = (typeof QUALIFICATION_SCORE_KEYS)[number];

export const QUALIFICATION_SCORE_META: Record<
  QualificationScoreKey,
  {
    label: string;
    shortLabel: string;
    description: string;
    scriptType: string;
  }
> = {
  websiteQuality: {
    label: "Website quality",
    shortLabel: "Website",
    description:
      "How strong the live homepage is — HTTPS, titles, content, forms, schema.",
    scriptType: "qualification_detail:websiteQuality",
  },
  seoOpportunity: {
    label: "SEO opportunity",
    shortLabel: "SEO",
    description:
      "Technical and on-page SEO gaps an agency can sell against.",
    scriptType: "qualification_detail:seoOpportunity",
  },
  marketingOpportunity: {
    label: "Marketing opportunity",
    shortLabel: "Marketing",
    description:
      "Funnel, content, and conversion gaps for demand-gen offers.",
    scriptType: "qualification_detail:marketingOpportunity",
  },
  ppcOpportunity: {
    label: "PPC opportunity",
    shortLabel: "Ads / PPC",
    description:
      "Paid traffic readiness — landing page, forms, HTTPS, rebuild vs scale.",
    scriptType: "qualification_detail:ppcOpportunity",
  },
};

export function isQualificationScoreKey(
  value: unknown,
): value is QualificationScoreKey {
  return (
    typeof value === "string" &&
    (QUALIFICATION_SCORE_KEYS as readonly string[]).includes(value)
  );
}

export type QualificationDetailInput = {
  scoreKey: QualificationScoreKey;
  businessName: string;
  website: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  audit: WebsiteAudit;
  score: number;
};

const SECTION_FOCUS: Record<QualificationScoreKey, string> = {
  websiteQuality: [
    "Focus ONLY on website quality / CRO / trust problems on the live homepage.",
    "Explain what is broken or weak, why it matters for a contractor, and how to fix it.",
    "Sections required:",
    "1) Score summary (what the score means)",
    "2) Problems found (numbered, specific to THIS site's audit signals)",
    "3) Why each problem hurts booked estimates",
    "4) Priority fixes (highest ROI first)",
    "5) Suggested SDR talking points",
  ].join("\n"),
  seoOpportunity: [
    "Focus ONLY on SEO opportunity / technical + local SEO gaps.",
    "Sections required:",
    "1) Score summary",
    "2) SEO problems found (title, meta, schema, H1, content, HTTPS, etc.)",
    "3) Local SEO implications for this trade/city",
    "4) Priority SEO fixes",
    "5) 30-day SEO sprint outline",
    "6) Suggested SEO pitch an agency can send",
  ].join("\n"),
  marketingOpportunity: [
    "Focus ONLY on marketing / content / conversion opportunity.",
    "Sections required:",
    "1) Score summary",
    "2) Marketing problems found (forms, CTAs, social tags, content, proof)",
    "3) Channel recommendations",
    "4) Priority marketing fixes",
    "5) Suggested marketing pitch",
  ].join("\n"),
  ppcOpportunity: [
    "Focus ONLY on Google Ads / Local Services Ads / paid readiness.",
    "Sections required:",
    "1) Score summary",
    "2) Ads readiness problems (HTTPS, forms, landing quality)",
    "3) Whether to pitch rebuild+ads vs scale ads",
    "4) Priority PPC fixes before spend",
    "5) Suggested ads pitch",
  ].join("\n"),
};

function auditSnapshot(audit: WebsiteAudit) {
  return JSON.stringify(
    {
      reachable: audit.reachable,
      https: audit.https,
      title: audit.title,
      metaDescription: Boolean(audit.metaDescription),
      metaLength: audit.metaDescription?.length ?? 0,
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
      likelySpaShell: audit.likelySpaShell,
      websiteQualityScore: audit.websiteQualityScore,
      seoOpportunityScore: audit.seoOpportunityScore,
      marketingOpportunityScore: audit.marketingOpportunityScore,
      ppcOpportunityScore: audit.ppcOpportunityScore,
      outreachAngle: audit.outreachAngle,
    },
    null,
    2,
  );
}

function buildFallbackDetail(input: QualificationDetailInput) {
  const meta = QUALIFICATION_SCORE_META[input.scoreKey];
  const audit = input.audit;
  const location = [input.city, input.state].filter(Boolean).join(", ");
  const problems: string[] = [];

  if (!input.website) {
    problems.push("No website URL is listed for this business.");
  } else if (!audit.reachable) {
    problems.push(
      "The website URL did not load during the live crawl (hosting, DNS, SSL, or bot blocking).",
    );
  } else {
    if (!audit.https) problems.push("Site is HTTP-only — not secure.");
    if (!audit.title || audit.title.length < 8) {
      problems.push("Title tag is missing or too short.");
    }
    if (!audit.metaDescription || audit.metaDescription.length < 50) {
      problems.push("Meta description is missing or thin.");
    }
    if (!audit.hasViewport) problems.push("Mobile viewport tag is missing.");
    if (!audit.hasCanonical) problems.push("Canonical URL is missing.");
    if (!audit.hasLocalBusinessSchema) {
      problems.push("No LocalBusiness schema detected.");
    }
    if (audit.h1Count !== 1) {
      problems.push(
        audit.h1Count === 0
          ? "No H1 heading found."
          : `${audit.h1Count} H1 tags — messy hierarchy.`,
      );
    }
    if (audit.wordCount < 200) {
      problems.push(
        `Thin homepage copy (${audit.wordCount} crawlable words).`,
      );
    }
    if (!audit.hasContactForm) {
      problems.push("Weak quote/contact capture (no clear form or booking CTA).");
    }
    if (!audit.hasPhoneOnPage) problems.push("Phone number not found on page.");
    if (!audit.hasOpenGraph) problems.push("Open Graph social tags missing.");
    if (!audit.hasBlogHint) {
      problems.push("No blog/resources/projects section detected.");
    }
    if (audit.likelySpaShell) {
      problems.push(
        "Page looks like a JS shell with little crawlable content.",
      );
    }
    if (
      audit.imageCount > 0 &&
      audit.imagesMissingAlt / audit.imageCount > 0.5
    ) {
      problems.push(
        `${audit.imagesMissingAlt}/${audit.imageCount} images missing alt text.`,
      );
    }
  }

  if (!problems.length) {
    problems.push(
      "Core homepage hygiene looks solid — opportunity is incremental (service-area pages, reviews, ads).",
    );
  }

  return [
    `${meta.label} detail — ${input.businessName}`,
    `Score: ${input.score}/100`,
    `Website: ${input.website || "none"}`,
    location ? `Location: ${location}` : null,
    input.industry ? `Trade: ${input.industry}` : null,
    "",
    "1) Score summary",
    `This ${meta.label.toLowerCase()} score is ${input.score}/100 based on a live homepage audit of measured HTML signals (not Google review count).`,
    "",
    "2) Problems found",
    ...problems.map((p, i) => `${i + 1}. ${p}`),
    "",
    "3) Why it matters",
    "Each gap above reduces trust, local rankings, or conversion from search/ads — which is the agency pitch.",
    "",
    "4) Priority fixes",
    "1) Fix technical basics (HTTPS, title, meta, viewport, H1).",
    "2) Add LocalBusiness schema and stronger quote CTA above the fold.",
    "3) Expand service + city page copy past 300+ words.",
    "4) Add call tracking / form notifications.",
    "5) Then layer local SEO content or paid traffic.",
    "",
    "5) Suggested pitch",
    audit.outreachAngle ||
      `Noticed ${input.businessName} has clear website/SEO gaps we can fix in a 30-day sprint — open to a quick walkthrough?`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function generateQualificationDetailReport(
  input: QualificationDetailInput,
): Promise<{ content: string; source: "ai" | "fallback" }> {
  const audit = input.audit ?? emptyWebsiteAudit();
  const meta = QUALIFICATION_SCORE_META[input.scoreKey];
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    return {
      content: buildFallbackDetail({ ...input, audit }),
      source: "fallback",
    };
  }

  const openai = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a senior local SEO / paid media / contractor-website consultant writing client-ready audit detail for agency SDRs. Be specific to the measured audit signals. Never invent page content you did not see. Never invent contact info. Use numbered sections and plain language. Target 700–1100 words.",
    prompt: [
      SECTION_FOCUS[input.scoreKey],
      "",
      `Report type: ${meta.label}`,
      `Measured score: ${input.score}/100`,
      `Business: ${input.businessName}`,
      `Trade: ${input.industry || "home services"}`,
      `Location: ${[input.city, input.state].filter(Boolean).join(", ") || "unknown"}`,
      `Website: ${input.website || "none"}`,
      `Google: ${input.googleRating ?? "n/a"} (${input.reviewCount ?? 0} reviews) — listing context only, do not use reviews as the website score basis.`,
      "",
      "Live homepage audit JSON:",
      auditSnapshot(audit),
    ].join("\n"),
  });

  const content = text.trim() || buildFallbackDetail({ ...input, audit });
  return {
    content,
    source: text.trim() ? "ai" : "fallback",
  };
}
