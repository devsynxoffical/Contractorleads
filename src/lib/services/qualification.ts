import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { getOpenAIApiKey } from "@/lib/openai-config";
import type { PlaceResult } from "./google-places";

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

export async function qualifyLead(
  place: PlaceResult,
  industry: string,
  hasWebsite: boolean,
  opts?: { preferRules?: boolean; timeoutMs?: number },
): Promise<QualificationResult> {
  if (opts?.preferRules) {
    return ruleBasedQualification(place, industry, hasWebsite);
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return ruleBasedQualification(place, industry, hasWebsite);
  }

  const timeoutMs = opts?.timeoutMs ?? 8000;
  try {
    const openai = createOpenAI({ apiKey });
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

Rules for revenueRangeEstimate (OPTIONAL — omit when uncertain):
- Only include when you can reasonably infer annual revenue for THIS trade + market size (reviews, rating, website).
- Prefer bands like: "Under $250K", "$250K–$500K", "$500K–$1M", "$1M–$3M", "$3M–$5M", "$5M–$10M", "$10M+".
- A solo plumber with <20 reviews is usually Under $250K or $250K–$500K — not $1M+.
- A multi-crew contractor with 200+ reviews in a metro can be $1M–$5M or higher.
- If data is thin, return null / omit the field — never invent a range from review count alone.
- Never invent exact dollar figures; ranges only. Be conservative.

Scores (0–100):
- websiteQualityScore: presence + likely sophistication from URL/name (no site ≈ 15–35).
- marketingOpportunityScore: how much they need agency help (weaker marketing online = higher).
- ppcOpportunityScore: paid ads upside for this trade/geo.
- seoOpportunityScore: organic / local SEO upside.
- leadScore: BASE outreach priority from Google signals ONLY (rating, reviews, website listed).
  Cap leadScore at 70 here. Do NOT give 90–100 — final score is computed later from
  LinkedIn + social + owner + email completeness. A strong 4.8★ / 200-review business with a site ≈ 60–70.
- qualityTier: provisional from your leadScore (hot 75+, warm 50–74, nurture <50).

outreachAngle: one concrete, specific sentence an SDR could use (no fluff).
serviceCategory: normalize to the trade (e.g. "HVAC", "Roofing").`,
    });

    const raced = await Promise.race([
      work.then((r) => ({ ok: true as const, object: r.object })),
      new Promise<{ ok: false }>((resolve) =>
        setTimeout(() => resolve({ ok: false }), timeoutMs),
      ),
    ]);
    if (!raced.ok) return ruleBasedQualification(place, industry, hasWebsite);
    const revenue = raced.object.revenueRangeEstimate?.trim() || null;
    // AI must not invent perfect scores before enrichment
    const cappedBase = Math.min(70, Math.round(raced.object.leadScore));
    return {
      ...raced.object,
      leadScore: cappedBase,
      qualityTier: tierFromScore(cappedBase),
      revenueRangeEstimate: revenue,
      source: "ai",
    };
  } catch (err) {
    console.error(
      "[qualifyLead] OpenAI failed — falling back to rules:",
      err instanceof Error ? err.message : err,
    );
    return ruleBasedQualification(place, industry, hasWebsite);
  }
}

export { ruleBasedQualification };
