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
    name: SEO.siteName,
    alternateName: [
      "ContractorLeads",
      "contractorleads.us",
      "www.contractorleads.us",
    ],
    url: seoBaseUrl(),
    logo: absoluteUrl("/logo.png"),
    email: EMAIL_BRAND.contactEmail,
    description: SEO.defaultDescription,
    sameAs: seoSameAs(),
    address: {
      "@type": "PostalAddress",
      streetAddress: "30 N Gould St # 58138",
      addressLocality: "Sheridan",
      addressRegion: "WY",
      postalCode: "82801",
      addressCountry: "US",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SEO.siteName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: seoBaseUrl(),
    description: SEO.defaultDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free trial with starter credits — no credit card required",
      url: absoluteUrl("/register"),
    },
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      url: seoBaseUrl(),
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
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/register")}?ref=search`,
      "query-input": "required name=search_term_string",
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
      name: SEO.siteName,
      url: seoBaseUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    mainEntityOfPage: absoluteUrl(opts.path),
    keywords: opts.keywords?.join(", "),
  };
}

