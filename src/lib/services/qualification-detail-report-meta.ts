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
      "Live crawl of speed, hero, content, contact page, and other key pages.",
    scriptType: "qualification_detail:websiteQuality",
  },
  seoOpportunity: {
    label: "SEO opportunity",
    shortLabel: "SEO",
    description:
      "Technical and on-page SEO gaps from the live crawl (readiness, not keyword rank export).",
    scriptType: "qualification_detail:seoOpportunity",
  },
  marketingOpportunity: {
    label: "Marketing opportunity",
    shortLabel: "Marketing",
    description:
      "Instagram / social presence, content proof, and demand-gen gaps.",
    scriptType: "qualification_detail:marketingOpportunity",
  },
  ppcOpportunity: {
    label: "PPC opportunity",
    shortLabel: "Ads / PPC",
    description:
      "Google Ads readiness — landing page, forms, HTTPS, speed, rebuild vs scale.",
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
