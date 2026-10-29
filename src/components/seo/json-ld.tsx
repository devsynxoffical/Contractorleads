import { absoluteUrl, MARKETING_FAQ, SEO, seoBaseUrl, seoSameAs } from "@/lib/seo";
import { EMAIL_BRAND } from "@/lib/email-brand";

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Contractor Leads",
    legalName: "Vaishali Media Productions LLC",
    alternateName: [
      "ContractorLeads",
      "contractorleads.us",
      "www.contractorleads.us",
    ],
    url: seoBaseUrl(),
    logo: absoluteUrl("/logo.png"),
    email: EMAIL_BRAND.contactEmail,
    description:
      "Contractor Leads is prospecting software for marketing agencies, media buyers and sales teams that sell to home-service contractors: it finds businesses from live Google data, scores them Hot, Warm or Nurture, adds owner names and Meta ad status, and writes the outreach.",
    sameAs: seoSameAs(),
    address: {
      "@type": "PostalAddress",
      streetAddress: "30 N Gould St # 58138",
      addressLocality: "Sheridan",
      addressRegion: "WY",
      postalCode: "82801",
      addressCountry: "US",
    },
    founder: {
      "@type": "Person",
      name: "Vaishali Kapoor",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Contractor Leads",
    url: seoBaseUrl(),
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Lead generation and sales prospecting",
    operatingSystem: "Web",
    description:
      "Contractor Leads is prospecting software for marketing agencies, media buyers and sales teams that sell to home-service contractors: it finds businesses from live Google data, scores them Hot, Warm or Nurture, adds owner names and Meta ad status, and writes the outreach.",
    featureList: [
      "Lead Finder (live Google Places search)",
      "AI lead scoring (Hot, Warm, Nurture)",
      "Owner enrichment",
      "Meta Ads Intel",
      "Outreach Studio (cold email, SMS, call scripts)",
      "Pipeline CRM",
      "Lead Map",
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
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "19.99",
        priceCurrency: "USD",
        description: "500 credits a month",
        url: absoluteUrl("/pricing"),
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "49",
        priceCurrency: "USD",
        description: "2,000 credits a month",
        url: absoluteUrl("/pricing"),
      },
      {
        "@type": "Offer",
        name: "Agency",
        price: "99",
        priceCurrency: "USD",
        description: "5,000 credits a month",
        url: absoluteUrl("/pricing"),
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "Contractor Leads",
      legalName: "Vaishali Media Productions LLC",
      url: seoBaseUrl(),
      logo: absoluteUrl("/logo.png"),
      email: EMAIL_BRAND.contactEmail,
      address: {
        "@type": "PostalAddress",
        streetAddress: "30 N Gould St # 58138",
        addressLocality: "Sheridan",
        addressRegion: "WY",
        postalCode: "82801",
        addressCountry: "US",
      },
      founder: {
        "@type": "Person",
        name: "Vaishali Kapoor",
      },
      sameAs: seoSameAs(),
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO.siteName,
    alternateName: ["contractorleads.us", "www.contractorleads.us"],
    url: seoBaseUrl(),
    description: SEO.defaultDescription,
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      url: seoBaseUrl(),
    },
  };
}

export function faqPageJsonLd(faqs = MARKETING_FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
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

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: {
      "@type": "Organization",
      name: "Contractor Leads",
      url: seoBaseUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: "Contractor Leads",
      legalName: "Vaishali Media Productions LLC",
      url: seoBaseUrl(),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    mainEntityOfPage: absoluteUrl(opts.path),
    keywords: opts.keywords?.join(", "),
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
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: {
      "@type": "Organization",
      name: "Contractor Leads",
      url: seoBaseUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: "Contractor Leads",
      legalName: "Vaishali Media Productions LLC",
      url: seoBaseUrl(),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    mainEntityOfPage: absoluteUrl(opts.path),
    keywords: opts.keywords?.join(", "),
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Vaishali Kapoor",
    jobTitle: "Founder",
    worksFor: {
      "@type": "Organization",
      name: "Contractor Leads",
      url: seoBaseUrl(),
    },
    image: absoluteUrl("/marketing/founder-portrait.jpg"),
    url: absoluteUrl("/about"),
    sameAs: [
      process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN?.trim() ||
        "https://www.linkedin.com/company/contractorleads",
    ],
  };
}



