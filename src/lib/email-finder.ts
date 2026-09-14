import { safeFetch } from "@/lib/safe-fetch";
import { verifyEmailAddress, type EmailVerificationResult } from "@/lib/email-verifier";

export type FoundContact = {
  email: string;
  name?: string | null;
  role?: string | null;
  type: "owner" | "executive" | "team" | "contact" | "general";
  sourceUrl: string;
  confidence: number;
  verification?: EmailVerificationResult;
};

export type EmailFinderResult = {
  query: string;
  domain: string;
  websiteUrl: string | null;
  companyName: string | null;
  phone: string | null;
  socials: {
    linkedin?: string | null;
    facebook?: string | null;
    instagram?: string | null;
  };
  contacts: FoundContact[];
  primaryEmail: string | null;
  ownerName: string | null;
  ownerRole: string | null;
  pagesChecked: string[];
  durationMs: number;
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; ContractorLeads/1.0; +https://contractorleads.app)";

const TARGET_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/about",
  "/about-us",
  "/our-team",
  "/team",
  "/staff",
  "/leadership",
  "/estimates",
  "/quote",
];

const BAD_EMAILS =
  /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|postmaster|sentry|wixpress|squarespace|wordpress|godaddy|cloudflare|schema\.org|googleapis|gstatic|w3\.org|jquery|example\.com|domain\.com|email\.com|yourdomain|placeholder|test@|sample@|user@|name@|email@|billing@|invoices?@|accounting@|legal@|privacy@|abuse@|security@)/i;

const OWNER_ROLES =
  /\b(owner|founder|co-founder|president|principal|managing director|ceo|general contractor)\b/i;

const TEAM_ROLES =
  /\b(manager|director|partner|supervisor|estimator|sales|operations|technician|specialist|project manager)\b/i;

/**
 * Normalise a raw domain or website URL into a fully qualified HTTPS URL.
 */
export function normalizeWebsiteUrl(raw: string): { url: string; domain: string } {
  let cleaned = raw.trim().toLowerCase();
  if (!cleaned) return { url: "", domain: "" };

  cleaned = cleaned.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const slashIdx = cleaned.indexOf("/");
  const domain = slashIdx === -1 ? cleaned : cleaned.slice(0, slashIdx);

  const fullUrl = `https://${domain}`;
  return { url: fullUrl, domain };
}

/**
 * Extract email addresses from raw HTML and mailto links using robust pattern scanning.
 */
function extractEmailsFromHtml(html: string, pageUrl: string): Array<{ email: string; source: string }> {
  const emails: Array<{ email: string; source: string }> = [];
  const seen = new Set<string>();

  // 1. Mailto links
  const mailtoMatches = html.matchAll(/href=["']mailto:([^"'\s?]+)[^"']*["']/gi);
  for (const match of mailtoMatches) {
    const raw = (match[1] || "").trim().toLowerCase();
    const emailMatch = raw.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
    if (emailMatch && !BAD_EMAILS.test(emailMatch[0])) {
      const e = emailMatch[0];
      if (!seen.has(e)) {
        seen.add(e);
        emails.push({ email: e, source: pageUrl });
      }
    }
  }

  // 2. Body text / comments / attributes regex search
  const matches = html.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g) || [];
  for (const raw of matches) {
    const e = raw.toLowerCase().replace(/[.,;:]+$/, "");
    if (
      e.length <= 80 &&
      !BAD_EMAILS.test(e) &&
      !e.endsWith(".png") &&
      !e.endsWith(".jpg") &&
      !e.endsWith(".svg") &&
      !seen.has(e)
    ) {
      seen.add(e);
      emails.push({ email: e, source: pageUrl });
    }
  }

  return emails;
}

/**
 * Extract phone, company name, and social links from HTML.
 */
function extractMetadata(html: string) {
  let phone: string | null = null;
  let companyName: string | null = null;
  let linkedin: string | null = null;
  let facebook: string | null = null;
  let instagram: string | null = null;

  // Title / Company
  const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogSiteMatch) {
    companyName = ogSiteMatch[1].trim();
  } else {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      companyName = titleMatch[1].split(/[|\-–—]/)[0]?.trim() || null;
    }
  }

  // Phone (tel link or regex)
  const telMatch = html.match(/href=["']tel:([^"'\s]+)["']/i);
  if (telMatch) {
    const cleanTel = telMatch[1].trim();
    if (cleanTel.replace(/\D/g, "").length >= 10) phone = cleanTel;
  }

  if (!phone) {
    const phoneMatch = html.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) phone = phoneMatch[0].trim();
  }

  // Socials
  const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^"'\s]+)["']/i);
  if (linkedinMatch) linkedin = linkedinMatch[1];

  const facebookMatch = html.match(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"'\s?]+)["']/i);
  if (facebookMatch && !facebookMatch[1].includes("/sharer")) facebook = facebookMatch[1];

  const instagramMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s?]+)["']/i);
  if (instagramMatch) instagram = instagramMatch[1];

  return { phone, companyName, linkedin, facebook, instagram };
}

/**
 * Find email addresses and key contacts for a domain or website.
 */
export async function findEmailsForDomain(
  rawQuery: string,
  options?: { verifyResults?: boolean; maxPages?: number },
): Promise<EmailFinderResult> {
  const startTime = Date.now();
  const { url: baseUrl, domain } = normalizeWebsiteUrl(rawQuery);

  if (!domain) {
    return {
      query: rawQuery,
      domain: "",
      websiteUrl: null,
      companyName: null,
      phone: null,
      socials: {},
      contacts: [],
      primaryEmail: null,
      ownerName: null,
      ownerRole: null,
      pagesChecked: [],
      durationMs: Date.now() - startTime,
    };
  }

  const pagesChecked: string[] = [];
  const rawFoundEmails: Array<{ email: string; source: string }> = [];
  let metaPhone: string | null = null;
  let metaCompanyName: string | null = null;
  let metaLinkedin: string | null = null;
  let metaFacebook: string | null = null;
  let metaInstagram: string | null = null;

  const maxPages = options?.maxPages ?? 4;
  const pathsToCheck = TARGET_PATHS.slice(0, maxPages);

  // Crawl target paths concurrently with quick timeout
  await Promise.all(
    pathsToCheck.map(async (path) => {
      const targetUrl = `${baseUrl}${path}`;
      try {
        const res = await safeFetch(targetUrl, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(4500),
        });
        if (!res.ok) return;

        const html = await res.text();
        pagesChecked.push(targetUrl);

        const extracted = extractEmailsFromHtml(html, targetUrl);
        rawFoundEmails.push(...extracted);

        if (!metaPhone || !metaCompanyName) {
          const meta = extractMetadata(html);
          if (!metaPhone && meta.phone) metaPhone = meta.phone;
          if (!metaCompanyName && meta.companyName) metaCompanyName = meta.companyName;
          if (!metaLinkedin && meta.linkedin) metaLinkedin = meta.linkedin;
          if (!metaFacebook && meta.facebook) metaFacebook = meta.facebook;
          if (!metaInstagram && meta.instagram) metaInstagram = meta.instagram;
        }
      } catch {
        // timeout or 404 on subpage is expected
      }
    }),
  );

  // If no email was found via crawling, generate high-probability pattern candidates
  if (rawFoundEmails.length === 0) {
    const commonPatterns = [`info@${domain}`, `contact@${domain}`, `sales@${domain}`, `office@${domain}`];
    for (const pattern of commonPatterns) {
      rawFoundEmails.push({ email: pattern, source: `${baseUrl} (Pattern Guess)` });
    }
  }

  // Deduplicate and structure contacts
  const uniqueEmails = new Map<string, { email: string; source: string }>();
  for (const item of rawFoundEmails) {
    const key = item.email.toLowerCase();
    if (!uniqueEmails.has(key)) {
      uniqueEmails.set(key, item);
    }
  }

  const contactsList: FoundContact[] = [];

  for (const { email, source } of uniqueEmails.values()) {
    const userPart = email.split("@")[0].toLowerCase();
    let type: FoundContact["type"] = "general";
    let role: string | null = null;
    let confidence = 75;

    if (OWNER_ROLES.test(userPart)) {
      type = "owner";
      role = "Owner / Founder";
      confidence = 90;
    } else if (TEAM_ROLES.test(userPart)) {
      type = "team";
      role = "Team / Estimator";
      confidence = 80;
    } else if (userPart === "contact" || userPart === "info" || userPart === "hello") {
      type = "contact";
      role = "General Contact";
      confidence = 85;
    } else if (userPart === "sales") {
      type = "executive";
      role = "Sales Department";
      confidence = 85;
    } else if (userPart.includes(".") || userPart.length > 3) {
      type = "team";
      const nameGuess = userPart
        .replace(/[._-]/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      role = "Direct Contact";
      confidence = 88;
      contactsList.push({
        email,
        name: nameGuess,
        role,
        type,
        sourceUrl: source,
        confidence,
      });
      continue;
    }

    contactsList.push({
      email,
      name: null,
      role,
      type,
      sourceUrl: source,
      confidence,
    });
  }

  // Optional verification step
  if (options?.verifyResults !== false) {
    for (const contact of contactsList) {
      try {
        contact.verification = await verifyEmailAddress(contact.email, { skipSmtp: true });
      } catch {
        // ignore
      }
    }
  }

  // Sort contacts: Valid verification first, then highest confidence
  contactsList.sort((a, b) => {
    const aScore = (a.verification?.score ?? 50) + a.confidence;
    const bScore = (b.verification?.score ?? 50) + b.confidence;
    return bScore - aScore;
  });

  const primary = contactsList[0]?.email || null;
  const ownerContact = contactsList.find((c) => c.type === "owner" || c.name);

  return {
    query: rawQuery,
    domain,
    websiteUrl: baseUrl,
    companyName: metaCompanyName || domain.replace(/\.[a-z]+$/i, ""),
    phone: metaPhone,
    socials: {
      linkedin: metaLinkedin,
      facebook: metaFacebook,
      instagram: metaInstagram,
    },
    contacts: contactsList,
    primaryEmail: primary,
    ownerName: ownerContact?.name || null,
    ownerRole: ownerContact?.role || null,
    pagesChecked,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Batch find emails across a list of websites or domains.
 */
export async function findEmailsBatch(
  domains: string[],
  options?: { verifyResults?: boolean; concurrency?: number },
): Promise<{
  total: number;
  withEmailCount: number;
  totalEmailsFound: number;
  results: EmailFinderResult[];
}> {
  const cleanList = [...new Set(domains.map((d) => d.trim()).filter(Boolean))].slice(0, 100);
  const concurrency = options?.concurrency ?? 4;
  const results: EmailFinderResult[] = [];

  for (let i = 0; i < cleanList.length; i += concurrency) {
    const chunk = cleanList.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((d) => findEmailsForDomain(d, options)),
    );
    results.push(...chunkResults);
  }

  const withEmailCount = results.filter((r) => r.contacts.length > 0 && r.primaryEmail).length;
  const totalEmailsFound = results.reduce((sum, r) => sum + r.contacts.length, 0);

  return {
    total: results.length,
    withEmailCount,
    totalEmailsFound,
    results,
  };
}
