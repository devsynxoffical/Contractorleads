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
  source: "live_audit" | "unreachable" | "no_website" | "estimate";
  websiteUrl: string | null;
  /** Measured scores from this crawl (prefer these over stale DB values). */
  measuredScores: {
    websiteQualityScore: number;
    seoOpportunityScore: number;
    marketingOpportunityScore: number;
    ppcOpportunityScore: number;
    outreachAngle: string;
  } | null;
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
      audit.https
        ? "Site loads over a secure connection."
        : "Site is HTTP-only — hurts trust and SEO.",
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
      audit.metaDescription && audit.metaDescription.length >= 50
        ? "pass"
        : "warn",
    ),
    sig(
      "Mobile viewport",
      audit.hasViewport
        ? "Viewport meta tag found."
        : "No viewport tag — poor mobile experience.",
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
      audit.likelySpaShell
        ? `${audit.wordCount.toLocaleString()} crawlable words — page looks like a JS shell.`
        : audit.wordCount >= 400
          ? `${audit.wordCount.toLocaleString()} words on the homepage.`
          : audit.wordCount >= 150
            ? `${audit.wordCount.toLocaleString()} words — moderate copy.`
            : `${audit.wordCount.toLocaleString()} words — thin content for local SEO.`,
      audit.likelySpaShell
        ? "warn"
        : audit.wordCount >= 400
          ? "pass"
          : audit.wordCount >= 150
            ? "warn"
            : "fail",
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
            audit.hasContactForm && "quote/contact form or booking CTA",
            audit.hasPhoneOnPage && "phone visible",
            audit.hasEmailOnPage && "email visible",
          ]
            .filter(Boolean)
            .join(" · ") || "Contact paths found."
        : "Weak lead capture on the page.",
      audit.hasContactForm
        ? "pass"
        : audit.hasPhoneOnPage || audit.hasEmailOnPage
          ? "warn"
          : "fail",
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
      ? "Scored from a live crawl of the homepage HTML (title, meta, schema, content, forms)."
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
  if (!audit.metaDescription || audit.metaDescription.length < 50) {
    gaps.push("missing meta description");
  }
  if (!audit.hasCanonical) gaps.push("no canonical URL");
  if (!audit.hasLocalBusinessSchema) gaps.push("no LocalBusiness schema");
  if (audit.h1Count !== 1) gaps.push("H1 issues");
  if (audit.wordCount < 200) gaps.push("thin homepage copy");
  if (
    audit.imageCount > 0 &&
    audit.imagesMissingAlt / audit.imageCount > 0.5
  ) {
    gaps.push("many images missing alt text");
  }
  if (!audit.hasBlogHint) gaps.push("no blog/resources section detected");
  if (audit.likelySpaShell) gaps.push("little crawlable copy (SPA shell)");

  const signals: BreakdownSignal[] = [
    sig(
      "How this score works",
      "Higher = more SEO gaps an agency can sell. Stronger measured sites score lower here.",
      "info",
    ),
    ...gaps.map((g) => sig("Gap detected", g, "warn")),
    ...(gaps.length === 0
      ? [
          sig(
            "Site hygiene",
            "Core SEO basics look solid — pitch incremental local SEO wins.",
            "pass",
          ),
        ]
      : []),
    sig(
      "Quality offset",
      `Measured site quality (${audit.websiteQualityScore}/100) reduces raw SEO upside.`,
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
        ? "Blog/news/resources/projects section detected."
        : "No blog or resources hub found.",
      audit.hasBlogHint ? "pass" : "warn",
    ),
    sig(
      "Conversion path",
      audit.hasContactForm
        ? "Contact, quote, or booking capture present."
        : "No clear form/CTA — harder to turn traffic into leads.",
      audit.hasContactForm ? "pass" : "fail",
    ),
    sig(
      "Phone visibility",
      audit.hasPhoneOnPage
        ? "Phone number on the page."
        : "Phone not found in page HTML.",
      audit.hasPhoneOnPage ? "pass" : "warn",
    ),
    sig(
      "Site quality factor",
      `Weaker measured sites (${audit.websiteQualityScore}/100) increase marketing upside.`,
      "info",
    ),
  ];

  return {
    score,
    headline:
      "Measured from homepage funnel gaps (forms, social tags, content) — not Google review count.",
    signals,
  };
}

function ppcBreakdown(
  audit: WebsiteAudit,
  score: number | null,
): ScoreBreakdown {
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
        ? "Form/booking CTA on page — paid clicks can convert."
        : "No form — paid traffic may bounce without a CTA.",
      audit.hasContactForm ? "pass" : "fail",
    ),
    sig(
      "HTTPS",
      audit.https
        ? "Secure landing URL for ad platforms."
        : "HTTP hurts trust and ad quality score.",
      audit.https ? "pass" : "warn",
    ),
    sig(
      "Bundle angle",
      audit.websiteQualityScore < 45
        ? "Low site quality — pitch rebuild + Google Ads together."
        : "Site is usable — pitch ads to capture demand the site already supports.",
      "info",
    ),
  ];

  return {
    score,
    headline:
      "Estimates paid-traffic readiness from HTTPS, forms, and measured site quality.",
    signals,
  };
}

function measuredFromAudit(audit: WebsiteAudit) {
  return {
    websiteQualityScore: audit.websiteQualityScore,
    seoOpportunityScore: audit.seoOpportunityScore,
    marketingOpportunityScore: audit.marketingOpportunityScore,
    ppcOpportunityScore: audit.ppcOpportunityScore,
    outreachAngle: audit.outreachAngle,
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
      source: "no_website",
      websiteUrl: null,
      measuredScores: measuredFromAudit(empty),
      websiteQuality: {
        score: empty.websiteQualityScore,
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
      seoOpportunity: seoOpportunityBreakdown(empty, empty.seoOpportunityScore),
      marketingOpportunity: marketingBreakdown(
        empty,
        empty.marketingOpportunityScore,
      ),
      ppcOpportunity: ppcBreakdown(empty, empty.ppcOpportunityScore),
    };
  }

  if (!audit?.reachable) {
    const empty = emptyWebsiteAudit();
    return {
      source: "unreachable",
      websiteUrl: lead.website,
      measuredScores: {
        websiteQualityScore: empty.websiteQualityScore,
        seoOpportunityScore: empty.seoOpportunityScore,
        marketingOpportunityScore: empty.marketingOpportunityScore,
        ppcOpportunityScore: empty.ppcOpportunityScore,
        outreachAngle:
          "Website URL is listed but the live page did not load — pitch hosting fix or rebuild before ads.",
      },
      websiteQuality: {
        score: empty.websiteQualityScore,
        headline:
          "Website URL is listed but the live homepage did not load during audit.",
        signals: [
          sig(
            "Live crawl",
            "Could not fetch HTML — hosting, DNS, SSL, or bot blocking may be the cause.",
            "fail",
          ),
          sig("Stored URL", lead.website ?? "", "info"),
          sig(
            "Google listing",
            `${lead.googleRating ?? "n/a"}★ · ${lead.reviewCount ?? 0} reviews (listing only — not used for site scores).`,
            "info",
          ),
        ],
      },
      seoOpportunity: {
        score: empty.seoOpportunityScore,
        headline: "Unreachable site — high SEO/rebuild opportunity.",
        signals: [
          sig(
            "Live crawl",
            "Page unreachable — technical fix or rebuild is the primary pitch.",
            "fail",
          ),
        ],
      },
      marketingOpportunity: {
        score: empty.marketingOpportunityScore,
        headline:
          "Unreachable site — marketing funnel work starts with getting the site live.",
        signals: [
          sig(
            "Live crawl",
            "No marketing funnel to measure until the site loads.",
            "fail",
          ),
        ],
      },
      ppcOpportunity: {
        score: empty.ppcOpportunityScore,
        headline: "Do not send paid traffic until a landing page loads reliably.",
        signals: [sig("Live crawl", "Fix hosting before running ads.", "fail")],
      },
    };
  }

  const measured = measuredFromAudit(audit);
  return {
    source: "live_audit",
    websiteUrl: lead.website,
    measuredScores: measured,
    websiteQuality: websiteQualityBreakdown(
      audit,
      measured.websiteQualityScore,
    ),
    seoOpportunity: seoOpportunityBreakdown(
      audit,
      measured.seoOpportunityScore,
    ),
    marketingOpportunity: marketingBreakdown(
      audit,
      measured.marketingOpportunityScore,
    ),
    ppcOpportunity: ppcBreakdown(audit, measured.ppcOpportunityScore),
  };
}
