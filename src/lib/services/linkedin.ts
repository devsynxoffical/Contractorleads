const LINKEDIN_HOST = "www.linkedin.com";

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
      parsed.hostname === LINKEDIN_HOST &&
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
      parsed.hostname === LINKEDIN_HOST &&
      parsed.pathname.startsWith("/company/")
    );
  } catch {
    return false;
  }
}

export function normalizeLinkedInCompanyUrl(raw: string): string | null {
  try {
    const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol.split("?")[0].split("#")[0]);
    if (parsed.hostname !== LINKEDIN_HOST && parsed.hostname !== "linkedin.com") {
      return null;
    }
    const slug = parsed.pathname
      .replace(/^\/company\//, "")
      .replace(/\/$/, "");
    if (!slug || slug.includes("/")) return null;
    return `https://www.linkedin.com/company/${decodeURIComponent(slug)}/`;
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

/** Free: scrape the business website for a linkedin.com/company link */
export async function discoverLinkedInFromWebsite(
  website: string
): Promise<string | null> {
  const html = await fetchWebsiteHtml(website);
  if (!html) return null;

  const patterns = [
    /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9._%+-]+/gi,
    /(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9._%+-]+/gi,
  ];

  const seen = new Set<string>();
  for (const pattern of patterns) {
    const matches = html.match(pattern) ?? [];
    for (const raw of matches) {
      const normalized = normalizeLinkedInCompanyUrl(raw);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);

      const check = await verifyLinkedInUrl(normalized);
      if (check.valid) return normalized;
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
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { url?: string };
    if (data.url && isValidLinkedInCompanyUrl(data.url)) {
      const normalized = normalizeLinkedInCompanyUrl(data.url);
      if (!normalized) return null;
      const check = await verifyLinkedInUrl(normalized);
      return check.valid ? normalized : null;
    }
  } catch {
    // Fall through
  }
  return null;
}

async function resolveViaProxycurlName(
  businessName: string,
  location: string,
  industry: string,
  apiKey: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${businessName} ${location} ${industry}`);
    const response = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin/company/resolve?company_domain=&company_name=${query}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { url?: string };
    if (data.url && isValidLinkedInCompanyUrl(data.url)) {
      const normalized = normalizeLinkedInCompanyUrl(data.url);
      if (!normalized) return null;
      const check = await verifyLinkedInUrl(normalized);
      return check.valid ? normalized : null;
    }
  } catch {
    // Fall through
  }
  return null;
}

/** Free: try common URL slugs derived from business name, verify page exists + name match */
async function resolveViaSlugGuess(
  businessName: string
): Promise<string | null> {
  for (const slug of slugifyBusinessName(businessName)) {
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
  website?: string | null
): Promise<LinkedInCompanyResult> {
  // 1) Website link (free, highest trust when on their own site)
  if (website) {
    const fromSite = await discoverLinkedInFromWebsite(website);
    if (fromSite) {
      return { url: fromSite, confidence: 97, source: "website" };
    }
  }

  const apiKey = process.env.LINKEDIN_DATA_API_KEY;

  // 2) Proxycurl by domain (paid, very accurate)
  if (website && apiKey) {
    const domain = extractWebsiteDomain(website);
    if (domain) {
      const fromDomain = await resolveViaProxycurlDomain(domain, apiKey);
      if (fromDomain) {
        return { url: fromDomain, confidence: 97, source: "proxycurl_domain" };
      }
    }
  }

  // 3) Proxycurl by company name (paid)
  if (apiKey) {
    const fromName = await resolveViaProxycurlName(
      businessName,
      location,
      industry,
      apiKey
    );
    if (fromName) {
      return { url: fromName, confidence: 96, source: "proxycurl_name" };
    }
  }

  // 4) Slug guess + name match in page HTML (free, best effort)
  const fromSlug = await resolveViaSlugGuess(businessName);
  if (fromSlug) {
    return { url: fromSlug, confidence: 95, source: "slug_match" };
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
    full.company.confidence >= 95
      ? full.company
      : full.owner.confidence >= 95
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
  const companyResult = await findLinkedInCompanyUrl(
    businessName,
    location,
    industry,
    website
  );

  let ownerUrl: string | null = null;
  let ownerConfidence = 0;
  const apiKey = process.env.LINKEDIN_DATA_API_KEY;

  if (ownerName && apiKey) {
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
        if (data.url && isValidLinkedInUrl(data.url)) {
          const check = await verifyLinkedInUrl(data.url);
          if (check.valid) {
            ownerUrl = data.url;
            ownerConfidence = 95;
          }
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
