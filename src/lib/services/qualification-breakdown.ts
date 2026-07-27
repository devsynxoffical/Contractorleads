import type { WebsiteAudit } from "./website-audit";
import { emptyWebsiteAudit } from "./website-audit";

export type BreakdownSignal = {
  label: string;
  detail: string;
  status: "pass" | "warn" | "fail" | "info";
};

export type ScoreBreakdown = {
  score: number | null;
  headline: string;
  signals: BreakdownSignal[];
};

export type QualificationBreakdown = {
  source: "live_audit" | "rules";
  websiteUrl: string | null;
  websiteQuality: ScoreBreakdown;
  seoOpportunity: ScoreBreakdown;
  marketingOpportunity: ScoreBreakdown;
  ppcOpportunity: ScoreBreakdown;
};

type LeadScores = {
  website: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  websiteQualityScore: number | null;
  seoOpportunityScore: number | null;
  marketingOpportunityScore: number | null;
  ppcOpportunityScore: number | null;
};

function sig(
  label: string,
  detail: string,
  status: BreakdownSignal["status"],
): BreakdownSignal {
  return { label, detail, status };
}

function websiteQualityBreakdown(
  audit: WebsiteAudit,
  score: number | null,
): ScoreBreakdown {
  const signals: BreakdownSignal[] = [
    sig(
      "HTTPS",
      audit.https ? "Site loads over a secure connection." : "Site is HTTP-only — hurts trust and SEO.",
      audit.https ? "pass" : "fail",
    ),
    sig(
      "Title tag",
      audit.title && audit.title.length >= 8
        ? `"${audit.title.slice(0, 80)}${audit.title.length > 80 ? "…" : ""}"`
        : "Missing or too short — search engines lack a clear page topic.",
      audit.title && audit.title.length >= 8 ? "pass" : "fail",
    ),
    sig(
      "Meta description",
      audit.metaDescription && audit.metaDescription.length >= 50
        ? `Present (${audit.metaDescription.length} chars).`
        : "Missing or thin — weaker click-through from Google.",
      audit.metaDescription && audit.metaDescription.length >= 50 ? "pass" : "warn",
    ),
    sig(
      "Mobile viewport",
      audit.hasViewport ? "Viewport meta tag found." : "No viewport tag — poor mobile experience.",
      audit.hasViewport ? "pass" : "warn",
    ),
    sig(
      "Heading structure",
      audit.h1Count === 1
        ? "Single H1 — clear page hierarchy."
        : audit.h1Count === 0
          ? "No H1 found."
          : `${audit.h1Count} H1 tags — messy structure.`,
      audit.h1Count === 1 ? "pass" : audit.h1Count === 0 ? "fail" : "warn",
    ),
    sig(
      "Content depth",
      audit.wordCount >= 400
        ? `${audit.wordCount.toLocaleString()} words on the homepage.`
        : audit.wordCount >= 150
          ? `${audit.wordCount.toLocaleString()} words — moderate copy.`
          : `${audit.wordCount.toLocaleString()} words — thin content for local SEO.`,
      audit.wordCount >= 400 ? "pass" : audit.wordCount >= 150 ? "warn" : "fail",
    ),
    sig(
      "LocalBusiness schema",
      audit.hasLocalBusinessSchema
        ? "Structured data helps Google understand the business."
        : "No LocalBusiness JSON-LD detected.",
      audit.hasLocalBusinessSchema ? "pass" : "warn",
    ),
    sig(
      "Contact capture",
      audit.hasContactForm || audit.hasPhoneOnPage || audit.hasEmailOnPage
        ? [
            audit.hasContactForm && "quote/contact form",
            audit.hasPhoneOnPage && "phone visible",
            audit.hasEmailOnPage && "email visible",
          ]
            .filter(Boolean)
            .join(" · ") || "Contact paths found."
        : "Weak lead capture on the page.",
      audit.hasContactForm ? "pass" : audit.hasPhoneOnPage || audit.hasEmailOnPage ? "warn" : "fail",
    ),
    sig(
      "Image accessibility",
      audit.imageCount === 0
        ? "No images scanned."
        : audit.imagesMissingAlt === 0
          ? `All ${audit.imageCount} images have alt text.`
          : `${audit.imagesMissingAlt} of ${audit.imageCount} images missing alt text.`,
      audit.imageCount === 0
        ? "info"
        : audit.imagesMissingAlt / audit.imageCount < 0.25
          ? "pass"
          : "warn",
    ),
  ];

  return {
    score,
    headline: audit.reachable
      ? "Scored from a live crawl of the homepage HTML."
      : "Website URL listed but the live page did not load.",
    signals,
  };
}

function seoOpportunityBreakdown(
  audit: WebsiteAudit,
  score: number | null,
): ScoreBreakdown {
  const gaps: string[] = [];
  if (!audit.https) gaps.push("no HTTPS");
  if (!audit.title || audit.title.length < 8) gaps.push("weak title");
  if (!audit.metaDescription || audit.metaDescription.length < 50) gaps.push("missing meta description");
  if (!audit.hasCanonical) gaps.push("no canonical URL");
  if (!audit.hasLocalBusinessSchema) gaps.push("no LocalBusiness schema");
  if (audit.h1Count !== 1) gaps.push("H1 issues");
  if (audit.wordCount < 200) gaps.push("thin homepage copy");
  if (audit.imageCount > 0 && audit.imagesMissingAlt / audit.imageCount > 0.5) {
    gaps.push("many images missing alt text");
  }
  if (!audit.hasBlogHint) gaps.push("no blog/resources section detected");

  const signals: BreakdownSignal[] = [
    sig(
      "How this score works",
      "Higher = more SEO gaps an agency can sell against. Stronger sites score lower here.",
      "info",
    ),
    ...gaps.map((g) => sig("Gap detected", g, "warn")),
    ...(gaps.length === 0
      ? [sig("Site hygiene", "Core SEO basics look solid — pitch incremental local SEO wins.", "pass")]
      : []),
    sig(
      "Quality offset",
      `Site quality (${audit.websiteQualityScore}/100) reduces raw SEO upside.`,
      "info",
    ),
  ];

  return {
    score,
    headline:
      gaps.length > 0
        ? `${gaps.length} homepage SEO gap${gaps.length === 1 ? "" : "s"} detected on the live audit.`
        : "Few technical SEO gaps — opportunity is mostly content and local pack growth.",
    signals,
  };
}

function marketingBreakdown(
  audit: WebsiteAudit,
  score: number | null,
): ScoreBreakdown {
  const signals: BreakdownSignal[] = [
    sig(
      "Open Graph tags",
      audit.hasOpenGraph
        ? "Social share previews are configured."
        : "Missing — links shared on social look generic.",
      audit.hasOpenGraph ? "pass" : "warn",
    ),
    sig(
      "Content marketing",
      audit.hasBlogHint
        ? "Blog/news/resources section detected."
        : "No blog or resources hub found.",
      audit.hasBlogHint ? "pass" : "warn",
    ),
    sig(
      "Conversion path",
      audit.hasContactForm
        ? "Contact or quote form present."
        : "No clear form — harder to turn traffic into leads.",
      audit.hasContactForm ? "pass" : "fail",
    ),
    sig(
      "Phone visibility",
      audit.hasPhoneOnPage ? "Phone number on the page." : "Phone not found in page HTML.",
      audit.hasPhoneOnPage ? "pass" : "warn",
    ),
    sig(
      "Site quality factor",
      `Weaker sites (${audit.websiteQualityScore}/100) increase marketing upside.`,
      "info",
    ),
  ];

  return {
    score,
    headline: "Measures how much room exists to improve funnels, social, and conversion copy.",
    signals,
  };
}

function ppcBreakdown(audit: WebsiteAudit, score: number | null): ScoreBreakdown {
  const signals: BreakdownSignal[] = [
    sig(
      "Landing surface",
      audit.reachable
        ? audit.websiteQualityScore >= 70
          ? "Homepage is strong enough to send paid traffic."
          : "Homepage needs work before scaling ad spend."
        : "No reliable landing page — ads would waste budget.",
      audit.reachable && audit.websiteQualityScore >= 70 ? "pass" : "warn",
    ),
    sig(
      "Lead capture",
      audit.hasContactForm
        ? "Form on page — paid clicks can convert."
        : "No form — paid traffic may bounce without a CTA.",
      audit.hasContactForm ? "pass" : "fail",
    ),
    sig(
      "HTTPS",
      audit.https ? "Secure landing URL for ad platforms." : "HTTP hurts trust and ad quality score.",
      audit.https ? "pass" : "warn",
    ),
    sig(
      "Bundle angle",
      audit.websiteQualityScore < 40
        ? "Low site quality — pitch rebuild + Google Ads together."
        : "Site is usable — pitch ads to capture demand the site already supports.",
      "info",
    ),
  ];

  return {
    score,
    headline: "Estimates how ready the business is for paid traffic and landing-page offers.",
    signals,
  };
}

function rulesBreakdown(lead: LeadScores): QualificationBreakdown {
  const rating = lead.googleRating ?? 0;
  const reviews = lead.reviewCount ?? 0;
  const hasWebsite = Boolean(lead.website?.trim());

  const baseSignals: BreakdownSignal[] = [
    sig(
      "Data source",
      "No live homepage crawl available — scores use Google Places signals only.",
      "info",
    ),
    sig(
      "Google rating",
      rating > 0 ? `${rating.toFixed(1)}★ average rating.` : "No rating on file.",
      rating >= 4 ? "pass" : rating > 0 ? "warn" : "info",
    ),
    sig(
      "Review volume",
      reviews > 0 ? `${reviews.toLocaleString()} Google reviews.` : "No reviews on file.",
      reviews >= 50 ? "pass" : reviews > 0 ? "warn" : "info",
    ),
    sig(
      "Website listed",
      hasWebsite ? `URL on file: ${lead.website}` : "No website URL from Google Places.",
      hasWebsite ? "pass" : "fail",
    ),
  ];

  return {
    source: "rules",
    websiteUrl: lead.website,
    websiteQuality: {
      score: lead.websiteQualityScore,
      headline: hasWebsite
        ? "Estimated from whether a website URL exists — run Fetch social or re-scrape for a live audit."
        : "No website — score reflects missing web presence.",
      signals: baseSignals,
    },
    seoOpportunity: {
      score: lead.seoOpportunityScore,
      headline: hasWebsite
        ? "Estimated from review count and web presence — not a live SEO crawl."
        : "High upside when no website is listed.",
      signals: [
        ...baseSignals,
        sig(
          "Rule of thumb",
          hasWebsite
            ? "More reviews usually mean more competition — SEO upside is modeled, not measured."
            : "No site = large local search gap.",
          "info",
        ),
      ],
    },
    marketingOpportunity: {
      score: lead.marketingOpportunityScore,
      headline: "Derived from Google rating and review volume as a proxy for marketing maturity.",
      signals: [
        sig(
          "Formula basis",
          `Higher reviews + rating → lower raw marketing gap; capped using listing signals.`,
          "info",
        ),
        ...baseSignals.slice(1),
      ],
    },
    ppcOpportunity: {
      score: lead.ppcOpportunityScore,
      headline: hasWebsite
        ? "Assumes a basic landing page exists — live form/HTTPS checks were not run."
        : "No website — strong pitch for site + ads bundle.",
      signals: baseSignals,
    },
  };
}

export function buildQualificationBreakdown(
  lead: LeadScores,
  audit: WebsiteAudit | null,
): QualificationBreakdown {
  const hasWebsite = Boolean(lead.website?.trim());
  if (!hasWebsite) {
    const empty = emptyWebsiteAudit();
    return {
      source: "rules",
      websiteUrl: null,
      websiteQuality: {
        score: lead.websiteQualityScore,
        headline: "No website on file — score reflects missing web presence.",
        signals: [
          sig("Website", "Google Places did not list a website URL.", "fail"),
          sig(
            "Outreach angle",
            "Pitch a conversion-ready site plus Google Business Profile optimization.",
            "info",
          ),
        ],
      },
      seoOpportunity: seoOpportunityBreakdown(empty, lead.seoOpportunityScore),
      marketingOpportunity: marketingBreakdown(empty, lead.marketingOpportunityScore),
      ppcOpportunity: ppcBreakdown(empty, lead.ppcOpportunityScore),
    };
  }

  if (!audit?.reachable) {
    return {
      source: "rules",
      websiteUrl: lead.website,
      websiteQuality: {
        score: lead.websiteQualityScore ?? 22,
        headline: "Website URL is listed but the live homepage did not load during audit.",
        signals: [
          sig("Live crawl", "Could not fetch HTML — hosting, DNS, or bot blocking may be the cause.", "fail"),
          sig("Stored URL", lead.website ?? "", "info"),
          ...rulesBreakdown(lead).websiteQuality.signals.slice(1),
        ],
      },
      seoOpportunity: {
        score: lead.seoOpportunityScore,
        headline: "Unreachable site — high SEO/rebuild opportunity assumed.",
        signals: [
          sig("Live crawl", "Page unreachable — technical fix or rebuild is the primary pitch.", "fail"),
        ],
      },
      marketingOpportunity: {
        score: lead.marketingOpportunityScore,
        headline: "Unreachable site — marketing funnel work starts with getting the site live.",
        signals: [sig("Live crawl", "No marketing funnel to measure until the site loads.", "fail")],
      },
      ppcOpportunity: {
        score: lead.ppcOpportunityScore,
        headline: "Do not send paid traffic until a landing page loads reliably.",
        signals: [sig("Live crawl", "Fix hosting before running ads.", "fail")],
      },
    };
  }

  return {
    source: "live_audit",
    websiteUrl: lead.website,
    websiteQuality: websiteQualityBreakdown(audit, lead.websiteQualityScore),
    seoOpportunity: seoOpportunityBreakdown(audit, lead.seoOpportunityScore),
    marketingOpportunity: marketingBreakdown(audit, lead.marketingOpportunityScore),
    ppcOpportunity: ppcBreakdown(audit, lead.ppcOpportunityScore),
  };
}
