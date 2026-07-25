import type { Metadata } from "next";
import { SITE_URL, appBaseUrl } from "@/lib/email-brand";
import { INDUSTRIES } from "@/lib/constants";

/** Canonical marketing origin for metadata, sitemap, and JSON-LD. */
export function seoBaseUrl() {
  const base = appBaseUrl().replace(/\/$/, "");
  if (base.includes("localhost") || base.includes("127.0.0.1")) {
    return SITE_URL;
  }
  return base;
}

export const SEO = {
  siteName: "Contractor Leads",
  defaultTitle: "Contractor Leads | Verified contractor leads for agencies",
  titleTemplate: "%s | Contractor Leads",
  defaultDescription:
    "Find verified, AI-scored contractor leads in seconds. Built for agencies selling to home-service businesses — real contact data, no fake lists.",
  keywords: [
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
  ],
  twitterHandle: "@contractorleads",
  locale: "en_US",
  ogImagePath: "/opengraph-image",
} as const;

export const MARKETING_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Is this for agencies or contractors?",
    a: "Contractor Leads is built for marketing agencies, media buyers, and sales teams that sell services to home-service contractors — not for homeowners trying to find a plumber or roofer.",
  },
  {
    q: "Are the leads real?",
    a: "Yes. Every business comes from live Google Places data, cross-checked against Yelp, Houzz, and the business's own website — never generated or guessed. If we can't verify a data point, we leave it blank instead of showing something wrong.",
  },
  {
    q: "How do credits work?",
    a: "Credits are consumed by action, not by lead: running a Lead Finder search costs credits, asking the AI assistant costs credits, and generating outreach content costs a smaller amount. In-app support chat is always free.",
  },
  {
    q: "Can I filter for LinkedIn and social presence?",
    a: "Yes. Turn on the Social Presence Filter in Lead Finder to only accept leads that have a verified LinkedIn profile, active social presence, and an identified owner.",
  },
  {
    q: "Do I need my own OpenAI key?",
    a: "No. Scoring, qualification, and the Ask Contractor Leads assistant all run on our backend — nothing extra to configure.",
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

export type BuildMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
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
    openGraph: {
      type: "website",
      locale: SEO.locale,
      url,
      siteName: SEO.siteName,
      title: input.title,
      description: input.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
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
