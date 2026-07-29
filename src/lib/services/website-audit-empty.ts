export type WebsiteAudit = {
  reachable: boolean;
  https: boolean;
  title: string | null;
  metaDescription: string | null;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasJsonLd: boolean;
  hasLocalBusinessSchema: boolean;
  h1Count: number;
  wordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasPhoneOnPage: boolean;
  hasEmailOnPage: boolean;
  hasContactForm: boolean;
  hasBlogHint: boolean;
  htmlBytes: number;
  /** Thin HTML that looks like a JS shell (SPA) — scores are less reliable. */
  likelySpaShell: boolean;
  /** How strong the live site is (0–100). */
  websiteQualityScore: number;
  /** Agency upside: weaker SEO hygiene → higher opportunity. */
  seoOpportunityScore: number;
  marketingOpportunityScore: number;
  ppcOpportunityScore: number;
  outreachAngle: string;
};

const EMPTY_AUDIT: WebsiteAudit = {
  reachable: false,
  https: false,
  title: null,
  metaDescription: null,
  hasViewport: false,
  hasCanonical: false,
  hasOpenGraph: false,
  hasJsonLd: false,
  hasLocalBusinessSchema: false,
  h1Count: 0,
  wordCount: 0,
  imageCount: 0,
  imagesMissingAlt: 0,
  hasPhoneOnPage: false,
  hasEmailOnPage: false,
  hasContactForm: false,
  hasBlogHint: false,
  htmlBytes: 0,
  likelySpaShell: false,
  websiteQualityScore: 18,
  seoOpportunityScore: 88,
  marketingOpportunityScore: 82,
  ppcOpportunityScore: 78,
  outreachAngle:
    "No live website found — pitch a conversion-ready local site plus Google Business Profile and call tracking.",
};

/** Honest mid-band scores when a URL exists but we have not measured the page yet. */
export function pendingWebsiteAudit(): WebsiteAudit {
  return {
    ...EMPTY_AUDIT,
    reachable: false,
    websiteQualityScore: 50,
    seoOpportunityScore: 55,
    marketingOpportunityScore: 55,
    ppcOpportunityScore: 55,
    outreachAngle:
      "Website is listed but not measured yet — refresh the site audit before pitching SEO or ads.",
  };
}

export function emptyWebsiteAudit(): WebsiteAudit {
  return { ...EMPTY_AUDIT };
}

