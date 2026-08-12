import { searchPublicWeb, type WebSearchResult } from "./web-search";
import { normalizeLinkedInProfileUrl } from "./linkedin";

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

const NAME_WORD = "[A-ZÀ-ÖØ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+";
const NAME_GROUP = `${NAME_WORD}(?: ${NAME_WORD}){1,3}`;

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

const NOT_A_NAME =
  /\b(owner|co-?owner|founder|co-?founder|president|ceo|principal|proprietor|manager|director|supervisor|estimator|sales|operations|staff|team|crew|service|services|company|business|inc|llc|ltd|corp|home|homes|house|houses|the|our|your|and|for|of|with|at|by|from|call|email|contact|about|meet|roof|roofs|roofing|plumbing|plumber|electric|electrical|electrician|heating|cooling|hvac|landscap\w*|painting|painters|construction|remodel\w*|renovation|builders|contractor|contractors|quality|local|trusted|professional\w*|trained|licensed|insured|certified|group|solutions|systems|pros?)\b/i;

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

function plausiblePersonName(value: string): boolean {
  const name = clean(value);
  if (!name || name.length < 4 || name.length > 60) return false;
  const words = name.split(" ");
  if (words.length < 2 || words.length > 4) return false;
  if (NOT_A_NAME.test(name)) return false;
  return words.every((word) =>
    /^[A-ZÀ-ÖØ][A-Za-zÀ-ÖØ-öø-ÿ'’.-]*$/.test(word),
  );
}

function nameConflictsWithBusiness(name: string, businessName: string): boolean {
  const bizWords = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (!bizWords.length) return false;
  const nameLower = name.toLowerCase();
  return bizWords.some(
    (w) =>
      nameLower === w ||
      nameLower.startsWith(`${w} `) ||
      nameLower.endsWith(` ${w}`) ||
      nameLower.includes(` ${w} `),
  );
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
  if (!plausiblePersonName(name)) return;
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
  const hasBusiness = text
    .toLowerCase()
    .includes(businessName.toLowerCase());

  if (linkedinUrl) {
    for (const match of text.matchAll(NAME_ROLE_RE)) {
      tryAddCandidate(out, match[1], match[2], 85, url, linkedinUrl, businessName);
    }
    for (const match of text.matchAll(ROLE_NAME_RE)) {
      tryAddCandidate(out, match[2], match[1], 80, url, linkedinUrl, businessName);
    }
    const slugName = slugToName(url);
    if (
      slugName &&
      !out.some(
        (candidate) => candidate.name.toLowerCase() === slugName.toLowerCase(),
      )
    ) {
      tryAddCandidate(out, slugName, null, 60, url, linkedinUrl, businessName);
    }
    return;
  }

  if (!hasBusiness) return;

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
      10,
    ),
    searchPublicWeb(`site:linkedin.com/in "${name}"`, 10),
    searchPublicWeb(
      `"${name}" "about us" (owner OR "founded by" OR "run by")`,
      10,
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
      `"${best.name}" "${name}" site:linkedin.com/in`,
      5,
    );
    for (const hit of confirm) {
      const profile = normalizeLinkedInProfileUrl(hit.url);
      if (profile) {
        ownerLinkedInUrl = profile;
        break;
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
