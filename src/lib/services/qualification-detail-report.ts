import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getOpenAIApiKey } from "@/lib/openai-config";
import type { WebsiteAudit } from "@/lib/services/website-audit";
import { emptyWebsiteAudit } from "@/lib/services/website-audit";
import { scrubReportMarkdown } from "@/lib/services/report-format";
import {
  QUALIFICATION_SCORE_META,
  type QualificationScoreKey,
} from "@/lib/services/qualification-detail-report-meta";

export {
  QUALIFICATION_SCORE_KEYS,
  QUALIFICATION_SCORE_META,
  isQualificationScoreKey,
  type QualificationScoreKey,
} from "@/lib/services/qualification-detail-report-meta";

export type QualificationDetailInput = {
  scoreKey: QualificationScoreKey;
  businessName: string;
  website: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  instagram?: string | null;
  facebook?: string | null;
  audit: WebsiteAudit;
  score: number;
};

const FORMAT_RULES = [
  "Plain professional prose only.",
  "Do NOT use markdown symbols: no #, **, __, backticks, or emoji.",
  "Use numbered sections like 1) Title and bullets starting with •.",
  "Justify every point with measured audit signals. Never invent page content or rankings.",
  "Do not mention AI, GPT, or language models.",
].join(" ");

const SECTION_FOCUS: Record<QualificationScoreKey, string> = {
  websiteQuality: [
    "Write a Website Quality detail report ONLY.",
    "Explain and justify the website quality score.",
    "Cover speed, hero section, homepage content, Contact/About/Services/Gallery/Blog page inventory, and conversion paths.",
    "Required sections:",
    "1) Score summary",
    "2) Speed & performance",
    "3) Hero section findings",
    "4) Content & trust signals",
    "5) Key pages inventory (found vs missing)",
    "6) Problems found (numbered, tied to audit)",
    "7) Priority website fixes",
    "8) Suggested pitch",
  ].join("\n"),
  seoOpportunity: [
    "Write an SEO Opportunity detail report ONLY.",
    "This is crawl-based SEO readiness — not a live keyword ranking tool export.",
    "Required sections:",
    "1) Score summary — why this opportunity score",
    "2) Technical SEO problems (title, meta, schema, H1, HTTPS, speed)",
    "3) Content / services page gaps",
    "4) Local SEO implications for this trade/city",
    "5) Priority SEO fixes",
    "6) 30-day SEO sprint",
    "7) Suggested SEO pitch",
  ].join("\n"),
  marketingOpportunity: [
    "Write an Instagram & Social Marketing detail report ONLY.",
    "Required sections:",
    "1) Score summary",
    "2) Instagram / social presence (lead fields + links on site)",
    "3) Content and social proof gaps",
    "4) Channel recommendations",
    "5) Priority marketing fixes",
    "6) Suggested marketing pitch",
  ].join("\n"),
  ppcOpportunity: [
    "Write a Google Ads / PPC readiness detail report ONLY.",
    "Required sections:",
    "1) Score summary",
    "2) Ads readiness problems (HTTPS, forms, hero, speed, tracking hints)",
    "3) Rebuild+ads vs scale-ads recommendation",
    "4) Priority PPC fixes before spend",
    "5) Suggested ads pitch",
  ].join("\n"),
};

function auditSnapshot(audit: WebsiteAudit) {
  return JSON.stringify(
    {
      reachable: audit.reachable,
      https: audit.https,
      finalUrl: audit.finalUrl,
      title: audit.title,
      h1Text: audit.h1Text,
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
      responseTimeMs: audit.responseTimeMs,
      speedBand: audit.speedBand,
      htmlBytes: audit.htmlBytes,
      scriptCount: audit.scriptCount,
      hasHeroSection: audit.hasHeroSection,
      heroSignals: audit.heroSignals,
      hasInstagramLink: audit.hasInstagramLink,
      hasFacebookLink: audit.hasFacebookLink,
      hasGoogleAdsHint: audit.hasGoogleAdsHint,
      pages: audit.pages,
      likelySpaShell: audit.likelySpaShell,
      websiteQualityScore: audit.websiteQualityScore,
      seoOpportunityScore: audit.seoOpportunityScore,
      marketingOpportunityScore: audit.marketingOpportunityScore,
      ppcOpportunityScore: audit.ppcOpportunityScore,
      findings: audit.findings,
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
  const contact = audit.pages?.find((p) => p.key === "contact");
  const about = audit.pages?.find((p) => p.key === "about");
  const services = audit.pages?.find((p) => p.key === "services");
  const gallery = audit.pages?.find((p) => p.key === "gallery");
  const blog = audit.pages?.find((p) => p.key === "blog");

  const problems =
    audit.findings?.length > 0
      ? audit.findings
      : ["Core homepage hygiene looks solid — opportunity is incremental."];

  const pageInventory = (audit.pages || [])
    .map((p) => {
      const status = p.reachable
        ? `found (${p.wordCount} words)`
        : p.found
          ? "linked but unreachable"
          : "not found";
      return `• ${p.key}: ${status}`;
    })
    .join("\n");

  const websiteFixes: string[] = [];
  if (!audit.https) websiteFixes.push("Move the site to HTTPS.");
  if (!audit.hasContactForm && !contact?.hasForm) {
    websiteFixes.push("Add a clear quote/contact form with click-to-call.");
  }
  if (!contact?.reachable) {
    websiteFixes.push("Add a dedicated Contact / Quote page.");
  }
  if (!about?.reachable) websiteFixes.push("Add an About page with trust proof.");
  if (!services?.reachable) {
    websiteFixes.push("Add a Services page with city/service coverage.");
  }
  if (!gallery?.reachable) {
    websiteFixes.push("Add a Projects / gallery page for social proof.");
  }
  if (!audit.hasHeroSection) {
    websiteFixes.push("Strengthen the homepage hero with one clear promise and CTA.");
  }
  if (audit.speedBand === "slow" || audit.speedBand === "moderate") {
    websiteFixes.push(
      `Tighten page speed (currently ${audit.speedBand}: ~${audit.responseTimeMs ?? "n/a"} ms TTFB, ${audit.scriptCount} scripts).`,
    );
  }
  if (audit.h1Count !== 1) {
    websiteFixes.push("Fix H1 hierarchy to a single clear homepage heading.");
  }
  if (!audit.title || audit.title.length < 8) {
    websiteFixes.push("Write a unique, descriptive title tag.");
  }
  if (websiteFixes.length === 0) {
    websiteFixes.push(
      "Site fundamentals look strong — prioritize speed polish, service-area pages, and review capture rather than a rebuild.",
    );
  }

  const ppcFixes: string[] = [];
  const landingReady =
    audit.https &&
    (audit.hasContactForm || Boolean(contact?.hasForm)) &&
    audit.hasPhoneOnPage &&
    audit.hasHeroSection;

  if (!landingReady) {
    if (!audit.https) ppcFixes.push("Fix HTTPS before sending paid traffic.");
    if (!audit.hasContactForm && !contact?.hasForm) {
      ppcFixes.push("Add form + click-to-call conversion path before spend.");
    }
    if (!audit.hasHeroSection) {
      ppcFixes.push("Clarify the landing-page offer/hero for ad visitors.");
    }
  } else {
    ppcFixes.push(
      "Landing page is conversion-ready (HTTPS, form/phone, hero detected) — safe to launch paid traffic.",
    );
  }
  if (audit.speedBand === "slow" || audit.speedBand === "moderate") {
    ppcFixes.push(
      `Improve speed before scaling budgets (currently ${audit.speedBand}).`,
    );
  }
  if (!audit.hasGoogleAdsHint) {
    ppcFixes.push("Add call tracking / conversion tags (GTM or Ads tag).");
  } else {
    ppcFixes.push("Analytics/ads tags already detected — verify conversion events and call tracking.");
  }
  ppcFixes.push(
    "Launch Local Services Ads and/or tightly geo-fenced Google Search for roofing + city terms.",
  );

  if (input.scoreKey === "websiteQuality") {
    return [
      `${meta.label} detail — ${input.businessName}`,
      `Score: ${input.score}/100`,
      `Website: ${input.website || "none"}`,
      location ? `Location: ${location}` : null,
      "",
      "1) Score summary",
      `Website quality ${input.score}/100 measures how strong the live site is (higher = better site). This is not an “opportunity to sell a rebuild” score. It comes from speed, hero, content, forms, and whether Contact / About / Services / Gallery / Blog pages exist.`,
      input.score >= 85
        ? "Verdict: this is a strong contractor site. Remaining upside is polish (speed) and growth channels — not a full redesign."
        : input.score >= 60
          ? "Verdict: usable site with clear gaps worth fixing before or alongside ads."
          : "Verdict: weak foundation — website work should come before heavy ad spend.",
      "",
      "2) Speed & performance",
      `Speed band: ${audit.speedBand}. TTFB: ${audit.responseTimeMs ?? "n/a"} ms. HTML: ${Math.round(audit.htmlBytes / 1024)} KB. Scripts: ${audit.scriptCount}.`,
      "",
      "3) Hero section",
      audit.hasHeroSection
        ? `Detected: ${(audit.heroSignals || []).join("; ") || "yes"}.`
        : "Clear hero (headline + media + CTA) was not detected.",
      "",
      "4) Content & trust",
      `Title: ${audit.title || "missing"}. H1 count: ${audit.h1Count}. Words: ${audit.wordCount}. Form: ${audit.hasContactForm ? "yes" : "no"}. Phone: ${audit.hasPhoneOnPage ? "yes" : "no"}.`,
      "",
      "5) Key pages inventory",
      pageInventory || "• No page crawl data",
      "",
      "6) Problems found",
      ...problems.map((p, i) => `${i + 1}. ${p}`),
      "",
      "7) Priority fixes (only what this crawl supports)",
      ...websiteFixes.map((f, i) => `${i + 1}) ${f}`),
      "",
      "8) Suggested pitch",
      audit.outreachAngle ||
        `Reviewed ${input.businessName}'s website — happy to walk through a short plan based on the live audit.`,
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  if (input.scoreKey === "marketingOpportunity") {
    const mktFixes: string[] = [];
    if (!audit.hasInstagramLink && !input.instagram?.trim()) {
      mktFixes.push("Claim/optimize Instagram and link it from the website.");
    } else if (!audit.hasInstagramLink) {
      mktFixes.push("Add the Instagram profile link to the website header/footer.");
    } else {
      mktFixes.push("Instagram is linked on-site — tighten bio CTA and weekly project posts.");
    }
    if (!audit.hasFacebookLink && !input.facebook?.trim()) {
      mktFixes.push("Add Facebook presence or at least keep one primary social channel active.");
    }
    if (!gallery?.reachable) {
      mktFixes.push("Publish a projects/gallery feed for social proof.");
    }
    if (!audit.hasOpenGraph) {
      mktFixes.push("Add Open Graph tags so shared links look professional.");
    }
    if (!blog?.reachable && !audit.hasBlogHint) {
      mktFixes.push("Add a light content hub (FAQs, project stories) for demand-gen.");
    }
    if (mktFixes.length === 0) {
      mktFixes.push("Social foundations look present — pitch content cadence and lead capture from social.");
    }

    return [
      `${meta.label} detail — ${input.businessName}`,
      `Score: ${input.score}/100`,
      "",
      "1) Score summary",
      `Marketing opportunity ${input.score}/100 is agency upside from Instagram/social and content gaps (higher = more to sell).`,
      "",
      "2) Instagram / social presence",
      `Instagram on lead record: ${input.instagram?.trim() || "not listed"}. Instagram link on website: ${audit.hasInstagramLink ? "detected" : "not detected"}. Facebook on website: ${audit.hasFacebookLink ? "detected" : "not detected"}.`,
      "",
      "3) Problems found",
      ...problems.map((p, i) => `${i + 1}. ${p}`),
      "",
      "4) Priority marketing fixes",
      ...mktFixes.map((f, i) => `${i + 1}) ${f}`),
      "",
      "5) Suggested pitch",
      audit.hasInstagramLink || input.instagram?.trim()
        ? `Noticed ${input.businessName} already has a web foundation — a tighter Instagram content + CTA system can book more estimates.`
        : `Noticed ${input.businessName} can book more jobs with a clearer Instagram system linked from the site — open to a quick walkthrough?`,
    ].join("\n");
  }

  if (input.scoreKey === "ppcOpportunity") {
    return [
      `${meta.label} detail — ${input.businessName}`,
      `Score: ${input.score}/100`,
      "",
      "1) Score summary",
      `PPC opportunity ${input.score}/100 estimates how worthwhile Google Ads / Local Services Ads are for an agency to sell. A mid/high score on a strong site usually means “ready to launch ads,” not “broken landing page.”`,
      landingReady
        ? "Verdict: landing page looks ready for paid traffic. Opportunity is campaign setup, tracking QA, and budget — not a rebuild."
        : "Verdict: fix conversion gaps before scaling spend.",
      "",
      "2) Ads readiness",
      `HTTPS: ${audit.https ? "yes" : "no"}. Form: ${audit.hasContactForm || contact?.hasForm ? "yes" : "no"}. Phone: ${audit.hasPhoneOnPage ? "yes" : "no"}. Hero: ${audit.hasHeroSection ? "yes" : "no"}. Speed: ${audit.speedBand}. Ads/analytics hints: ${audit.hasGoogleAdsHint ? "detected" : "not detected"}. Website quality: ${audit.websiteQualityScore}/100.`,
      "",
      "3) Problems / notes from crawl",
      ...problems.map((p, i) => `${i + 1}. ${p}`),
      "",
      "4) Priority PPC actions",
      ...ppcFixes.map((f, i) => `${i + 1}) ${f}`),
      "",
      "5) Suggested pitch",
      landingReady
        ? `Reviewed ${input.businessName} — the site already converts well enough to launch Google Ads / LSA. Happy to share a geo-fenced launch plan.`
        : `Reviewed ${input.businessName} for Google Ads readiness — a short conversion fix, then a paid launch plan.`,
    ].join("\n");
  }

  // SEO default
  const seoFixes: string[] = [];
  if (!audit.https) seoFixes.push("Enforce HTTPS.");
  if (!audit.title || audit.title.length < 8) seoFixes.push("Improve title tags.");
  if (!audit.metaDescription || audit.metaDescription.length < 50) {
    seoFixes.push("Write stronger meta descriptions.");
  }
  if (!audit.hasLocalBusinessSchema) {
    seoFixes.push("Add LocalBusiness schema.");
  }
  if (!services?.reachable) {
    seoFixes.push("Build dedicated service landing pages.");
  }
  if (audit.wordCount < 200) seoFixes.push("Expand crawlable service copy.");
  if (audit.speedBand === "slow") seoFixes.push("Improve Core Web Vitals / page speed.");
  if (seoFixes.length === 0) {
    seoFixes.push(
      "Technical basics look solid — pitch city/service page expansion, review velocity, and local pack content.",
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
    `SEO opportunity ${input.score}/100 is crawl-based readiness / gap upside (not a live keyword ranking export). Higher usually means more SEO work an agency can sell.`,
    "",
    "2) Problems found",
    ...problems.map((p, i) => `${i + 1}. ${p}`),
    "",
    "3) Why it matters",
    "Gaps above reduce local visibility or conversion from organic search — that is the agency pitch.",
    "",
    "4) Priority fixes",
    ...seoFixes.map((f, i) => `${i + 1}) ${f}`),
    "",
    "5) Suggested pitch",
    audit.outreachAngle ||
      `Noticed ${input.businessName} has measurable SEO gaps from a live crawl — open to a 30-day sprint walkthrough?`,
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
      content: scrubReportMarkdown(buildFallbackDetail({ ...input, audit })),
      source: "fallback",
    };
  }

  const openai = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: [
      "You are a senior local SEO / paid media / contractor-website consultant writing client-ready audit detail for agency SDRs.",
      FORMAT_RULES,
      "Target 700–1100 words.",
    ].join(" "),
    prompt: [
      SECTION_FOCUS[input.scoreKey],
      "",
      FORMAT_RULES,
      "",
      `Report type: ${meta.label}`,
      `Measured score: ${input.score}/100`,
      `Business: ${input.businessName}`,
      `Trade: ${input.industry || "home services"}`,
      `Location: ${[input.city, input.state].filter(Boolean).join(", ") || "unknown"}`,
      `Website: ${input.website || "none"}`,
      `Instagram: ${input.instagram || "not listed"}`,
      `Facebook: ${input.facebook || "not listed"}`,
      `Google: ${input.googleRating ?? "n/a"} (${input.reviewCount ?? 0} reviews) — listing context only.`,
      "",
      "Live site audit JSON:",
      auditSnapshot(audit),
    ].join("\n"),
  });

  const content =
    scrubReportMarkdown(text.trim()) ||
    scrubReportMarkdown(buildFallbackDetail({ ...input, audit }));
  return {
    content,
    source: text.trim() ? "ai" : "fallback",
  };
}
