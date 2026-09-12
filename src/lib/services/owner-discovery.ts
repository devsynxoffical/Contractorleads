import { searchPublicWeb, type WebSearchResult } from "./web-search";
import { normalizeLinkedInProfileUrl, matchesBusinessName } from "./linkedin";

export type OwnerDiscoveryResult = {
  ownerName: string | null;
  ownerRole: string | null;
  ownerLinkedInUrl: string | null;
  sourceUrl: string | null;
  confidence: number;
};

export const EMPTY_OWNER_DISCOVERY: OwnerDiscoveryResult = {
  ownerName: null,
  ownerRole: null,
  ownerLinkedInUrl: null,
  sourceUrl: null,
  confidence: 0,
};

const ROLE_SRC =
  "[Oo]wner|[Cc]o-?[Oo]wner|[Ff]ounder|[Cc]o-?[Ff]ounder|[Pp]resident|[Pp]rincipal|[Pp]roprietor|[Cc][Ee][Oo]";

const NAME_WORD = "[A-ZÀ-ÖØ][A-Za-zÀ-ÖØ-öø-ÿ'’-]{1,24}";
// Real personal names are 2 or 3 words (First + Last, or First + Middle + Last)
const NAME_GROUP = `${NAME_WORD}(?: ${NAME_WORD}){1,2}`;

const NAME_ROLE_RE = new RegExp(
  `(${NAME_GROUP})\\s*(?:,|—|–|-|:|\\(|\\[|\\|)\\s*(${ROLE_SRC})\\b`,
  "g",
);
const ROLE_NAME_RE = new RegExp(
  `\\b(${ROLE_SRC})\\s*(?:is|:|,|—|–|-|\\||\\(|\\[|\\s)\\s*(${NAME_GROUP})\\b`,
  "g",
);
const COPULA_RE = new RegExp(
  `(${NAME_GROUP})\\s+(?:is|was)\\s+(?:the\\s+)?(${ROLE_SRC})\\s+(?:of|at)\\b`,
);
const FOUNDED_BY_RE = new RegExp(
  `(?:[Ff]ounded|[Oo]wned|[Ee]stablished|[Ll]ed)\\b.{0,40}?by\\s+(${NAME_GROUP})\\b`,
);

export const NOT_A_PERSON_NAME =
  /\b(owner|co-?owner|founder|co-?founder|president|ceo|principal|proprietor|manager|director|supervisor|estimator|sales|operations|staff|team|crew|service|services|company|business|contractor|contractors|specialists?|installers?|technicians?|experts?|professionals?|partners?|associates?|enterprises?|ventures?|group|solutions?|systems?|agency|agencies|consulting|management|holdings?|capital|investments?|properties|property|estate|realty|realtor|finance|financial|insurance|mortgage|credit|bank|law|legal|attorney|firm|council|board|department|bureau|association|foundation|institute|academy|college|university|school|church|temple|hospital|clinic|doctor|dental|dentist|therapy|physical|mental|health|wellness|chiropractic|medical|care|nursing|pharmacy|fitness|gym|yoga|spa|salon|barber|store|shop|market|mart|outlet|cafe|coffee|bakery|restaurant|bistro|diner|bar|grill|pub|hotel|motel|inn|resort|auto|automotive|mechanic|garage|collision|towing|tires?|detail|detailing|wash|moving|movers|security|alarm|solar|energy|insulation|drywall|handyman|masonry|concrete|paving|asphalt|fencing|fence|deck|patio|pool|lawn|tree|arborist|pest|cleaning|cleaners?|janitorial|painting|painters?|plumbing|plumbers?|electric|electrical|electricians?|heating|cooling|hvac|roof|roofs|roofing|builders?|building|construction|remodeling|remodel\w*|renovation|restoration|revive|restore|rebuild|siding|windows?|gutters?|repairs?|inc|incorporated|llc|llp|ltd|limited|co|corp|corporation|gmbh|sa|bv|plc|small|big|large|great|good|best|top|fast|quick|easy|simple|smart|bright|fresh|pure|clean|clear|green|eco|safe|sure|true|real|first|choice|one|pro|pros|plus|max|all|star|super|ultra|micro|mega|express|direct|action|vision|future|advance|advanced|modern|classic|vintage|heritage|custom|premier|prime|apex|summit|pinnacle|national|international|global|united|american|british|royal|standard|general|universal|select|metro|central|valley|island|county|state|country|town|city|village|district|street|road|avenue|lane|drive|way|boulevard|blvd|digital|online|media|marketing|advertising|design|designs|creative|software|tech|technology|technologies|data|network|networks|cloud|cyber|labs?|studios?|gallery|the|our|your|their|and|for|of|with|at|by|from|in|on|to|is|was|are|were|about|meet|contact|call|email|view|public|source|website)\b/i;

type OwnerCandidate = {
  name: string;
  role: string | null;
  confidence: number;
  sourceUrl: string | null;
  linkedinUrl: string | null;
};

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatRole(role: string): string {
  const cleaned = clean(role);
  if (/^ceo$/i.test(cleaned)) return "CEO";
  return cleaned
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("-"),
    )
    .join(" ");
}

export function plausiblePersonName(
  value: string,
  businessName?: string,
): boolean {
  const name = clean(value)
    .replace(/\b(Jr|Sr|II|III|IV|MD|PhD|Ph\.D\.|Esq|Esq\.)\.?\b/gi, "")
    .trim();
  if (!name || name.length < 4 || name.length > 40) return false;

  const words = name.split(/\s+/);
  // Real personal names are 2 or 3 words
  if (words.length < 2 || words.length > 3) return false;

  // Strict: none of the words may match NOT_A_PERSON_NAME
  if (NOT_A_PERSON_NAME.test(name)) return false;

  // Each word must look like a capitalized personal name (letters, hyphens, apostrophes)
  const isAllValidWords = words.every((word) =>
    /^[A-ZÀ-ÖØ][A-Za-zÀ-ÖØ-öø-ÿ'’-]{1,24}$/.test(word),
  );
  if (!isAllValidWords) return false;

  // If a business name is provided, ensure no overlap with business name words
  if (businessName) {
    const bizWords = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);
    const nameWords = words.map((w) => w.toLowerCase());
    if (nameWords.some((nw) => bizWords.includes(nw))) {
      return false;
    }
  }

  return true;
}

function nameConflictsWithBusiness(name: string, businessName: string): boolean {
  const bizWords = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (!bizWords.length) return false;
  const nameWords = name.toLowerCase().split(/\s+/);
  return nameWords.some((nw) => bizWords.includes(nw));
}

function slugToName(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (!match?.[1]) return null;
  const parts = match[1].split(/[-_]/).filter(Boolean);
  if (parts.length < 2) return null;
  const words = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  const name = clean(words.slice(0, 2).join(" "));
  return plausiblePersonName(name) ? name : null;
}

function tryAddCandidate(
  out: OwnerCandidate[],
  rawName: string,
  role: string | null,
  confidence: number,
  sourceUrl: string | null,
  linkedinUrl: string | null,
  businessName: string,
) {
  const name = clean(rawName);
  if (!plausiblePersonName(name, businessName)) return;
  if (nameConflictsWithBusiness(name, businessName)) return;
  const existing = out.find(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    if (confidence > existing.confidence) {
      existing.confidence = confidence;
      existing.role = role ? formatRole(role) : existing.role;
      existing.sourceUrl = sourceUrl ?? existing.sourceUrl;
      if (linkedinUrl) existing.linkedinUrl = linkedinUrl;
    } else if (linkedinUrl && !existing.linkedinUrl) {
      existing.linkedinUrl = linkedinUrl;
    }
    return;
  }
  out.push({ name, role: role ? formatRole(role) : role, confidence, sourceUrl, linkedinUrl });
}

function scanHit(
  hit: WebSearchResult,
  businessName: string,
  out: OwnerCandidate[],
) {
  const text = clean(`${hit.title} ${hit.snippet}`);
  const url = hit.url;
  const linkedinUrl = normalizeLinkedInProfileUrl(url);
  const textWithUrl = `${text} ${url}`;

  // Strict check: The snippet/title or URL MUST match the business name
  if (!matchesBusinessName(textWithUrl, businessName)) {
    return;
  }

  if (linkedinUrl) {
    for (const match of text.matchAll(NAME_ROLE_RE)) {
      tryAddCandidate(out, match[1], match[2], 85, url, linkedinUrl, businessName);
    }
    for (const match of text.matchAll(ROLE_NAME_RE)) {
      tryAddCandidate(out, match[2], match[1], 80, url, linkedinUrl, businessName);
    }
    const copular = COPULA_RE.exec(text);
    if (copular) {
      tryAddCandidate(out, copular[1], copular[2], 84, url, linkedinUrl, businessName);
    }
    return;
  }

  for (const match of text.matchAll(NAME_ROLE_RE)) {
    tryAddCandidate(out, match[1], match[2], 85, url, null, businessName);
  }
  for (const match of text.matchAll(ROLE_NAME_RE)) {
    tryAddCandidate(out, match[2], match[1], 80, url, null, businessName);
  }
  const copular = COPULA_RE.exec(text);
  if (copular) {
    tryAddCandidate(out, copular[1], copular[2], 84, url, null, businessName);
  }
  const foundedBy = FOUNDED_BY_RE.exec(text);
  if (foundedBy) {
    tryAddCandidate(
      out,
      foundedBy[1],
      "Founder / Owner",
      88,
      url,
      null,
      businessName,
    );
  }
}

/**
 * Find the business owner via public web search (Google SERP snippets +
 * LinkedIn profile pages). Never scrapes linkedin.com directly.
 */
export async function discoverOwnerFromSearch(
  businessName: string,
  location: string,
): Promise<OwnerDiscoveryResult> {
  const name = businessName.trim();
  const loc = location.trim();
  if (!name) return EMPTY_OWNER_DISCOVERY;

  const [businessHits, linkedInHits, aboutHits] = await Promise.all([
    searchPublicWeb(
      `"${name}" ${loc} (owner OR founder OR president OR "founded by")`,
      8,
    ),
    searchPublicWeb(
      `site:linkedin.com/in "${name}" ${loc} (owner OR founder OR director OR president OR ceo)`,
      8,
    ),
    searchPublicWeb(
      `"${name}" ${loc} "about us" (owner OR "founded by" OR "run by")`,
      8,
    ),
  ]);

  const candidates: OwnerCandidate[] = [];
  for (const hit of [...businessHits, ...linkedInHits, ...aboutHits]) {
    scanHit(hit, name, candidates);
  }

  if (!candidates.length) return EMPTY_OWNER_DISCOVERY;

  const best = candidates.reduce((a, b) =>
    b.confidence > a.confidence ? b : a,
  );

  let ownerLinkedInUrl = best.linkedinUrl ?? null;
  let confidence = best.confidence;

  if (!ownerLinkedInUrl && confidence >= 80) {
    const confirm = await searchPublicWeb(
      `"${best.name}" "${name}" ${loc} site:linkedin.com/in`,
      5,
    );
    for (const hit of confirm) {
      if (matchesBusinessName(`${hit.url} ${hit.title} ${hit.snippet}`, name)) {
        const profile = normalizeLinkedInProfileUrl(hit.url);
        if (profile) {
          ownerLinkedInUrl = profile;
          break;
        }
      }
    }
    if (ownerLinkedInUrl) confidence = Math.max(confidence, 90);
  }

  return {
    ownerName: best.name,
    ownerRole: best.role,
    ownerLinkedInUrl,
    sourceUrl: best.sourceUrl,
    confidence,
  };
}
