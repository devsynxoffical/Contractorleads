import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { PlaceResult } from "./google-places";

const qualificationSchema = z.object({
  serviceCategory: z.string(),
  revenueRangeEstimate: z.string(),
  websiteQualityScore: z.number().min(0).max(100),
  marketingOpportunityScore: z.number().min(0).max(100),
  ppcOpportunityScore: z.number().min(0).max(100),
  seoOpportunityScore: z.number().min(0).max(100),
  outreachAngle: z.string(),
  leadScore: z.number().min(1).max(100),
  qualityTier: z.enum(["hot", "warm", "nurture"]),
});

export type QualificationResult = z.infer<typeof qualificationSchema>;

function ruleBasedQualification(
  place: PlaceResult,
  industry: string,
  hasWebsite: boolean
): QualificationResult {
  const rating = place.rating ?? 0;
  const reviews = place.reviewCount ?? 0;
  const websiteScore = hasWebsite ? 55 : 25;
  const marketingScore = Math.min(95, 40 + reviews * 0.5 + rating * 8);
  const ppcScore = hasWebsite ? Math.min(90, 50 + (5 - rating) * 10) : 70;
  const seoScore = hasWebsite
    ? Math.min(85, 35 + reviews * 0.3)
    : Math.min(90, 60 + reviews * 0.2);
  const leadScore = Math.round(
    rating * 12 + Math.min(reviews, 50) * 0.6 + (hasWebsite ? 10 : 0)
  );

  let qualityTier: "hot" | "warm" | "nurture" = "nurture";
  if (leadScore >= 75) qualityTier = "hot";
  else if (leadScore >= 50) qualityTier = "warm";

  return {
    serviceCategory: industry,
    revenueRangeEstimate:
      reviews > 100 ? "$1M–$5M" : reviews > 30 ? "$500K–$1M" : "$250K–$500K",
    websiteQualityScore: websiteScore,
    marketingOpportunityScore: Math.round(marketingScore),
    ppcOpportunityScore: Math.round(ppcScore),
    seoOpportunityScore: Math.round(seoScore),
    outreachAngle: hasWebsite
      ? "Position paid traffic to complement their existing web presence and fill service-area gaps."
      : "Lead with a no-website angle — they are likely losing local search demand to competitors.",
    leadScore: Math.min(100, Math.max(1, leadScore)),
    qualityTier,
  };
}

export async function qualifyLead(
  place: PlaceResult,
  industry: string,
  hasWebsite: boolean
): Promise<QualificationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return ruleBasedQualification(place, industry, hasWebsite);
  }

  try {
    const openai = createOpenAI({ apiKey });
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: qualificationSchema,
      prompt: `Qualify this home-service business lead for a marketing agency outreach campaign.

Business: ${place.name}
Industry: ${industry}
Address: ${place.address}
Google Rating: ${place.rating ?? "unknown"}
Reviews: ${place.reviewCount ?? 0}
Website: ${place.website ?? "none"}
Has working website: ${hasWebsite}

Return realistic opportunity scores and a direct outreach angle. Score lead 1-100. Tier: hot (75+), warm (50-74), nurture (<50).`,
    });
    return object;
  } catch {
    return ruleBasedQualification(place, industry, hasWebsite);
  }
}
