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
  source: "website" | "serper" | "web" | null;
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
  // One query only — sequential multi-query was the LinkedIn bottleneck
  const hits = await searchPublicWeb(
    `site:linkedin.com/company "${businessName}" ${location}`,
    6,
  );
  for (const hit of hits) {
    const company = normalizeLinkedInCompanyUrl(hit.url);
    if (company) return company;
    const owner = normalizeLinkedInProfileUrl(hit.url);
    if (owner) return owner;
  }
  return null;
}

/** Run free strategies: website scrape + public web search. */
export async function findLinkedInCompanyUrl(
  businessName: string,
  location: string,
  industry: string,
  website?: string | null,
  opts?: {
    /** Prefetched company URL from website pack (avoids double scrape). */
    websiteCompanyUrl?: string | null;
    skipWebsiteScrape?: boolean;
    /** Skip slow public-web lookup when URL already known. */
    skipWebSearch?: boolean;
  },
): Promise<LinkedInCompanyResult> {
  void industry;

  const fromSitePrefetch = opts?.websiteCompanyUrl
    ? normalizeLinkedInCompanyUrl(opts.websiteCompanyUrl) ||
      opts.websiteCompanyUrl
    : null;

  if (fromSitePrefetch) {
    const company = normalizeLinkedInCompanyUrl(fromSitePrefetch);
    if (company) return { url: company, confidence: 98, source: "website" };
    return { url: fromSitePrefetch, confidence: 96, source: "website" };
  }

  const [fromSite, fromSerper] = await Promise.all([
    opts?.skipWebsiteScrape
      ? Promise.resolve(null)
      : website
        ? discoverLinkedInFromWebsite(website)
        : Promise.resolve(null),
    opts?.skipWebSearch
      ? Promise.resolve(null)
      : findLinkedInViaSerper(businessName, location),
  ]);

  if (fromSite) {
    const company = normalizeLinkedInCompanyUrl(fromSite);
    if (company) return { url: company, confidence: 98, source: "website" };
    return { url: fromSite, confidence: 96, source: "website" };
  }
  if (fromSerper) {
    const company = normalizeLinkedInCompanyUrl(fromSerper);
    if (company) return { url: company, confidence: 94, source: "web" };
    return { url: fromSerper, confidence: 92, source: "web" };
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

  // Owner LinkedIn: Serper search by person + company (no Proxycurl — shut down)
  if (!ownerUrl && ownerName) {
    const { searchPublicWeb } = await import("./web-search");
    const hits = await searchPublicWeb(
      `"${ownerName}" "${businessName}" site:linkedin.com/in`,
      5,
    );
    for (const hit of hits) {
      const normalized = normalizeLinkedInProfileUrl(hit.url);
      if (normalized) {
        ownerUrl = normalized;
        ownerConfidence = 90;
        break;
      }
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
