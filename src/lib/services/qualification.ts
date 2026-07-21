import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { getOpenAIApiKey } from "@/lib/openai-config";
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

export type QualificationResult = z.infer<typeof qualificationSchema> & {
  source: "ai" | "rules";
};

function ruleBasedQualification(
  place: PlaceResult,
  industry: string,
  hasWebsite: boolean,
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
    rating * 12 + Math.min(reviews, 50) * 0.6 + (hasWebsite ? 10 : 0),
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

Rules for revenueRangeEstimate (REQUIRED — do NOT use generic review buckets alone):
- Infer a realistic annual revenue band for THIS trade + market size signals (reviews, rating, website).
- Prefer bands like: "Under $250K", "$250K–$500K", "$500K–$1M", "$1M–$3M", "$3M–$5M", "$5M–$10M", "$10M+".
- A solo plumber with <20 reviews is usually Under $250K or $250K–$500K — not $1M+.
- A multi-crew contractor with 200+ reviews in a metro can be $1M–$5M or higher.
- Never invent exact dollar figures; ranges only. Be conservative when data is thin.

Scores (0–100):
- websiteQualityScore: presence + likely sophistication from URL/name (no site ≈ 15–35).
- marketingOpportunityScore: how much they need agency help (weaker marketing online = higher).
- ppcOpportunityScore: paid ads upside for this trade/geo.
- seoOpportunityScore: organic / local SEO upside.
- leadScore 1–100 for agency outreach priority.
- qualityTier: hot (75+), warm (50–74), nurture (<50).

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
    return { ...raced.object, source: "ai" };
  } catch (err) {
    console.error(
      "[qualifyLead] OpenAI failed — falling back to rules:",
      err instanceof Error ? err.message : err,
    );
    return ruleBasedQualification(place, industry, hasWebsite);
  }
}

export { ruleBasedQualification };
