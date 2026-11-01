import { prisma } from "@/lib/prisma";
import { resolvePlatformKey } from "@/lib/platform-keys";
import { resolveDomainMx } from "@/lib/email-verifier";
import { findExistingLead } from "./lead-identity";
import { extractWebsitePeople, pickBestEmail } from "./website-people";
import { scrapeWebsiteSocialPack } from "./website-social-pack";
import { discoverOwnerFromSearch, plausiblePersonName } from "./owner-discovery";
import { searchPublicWeb } from "./web-search";
import { enrichCompanyFromWebsite } from "./ninjapear";
import {
  cleanDomain,
  classifyEmail,
  classifyPhone,
  classifyRole,
  splitFullName,
} from "./sme-intelligence";

export type WaterfallInput = {
  leadId?: string;
  businessName: string;
  website?: string | null;
  ownerName?: string | null;
  ownerTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  address?: string | null;
  industry?: string | null;
};

export type WaterfallStepTrace = {
  step: string;
  provider: string;
  status: "hit" | "partial" | "miss" | "skipped";
  foundFields: string[];
};

export type WaterfallResult = {
  leadId: string | null;
  businessName: string;
  ownerName: string | null;
  ownerTitle: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string;
  industry: string | null;
  linkedinUrl: string | null;
  facebook: string | null;
  instagram: string | null;
  /** Whether verified contact info (email, phone, or owner) was found */
  foundVerifiedContact: boolean;
  /** Which fields were newly discovered or verified during this waterfall run */
  newlyFoundFields: Array<"email" | "phone" | "ownerName" | "website" | "linkedin">;
  /** Primary source that satisfied the waterfall */
  winningSource: string | null;
  /** All sources checked in sequence */
  sourcesChecked: string[];
  trace: WaterfallStepTrace[];
};

const DISPOSABLE_CHECK = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
]);

const EMAIL_SYNTAX_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Fast verification gate for candidate emails:
 * 1. Syntax check
 * 2. Disposable / placeholder domain rejection
 * 3. Live DNS MX record resolution
 */
export async function verifyCandidateEmail(
  rawEmail: string | null | undefined,
): Promise<{ valid: boolean; normalized: string | null }> {
  if (!rawEmail) return { valid: false, normalized: null };
  const cleaned = rawEmail.trim().toLowerCase();
  if (!EMAIL_SYNTAX_REGEX.test(cleaned)) {
    return { valid: false, normalized: null };
  }
  const domain = cleaned.split("@")[1];
  if (
    !domain ||
    DISPOSABLE_CHECK.has(domain) ||
    /^(example|test|domain|yoursite|yourdomain|email|sentry|wixpress)\./i.test(
      domain,
    ) ||
    /\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(domain)
  ) {
    return { valid: false, normalized: null };
  }

  try {
    const mx = await withTimeout(resolveDomainMx(domain), 2000, {
      mxRecords: [{ host: "fallback.mx", priority: 10 }],
      domainExists: true,
    });
    if (!mx.domainExists || mx.mxRecords.length === 0) {
      return { valid: false, normalized: null };
    }
    return { valid: true, normalized: cleaned };
  } catch {
    return { valid: true, normalized: cleaned };
  }
}

function isValidPhoneCandidate(rawPhone: string | null | undefined): boolean {
  if (!rawPhone) return false;
  const digits = rawPhone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * External API Provider 1: Apollo.io People Match & Search
 */
async function queryApolloApi(params: {
  domain: string | null;
  businessName: string;
  ownerName: string | null;
}): Promise<{
  email: string | null;
  phone: string | null;
  ownerName: string | null;
  ownerTitle: string | null;
  linkedinUrl: string | null;
} | null> {
  const apiKey = (await resolvePlatformKey("apolloApiKey")).trim();
  if (!apiKey) return null;

  try {
    const { firstName, lastName } = splitFullName(params.ownerName);
    const response = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        api_key: apiKey,
        domain: params.domain || undefined,
        organization_name: params.businessName || undefined,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        name: params.ownerName || undefined,
        reveal_personal_emails: true,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        person?: {
          name?: string;
          title?: string;
          email?: string;
          email_status?: string;
          linkedin_url?: string;
          phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }>;
        };
      };
      if (data.person) {
        const p = data.person;
        const phone =
          p.phone_numbers?.[0]?.sanitized_number ||
          p.phone_numbers?.[0]?.raw_number ||
          null;
        return {
          email: p.email || null,
          phone,
          ownerName: p.name || null,
          ownerTitle: p.title || null,
          linkedinUrl: p.linkedin_url || null,
        };
      }
    }

    // Fallback: Apollo Mixed People Search for company executives if no exact person match
    if (params.domain) {
      const searchRes = await fetch("https://api.apollo.io/v1/mixed_people/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          api_key: apiKey,
          q_organization_domains: params.domain,
          person_titles: [
            "owner",
            "founder",
            "ceo",
            "president",
            "managing partner",
            "principal",
            "general manager",
          ],
          page: 1,
          per_page: 3,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as {
          people?: Array<{
            name?: string;
            title?: string;
            email?: string;
            linkedin_url?: string;
            phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }>;
          }>;
        };
        const top = searchData.people?.[0];
        if (top) {
          return {
            email: top.email && !top.email.includes("email_not_unlocked") ? top.email : null,
            phone:
              top.phone_numbers?.[0]?.sanitized_number ||
              top.phone_numbers?.[0]?.raw_number ||
              null,
            ownerName: top.name || null,
            ownerTitle: top.title || null,
            linkedinUrl: top.linkedin_url || null,
          };
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * External API Provider 2: Hunter.io Domain Search & Email Finder
 */
async function queryHunterApi(params: {
  domain: string | null;
  businessName: string;
  ownerName: string | null;
}): Promise<{
  email: string | null;
  phone: string | null;
  ownerName: string | null;
  ownerTitle: string | null;
  linkedinUrl: string | null;
} | null> {
  const apiKey = (await resolvePlatformKey("hunterApiKey")).trim();
  if (!apiKey || (!params.domain && !params.businessName)) return null;

  try {
    // 1. If we have an owner name + domain, try Email Finder first
    if (params.ownerName && params.domain) {
      const { firstName, lastName } = splitFullName(params.ownerName);
      if (firstName && lastName) {
        const finderUrl = new URL("https://api.hunter.io/v2/email-finder");
        finderUrl.searchParams.set("domain", params.domain);
        finderUrl.searchParams.set("first_name", firstName);
        finderUrl.searchParams.set("last_name", lastName);
        finderUrl.searchParams.set("api_key", apiKey);

        const res = await fetch(finderUrl.toString(), {
          signal: AbortSignal.timeout(7000),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            data?: {
              email?: string;
              position?: string;
              phone_number?: string;
              linkedin_url?: string;
            };
          };
          if (json.data?.email) {
            return {
              email: json.data.email,
              phone: json.data.phone_number || null,
              ownerName: params.ownerName,
              ownerTitle: json.data.position || null,
              linkedinUrl: json.data.linkedin_url || null,
            };
          }
        }
      }
    }

    // 2. Domain Search fallback
    const domainUrl = new URL("https://api.hunter.io/v2/domain-search");
    if (params.domain) {
      domainUrl.searchParams.set("domain", params.domain);
    } else {
      domainUrl.searchParams.set("company", params.businessName);
    }
    domainUrl.searchParams.set("limit", "5");
    domainUrl.searchParams.set("api_key", apiKey);

    const res = await fetch(domainUrl.toString(), {
      signal: AbortSignal.timeout(7500),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        emails?: Array<{
          value?: string;
          type?: string;
          first_name?: string;
          last_name?: string;
          position?: string;
          phone_number?: string;
          linkedin?: string;
        }>;
      };
    };

    const emails = json.data?.emails ?? [];
    if (emails.length === 0) return null;

    // Prefer executive / personal email over generic
    const execEmail =
      emails.find((e) =>
        /owner|founder|ceo|president|partner|principal|director/i.test(
          e.position || "",
        ),
      ) ||
      emails.find((e) => e.type === "personal") ||
      emails[0];

    const fullName = [execEmail?.first_name, execEmail?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      email: execEmail?.value || null,
      phone: execEmail?.phone_number || null,
      ownerName: fullName || null,
      ownerTitle: execEmail?.position || null,
      linkedinUrl: execEmail?.linkedin || null,
    };
  } catch {
    return null;
  }
}

/**
 * External API Provider 3: Prospeo Email Finder & Domain Search
 */
async function queryProspeoApi(params: {
  domain: string | null;
  businessName: string;
  ownerName: string | null;
}): Promise<{
  email: string | null;
  ownerName: string | null;
  ownerTitle: string | null;
} | null> {
  const apiKey = (await resolvePlatformKey("prospeoApiKey")).trim();
  if (!apiKey || !params.domain) return null;

  try {
    if (params.ownerName) {
      const { firstName, lastName } = splitFullName(params.ownerName);
      if (firstName && lastName) {
        const res = await fetch("https://api.prospeo.io/email-finder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-KEY": apiKey,
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            company: params.domain,
          }),
          signal: AbortSignal.timeout(7500),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            response?: { email?: string; email_status?: string };
          };
          if (json.response?.email) {
            return {
              email: json.response.email,
              ownerName: params.ownerName,
              ownerTitle: null,
            };
          }
        }
      }
    }

    const domainRes = await fetch("https://api.prospeo.io/domain-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KEY": apiKey,
      },
      body: JSON.stringify({
        company: params.domain,
        limit: 5,
      }),
      signal: AbortSignal.timeout(7500),
    });

    if (domainRes.ok) {
      const json = (await domainRes.json()) as {
        response?: {
          email_list?: Array<{
            email?: string;
            first_name?: string;
            last_name?: string;
            job_title?: string;
          }>;
        };
      };
      const first = json.response?.email_list?.[0];
      if (first?.email) {
        const fullName = [first.first_name, first.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
        return {
          email: first.email,
          ownerName: fullName || null,
          ownerTitle: first.job_title || null,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Executes the 5-Stage Sequential Waterfall Enrichment for a single lead or datasheet row.
 * Stops querying external providers as soon as verified Email + Phone (+ Owner) are satisfied.
 */
export async function runWaterfallEnrichment(
  input: WaterfallInput,
): Promise<WaterfallResult> {
  const businessName = input.businessName.trim();
  const initialEmail = input.email?.trim() || null;
  const initialPhone = input.phone?.trim() || null;
  const initialOwner = input.ownerName?.trim() || null;
  const initialWebsite = input.website?.trim() || null;

  let email: string | null = null;
  let emailVerified = false;
  let phone: string | null = isValidPhoneCandidate(initialPhone)
    ? initialPhone
    : null;
  let ownerName: string | null =
    initialOwner && plausiblePersonName(initialOwner, businessName)
      ? initialOwner
      : null;
  let ownerTitle: string | null = input.ownerTitle?.trim() || null;
  let website: string | null = initialWebsite;
  let city: string | null = input.city?.trim() || null;
  let state: string | null = input.state?.trim() || null;
  let country: string = input.country?.trim() || "US";
  let industry: string | null = input.industry?.trim() || null;
  let linkedinUrl: string | null = null;
  let facebook: string | null = null;
  let instagram: string | null = null;
  let matchedLeadId: string | null = input.leadId || null;

  const trace: WaterfallStepTrace[] = [];
  const sourcesChecked: string[] = [];
  let winningSource: string | null = null;

  // Pre-verify initial email if user provided one
  if (initialEmail) {
    const check = await verifyCandidateEmail(initialEmail);
    if (check.valid && check.normalized) {
      email = check.normalized;
      emailVerified = true;
    }
  }

  const isComplete = () => Boolean(email && emailVerified && phone && ownerName);

  // ============================================================================
  // STAGE 1: CHECK OUR INTERNAL POSTGRESQL DATABASE FIRST (Cost: $0)
  // ============================================================================
  sourcesChecked.push("Internal Database");
  let dbLead = matchedLeadId
    ? await prisma.lead.findUnique({ where: { id: matchedLeadId } })
    : await findExistingLead({
        name: businessName,
        address: input.address || [city, state].filter(Boolean).join(", "),
        phone: phone ?? undefined,
        website: website ?? undefined,
      });

  if (!dbLead && businessName) {
    dbLead = await prisma.lead.findFirst({
      where: {
        businessName: { equals: businessName, mode: "insensitive" },
        ...(state ? { state: { equals: state, mode: "insensitive" } } : {}),
      },
      orderBy: { leadScore: "desc" },
    });
  }

  const dbFoundFields: string[] = [];
  if (dbLead) {
    matchedLeadId = dbLead.id;
    if (!website && dbLead.website) {
      website = dbLead.website;
      dbFoundFields.push("website");
    }
    if (!phone && isValidPhoneCandidate(dbLead.phone)) {
      phone = dbLead.phone;
      dbFoundFields.push("phone");
    }
    if (
      !ownerName &&
      dbLead.ownerName &&
      plausiblePersonName(dbLead.ownerName, businessName)
    ) {
      ownerName = dbLead.ownerName;
      ownerTitle = ownerTitle || dbLead.ownerTitle || null;
      dbFoundFields.push("ownerName");
    }
    if (!email && dbLead.email) {
      const check = await verifyCandidateEmail(dbLead.email);
      if (check.valid && check.normalized) {
        email = check.normalized;
        emailVerified = true;
        dbFoundFields.push("email");
      }
    }
    city = city || dbLead.city || null;
    state = state || dbLead.state || null;
    country = dbLead.country || country;
    industry = industry || dbLead.industry || null;
    linkedinUrl =
      linkedinUrl ||
      dbLead.linkedinOwnerUrl ||
      dbLead.linkedinCompanyUrl ||
      dbLead.linkedinUrl ||
      null;
    facebook = facebook || dbLead.facebook || null;
    instagram = instagram || dbLead.instagram || null;
  }

  trace.push({
    step: "Stage 1",
    provider: "Internal Database",
    status:
      dbFoundFields.length > 0
        ? isComplete()
          ? "hit"
          : "partial"
        : "miss",
    foundFields: dbFoundFields,
  });

  if (dbFoundFields.length > 0 && !winningSource) {
    winningSource = "Internal Database";
  }

  // ============================================================================
  // STAGE 2: FIRST-PARTY WEBSITE & SOCIAL EXTRACTION (If Still Missing)
  // ============================================================================
  const locationLabel = [city, state, country].filter(Boolean).join(", ");

  // If website is missing, try discovering official domain via Serper first
  if (!website && !isComplete() && businessName) {
    try {
      const webHits = await withTimeout(
        searchPublicWeb(`"${businessName}" ${locationLabel} official website`, 4),
        3500,
        [],
      );
      const directoryRegex =
        /(yelp\.com|facebook\.com|instagram\.com|linkedin\.com|bbb\.org|houzz\.com|nextdoor\.com|angi\.com|homeadvisor\.com|thumbtack\.com|yellowpages\.com|mapquest\.com|manta\.com)/i;
      const officialHit = webHits.find(
        (h) => h.url && !directoryRegex.test(h.url),
      );
      if (officialHit?.url) {
        try {
          const u = new URL(officialHit.url);
          website = `${u.protocol}//${u.hostname}`;
        } catch {
          website = officialHit.url;
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!isComplete() && website) {
    sourcesChecked.push("Official Website");
    const webFoundFields: string[] = [];

    const [people, socialPack] = await Promise.all([
      !email || !ownerName
        ? withTimeout(extractWebsitePeople(website, { budgetMs: 7000 }), 8000, {
            owner: null,
            team: [],
            email: null,
            emailSourceUrl: null,
            pagesChecked: [],
          })
        : Promise.resolve(null),
      !linkedinUrl || !facebook
        ? withTimeout(scrapeWebsiteSocialPack(website), 6000, null)
        : Promise.resolve(null),
    ]);

    if (
      !ownerName &&
      people?.owner?.name &&
      plausiblePersonName(people.owner.name, businessName)
    ) {
      ownerName = people.owner.name;
      ownerTitle = ownerTitle || people.owner.role || "Owner";
      webFoundFields.push("ownerName");
    }

    if (!email && people?.email) {
      const check = await verifyCandidateEmail(people.email);
      if (check.valid && check.normalized) {
        email = check.normalized;
        emailVerified = true;
        webFoundFields.push("email");
      }
    }

    if (socialPack) {
      if (!linkedinUrl && (socialPack.linkedinOwner || socialPack.linkedinCompany)) {
        linkedinUrl = socialPack.linkedinOwner || socialPack.linkedinCompany;
        webFoundFields.push("linkedin");
      }
      facebook = facebook || socialPack.facebook || null;
      instagram = instagram || socialPack.instagram || null;
    }

    trace.push({
      step: "Stage 2",
      provider: "Official Website Scraper",
      status:
        webFoundFields.length > 0
          ? isComplete()
            ? "hit"
            : "partial"
          : "miss",
      foundFields: webFoundFields,
    });

    if (webFoundFields.includes("email") || (webFoundFields.length > 0 && !winningSource)) {
      winningSource = "Official Website";
    }
  }

  // ============================================================================
  // STAGE 3: PUBLIC SEARCH & DIRECTORY SNIPPETS (Serper)
  // ============================================================================
  if (!isComplete() && businessName) {
    sourcesChecked.push("Public Web Search");
    const searchFoundFields: string[] = [];

    if (!ownerName) {
      const ownerSearch = await withTimeout(
        discoverOwnerFromSearch(businessName, locationLabel),
        4500,
        {
          ownerName: null,
          ownerRole: null,
          ownerLinkedInUrl: null,
          confidence: 0,
          sourceUrl: null,
        },
      );
      if (
        ownerSearch.ownerName &&
        plausiblePersonName(ownerSearch.ownerName, businessName)
      ) {
        ownerName = ownerSearch.ownerName;
        ownerTitle = ownerTitle || ownerSearch.ownerRole || "Owner";
        linkedinUrl = linkedinUrl || ownerSearch.ownerLinkedInUrl || null;
        searchFoundFields.push("ownerName");
      }
    }

    if (!email || !phone) {
      const query = `"${businessName}" ${locationLabel} email OR phone OR contact`;
      const hits = await withTimeout(searchPublicWeb(query, 5), 4000, []);
      const snippetEmails = new Set<string>();

      for (const hit of hits) {
        const text = `${hit.title} ${hit.snippet}`;
        if (!email) {
          for (const m of text.matchAll(
            /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}\b/g,
          )) {
            snippetEmails.add(m[0]);
          }
        }
        if (!phone) {
          const phoneMatch = text.match(
            /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/,
          );
          if (phoneMatch && isValidPhoneCandidate(phoneMatch[0])) {
            phone = phoneMatch[0].trim();
            searchFoundFields.push("phone");
          }
        }
      }

      if (!email && snippetEmails.size > 0) {
        const bestCandidate = pickBestEmail(snippetEmails, ownerName, website);
        if (bestCandidate) {
          const check = await verifyCandidateEmail(bestCandidate);
          if (check.valid && check.normalized) {
            email = check.normalized;
            emailVerified = true;
            searchFoundFields.push("email");
          }
        }
      }
    }

    trace.push({
      step: "Stage 3",
      provider: "Public Web & Directory Snippets",
      status:
        searchFoundFields.length > 0
          ? isComplete()
            ? "hit"
            : "partial"
          : "miss",
      foundFields: searchFoundFields,
    });

    if (searchFoundFields.includes("email") || (searchFoundFields.length > 0 && !winningSource)) {
      winningSource = "Public Web Search";
    }
  }

  // ============================================================================
  // STAGE 4: SEQUENTIAL EXTERNAL ENRICHMENT APIs (ONE BY ONE)
  // ============================================================================
  const domainClean = cleanDomain(website);

  // 4A. Provider 1: Apollo.io API
  if (!isComplete()) {
    const apolloKey = (await resolvePlatformKey("apolloApiKey")).trim();
    if (apolloKey) {
      sourcesChecked.push("Apollo.io API");
      const apolloFields: string[] = [];
      const apolloRes = await queryApolloApi({
        domain: domainClean,
        businessName,
        ownerName,
      });

      if (apolloRes) {
        if (!ownerName && apolloRes.ownerName && plausiblePersonName(apolloRes.ownerName, businessName)) {
          ownerName = apolloRes.ownerName;
          ownerTitle = ownerTitle || apolloRes.ownerTitle || "Owner";
          apolloFields.push("ownerName");
        }
        if (!phone && isValidPhoneCandidate(apolloRes.phone)) {
          phone = apolloRes.phone;
          apolloFields.push("phone");
        }
        if (!linkedinUrl && apolloRes.linkedinUrl) {
          linkedinUrl = apolloRes.linkedinUrl;
          apolloFields.push("linkedin");
        }
        if (!email && apolloRes.email) {
          const check = await verifyCandidateEmail(apolloRes.email);
          if (check.valid && check.normalized) {
            email = check.normalized;
            emailVerified = true;
            apolloFields.push("email");
          }
        }
      }

      trace.push({
        step: "Stage 4.1",
        provider: "Apollo.io API",
        status: apolloFields.length > 0 ? (isComplete() ? "hit" : "partial") : "miss",
        foundFields: apolloFields,
      });

      if (apolloFields.includes("email") || (apolloFields.length > 0 && !winningSource)) {
        winningSource = "Apollo.io API";
      }
    } else {
      trace.push({
        step: "Stage 4.1",
        provider: "Apollo.io API",
        status: "skipped",
        foundFields: [],
      });
    }
  }

  // 4B. Provider 2: Hunter.io API (Only called if email or owner still missing)
  if (!email || !ownerName) {
    const hunterKey = (await resolvePlatformKey("hunterApiKey")).trim();
    if (hunterKey) {
      sourcesChecked.push("Hunter.io API");
      const hunterFields: string[] = [];
      const hunterRes = await queryHunterApi({
        domain: domainClean,
        businessName,
        ownerName,
      });

      if (hunterRes) {
        if (!ownerName && hunterRes.ownerName && plausiblePersonName(hunterRes.ownerName, businessName)) {
          ownerName = hunterRes.ownerName;
          ownerTitle = ownerTitle || hunterRes.ownerTitle || "Owner";
          hunterFields.push("ownerName");
        }
        if (!phone && isValidPhoneCandidate(hunterRes.phone)) {
          phone = hunterRes.phone;
          hunterFields.push("phone");
        }
        if (!linkedinUrl && hunterRes.linkedinUrl) {
          linkedinUrl = hunterRes.linkedinUrl;
          hunterFields.push("linkedin");
        }
        if (!email && hunterRes.email) {
          const check = await verifyCandidateEmail(hunterRes.email);
          if (check.valid && check.normalized) {
            email = check.normalized;
            emailVerified = true;
            hunterFields.push("email");
          }
        }
      }

      trace.push({
        step: "Stage 4.2",
        provider: "Hunter.io API",
        status: hunterFields.length > 0 ? (isComplete() ? "hit" : "partial") : "miss",
        foundFields: hunterFields,
      });

      if (hunterFields.includes("email") || (hunterFields.length > 0 && !winningSource)) {
        winningSource = "Hunter.io API";
      }
    } else {
      trace.push({
        step: "Stage 4.2",
        provider: "Hunter.io API",
        status: "skipped",
        foundFields: [],
      });
    }
  }

  // 4C. Provider 3: Prospeo API (Only called if email still missing)
  if (!email) {
    const prospeoKey = (await resolvePlatformKey("prospeoApiKey")).trim();
    if (prospeoKey && domainClean) {
      sourcesChecked.push("Prospeo API");
      const prospeoFields: string[] = [];
      const prospeoRes = await queryProspeoApi({
        domain: domainClean,
        businessName,
        ownerName,
      });

      if (prospeoRes) {
        if (!ownerName && prospeoRes.ownerName && plausiblePersonName(prospeoRes.ownerName, businessName)) {
          ownerName = prospeoRes.ownerName;
          ownerTitle = ownerTitle || prospeoRes.ownerTitle || "Owner";
          prospeoFields.push("ownerName");
        }
        if (!email && prospeoRes.email) {
          const check = await verifyCandidateEmail(prospeoRes.email);
          if (check.valid && check.normalized) {
            email = check.normalized;
            emailVerified = true;
            prospeoFields.push("email");
          }
        }
      }

      trace.push({
        step: "Stage 4.3",
        provider: "Prospeo API",
        status: prospeoFields.length > 0 ? (isComplete() ? "hit" : "partial") : "miss",
        foundFields: prospeoFields,
      });

      if (prospeoFields.includes("email") || (prospeoFields.length > 0 && !winningSource)) {
        winningSource = "Prospeo API";
      }
    } else {
      trace.push({
        step: "Stage 4.3",
        provider: "Prospeo API",
        status: "skipped",
        foundFields: [],
      });
    }
  }

  // 4D. Provider 4: NinjaPear API (Executive & Social fallback from website)
  if ((!ownerName || !facebook || !instagram) && website) {
    const ninjapearKey = (await resolvePlatformKey("ninjapearApiKey")).trim();
    if (ninjapearKey) {
      sourcesChecked.push("NinjaPear API");
      const npFields: string[] = [];
      const npRes = await enrichCompanyFromWebsite(website);
      if (npRes) {
        if (!ownerName && npRes.ownerName && plausiblePersonName(npRes.ownerName, businessName)) {
          ownerName = npRes.ownerName;
          ownerTitle = ownerTitle || npRes.ownerTitle || "Owner";
          npFields.push("ownerName");
        }
        if (!facebook && npRes.facebookUrl) facebook = npRes.facebookUrl;
        if (!instagram && npRes.instagramUrl) instagram = npRes.instagramUrl;
      }

      trace.push({
        step: "Stage 4.4",
        provider: "NinjaPear API",
        status: npFields.length > 0 ? "partial" : "miss",
        foundFields: npFields,
      });

      if (npFields.length > 0 && !winningSource) {
        winningSource = "NinjaPear API";
      }
    }
  }

  // ============================================================================
  // STAGE 5: DETERMINE NEWLY DISCOVERED FIELDS & PERSIST TO INTERNAL DB
  // ============================================================================
  const newlyFoundFields: Array<
    "email" | "phone" | "ownerName" | "website" | "linkedin"
  > = [];
  if (email && emailVerified && email.toLowerCase() !== initialEmail?.toLowerCase()) {
    newlyFoundFields.push("email");
  }
  if (phone && phone !== initialPhone) {
    newlyFoundFields.push("phone");
  }
  if (ownerName && ownerName.toLowerCase() !== initialOwner?.toLowerCase()) {
    newlyFoundFields.push("ownerName");
  }
  if (website && website.toLowerCase() !== initialWebsite?.toLowerCase()) {
    newlyFoundFields.push("website");
  }
  if (linkedinUrl) {
    newlyFoundFields.push("linkedin");
  }

  const foundVerifiedContact = Boolean(
    (email && emailVerified) || phone || ownerName,
  );

  // Persist or update the enriched lead in PostgreSQL so future waterfall runs hit Stage 1 for free
  if (businessName && foundVerifiedContact) {
    const roleCheck = classifyRole(ownerTitle);
    const emailClass = classifyEmail(email, website);
    const phoneClass = classifyPhone(phone);
    const dmFound = Boolean(ownerName && !roleCheck.isGatekeeper);
    const { firstName: dmFirstName, lastName: dmLastName } = splitFullName(ownerName);

    const leadUpdateData = {
      businessName,
      ownerName: ownerName ?? undefined,
      ownerTitle: ownerTitle ?? undefined,
      email: email ?? undefined,
      phone: phone ?? undefined,
      website: website ?? undefined,
      city: city ?? undefined,
      state: state ?? undefined,
      country,
      industry: industry ?? undefined,
      linkedinUrl: linkedinUrl ?? undefined,
      linkedinOwnerUrl:
        linkedinUrl && linkedinUrl.includes("/in/") ? linkedinUrl : undefined,
      linkedinCompanyUrl:
        linkedinUrl && !linkedinUrl.includes("/in/") ? linkedinUrl : undefined,
      facebook: facebook ?? undefined,
      instagram: instagram ?? undefined,
      peopleEnrichedAt: new Date(),
      verificationStatus: "verified",
      decisionMakerFound: dmFound,
      decisionMakerName: dmFound ? ownerName : undefined,
      decisionMakerFirstName: dmFound ? dmFirstName : undefined,
      decisionMakerLastName: dmFound ? dmLastName : undefined,
      decisionMakerTitle: dmFound ? ownerTitle : undefined,
      decisionMakerRole: dmFound ? roleCheck.normalizedRole || "Owner" : undefined,
      decisionMakerEmail:
        dmFound && emailClass.emailType !== "generic" ? email : undefined,
      decisionMakerEmailType: emailClass.emailType,
      decisionMakerEmailVerification:
        email && emailVerified ? "verified" : "unverified",
      decisionMakerDirectPhone: phone ?? undefined,
      decisionMakerPhoneType: phoneClass.phoneType,
      decisionMakerSource: winningSource || "Waterfall Enrichment",
      decisionMakerVerified: Boolean(emailVerified || phone),
      decisionMakerVerificationDate: new Date(),
      sourcesCount: sourcesChecked.length,
      sourcesUsedJson: JSON.stringify(sourcesChecked),
      lastVerifiedAt: new Date(),
    };

    try {
      if (matchedLeadId) {
        const updated = await prisma.lead.update({
          where: { id: matchedLeadId },
          data: leadUpdateData,
        });
        matchedLeadId = updated.id;
      } else {
        const created = await prisma.lead.create({
          data: {
            ...leadUpdateData,
            leadScore: email && phone ? 82 : email ? 74 : 65,
            qualityTier: email && phone ? "hot" : "warm",
          },
        });
        matchedLeadId = created.id;
      }
    } catch {
      // Ignore unique constraint collision on phone/mapsLink and match existing
      const fallbackExisting = await findExistingLead({
        name: businessName,
        phone: phone ?? undefined,
        website: website ?? undefined,
      });
      if (fallbackExisting) {
        matchedLeadId = fallbackExisting.id;
      }
    }
  }

  return {
    leadId: matchedLeadId,
    businessName,
    ownerName,
    ownerTitle,
    email,
    emailVerified,
    phone,
    website,
    city,
    state,
    country,
    industry,
    linkedinUrl,
    facebook,
    instagram,
    foundVerifiedContact,
    newlyFoundFields,
    winningSource,
    sourcesChecked,
    trace,
  };
}
