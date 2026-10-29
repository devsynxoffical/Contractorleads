import type { Metadata } from "next";
import { SITE_URL } from "@/lib/email-brand";
import { INDUSTRIES, US_STATES } from "@/lib/constants";

/**
 * Canonical marketing origin for metadata, sitemap, robots, and JSON-LD.
 * Always www — never Railway preview or apex — so Google indexes one host.
 */
export function seoBaseUrl() {
  return SITE_URL.replace(/\/$/, "");
}

/** Last date the core marketing pages changed. Bump when you edit copy; sitemaps use it for lastmod. */
export const CONTENT_LAST_UPDATED = "2026-10-29";

export const SEO = {
  siteName: "Contractor Leads",
  defaultTitle: "Contractor Leads: AI-Scored Leads for Agencies",
  titleTemplate: "%s | Contractor Leads",
  defaultDescription:
    "Contractor leads for agencies: live Google data, AI scores, owner names and outreach in one tool. Start with 10 free leads, no card needed.",
  keywords: [
    "contractorleads.us",
    "www.contractorleads.us",
    "Contractor Leads",
    "contractor leads",
    "verified contractor leads",
    "AI lead scoring",
    "home service lead generation",
    "agency lead finder",
    "contractor prospecting software",
    "cold outreach for contractors",
    "contractor CRM for agencies",
    "roofing contractor leads",
    "HVAC contractor leads",
    "plumbing contractor leads",
    "google maps scraper",
    "apollo alternative",
    "local service ads",
    "agency lead generation",
  ],
  twitterHandle: "@contractorleads",
  locale: "en_US",
  ogImagePath: "/opengraph-image",
  social: {
    linkedin:
      process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN?.trim() ||
      "https://www.linkedin.com/company/contractorleads",
    youtube:
      process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() ||
      "https://www.youtube.com/@contractorleads",
    facebook:
      process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim() ||
      "https://www.facebook.com/contractorleads",
  },
} as const;

/** Profiles included in JSON-LD sameAs (non-empty only). */
export function seoSameAs(): string[] {
  return [
    SEO.social.linkedin,
    SEO.social.youtube,
    SEO.social.facebook,
  ].filter(Boolean);
}

export const MARKETING_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Is Contractor Leads free to try?",
    a: "Yes. Every new account gets 10 free leads on Starter with no credit card. You pay only when you subscribe, from $19.99 a month for 500 credits.",
  },
  {
    q: "Is Contractor Leads for agencies or for contractors?",
    a: "It is built for marketing agencies, media buyers and sales teams that sell services to home-service contractors. It is not a site for homeowners looking to hire a roofer or plumber.",
  },
  {
    q: "Are the leads real?",
    a: "Yes. Every business comes from live Google Places data at the moment you search, cross-checked with Yelp and the business's own website. If a field cannot be verified it is left blank.",
  },
  {
    q: "How do credits work?",
    a: "One credit equals one lead. Starter includes 500 credits a month, Growth 2,000 and Agency 5,000, and the AI assistant and outreach generation use credits as listed on the pricing page.",
  },
  {
    q: "Can I send leads to GoHighLevel or HubSpot?",
    a: "Yes. Saved leads and status changes push to GoHighLevel, Zapier, Make, HubSpot, Slack or any webhook on the Growth plan and above, and you can export to CSV or Excel on every plan.",
  },
];

export type TradeSeo = {
  slug: string;
  name: string;
  headline: string;
  description: string;
  angle: string;
  keywords: string[];
};

function slugifyIndustry(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const TRADE_COPY: Record<
  string,
  Pick<TradeSeo, "headline" | "description" | "angle">
> = {
  roofing: {
    headline: "Roofing contractor leads for agencies",
    description:
      "Find verified roofing contractors ready for marketing outreach — owners, phones, ratings, and AI-scored opportunity angles.",
    angle:
      "Storm markets, aging roofs, and competitive local SEOs make roofing one of the highest-intent trades for agencies.",
  },
  hvac: {
    headline: "HVAC contractor leads for agencies",
    description:
      "Prospect install and service HVAC companies with live contact data, Meta ad intel, and outreach-ready scores.",
    angle:
      "Seasonal demand swings and membership plans create recurring budget conversations with HVAC owners.",
  },
  plumbing: {
    headline: "Plumbing contractor leads for agencies",
    description:
      "Build lists of verified plumbers — emergency and remodel — with decision-maker contacts and reputation signals.",
    angle:
      "Emergency search volume and remodel upsells make plumbing a strong outbound + PPC hybrid vertical.",
  },
  electrical: {
    headline: "Electrical contractor leads for agencies",
    description:
      "Reach licensed electrical contractors with verified phones, websites, and marketing opportunity scores.",
    angle:
      "EV chargers, panel upgrades, and commercial work open clear digital marketing hooks.",
  },
  solar: {
    headline: "Solar contractor leads for agencies",
    description:
      "Find solar installers and EPCs with live Google data, owner enrichment, and ad-intelligence context.",
    angle:
      "High ticket sizes and aggressive competitor ads make solar ideal for agencies with Meta + search chops.",
  },
  landscaping: {
    headline: "Landscaping contractor leads for agencies",
    description:
      "Prospect landscaping and lawn-care businesses with verified local data and outreach scripts.",
    angle:
      "Recurring seasonal contracts and design-build projects give agencies clear packaging angles.",
  },
  remodeling: {
    headline: "Remodeling contractor leads for agencies",
    description:
      "Target kitchen, bath, and whole-home remodelers with owner contacts and opportunity scoring.",
    angle:
      "Long sales cycles reward agencies that bring creative, content, and lead-gen systems.",
  },
  painting: {
    headline: "Painting contractor leads for agencies",
    description:
      "Build verified lists of residential and commercial painting companies for agency outreach.",
    angle:
      "High local competition rewards agencies that can own Google Maps and review velocity.",
  },
  "cleaning-services": {
    headline: "Cleaning services contractor leads",
    description:
      "Find commercial and residential cleaning companies with phones, websites, and AI fit scores.",
    angle:
      "Recurring revenue models make cleaning operators receptive to predictable lead systems.",
  },
  "pest-control": {
    headline: "Pest control contractor leads for agencies",
    description:
      "Prospect pest control operators with verified contact data and marketing opportunity scores.",
    angle:
      "Route density and seasonal spikes create strong PPC and LSA conversations.",
  },
  "pool-services": {
    headline: "Pool services contractor leads for agencies",
    description:
      "Reach pool builders and service companies with live enrichment and outreach studio scripts.",
    angle:
      "High LTV customers and regional seasonality make pool trades agency-friendly.",
  },
  "general-contractors": {
    headline: "General contractor leads for agencies",
    description:
      "Find general contractors with verified owners, phones, and multi-channel opportunity scores.",
    angle:
      "GCs often buy multiple services — SEO, ads, CRM — once trust is established.",
  },
};

export const TRADE_PAGES: TradeSeo[] = INDUSTRIES.map((name) => {
  const slug = slugifyIndustry(name);
  const copy = TRADE_COPY[slug] ?? {
    headline: `${name} contractor leads for agencies`,
    description: `Find verified ${name.toLowerCase()} contractors with AI scoring, owner contacts, and outreach-ready data.`,
    angle: `${name} businesses are actively hiring agencies for local demand generation.`,
  };
  return {
    slug,
    name,
    ...copy,
    keywords: [
      `${name.toLowerCase()} contractor leads`,
      `${name.toLowerCase()} leads for agencies`,
      `verified ${name.toLowerCase()} contractors`,
      "contractor prospecting software",
    ],
  };
});

export function getTradeBySlug(slug: string) {
  return TRADE_PAGES.find((t) => t.slug === slug) ?? null;
}

/**
 * 7 priority trades that receive unique state data blocks and indexation:
 * roofing, hvac, plumbing, electrical, solar, general-contractors, remodeling.
 * The other 11 trades are marked noindex, follow.
 */
export const PRIORITY_TRADE_SLUGS = [
  "roofing",
  "hvac",
  "plumbing",
  "electrical",
  "solar",
  "general-contractors",
  "remodeling",
] as const;

export function isPriorityTrade(slug: string): boolean {
  return (PRIORITY_TRADE_SLUGS as readonly string[]).includes(slug);
}

export type BuildMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
  /** Use "article" for blog posts and guides so Open Graph carries publish dates. */
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const base = seoBaseUrl();
  const path = input.path || "/";
  const url = path === "/" ? base : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = input.ogImage
    ? input.ogImage.startsWith("http")
      ? input.ogImage
      : `${base}${input.ogImage}`
    : `${base}${SEO.ogImagePath}`;

  return {
    title: {
      absolute: input.title,
    },
    description: input.description,
    keywords: input.keywords ?? [...SEO.keywords],
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph:
      input.type === "article"
        ? {
            type: "article",
            locale: SEO.locale,
            url,
            siteName: SEO.siteName,
            title: input.title,
            description: input.description,
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime ?? input.publishedTime,
            authors: input.authors,
            images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
          }
        : {
            type: "website",
            locale: SEO.locale,
            url,
            siteName: SEO.siteName,
            title: input.title,
            description: input.description,
            images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
          },
    twitter: {
      card: "summary_large_image",
      site: SEO.twitterHandle,
      creator: SEO.twitterHandle,
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
  };
}

export function absoluteUrl(path = "/") {
  const base = seoBaseUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export type SeoRegion = {
  slug: string;
  name: string;
  code: string;
  kind: "state";
};

function regionSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** All US states as SEO region landers (e.g. /industries/roofing/texas). */
export const SEO_REGIONS: SeoRegion[] = US_STATES.map((s) => ({
  slug: regionSlug(s.name),
  name: s.name,
  code: s.code,
  kind: "state" as const,
}));

export function getRegionBySlug(slug: string) {
  return SEO_REGIONS.find((r) => r.slug === slug) ?? null;
}

/** Public blog helpers — Academy articles published on the marketing site. */
export {
  ACADEMY_ARTICLES as BLOG_ARTICLES,
  ACADEMY_CATEGORIES as BLOG_CATEGORIES,
  getAcademyArticle as getBlogArticle,
  categoryLabel as blogCategoryLabel,
} from "@/lib/academy-content";

