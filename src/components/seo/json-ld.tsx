import { absoluteUrl, MARKETING_FAQ, SEO, seoBaseUrl, seoSameAs } from "@/lib/seo";
import { EMAIL_BRAND } from "@/lib/email-brand";

/**
 * Structured data (schema.org JSON-LD) for rich results.
 *
 * Every page refers to the same company, website, software and founder through stable
 * "@id" values, so Google merges them into one entity instead of seeing slightly
 * different copies on each page. Only facts that are true and visible on the site are
 * described: there are no ratings, reviews or videos here because the site has none.
 */

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so text such as "</script>" inside a field can never end the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const CONTEXT = "https://schema.org";

/** Stable entity IDs shared by every page. */
export const SCHEMA_IDS = {
  organization: () => `${seoBaseUrl()}/#organization`,
  website: () => `${seoBaseUrl()}/#website`,
  software: () => `${seoBaseUrl()}/#software`,
  founder: () => `${absoluteUrl("/about")}#founder`,
  logo: () => `${seoBaseUrl()}/#logo`,
  blog: () => `${absoluteUrl("/blog")}#blog`,
  help: () => `${absoluteUrl("/help")}#help`,
};

const COMPANY_DESCRIPTION =
  "Contractor Leads is prospecting software for marketing agencies, media buyers and sales teams that sell to home-service contractors: it finds businesses from live Google data, scores them Hot, Warm or Nurture, adds owner names and Meta ad status, and writes the outreach.";

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "30 N Gould St # 58138",
  addressLocality: "Sheridan",
  addressRegion: "WY",
  postalCode: "82801",
  addressCountry: "US",
};

/** Markets the product covers (as stated on the site). */
const AREA_SERVED = ["US", "CA", "GB", "AU", "NZ"].map((code) => ({ "@type": "Country", name: code }));

const logoObject = () => ({
  "@type": "ImageObject",
  "@id": SCHEMA_IDS.logo(),
  url: absoluteUrl("/logo.png"),
  contentUrl: absoluteUrl("/logo.png"),
  width: 310,
  height: 312,
  caption: "Contractor Leads",
});

/** Short reference to the company, for use inside other entities. */
const orgRef = () => ({ "@id": SCHEMA_IDS.organization(), "@type": "Organization", name: "Contractor Leads" });

/** Default social image (1200x630) used when a page has no own image. */
const defaultImage = () => ({
  "@type": "ImageObject",
  url: absoluteUrl(SEO.ogImagePath),
  width: 1200,
  height: 630,
});

export function organizationJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": SCHEMA_IDS.organization(),
    name: "Contractor Leads",
    legalName: "Vaishali Media Productions LLC",
    alternateName: ["ContractorLeads", "contractorleads.us", "www.contractorleads.us"],
    url: seoBaseUrl(),
    logo: logoObject(),
    image: { "@id": SCHEMA_IDS.logo() },
    email: EMAIL_BRAND.contactEmail,
    description: COMPANY_DESCRIPTION,
    sameAs: seoSameAs(),
    address: ADDRESS,
    areaServed: AREA_SERVED,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: EMAIL_BRAND.contactEmail,
        url: absoluteUrl("/help"),
        availableLanguage: ["English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: EMAIL_BRAND.contactEmail,
        url: absoluteUrl("/enterprise/book"),
        availableLanguage: ["English"],
      },
    ],
    knowsAbout: [
      "Contractor lead generation",
      "Home-service marketing",
      "Google Maps lead generation",
      "Cold email outreach",
      "Email deliverability",
      "Local Services Ads",
    ],
    founder: { "@id": SCHEMA_IDS.founder(), "@type": "Person", name: "Vaishali Kapoor" },
  };
}

/** Monthly subscription price, so the offer is not read as a one-off payment. */
function monthlyOffer(name: string, price: string, description: string, path: string) {
  return {
    "@type": "Offer",
    name,
    price,
    priceCurrency: "USD",
    description,
    url: absoluteUrl(path),
    availability: "https://schema.org/InStock",
    category: "Subscription",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitCode: "MON",
      unitText: "month",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "SoftwareApplication",
    "@id": SCHEMA_IDS.software(),
    name: "Contractor Leads",
    url: seoBaseUrl(),
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Lead generation and sales prospecting",
    operatingSystem: "Web",
    browserRequirements: "Requires a modern web browser",
    description: COMPANY_DESCRIPTION,
    image: defaultImage(),
    softwareHelp: { "@type": "CreativeWork", url: absoluteUrl("/help") },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Marketing agencies, media buyers and sales teams that sell to home-service contractors",
    },
    featureList: [
      "Lead Finder (live Google Places search)",
      "AI lead scoring (Hot, Warm, Nurture)",
      "Owner enrichment",
      "Email verification",
      "Meta Ads Intel",
      "Outreach Studio (cold email, SMS, call scripts)",
      "Mailbox warmup with SPF, DKIM, DMARC and MX checks",
      "Pipeline CRM",
      "Lead Map",
      "CSV and Excel export",
      "Integrations: GoHighLevel, Zapier, Make, HubSpot, Slack, webhooks",
    ],
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "10 free leads, no credit card",
        url: absoluteUrl("/register"),
        availability: "https://schema.org/InStock",
      },
      monthlyOffer("Starter", "19.99", "500 credits a month", "/pricing"),
      monthlyOffer("Growth", "49", "2,000 credits a month", "/pricing"),
      monthlyOffer("Agency", "99", "5,000 credits a month", "/pricing"),
    ],
    publisher: orgRef(),
    provider: orgRef(),
  };
}

export function websiteJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": SCHEMA_IDS.website(),
    name: SEO.siteName,
    alternateName: ["contractorleads.us", "www.contractorleads.us"],
    url: seoBaseUrl(),
    description: SEO.defaultDescription,
    inLanguage: "en-US",
    publisher: orgRef(),
  };
}

export function faqPageJsonLd(faqs = MARKETING_FAQ, path?: string) {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    ...(path ? { "@id": `${absoluteUrl(path)}#faq`, url: absoluteUrl(path) } : {}),
    inLanguage: "en-US",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function founderRef() {
  return {
    "@type": "Person",
    "@id": SCHEMA_IDS.founder(),
    name: "Vaishali Kapoor",
    jobTitle: "Founder",
    url: absoluteUrl("/about"),
    image: absoluteUrl("/marketing/founder-portrait.jpg"),
    worksFor: { "@id": SCHEMA_IDS.organization() },
  };
}

export function blogPostingJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  keywords?: string[];
  image?: string;
  author?: { name: string; url?: string; image?: string };
  wordCount?: number;
  section?: string;
  readingMinutes?: number;
  /** Primary sources the article relies on (schema.org citation). */
  citations?: Array<{ label: string; url: string }>;
}) {
  const url = absoluteUrl(opts.path);
  const isFounder = !opts.author || opts.author.name === "Vaishali Kapoor";
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: opts.title.length > 110 ? `${opts.title.slice(0, 107)}...` : opts.title,
    description: opts.description,
    url,
    image: [
      {
        "@type": "ImageObject",
        url: opts.image ? absoluteUrl(opts.image) : absoluteUrl(SEO.ogImagePath),
        width: 1200,
        height: 630,
      },
    ],
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
    ...(opts.readingMinutes ? { timeRequired: `PT${opts.readingMinutes}M` } : {}),
    ...(opts.section ? { articleSection: opts.section } : {}),
    ...(opts.citations?.length
      ? { citation: opts.citations.map((c) => ({ "@type": "CreativeWork", name: c.label, url: c.url })) }
      : {}),
    author: isFounder
      ? founderRef()
      : {
          "@type": "Person",
          name: opts.author!.name,
          url: opts.author!.url ? absoluteUrl(opts.author!.url) : absoluteUrl("/about"),
          ...(opts.author!.image ? { image: absoluteUrl(opts.author!.image) } : {}),
        },
    publisher: { ...orgRef(), logo: logoObject() },
    isPartOf: { "@type": "Blog", "@id": SCHEMA_IDS.blog(), name: "Agency Growth Blog", url: absoluteUrl("/blog") },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(opts.keywords?.length ? { keywords: opts.keywords.join(", ") } : {}),
  };
}

export function techArticleJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  keywords?: string[];
}) {
  const url = absoluteUrl(opts.path);
  return {
    "@context": CONTEXT,
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: opts.title.length > 110 ? `${opts.title.slice(0, 107)}...` : opts.title,
    description: opts.description,
    url,
    image: [defaultImage()],
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    author: orgRef(),
    publisher: { ...orgRef(), logo: logoObject() },
    about: { "@id": SCHEMA_IDS.software() },
    isPartOf: { "@type": "WebSite", "@id": SCHEMA_IDS.website() },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(opts.keywords?.length ? { keywords: opts.keywords.join(", ") } : {}),
  };
}

export function personJsonLd() {
  // A Person's sameAs must point to that person's own profiles, never the company's.
  const personal = process.env.NEXT_PUBLIC_FOUNDER_LINKEDIN?.trim();
  return {
    "@context": CONTEXT,
    ...founderRef(),
    description:
      "Founder of Contractor Leads, helping marketing agencies prospect, score and close home-service contractors.",
    ...(personal ? { sameAs: [personal] } : {}),
  };
}

/**
 * A service the company provides (industry and service landing pages), per the page plan:
 * "Service on service, industry and platform pages".
 */
export function serviceJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  audience?: string;
}) {
  const url = absoluteUrl(opts.path);
  return {
    "@context": CONTEXT,
    "@type": "Service",
    "@id": `${url}#service`,
    name: opts.name,
    description: opts.description,
    url,
    serviceType: opts.serviceType,
    provider: orgRef(),
    areaServed: AREA_SERVED,
    audience: {
      "@type": "BusinessAudience",
      audienceType:
        opts.audience ?? "Marketing agencies, media buyers and sales teams that sell to home-service contractors",
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/pricing"),
      price: "0",
      priceCurrency: "USD",
      description: "Start with 10 free leads; paid plans from $19.99 a month",
      availability: "https://schema.org/InStock",
    },
    isRelatedTo: { "@id": SCHEMA_IDS.software() },
  };
}

/** A web page of a specific kind (about, legal, contact) tied to the site and company. */
export function webPageJsonLd(opts: {
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  name: string;
  description: string;
  path: string;
  dateModified?: string;
}) {
  const url = absoluteUrl(opts.path);
  return {
    "@context": CONTEXT,
    "@type": opts.type ?? "WebPage",
    "@id": url,
    url,
    name: opts.name,
    description: opts.description,
    inLanguage: "en-US",
    isPartOf: { "@id": SCHEMA_IDS.website() },
    publisher: orgRef(),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

/**
 * A hub page that lists other pages (blog index, industries, comparisons, help).
 * The ItemList mirrors the links visible on the page, in the same order.
 */
export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  items: Array<{ name: string; path: string }>;
  /** Use "Blog" for the blog index so posts are linked to the Blog entity. */
  as?: "CollectionPage" | "Blog";
}) {
  const url = absoluteUrl(opts.path);
  const list = {
    "@type": "ItemList",
    numberOfItems: opts.items.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: opts.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
  if (opts.as === "Blog") {
    return {
      "@context": CONTEXT,
      "@type": "Blog",
      "@id": SCHEMA_IDS.blog(),
      url,
      name: opts.name,
      description: opts.description,
      inLanguage: "en-US",
      publisher: orgRef(),
      isPartOf: { "@id": SCHEMA_IDS.website() },
      blogPost: opts.items.map((item) => ({
        "@type": "BlogPosting",
        "@id": `${absoluteUrl(item.path)}#article`,
        headline: item.name,
        url: absoluteUrl(item.path),
      })),
    };
  }
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    "@id": url,
    url,
    name: opts.name,
    description: opts.description,
    inLanguage: "en-US",
    isPartOf: { "@id": SCHEMA_IDS.website() },
    publisher: orgRef(),
    mainEntity: list,
  };
}
