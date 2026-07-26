import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { getOpenAIApiKey } from "@/lib/openai-config";
import type { PlaceResult } from "./google-places";
import type { WebsiteAudit } from "./website-audit";
import { emptyWebsiteAudit } from "./website-audit";

const qualificationSchema = z.object({
  serviceCategory: z.string(),
  // Only include when confidence is reasonable; omit rather than guess.
  revenueRangeEstimate: z.string().optional().nullable(),
  websiteQualityScore: z.number().min(0).max(100),
  marketingOpportunityScore: z.number().min(0).max(100),
  ppcOpportunityScore: z.number().min(0).max(100),
  seoOpportunityScore: z.number().min(0).max(100),
  outreachAngle: z.string(),
  /** Base priority before contact completeness is applied (capped later). */
  leadScore: z.number().min(1).max(100),
  qualityTier: z.enum(["hot", "warm", "nurture"]),
});

export type QualificationResult = z.infer<typeof qualificationSchema> & {
  source: "ai" | "rules";
  revenueRangeEstimate: string | null;
};

/** Contact / presence signals used to finalize outreach score. */
export type LeadCompleteness = {
  hasWebsite: boolean;
  hasEmail: boolean;
  hasOwner: boolean;
  hasLinkedIn: boolean;
  /** Facebook, Instagram, YouTube, or TikTok */
  hasSocial: boolean;
  hasPhone?: boolean;
};

export function tierFromScore(score: number): "hot" | "warm" | "nurture" {
  if (score >= 75) return "hot";
  if (score >= 50) return "warm";
  return "nurture";
}

/**
 * Final lead score after enrichment.
 * Score 100 is reserved for complete profiles:
 * website + email + owner + LinkedIn + social.
 */
export function finalizeLeadScore(
  baseScore: number,
  completeness: LeadCompleteness,
): { leadScore: number; qualityTier: "hot" | "warm" | "nurture" } {
  const checks = {
    website: completeness.hasWebsite,
    email: completeness.hasEmail,
    owner: completeness.hasOwner,
    linkedin: completeness.hasLinkedIn,
    social: completeness.hasSocial,
  };
  const presentCount = Object.values(checks).filter(Boolean).length;
  const allComplete = presentCount === 5;

  // Places/AI base is capped ~70 before enrichment.
  const base = Math.round(Math.min(70, Math.max(1, baseScore)));

  if (allComplete) {
    // Score 100 only with website + LinkedIn + social + owner + email.
    // 95–100 scales with Google strength (base).
    let score = 95;
    if (base >= 60) score = 100;
    else if (base >= 50) score = 98;
    else if (base >= 40) score = 96;
    else score = 95;
    if (completeness.hasPhone && score < 100) score = Math.min(100, score + 1);
    return { leadScore: score, qualityTier: tierFromScore(score) };
  }

  // Incomplete: blend Places signal with whatever contact fields we found.
  const completenessPoints =
    (checks.website ? 12 : 0) +
    (checks.linkedin ? 12 : 0) +
    (checks.social ? 10 : 0) +
    (checks.owner ? 8 : 0) +
    (checks.email ? 8 : 0);

  let score = Math.round(base * 0.55 + completenessPoints * 0.9);
  if (completeness.hasPhone) score += 2;

  if (!checks.website) score = Math.min(score, 52);
  if (!checks.linkedin) score = Math.min(score, 68);
  if (!checks.owner) score = Math.min(score, 74);
  if (!checks.email) score = Math.min(score, 80);
  if (!checks.social) score = Math.min(score, 86);

  // Never 95+ without a complete profile
  score = Math.min(94, Math.max(1, Math.round(score)));
  return { leadScore: score, qualityTier: tierFromScore(score) };
}

/** Reconstruct Places-style base (≤70) from stored Google fields. */
export function baseScoreFromStoredSignals(lead: {
  googleRating?: number | null;
  reviewCount?: number | null;
  website?: string | null;
}): number {
  const rating = lead.googleRating ?? 0;
  const reviews = lead.reviewCount ?? 0;
  const hasWebsite = Boolean(lead.website?.trim());
  const ratingPts = Math.min(28, rating * 5.2);
  const reviewPts = Math.min(28, Math.log10(reviews + 1) * 14);
  const websitePts = hasWebsite ? 12 : 0;
  return Math.round(
    Math.min(70, Math.max(18, ratingPts + reviewPts + websitePts)),
  );
}

/**
 * Recompute leadScore / qualityTier from fields already on the lead row.
 * Use after the scoring rules change, or for admin bulk fix.
 */
export function scoreLeadFromStoredFields(lead: {
  googleRating?: number | null;
  reviewCount?: number | null;
  website?: string | null;
  email?: string | null;
  ownerName?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  linkedinCompanyUrl?: string | null;
  linkedinOwnerUrl?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
}): { leadScore: number; qualityTier: "hot" | "warm" | "nurture" } {
  const base = baseScoreFromStoredSignals(lead);
  return finalizeLeadScore(base, {
    hasWebsite: Boolean(lead.website?.trim()),
    hasEmail: Boolean(lead.email?.trim()),
    hasOwner: Boolean(lead.ownerName?.trim()),
    hasLinkedIn: Boolean(
      lead.linkedinUrl?.trim() ||
        lead.linkedinCompanyUrl?.trim() ||
        lead.linkedinOwnerUrl?.trim(),
    ),
    hasSocial: Boolean(
      lead.facebook?.trim() ||
        lead.instagram?.trim() ||
        lead.youtube?.trim() ||
        lead.tiktok?.trim(),
    ),
    hasPhone: Boolean(lead.phone?.trim()),
  });
}

/**
 * Rules-only base score from Google Places signals (before enrichment).
 * Intentionally capped well below 100 — completeness finalizes the score.
 */
function ruleBasedQualification(
  place: PlaceResult,
  industry: string,
  hasWebsite: boolean,
): QualificationResult {
  const rating = place.rating ?? 0;
  const reviews = place.reviewCount ?? 0;

  // Max ~70 from Places alone (rating + reviews + website hint)
  const ratingPts = Math.min(28, rating * 5.2);
  const reviewPts = Math.min(28, Math.log10(reviews + 1) * 14);
  const websitePts = hasWebsite ? 12 : 0;
  const leadScore = Math.round(
    Math.min(70, Math.max(18, ratingPts + reviewPts + websitePts)),
  );

  const websiteScore = hasWebsite ? 55 : 25;
  const marketingScore = Math.min(95, 40 + reviews * 0.4 + rating * 7);
  const ppcScore = hasWebsite ? Math.min(90, 50 + (5 - rating) * 10) : 70;
  const seoScore = hasWebsite
    ? Math.min(85, 35 + reviews * 0.25)
    : Math.min(90, 60 + reviews * 0.15);

  return {
    serviceCategory: industry,
    revenueRangeEstimate: null,
    websiteQualityScore: websiteScore,
    marketingOpportunityScore: Math.round(marketingScore),
    ppcOpportunityScore: Math.round(ppcScore),
    seoOpportunityScore: Math.round(seoScore),
    outreachAngle: hasWebsite
      ? "Position paid traffic to complement their existing web presence and fill service-area gaps."
      : "Lead with a no-website angle — they are likely losing local search demand to competitors.",
    leadScore,
    qualityTier: tierFromScore(leadScore),
    source: "rules",
  };
}

/** Overlay live homepage audit onto qualification (replaces guessed SEO/site scores). */
export function applyLiveWebsiteAudit(
  base: QualificationResult,
  audit: WebsiteAudit | null | undefined,
  hasWebsite: boolean,
): QualificationResult {
  if (!hasWebsite) {
    const empty = emptyWebsiteAudit();
    return {
      ...base,
      websiteQualityScore: empty.websiteQualityScore,
      seoOpportunityScore: empty.seoOpportunityScore,
      marketingOpportunityScore: empty.marketingOpportunityScore,
      ppcOpportunityScore: empty.ppcOpportunityScore,
      outreachAngle: empty.outreachAngle,
    };
  }
  if (!audit?.reachable) {
    return {
      ...base,
      websiteQualityScore: 22,
      seoOpportunityScore: 86,
      marketingOpportunityScore: Math.max(base.marketingOpportunityScore, 78),
      ppcOpportunityScore: Math.max(base.ppcOpportunityScore, 72),
      outreachAngle:
        "Website URL is listed but the live page did not load — pitch a rebuild or hosting fix before ads.",
    };
  }
  return {
    ...base,
    websiteQualityScore: audit.websiteQualityScore,
    seoOpportunityScore: audit.seoOpportunityScore,
    marketingOpportunityScore: audit.marketingOpportunityScore,
    ppcOpportunityScore: audit.ppcOpportunityScore,
    outreachAngle: audit.outreachAngle || base.outreachAngle,
  };
}

export async function qualifyLead(
  place: PlaceResult,
  industry: string,
  hasWebsite: boolean,
  opts?: {
    preferRules?: boolean;
    timeoutMs?: number;
    /** Live homepage audit — drives website/SEO opportunity scores. */
    websiteAudit?: WebsiteAudit | null;
  },
): Promise<QualificationResult> {
  const withAudit = (result: QualificationResult) =>
    applyLiveWebsiteAudit(result, opts?.websiteAudit, hasWebsite);

  if (opts?.preferRules) {
    return withAudit(ruleBasedQualification(place, industry, hasWebsite));
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return withAudit(ruleBasedQualification(place, industry, hasWebsite));
  }

  const timeoutMs = opts?.timeoutMs ?? 8000;
  try {
    const openai = createOpenAI({ apiKey });
    const audit = opts?.websiteAudit;
    const liveBlock =
      hasWebsite && audit?.reachable
        ? `
LIVE WEBSITE AUDIT (use these — do not invent site quality):
- HTTPS: ${audit.https}
- Title: ${audit.title ?? "missing"}
- Meta description: ${audit.metaDescription ? "present" : "missing"}
- H1 count: ${audit.h1Count}
- Word count: ${audit.wordCount}
- Viewport: ${audit.hasViewport}
- Canonical: ${audit.hasCanonical}
- Open Graph: ${audit.hasOpenGraph}
- JSON-LD / LocalBusiness: ${audit.hasJsonLd} / ${audit.hasLocalBusinessSchema}
- Phone on page: ${audit.hasPhoneOnPage}
- Contact form: ${audit.hasContactForm}
- Blog/news hint: ${audit.hasBlogHint}
- Measured websiteQualityScore: ${audit.websiteQualityScore}
- Measured seoOpportunityScore: ${audit.seoOpportunityScore}
`
        : hasWebsite
          ? "LIVE WEBSITE AUDIT: URL listed but page did not load."
          : "LIVE WEBSITE AUDIT: no website listed.";

    const work = generateObject({
      model: openai("gpt-4o-mini"),
      schema: qualificationSchema,
      prompt: `You are qualifying a real home-service business for a US marketing agency selling lead-gen / paid ads.

Business name: ${place.name}
Industry / trade: ${industry}
Address: ${place.address ?? "unknown"}
Google rating: ${place.rating ?? "unknown"}
Google review count: ${place.reviewCount ?? 0}
Website URL: ${place.website ?? "none"}
Has website listed: ${hasWebsite}
${liveBlock}

Rules for revenueRangeEstimate (OPTIONAL — omit when uncertain):
- Only include when you can reasonably infer annual revenue for THIS trade + market size (reviews, rating, website).
- Prefer bands like: "Under $250K", "$250K–$500K", "$500K–$1M", "$1M–$3M", "$3M–$5M", "$5M–$10M", "$10M+".
- A solo plumber with <20 reviews is usually Under $250K or $250K–$500K — not $1M+.
- A multi-crew contractor with 200+ reviews in a metro can be $1M–$5M or higher.
- If data is thin, return null / omit the field — never invent a range from review count alone.
- Never invent exact dollar figures; ranges only. Be conservative.

Scores (0–100):
- websiteQualityScore / seoOpportunityScore / marketingOpportunityScore / ppcOpportunityScore:
  When a LIVE WEBSITE AUDIT is present, COPY the measured websiteQualityScore and seoOpportunityScore exactly.
  Only invent those when no live audit exists.
- leadScore: BASE outreach priority from Google signals ONLY (rating, reviews, website listed).
  Cap leadScore at 70 here. Do NOT give 90–100 — final score is computed later from
  LinkedIn + social + owner + email completeness. A strong 4.8★ / 200-review business with a site ≈ 60–70.
- qualityTier: provisional from your leadScore (hot 75+, warm 50–74, nurture <50).

outreachAngle: one concrete, specific sentence an SDR could use; prefer citing live audit gaps when present.
serviceCategory: normalize to the trade (e.g. "HVAC", "Roofing").`,
    });

    const raced = await Promise.race([
      work.then((r) => ({ ok: true as const, object: r.object })),
      new Promise<{ ok: false }>((resolve) =>
        setTimeout(() => resolve({ ok: false }), timeoutMs),
      ),
    ]);
    if (!raced.ok) {
      return withAudit(ruleBasedQualification(place, industry, hasWebsite));
    }
    const revenue = raced.object.revenueRangeEstimate?.trim() || null;
    // AI must not invent perfect scores before enrichment
    const cappedBase = Math.min(70, Math.round(raced.object.leadScore));
    return withAudit({
      ...raced.object,
      leadScore: cappedBase,
      qualityTier: tierFromScore(cappedBase),
      revenueRangeEstimate: revenue,
      source: "ai",
    });
  } catch (err) {
    console.error(
      "[qualifyLead] OpenAI failed — falling back to rules:",
      err instanceof Error ? err.message : err,
    );
    return withAudit(ruleBasedQualification(place, industry, hasWebsite));
  }
}

export { ruleBasedQualification };
