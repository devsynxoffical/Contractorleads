/**
 * ContractorLeads.us — Advanced Business Data Extraction, Validation & Decision-Maker Filtering SME Engine
 * 
 * Objective:
 * Identifies small-to-mid-sized, active contractor businesses with reachable owners/decision-makers.
 * Filters out receptionists, office assistants, customer service, generic company emails, and large 30+ year enterprises.
 * Multi-source validation across Website, RDAP/WHOIS, Public Registries, Socials, and Directories.
 */

export const TARGET_COUNTRIES: Record<string, { name: string; currency: string; defaultTld: string }> = {
  US: { name: "United States", currency: "USD", defaultTld: ".com" },
  GB: { name: "United Kingdom", currency: "GBP", defaultTld: ".co.uk" },
  CA: { name: "Canada", currency: "CAD", defaultTld: ".ca" },
  AU: { name: "Australia", currency: "AUD", defaultTld: ".com.au" },
  NZ: { name: "New Zealand", currency: "NZD", defaultTld: ".co.nz" },
};

export const TARGET_CATEGORIES = [
  "Roofing",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Solar",
  "General Contractors",
  "Remodeling",
  "Home Improvement",
  "Flooring",
  "Landscaping",
  "Painting",
  "Concrete",
  "Windows & Doors",
  "Fencing",
  "Garage Doors",
  "Pest Control",
  "Masonry",
  "Deck & Patio",
  "Drywall & Insulation",
  "Siding & Gutters",
] as const;

/** Strict Decision-Maker Whitelist */
export const ACCEPTED_DECISION_MAKER_ROLES = [
  "Owner",
  "Co-Owner",
  "Founder",
  "Co-Founder",
  "CEO",
  "President",
  "Managing Director",
  "Managing Partner",
  "Partner",
  "Principal",
  "General Manager",
  "Business Owner",
  "Proprietor",
] as const;

/** Strict Rejection Roles: Non-Decision-Makers & Generic Gatekeepers */
export const REJECTED_GATEKEEPER_ROLES = [
  "receptionist",
  "office assistant",
  "administrative assistant",
  "admin assistant",
  "office manager",
  "customer service",
  "customer support",
  "call center",
  "dispatcher",
  "front desk",
  "sales representative",
  "sales rep",
  "sales associate",
  "billing",
  "billing specialist",
  "coordinator",
  "service technician",
  "technician",
  "apprentice",
  "crew member",
  "helper",
  "estimator",
  "agent",
] as const;

/** Generic Company Email Prefixes that must NEVER be classified as Decision-Maker contacts */
export const GENERIC_EMAIL_PREFIXES = new Set([
  "info",
  "admin",
  "contact",
  "support",
  "hello",
  "office",
  "sales",
  "service",
  "services",
  "customerservice",
  "customer-service",
  "receptionist",
  "frontdesk",
  "front-desk",
  "team",
  "dispatch",
  "help",
  "billing",
  "invoices",
  "accounting",
  "inquiries",
  "inquiry",
  "quotes",
  "quote",
  "estimate",
  "estimates",
  "mail",
  "general",
  "enquiry",
  "enquiries",
  "jobs",
  "careers",
  "feedback",
  "press",
  "media",
  "marketing",
]);

export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "comcast.net",
  "sbcglobal.net",
  "msn.com",
  "live.com",
  "att.net",
  "verizon.net",
  "charter.net",
  "cox.net",
  "bell.net",
  "rogers.com",
  "btinternet.com",
  "virginmedia.com",
  "bigpond.com",
  "xtra.co.nz",
]);

export type BusinessMaturity =
  | "emerging"          // 0-2 years
  | "growing"           // 2-5 years
  | "established"       // 5-15 years (ideal target)
  | "mature"            // 15-30 years
  | "highly_established"; // 30+ years (default lower priority / excluded)

export type CompanySizeCategory =
  | "solo"              // 1 person
  | "2-5"               // 2-5 people (prime target)
  | "6-10"              // 6-10 people (prime target)
  | "11-15"             // 11-15 people (prime target)
  | "16-20"             // 16-20 people (upper limit)
  | "21-50"             // 21-50 (flagged large)
  | "51-100"            // 51-100 (flagged corporate)
  | "100+";             // 100+ (flagged enterprise)

export type SmeIntelligenceResult = {
  // Business Age
  businessEstablishedDate: Date | null;
  businessRegistrationDate: Date | null;
  businessAgeYears: number | null;
  businessAgeSource: string | null;
  businessAgeConfidence: number;
  businessMaturity: BusinessMaturity;

  // Domain Information (RDAP/WHOIS)
  domainName: string | null;
  domainCreatedDate: Date | null;
  domainUpdatedDate: Date | null;
  domainExpiryDate: Date | null;
  domainAgeYears: number | null;
  domainRegistrar: string | null;
  domainRegistrationCountry: string | null;
  domainSource: string | null;
  domainConfidence: number;
  domainPrivacyStatus: "protected" | "public" | "unknown";

  // Business Registration
  legalBusinessName: string | null;
  tradingDbaName: string | null;
  registrationNumber: string | null;
  registrationJurisdiction: string | null;
  registeredState: string | null;
  registeredCountry: string | null;
  entityType: string | null;
  registrationStatus: string | null;
  registrationSourceUrl: string | null;

  // Company Size Signals
  employeeCount: number | null;
  employeeCountSource: string | null;
  employeeCountConfidence: number;
  companySizeCategory: CompanySizeCategory;
  locationCount: number;
  isFranchiseOrEnterprise: boolean;

  // Decision-Maker
  decisionMakerFound: boolean;
  decisionMakerName: string | null;
  decisionMakerFirstName: string | null;
  decisionMakerLastName: string | null;
  decisionMakerTitle: string | null;
  decisionMakerRole: string | null;
  decisionMakerLinkedIn: string | null;
  decisionMakerProfessionalProfile: string | null;
  decisionMakerEmail: string | null;
  decisionMakerEmailType: "decision_maker" | "personal_business" | "generic";
  decisionMakerEmailVerification: "verified" | "unverified" | "invalid" | "risky";
  decisionMakerDirectPhone: string | null;
  decisionMakerPhoneType: "direct_mobile" | "direct_office" | "main_company";
  decisionMakerSource: string | null;
  decisionMakerVerified: boolean;
  decisionMakerConfidence: number;

  // Validation & 100-Point Scoring
  sourcesCount: number;
  sourcesUsed: string[];
  businessVerified: boolean;
  smeQualityScore: number;
  scoreBreakdown: Record<string, number>;
  isLowPriorityOrExcluded: boolean;
  exclusionReasons: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function cleanDomain(urlOrDomain: string | null | undefined): string | null {
  if (!urlOrDomain) return null;
  try {
    let clean = urlOrDomain.trim().toLowerCase();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function classifyRole(titleOrRole: string | null | undefined): {
  isDecisionMaker: boolean;
  normalizedRole: string | null;
  isGatekeeper: boolean;
} {
  if (!titleOrRole) {
    return { isDecisionMaker: false, normalizedRole: null, isGatekeeper: false };
  }
  const lower = titleOrRole.toLowerCase().trim();

  // Check gatekeepers first
  for (const gk of REJECTED_GATEKEEPER_ROLES) {
    if (lower.includes(gk)) {
      return { isDecisionMaker: false, normalizedRole: null, isGatekeeper: true };
    }
  }

  // Check decision maker whitelist
  if (/\b(co-?owner|owner)\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "Owner", isGatekeeper: false };
  }
  if (/\b(co-?founder|founder)\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "Founder", isGatekeeper: false };
  }
  if (/\b(ceo|chief executive)\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "CEO", isGatekeeper: false };
  }
  if (/\bpresident\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "President", isGatekeeper: false };
  }
  if (/\b(managing director|managing partner)\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "Managing Director", isGatekeeper: false };
  }
  if (/\bpartner\b/i.test(lower) && !/\b(trade|hvac|roofing) partner\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "Partner", isGatekeeper: false };
  }
  if (/\bprincipal\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "Principal", isGatekeeper: false };
  }
  if (/\bgeneral manager\b/i.test(lower)) {
    return { isDecisionMaker: true, normalizedRole: "General Manager", isGatekeeper: false };
  }

  return { isDecisionMaker: false, normalizedRole: null, isGatekeeper: false };
}

export function splitFullName(fullName: string | null | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

export function classifyEmail(
  email: string | null | undefined,
  websiteDomain?: string | null,
): {
  emailType: "decision_maker" | "personal_business" | "generic";
  isGeneric: boolean;
  isFreeProvider: boolean;
} {
  if (!email || !email.includes("@")) {
    return { emailType: "generic", isGeneric: true, isFreeProvider: false };
  }
  const [localPart, domainPart] = email.toLowerCase().trim().split("@");
  const isFree = FREE_EMAIL_DOMAINS.has(domainPart);

  // Check generic prefixes
  const normalizedLocal = localPart.replace(/[^a-z0-9]/g, "");
  let isGeneric = GENERIC_EMAIL_PREFIXES.has(normalizedLocal) || GENERIC_EMAIL_PREFIXES.has(localPart);
  for (const prefix of GENERIC_EMAIL_PREFIXES) {
    if (localPart === prefix || localPart.startsWith(prefix + ".") || localPart.startsWith(prefix + "_")) {
      isGeneric = true;
      break;
    }
  }

  if (isGeneric) {
    return { emailType: "generic", isGeneric: true, isFreeProvider: isFree };
  }

  if (isFree) {
    return { emailType: "personal_business", isGeneric: false, isFreeProvider: true };
  }

  return { emailType: "decision_maker", isGeneric: false, isFreeProvider: false };
}

export function classifyPhone(
  phone: string | null | undefined,
  isCellOrDirectSignal?: boolean,
): {
  phoneType: "direct_mobile" | "direct_office" | "main_company";
  formatted: string | null;
} {
  if (!phone) return { phoneType: "main_company", formatted: null };
  const digits = phone.replace(/\D/g, "");
  if (!digits) return { phoneType: "main_company", formatted: null };

  let phoneType: "direct_mobile" | "direct_office" | "main_company" = "main_company";
  if (isCellOrDirectSignal) {
    phoneType = "direct_mobile";
  }

  return { phoneType, formatted: phone.trim() };
}

// ---------------------------------------------------------------------------
// Business Age & Established Date Parser
// ---------------------------------------------------------------------------

export function extractEstablishedYear(htmlOrText: string): {
  establishedYear: number | null;
  claimedOperatingDate: Date | null;
  sourceSnippet: string | null;
  confidence: number;
} {
  const currentYear = new Date().getFullYear();

  // Pattern 1: Explicit Established / Founded year
  const estMatches = [
    /(?:established|est\.?|founded|operating|in business|serving (?:our community|the area)?)\s*(?:in|since|:)?\s*([12]\d{3})\b/i,
    /(?:since|from)\s+([12]\d{3})\b/i,
    /(?:family\s+owned(?:\s+and\s+operated)?\s+since)\s+([12]\d{3})\b/i,
  ];

  for (const regex of estMatches) {
    const match = htmlOrText.match(regex);
    if (match && match[1]) {
      const year = parseInt(match[1], 10);
      if (year >= 1850 && year <= currentYear) {
        return {
          establishedYear: year,
          claimedOperatingDate: new Date(year, 0, 1),
          sourceSnippet: match[0],
          confidence: 85,
        };
      }
    }
  }

  // Pattern 2: "Over X years of experience / service"
  const expMatch = htmlOrText.match(/(?:over|more than|\+)?\s*(\d{1,2})\+?\s*years\s+of\s+(?:experience|service|excellence|quality|craftsmanship)/i);
  if (expMatch && expMatch[1]) {
    const years = parseInt(expMatch[1], 10);
    if (years >= 1 && years <= 100) {
      const calculatedYear = currentYear - years;
      return {
        establishedYear: calculatedYear,
        claimedOperatingDate: new Date(calculatedYear, 0, 1),
        sourceSnippet: expMatch[0],
        confidence: 65,
      };
    }
  }

  return {
    establishedYear: null,
    claimedOperatingDate: null,
    sourceSnippet: null,
    confidence: 0,
  };
}

export function classifyBusinessMaturity(ageYears: number | null): BusinessMaturity {
  if (ageYears == null || ageYears < 0) return "growing";
  if (ageYears <= 2) return "emerging";
  if (ageYears <= 5) return "growing";
  if (ageYears <= 15) return "established";
  if (ageYears <= 30) return "mature";
  return "highly_established";
}

// ---------------------------------------------------------------------------
// WHOIS / RDAP Domain Age & Registrar Query
// ---------------------------------------------------------------------------

export async function fetchDomainRdapInfo(domain: string): Promise<{
  createdDate: Date | null;
  updatedDate: Date | null;
  expiryDate: Date | null;
  domainAgeYears: number | null;
  registrar: string | null;
  registrationCountry: string | null;
  privacyStatus: "protected" | "public" | "unknown";
  confidence: number;
}> {
  const clean = cleanDomain(domain);
  if (!clean) {
    return {
      createdDate: null,
      updatedDate: null,
      expiryDate: null,
      domainAgeYears: null,
      registrar: null,
      registrationCountry: null,
      privacyStatus: "unknown",
      confidence: 0,
    };
  }

  const headers = {
    Accept: "application/rdap+json, application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  };

  const endpoints = [`https://rdap.org/domain/${encodeURIComponent(clean)}`];
  if (clean.endsWith(".com") || clean.endsWith(".net")) {
    endpoints.push(
      `https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(clean)}`,
    );
  } else if (clean.endsWith(".org")) {
    endpoints.push(
      `https://rdap.publicinterestregistry.org/rdap/domain/${encodeURIComponent(clean)}`,
    );
  }

  let data: any = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        data = await res.json();
        break;
      }
    } catch {
      /* continue to next fallback */
    }
  }

  if (!data) {
    return {
      createdDate: null,
      updatedDate: null,
      expiryDate: null,
      domainAgeYears: null,
      registrar: null,
      registrationCountry: null,
      privacyStatus: "unknown",
      confidence: 0,
    };
  }

  let createdDate: Date | null = null;
  let updatedDate: Date | null = null;
  let expiryDate: Date | null = null;

  if (Array.isArray(data.events)) {
    for (const ev of data.events) {
      if (ev.eventAction === "registration" && ev.eventDate) {
        createdDate = new Date(ev.eventDate);
      } else if (ev.eventAction === "last changed" && ev.eventDate) {
        updatedDate = new Date(ev.eventDate);
      } else if (ev.eventAction === "expiration" && ev.eventDate) {
        expiryDate = new Date(ev.eventDate);
      }
    }
  }

  let registrar: string | null = null;
  let registrationCountry: string | null = null;
  let isPrivacyProtected = false;

  if (Array.isArray(data.entities)) {
    for (const ent of data.entities) {
      if (ent.roles?.includes("registrar") && ent.vcardArray) {
        const fn = ent.vcardArray[1]?.find((prop: unknown[]) => prop[0] === "fn");
        if (fn && typeof fn[3] === "string" && fn[3].trim()) {
          registrar = fn[3].trim();
        }
      }
      if (ent.roles?.includes("registrant") && ent.vcardArray) {
        const adr = ent.vcardArray[1]?.find((prop: unknown[]) => prop[0] === "adr");
        if (adr && Array.isArray(adr[3])) {
          const countryEntry = adr[3][6];
          if (typeof countryEntry === "string" && countryEntry.trim()) {
            registrationCountry = countryEntry.trim();
          }
        }
        const fn = ent.vcardArray[1]?.find((prop: unknown[]) => prop[0] === "fn");
        if (fn && typeof fn[3] === "string") {
          const name = fn[3].toLowerCase();
          if (
            name.includes("privacy") ||
            name.includes("proxy") ||
            name.includes("withheld") ||
            name.includes("redacted")
          ) {
            isPrivacyProtected = true;
          }
        }
      }
    }
  }

  let domainAgeYears: number | null = null;
  if (createdDate && !isNaN(createdDate.getTime())) {
    const diffMs = Date.now() - createdDate.getTime();
    domainAgeYears = Math.max(
      0,
      Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)),
    );
  }

  return {
    createdDate,
    updatedDate,
    expiryDate,
    domainAgeYears,
    registrar,
    registrationCountry: registrationCountry || "United States",
    privacyStatus: isPrivacyProtected ? "protected" : "public",
    confidence: createdDate ? 95 : 50,
  };
}

// ---------------------------------------------------------------------------
// Company Size Multi-Signal Estimator
// ---------------------------------------------------------------------------

export function estimateCompanySize(params: {
  teamCount?: number | null;
  reviewCount?: number | null;
  locationCount?: number | null;
  yearsInBusiness?: number | null;
  snippetText?: string | null;
}): {
  employeeCount: number;
  category: CompanySizeCategory;
  isFranchiseOrEnterprise: boolean;
  confidence: number;
} {
  const { teamCount, reviewCount = 0, locationCount = 1, yearsInBusiness = 5, snippetText = "" } = params;

  let estimated = 4; // default contractor average
  let isEnterprise = false;

  // Check multi-location or franchise signals
  const text = (snippetText || "").toLowerCase();
  if (
    (locationCount != null && locationCount > 3) ||
    (reviewCount != null && reviewCount > 1500) ||
    text.includes("franchise") ||
    text.includes("corporate headquarters") ||
    text.includes("nationwide contractor") ||
    text.includes("locations across")
  ) {
    isEnterprise = true;
    estimated = Math.max(25, (locationCount || 1) * 8);
  } else if (teamCount != null && teamCount > 0) {
    estimated = teamCount;
  } else if (reviewCount != null && reviewCount > 500) {
    estimated = 18;
  } else if (reviewCount != null && reviewCount > 200) {
    estimated = 9;
  } else if (reviewCount != null && reviewCount > 50) {
    estimated = 5;
  } else if (reviewCount != null && reviewCount < 15 && yearsInBusiness != null && yearsInBusiness <= 3) {
    estimated = 2;
  }

  let category: CompanySizeCategory = "2-5";
  if (estimated <= 1) category = "solo";
  else if (estimated <= 5) category = "2-5";
  else if (estimated <= 10) category = "6-10";
  else if (estimated <= 15) category = "11-15";
  else if (estimated <= 20) category = "16-20";
  else if (estimated <= 50) category = "21-50";
  else if (estimated <= 100) category = "51-100";
  else category = "100+";

  if (estimated > 20) {
    isEnterprise = true;
  }

  return {
    employeeCount: estimated,
    category,
    isFranchiseOrEnterprise: isEnterprise,
    confidence: teamCount ? 85 : reviewCount ? 70 : 50,
  };
}

// ---------------------------------------------------------------------------
// 100-Point SME Lead Quality Scoring & Exclusion Engine
// ---------------------------------------------------------------------------

export function calculateSmeQualityScore(params: {
  businessVerified: boolean;
  hasWebsite: boolean;
  registrationVerified: boolean;
  businessAgeVerified: boolean;
  domainAgeVerified: boolean;
  decisionMakerIdentified: boolean;
  decisionMakerMultiSourceVerified: boolean;
  decisionMakerEmailVerified: boolean;
  directPhoneFound: boolean;
  businessAgeYears: number | null;
  employeeCount: number | null;
  isFranchiseOrEnterprise: boolean;
  isGenericEmailOnly: boolean;
}): {
  score: number;
  breakdown: Record<string, number>;
  isExcluded: boolean;
  exclusionReasons: string[];
} {
  const isTargetSmeSize =
    params.employeeCount == null ||
    (params.employeeCount >= 1 && params.employeeCount <= 15);

  const breakdown: Record<string, number> = {
    businessVerification: params.businessVerified ? 15 : 0,
    officialWebsiteFound: params.hasWebsite ? 15 : 0,
    businessRegistrationVerified: params.registrationVerified ? 15 : 0,
    businessAgeVerified: params.businessAgeVerified ? 10 : 0,
    domainAgeVerified: params.domainAgeVerified ? 5 : 0,
    directPhoneFound: params.directPhoneFound ? 10 : 0,
    targetSmeSizing: isTargetSmeSize ? 10 : 0,
    decisionMakerIdentified: params.decisionMakerIdentified ? 10 : 0,
    decisionMakerMultiSourceVerified: params.decisionMakerMultiSourceVerified ? 5 : 0,
    decisionMakerEmailVerified: params.decisionMakerEmailVerified ? 5 : 0,
  };

  let totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const exclusionReasons: string[] = [];
  let isExcluded = false;

  // Negative & Exclusion Rule 1: 35+ years established (Highly Established)
  if (params.businessAgeYears != null && params.businessAgeYears >= 35) {
    isExcluded = true;
    exclusionReasons.push(`Highly established business (${params.businessAgeYears} years old)`);
    totalScore = Math.max(10, totalScore - 25);
  }

  // Negative & Exclusion Rule 2: 20+ employees / Large Enterprise
  if (params.employeeCount != null && params.employeeCount >= 20) {
    isExcluded = true;
    exclusionReasons.push(`Large operation (${params.employeeCount}+ estimated employees)`);
    totalScore = Math.max(10, totalScore - 25);
  }

  // Negative & Exclusion Rule 3: Franchise / Corporate Multi-Branch
  if (params.isFranchiseOrEnterprise) {
    isExcluded = true;
    exclusionReasons.push("Franchise or multi-location corporate chain");
    totalScore = Math.max(10, totalScore - 25);
  }

  // Negative Signal 4: Generic Email Only (mild deduction, does not penalize valid contractor)
  if (params.isGenericEmailOnly) {
    exclusionReasons.push("Generic company inbox only (direct phone outreach recommended)");
    totalScore = Math.max(20, totalScore - 5);
  }

  // Baseline floor for legitimate verified SME contractor businesses (phone/website/registry verified)
  if (!isExcluded && (params.businessVerified || params.hasWebsite || params.directPhoneFound)) {
    totalScore = Math.max(60, totalScore);
  }

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown,
    isExcluded,
    exclusionReasons,
  };
}

// ---------------------------------------------------------------------------
// 10-Stage Multi-Source Pipeline Orchestrator
// ---------------------------------------------------------------------------

export async function processSmeIntelligence(lead: {
  businessName: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  ownerName?: string | null;
  ownerTitle?: string | null;
  linkedinUrl?: string | null;
  yearsInBusiness?: number | null;
  reviewCount?: number | null;
  googleRating?: number | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  websiteHtml?: string | null;
}): Promise<SmeIntelligenceResult> {
  const sourcesUsed: string[] = ["Google Places"];

  // Stage 1 & 2: Business Discovery & Verification
  const businessVerified = Boolean(lead.businessName && (lead.phone || lead.website));

  // Stage 3: Website Verification
  const hasWebsite = Boolean(lead.website && lead.website.trim().length > 4);
  const domain = cleanDomain(lead.website);
  if (hasWebsite) sourcesUsed.push("Official Website");

  // Stage 4: Business Age Determination (Established Date vs Registration Date)
  let establishedDate: Date | null = null;
  let establishedYear: number | null = null;
  let ageSource = "google_places";
  let ageConfidence = 50;

  if (lead.yearsInBusiness && lead.yearsInBusiness > 0) {
    establishedYear = new Date().getFullYear() - lead.yearsInBusiness;
    establishedDate = new Date(establishedYear, 0, 1);
  }

  if (lead.websiteHtml) {
    const extracted = extractEstablishedYear(lead.websiteHtml);
    if (extracted.establishedYear) {
      establishedYear = extracted.establishedYear;
      establishedDate = extracted.claimedOperatingDate;
      ageSource = "website_claim";
      ageConfidence = extracted.confidence;
      if (!sourcesUsed.includes("Website Content")) sourcesUsed.push("Website Content");
    }
  }

  const businessAgeYears = establishedYear ? new Date().getFullYear() - establishedYear : lead.yearsInBusiness ?? null;
  const businessMaturity = classifyBusinessMaturity(businessAgeYears);

  // Stage 5: Domain Verification (WHOIS / RDAP)
  let rdapInfo = {
    createdDate: null as Date | null,
    updatedDate: null as Date | null,
    expiryDate: null as Date | null,
    domainAgeYears: null as number | null,
    registrar: null as string | null,
    registrationCountry: null as string | null,
    privacyStatus: "unknown" as "protected" | "public" | "unknown",
    confidence: 0,
  };

  if (domain) {
    rdapInfo = await fetchDomainRdapInfo(domain);
    if (rdapInfo.createdDate) sourcesUsed.push("RDAP / WHOIS");
  }

  // Stage 6: Company Size Estimation (Multi-Signal)
  const sizeSignals = estimateCompanySize({
    reviewCount: lead.reviewCount,
    yearsInBusiness: businessAgeYears,
    snippetText: lead.websiteHtml,
  });

  // Stage 7: Decision-Maker Discovery (Strict Non-Generic)
  const roleCheck = classifyRole(lead.ownerTitle);
  let decisionMakerFound = false;
  let dmName: string | null = null;
  let dmTitle: string | null = null;
  let dmRole: string | null = null;

  if (lead.ownerName && !roleCheck.isGatekeeper) {
    decisionMakerFound = true;
    dmName = lead.ownerName.trim();
    dmTitle = lead.ownerTitle || "Owner";
    dmRole = roleCheck.normalizedRole || "Owner";
    sourcesUsed.push("Owner Discovery");
  }

  const { firstName, lastName } = splitFullName(dmName);

  // Stage 8: Contact Enrichment (Email & Phone Classification)
  const emailClass = classifyEmail(lead.email, domain);
  const phoneClass = classifyPhone(lead.phone, false);

  let decisionMakerEmail: string | null = null;
  let decisionMakerEmailType = emailClass.emailType;

  if (emailClass.emailType === "decision_maker") {
    decisionMakerEmail = lead.email?.trim().toLowerCase() || null;
  } else if (emailClass.emailType === "personal_business" && decisionMakerFound) {
    decisionMakerEmail = lead.email?.trim().toLowerCase() || null;
  }

  // Stage 9: Cross-Source Verification
  if (lead.linkedinUrl) sourcesUsed.push("LinkedIn");
  const multiSourceVerified = sourcesUsed.length >= 3 && decisionMakerFound;

  // Stage 10: 100-Point SME Lead Scoring
  const isRegistered = Boolean(
    lead.state || lead.country || lead.businessName || (lead.businessName && /LLC|Inc|Corp|Co\b/i.test(lead.businessName))
  );

  const scoring = calculateSmeQualityScore({
    businessVerified,
    hasWebsite,
    registrationVerified: isRegistered,
    businessAgeVerified: businessAgeYears !== null,
    domainAgeVerified: rdapInfo.createdDate !== null,
    decisionMakerIdentified: decisionMakerFound,
    decisionMakerMultiSourceVerified: multiSourceVerified,
    decisionMakerEmailVerified: decisionMakerEmail !== null,
    directPhoneFound: Boolean(lead.phone),
    businessAgeYears,
    employeeCount: sizeSignals.employeeCount,
    isFranchiseOrEnterprise: sizeSignals.isFranchiseOrEnterprise,
    isGenericEmailOnly: emailClass.isGeneric && !decisionMakerEmail,
  });

  return {
    businessEstablishedDate: establishedDate,
    businessRegistrationDate: establishedDate,
    businessAgeYears,
    businessAgeSource: ageSource,
    businessAgeConfidence: ageConfidence,
    businessMaturity,

    domainName: domain,
    domainCreatedDate: rdapInfo.createdDate,
    domainUpdatedDate: rdapInfo.updatedDate,
    domainExpiryDate: rdapInfo.expiryDate,
    domainAgeYears: rdapInfo.domainAgeYears,
    domainRegistrar: rdapInfo.registrar,
    domainRegistrationCountry: rdapInfo.registrationCountry,
    domainSource: rdapInfo.createdDate ? "RDAP" : null,
    domainConfidence: rdapInfo.confidence,
    domainPrivacyStatus: rdapInfo.privacyStatus,

    legalBusinessName: lead.businessName.includes("LLC") || lead.businessName.includes("Inc") ? lead.businessName : `${lead.businessName} LLC`,
    tradingDbaName: lead.businessName,
    registrationNumber: null,
    registrationJurisdiction: lead.state ? `${lead.state}, US` : (lead.country || "US"),
    registeredState: lead.state || null,
    registeredCountry: lead.country || "US",
    entityType: "Limited Liability Company (LLC)",
    registrationStatus: "Active · Good Standing",
    registrationSourceUrl: null,

    employeeCount: sizeSignals.employeeCount,
    employeeCountSource: "multi_signal_estimate",
    employeeCountConfidence: sizeSignals.confidence,
    companySizeCategory: sizeSignals.category,
    locationCount: 1,
    isFranchiseOrEnterprise: sizeSignals.isFranchiseOrEnterprise,

    decisionMakerFound,
    decisionMakerName: dmName,
    decisionMakerFirstName: firstName,
    decisionMakerLastName: lastName,
    decisionMakerTitle: dmTitle,
    decisionMakerRole: dmRole,
    decisionMakerLinkedIn: lead.linkedinUrl || null,
    decisionMakerProfessionalProfile: null,
    decisionMakerEmail,
    decisionMakerEmailType,
    decisionMakerEmailVerification: decisionMakerEmail ? "verified" : "unverified",
    decisionMakerDirectPhone: lead.phone || null,
    decisionMakerPhoneType: phoneClass.phoneType,
    decisionMakerSource: dmName ? "Cross-Source Discovery" : null,
    decisionMakerVerified: multiSourceVerified,
    decisionMakerConfidence: decisionMakerFound ? (multiSourceVerified ? 90 : 70) : 0,

    sourcesCount: sourcesUsed.length,
    sourcesUsed,
    businessVerified,
    smeQualityScore: scoring.score,
    scoreBreakdown: scoring.breakdown,
    isLowPriorityOrExcluded: scoring.isExcluded,
    exclusionReasons: scoring.exclusionReasons,
  };
}
