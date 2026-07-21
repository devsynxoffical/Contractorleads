function isLinkedInHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "linkedin.com" || host.endsWith(".linkedin.com");
}

export type LinkedInCandidate = {
  url: string;
  type: "company" | "owner" | "founder";
  confidence: number;
};

export type LinkedInCompanyResult = {
  url: string | null;
  confidence: number;
  source: "website" | "proxycurl_domain" | "proxycurl_name" | "slug_match" | null;
};

export function isValidLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      isLinkedInHostname(parsed.hostname) &&
      (parsed.pathname.startsWith("/company/") ||
        parsed.pathname.startsWith("/in/"))
    );
  } catch {
    return false;
  }
}

export function isValidLinkedInCompanyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      isLinkedInHostname(parsed.hostname) &&
      parsed.pathname.startsWith("/company/")
    );
  } catch {
    return false;
  }
}

/** Canonicalize any LinkedIn company URL (incl. pk.linkedin.com) to www.linkedin.com */
export function normalizeLinkedInCompanyUrl(raw: string): string | null {
  try {
    const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol.split("?")[0].split("#")[0]);
    if (!isLinkedInHostname(parsed.hostname)) {
      return null;
    }
    const match = parsed.pathname.match(/^\/company\/([^/]+)\/?/i);
    if (!match?.[1]) return null;
    const slug = decodeURIComponent(match[1]).replace(/\/+$/, "");
    if (!slug || !/^[a-zA-Z0-9._%-]+$/.test(slug)) return null;
    return `https://www.linkedin.com/company/${slug}/`;
  } catch {
    return null;
  }
}

export function normalizeLinkedInProfileUrl(raw: string): string | null {
  try {
    const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol.split("?")[0].split("#")[0]);
    if (!isLinkedInHostname(parsed.hostname)) return null;
    const match = parsed.pathname.match(/^\/in\/([^/]+)\/?/i);
    if (!match?.[1]) return null;
    const slug = decodeURIComponent(match[1]).replace(/\/+$/, "");
    if (!slug || !/^[a-zA-Z0-9._%-]+$/.test(slug)) return null;
    return `https://www.linkedin.com/in/${slug}/`;
  } catch {
    return null;
  }
}

export function extractWebsiteDomain(website: string): string | null {
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function buildLinkedInCompanySearchUrl(businessName: string): string {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(businessName)}`;
}

function slugifyBusinessName(name: string): string[] {
  const cleaned = name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|co|corp|corporation|company)\b\.?/gi, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

  const slugs = new Set<string>();
  if (cleaned) {
    slugs.add(cleaned.replace(/\s+/g, "-").replace(/-+/g, "-"));
    slugs.add(cleaned.replace(/\s+/g, ""));
    slugs.add(
      cleaned
        .split(/\s+/)
        .slice(0, 3)
        .join("-")
    );
  }
  return [...slugs].filter((s) => s.length >= 3);
}

function businessNameInHtml(businessName: string, html: string): boolean {
  const words = businessName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (!words.length) return false;
  const haystack = html.toLowerCase();
  const hits = words.filter((w) => haystack.includes(w)).length;
  return hits >= Math.min(2, words.length);
}

async function fetchWebsiteHtml(website: string): Promise<string | null> {
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadFlowUSA/1.0; +https://leadflowusa.com)",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export async function verifyLinkedInUrl(url: string): Promise<{
  valid: boolean;
  reason?: string;
  html?: string;
}> {
  if (!isValidLinkedInUrl(url)) {
    return { valid: false, reason: "Invalid URL format" };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadFlowVerifier/1.0; +https://leadflowusa.com)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404 || response.status === 410) {
      return { valid: false, reason: "Page not found" };
    }

    const html = await response.text();
    const blockedPhrases = [
      "Page Not Found",
      "Profile Unavailable",
      "Company Not Found",
      "This page doesn't exist",
    ];

    if (blockedPhrases.some((phrase) => html.includes(phrase))) {
      return { valid: false, reason: "Profile unavailable" };
    }

    return { valid: response.ok, html };
  } catch {
    return { valid: false, reason: "Verification failed" };
  }
}

/** Free: scrape the business website for a linkedin.com/company link.
 * Trust on-site links — LinkedIn blocks most bot HTML verification. */
export async function discoverLinkedInFromWebsite(
  website: string
): Promise<string | null> {
  const { scrapeWebsiteSocialPack } = await import("./website-social-pack");
  const pack = await scrapeWebsiteSocialPack(website);
  return pack.linkedinCompany || pack.linkedinOwner || null;
}

async function findLinkedInViaSerper(
  businessName: string,
  location: string,
): Promise<string | null> {
  const { searchPublicWeb } = await import("./web-search");
  const queries = [
    `${businessName} ${location} site:linkedin.com/company`,
    `"${businessName}" site:linkedin.com/company`,
    `${businessName} linkedin company`,
  ];
  for (const q of queries) {
    const hits = await searchPublicWeb(q, 6);
    for (const hit of hits) {
      const company = normalizeLinkedInCompanyUrl(hit.url);
      if (company) return company;
      const owner = normalizeLinkedInProfileUrl(hit.url);
      if (owner) return owner;
    }
  }
  return null;
}

async function resolveViaProxycurlDomain(
  domain: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nubela.co/proxycurl/api/linkedin/company/resolve?company_domain=${encodeURIComponent(domain)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { url?: string };
    // Trust Proxycurl — LinkedIn blocks most server-side HTML checks
    return data.url ? normalizeLinkedInCompanyUrl(data.url) : null;
  } catch {
    return null;
  }
}

async function resolveViaProxycurlName(
  businessName: string,
  location: string,
  industry: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = new URL(
      "https://nubela.co/proxycurl/api/linkedin/company/resolve"
    );
    url.searchParams.set("company_name", businessName);
    if (location) url.searchParams.set("enrich_profile", "enrich");
    void industry;
    void location;

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { url?: string };
    return data.url ? normalizeLinkedInCompanyUrl(data.url) : null;
  } catch {
    return null;
  }
}

/** Free: try common URL slugs — keep short so Find LinkedIn doesn't hang */
async function resolveViaSlugGuess(
  businessName: string
): Promise<string | null> {
  const slugs = slugifyBusinessName(businessName).slice(0, 3);
  for (const slug of slugs) {
    const url = `https://www.linkedin.com/company/${slug}/`;
    const check = await verifyLinkedInUrl(url);
    if (check.valid && check.html && businessNameInHtml(businessName, check.html)) {
      return url;
    }
  }
  return null;
}

/** Run all strategies to find a verified LinkedIn company page URL */
export async function findLinkedInCompanyUrl(
  businessName: string,
  location: string,
  industry: string,
  website?: string | null,
  opts?: {
    /** Prefetched company URL from website pack (avoids double scrape). */
    websiteCompanyUrl?: string | null;
    skipWebsiteScrape?: boolean;
  },
): Promise<LinkedInCompanyResult> {
  const apiKey = process.env.LINKEDIN_DATA_API_KEY;

  const fromSitePrefetch = opts?.websiteCompanyUrl
    ? normalizeLinkedInCompanyUrl(opts.websiteCompanyUrl) || opts.websiteCompanyUrl
    : null;

  const [fromSite, fromDomain, fromSerper] = await Promise.all([
    fromSitePrefetch
      ? Promise.resolve(fromSitePrefetch)
      : opts?.skipWebsiteScrape
        ? Promise.resolve(null)
        : website
          ? discoverLinkedInFromWebsite(website)
          : Promise.resolve(null),
    website && apiKey
      ? (async () => {
          const domain = extractWebsiteDomain(website);
          return domain ? resolveViaProxycurlDomain(domain, apiKey) : null;
        })()
      : Promise.resolve(null),
    findLinkedInViaSerper(businessName, location),
  ]);

  if (fromSite) {
    const company = normalizeLinkedInCompanyUrl(fromSite);
    if (company) return { url: company, confidence: 98, source: "website" };
    return { url: fromSite, confidence: 96, source: "website" };
  }
  if (fromDomain) {
    return { url: fromDomain, confidence: 97, source: "proxycurl_domain" };
  }
  if (fromSerper) {
    const company = normalizeLinkedInCompanyUrl(fromSerper);
    if (company) return { url: company, confidence: 94, source: "slug_match" };
    return { url: fromSerper, confidence: 92, source: "slug_match" };
  }

  if (apiKey) {
    const fromName = await resolveViaProxycurlName(
      businessName,
      location,
      industry,
      apiKey,
    );
    if (fromName) {
      return { url: fromName, confidence: 96, source: "proxycurl_name" };
    }
  }

  return { url: null, confidence: 0, source: null };
}

export async function resolveLinkedIn(
  businessName: string,
  location: string,
  industry: string,
  ownerName?: string | null,
  website?: string | null
): Promise<{
  url: string | null;
  companyUrl: string | null;
  ownerUrl: string | null;
  type: string;
  confidence: number;
  ownerConfidence: number;
  companySource: LinkedInCompanyResult["source"];
}> {
  const full = await resolveLinkedInProfiles(
    businessName,
    location,
    industry,
    ownerName,
    website
  );
  const primary =
    full.company.confidence >= 90
      ? full.company
      : full.owner.confidence >= 90
        ? full.owner
        : full.company.url
          ? full.company
          : full.owner.url
            ? full.owner
            : { url: null, confidence: 0, type: "none" as const };

  return {
    url: primary.url,
    companyUrl: full.company.url,
    ownerUrl: full.owner.url,
    type: primary.type,
    confidence: primary.confidence,
    ownerConfidence: full.owner.confidence,
    companySource: full.companySource,
  };
}

export async function resolveLinkedInProfiles(
  businessName: string,
  location: string,
  industry: string,
  ownerName?: string | null,
  website?: string | null
): Promise<{
  company: { url: string | null; confidence: number; type: "company" };
  owner: { url: string | null; confidence: number; type: "owner" };
  companySource: LinkedInCompanyResult["source"];
}> {
  const pack = website
    ? await (await import("./website-social-pack")).scrapeWebsiteSocialPack(
        website,
      )
    : null;

  const companyResult = await findLinkedInCompanyUrl(
    businessName,
    location,
    industry,
    website,
    {
      websiteCompanyUrl: pack?.linkedinCompany ?? null,
      skipWebsiteScrape: true,
    },
  );

  let ownerUrl: string | null = pack?.linkedinOwner ?? null;
  let ownerConfidence = ownerUrl ? 96 : 0;
  const apiKey = process.env.LINKEDIN_DATA_API_KEY;

  if (!ownerUrl && ownerName && apiKey) {
    try {
      const domain = website ? extractWebsiteDomain(website) : null;
      const domainParam = domain
        ? `&company_domain=${encodeURIComponent(domain)}`
        : "";
      const response = await fetch(
        `https://nubela.co/proxycurl/api/linkedin/profile/resolve?first_name=${encodeURIComponent(ownerName.split(" ")[0] || "")}&last_name=${encodeURIComponent(ownerName.split(" ").slice(1).join(" ") || "")}${domainParam}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as { url?: string };
        const normalized = data.url
          ? normalizeLinkedInProfileUrl(data.url)
          : null;
        if (normalized) {
          ownerUrl = normalized;
          ownerConfidence = 95;
        }
      }
    } catch {
      // Fall through
    }
  }

  return {
    company: {
      url: companyResult.url,
      confidence: companyResult.confidence,
      type: "company",
    },
    owner: { url: ownerUrl, confidence: ownerConfidence, type: "owner" },
    companySource: companyResult.source,
  };
}
