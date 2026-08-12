import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/safe-fetch";

export type PublicTeamMember = {
  name: string;
  role: string;
  sourceUrl: string;
  confidence: number;
};

/**
 * Internal candidate with an optional source marker so we can cross-check
 * JSON-LD claims (often stale metadata) against what the visible page says.
 */
type PersonCandidate = PublicTeamMember & {
  source?: "jsonld" | "container" | "rolefirst" | "foundedby" | "visible";
};

export type WebsitePeopleResult = {
  owner: PublicTeamMember | null;
  team: PublicTeamMember[];
  email: string | null;
  emailSourceUrl: string | null;
  pagesChecked: string[];
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; ContractorLeads/1.0; +https://contractorleads.app)";

/** Pages likely to list owners/team OR a public email / contact form. */
const PEOPLE_PATH =
  /\b(about|team|our-team|staff|leadership|company|who-we-are|meet-the-team|owner|founder|ceo|bio|contact|contact-us|get-in-touch|reach-us|connect|locations?)\b/i;

/** Prefer these when ranking follow links for email discovery. */
const CONTACT_PATH =
  /\b(contact|contact-us|get-in-touch|reach-us|connect)\b/i;

const OWNER_ROLE =
  /\b(owner|founder|co-founder|president|principal|managing director|ceo)\b/i;
const TEAM_ROLE =
  /\b(owner|founder|co-founder|president|principal|ceo|manager|director|partner|supervisor|estimator|sales|operations|technician|specialist)\b/i;

const EMAIL_RE =
  /[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/gi;

/** Throw away tracking / CDN / image / placeholder addresses. */
const BAD_EMAIL =
  /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|postmaster|sentry\.io|wixpress\.com|example\.com|domain\.com|email\.com|yourdomain|placeholder|cloudflare|schema\.org|googleapis|gstatic|w3\.org|jquery|sentry-next)/i;

const PREFERRED_LOCAL =
  /^(info|contact|hello|office|sales|support|admin|enquiries|inquiry|inquiries|mail|team|jobs|estimates?|quotes?|service|services|booking|book|appointments?)\b/i;

/** Common contact paths to try when the homepage has no contact link. */
const CONTACT_FALLBACKS = [
  "/contact",
  "/contact-us",
  "/contactus",
  "/get-in-touch",
  "/about",
  "/about-us",
];

// Marketing/filler words that regex matches sometimes capture instead of a
// person ("led by trained technicians committed to…").
const NOT_A_NAME =
  /\b(trained|licensed|insured|certified|professional|professionals|technician|technicians|expert|experts|team|teams|staff|crew|committed|dedicated|experienced|skilled|qualified|local|trusted|friendly|service|services|company|business|contractor|contractors|specialists|installers|plumbers|electricians|roofers|our|your|the|and|with|quality|customer|customers|roofing|roof|roofs|construction|contracting|builders|building|remodeling|renovation|hvac|heating|cooling|plumbing|electrical|electric|landscaping|landscape|siding|windows|gutters|gutter|repair|repairs|cleaning|inc|llc|llp|ltd|corp|co|group|solutions|systems|home|homes|house|houses|pro|pros)\b/i;

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function plausibleName(value: string): boolean {
  const name = clean(value);
  const words = name.split(" ");
  return (
    name.length >= 4 &&
    name.length <= 60 &&
    words.length >= 2 &&
    words.length <= 4 &&
    !NOT_A_NAME.test(name) &&
    words.every((word) => /^[A-ZÀ-ÖØ][A-Za-zÀ-ÖØ-öø-ÿ'’.-]*$/.test(word))
  );
}

function formatRole(role: string): string {
  const cleaned = clean(role);
  if (/^ceo$/i.test(cleaned)) return "CEO";
  return cleaned
    .split(" ")
    .map((word) =>
      /^ceo$/i.test(word)
        ? "CEO"
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function addMember(members: PersonCandidate[], candidate: PersonCandidate) {
  if (!plausibleName(candidate.name) || !TEAM_ROLE.test(candidate.role)) return;
  const normalized = { ...candidate, role: formatRole(candidate.role) };
  const key = normalized.name.toLowerCase();
  const existing = members.find((member) => member.name.toLowerCase() === key);
  if (!existing) members.push(normalized);
  else if (normalized.confidence > existing.confidence) {
    Object.assign(existing, normalized);
  }
}

/**
 * Find how the visible page labels a person — e.g. "Gregory Noland, Outside
 * Sales" or "Gregory Noland — Outside Sales". Returns the phrase that follows
 * the name up to the next separator. Used to cross-check (and override)
 * metadata-only claims like a JSON-LD "Owner" tag.
 */
function visibleRoleForName(bodyText: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `${escaped}\\s*(?:,|—|–|-|:|\\(|\\|)\\s*([A-Za-zÀ-ÖØ-öø-ÿ'’&]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ'’&]+){0,8})`,
    "ig",
  );
  for (const match of bodyText.matchAll(re)) {
    const role = clean(match[1]);
    if (TEAM_ROLE.test(role)) {
      // Cut at a trailing separator ("Owners — Noland's Roofing" -> "Owners")
      return clean(role.split(/\s*(?:—|–|-|,|\(|\|)\s*/)[0]).slice(0, 60);
    }
  }
  return null;
}

/**
 * Visible text is ground truth; JSON-LD is metadata that can be stale or
 * inconsistent. Re-rank candidates so a page-confirmed owner outranks a
 * metadata-only "Owner", and a page that contradicts a JSON-LD claim wins.
 */
function crossCheckMembers(members: PersonCandidate[], bodyText: string) {
  for (const member of members) {
    const visible = visibleRoleForName(bodyText, member.name);
    if (!visible) {
      // Metadata-only claim (e.g. JSON-LD founder) never gets "verified" trust
      if (member.source === "jsonld") {
        member.confidence = Math.min(member.confidence, 70);
      }
      continue;
    }
    const visibleOwner = OWNER_ROLE.test(visible);
    const claimedOwner = OWNER_ROLE.test(member.role);
    if (claimedOwner && !visibleOwner) {
      // Page contradicts the owner claim (e.g. "Outside Sales") — trust page
      member.role = visible;
      member.confidence = Math.min(member.confidence, 82);
    } else if (claimedOwner && visibleOwner) {
      member.confidence = Math.max(member.confidence, 90);
    }
  }
}

/**
 * Cloudflare "email protection" replaces addresses with a hex blob
 * (data-cfemail / #email-protection). First byte is the XOR key.
 */
function decodeCfEmail(hex: string): string | null {
  const clean = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{4,}$/.test(clean) || clean.length % 2 !== 0) return null;
  try {
    const key = parseInt(clean.slice(0, 2), 16);
    let out = "";
    for (let i = 2; i < clean.length; i += 2) {
      out += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16) ^ key);
    }
    return out;
  } catch {
    return null;
  }
}

/** Turn "info (at) acme (dot) com" into a real address. Bracketed forms only. */
function deobfuscate(text: string): string {
  return text
    .replace(/\s*[([{]\s*at\s*[)\]}]\s*/gi, "@")
    .replace(/\s*[([{]\s*dot\s*[)\]}]\s*/gi, ".");
}

function isPlausibleEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 120) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  if (BAD_EMAIL.test(email)) return false;
  if (/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(email)) return false;
  return true;
}

function emailScore(email: string): number {
  const local = email.split("@")[0] || "";
  let score = 0;
  if (PREFERRED_LOCAL.test(local)) score += 40;
  score += Math.max(0, 20 - local.length);
  return score;
}

function pickBestEmail(emails: Iterable<string>): string | null {
  const list = [
    ...new Set(
      [...emails].map((e) => e.toLowerCase().trim()).filter(isPlausibleEmail),
    ),
  ];
  if (!list.length) return null;
  list.sort((a, b) => emailScore(b) - emailScore(a));
  return list[0];
}

function walkJsonLd(
  node: unknown,
  sourceUrl: string,
  members: PersonCandidate[],
  emails: Set<string>,
) {
  if (Array.isArray(node)) {
    node.forEach((item) => walkJsonLd(item, sourceUrl, members, emails));
    return;
  }
  if (!node || typeof node !== "object") return;

  const record = node as Record<string, unknown>;
  const type = String(record["@type"] ?? "");
  if (type.toLowerCase() === "person") {
    const name = clean(String(record.name ?? ""));
    const role = clean(
      String(record.jobTitle ?? record.roleName ?? record.description ?? ""),
    );
    addMember(members, {
      name,
      role,
      sourceUrl,
      confidence: 95,
      source: "jsonld",
    });
  }

  const emailField = record.email;
  if (typeof emailField === "string" && isPlausibleEmail(emailField)) {
    emails.add(emailField.toLowerCase().trim());
  } else if (Array.isArray(emailField)) {
    for (const item of emailField) {
      if (typeof item === "string" && isPlausibleEmail(item)) {
        emails.add(item.toLowerCase().trim());
      }
    }
  }

  for (const key of [
    "founder",
    "employee",
    "member",
    "worksFor",
    "contactPoint",
    "@graph",
  ]) {
    if (record[key]) walkJsonLd(record[key], sourceUrl, members, emails);
  }
}

function extractFromHtml(html: string, sourceUrl: string) {
  const $ = cheerio.load(html.slice(0, 1_500_000));
  const members: PersonCandidate[] = [];
  const emails = new Set<string>();

  $('a[href^="mailto:"]').each((_, element) => {
    const raw = $(element)
      .attr("href")
      ?.replace(/^mailto:/i, "")
      .split("?")[0]
      ?.split(",")[0];
    if (raw && isPlausibleEmail(raw)) {
      emails.add(raw.toLowerCase().trim());
    }
  });

  $("[data-email], [itemprop='email']").each((_, element) => {
    const raw =
      $(element).attr("data-email") ||
      $(element).attr("content") ||
      $(element).text();
    if (raw && isPlausibleEmail(raw)) {
      emails.add(raw.toLowerCase().trim());
    }
  });

  // Cloudflare-protected addresses (very common on contractor sites)
  $("[data-cfemail], .__cf_email__").each((_, element) => {
    const hex = $(element).attr("data-cfemail");
    const decoded = hex ? decodeCfEmail(hex) : null;
    if (decoded && isPlausibleEmail(decoded)) {
      emails.add(decoded.toLowerCase().trim());
    }
  });
  $('a[href*="/cdn-cgi/l/email-protection#"]').each((_, element) => {
    const hex = $(element).attr("href")?.split("#")[1];
    const decoded = hex ? decodeCfEmail(hex) : null;
    if (decoded && isPlausibleEmail(decoded)) {
      emails.add(decoded.toLowerCase().trim());
    }
  });

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      walkJsonLd(JSON.parse($(element).text()), sourceUrl, members, emails);
    } catch {
      // Invalid third-party JSON-LD should not block enrichment.
    }
  });

  $(
    '[class*="team"], [class*="staff"], [class*="founder"], [class*="owner"], [class*="leadership"], [class*="profile"], [id*="team"], [id*="staff"], [id*="leadership"]',
  ).each((_, element) => {
    const container = $(element);
    const text = clean(container.text());
    const role = text.match(TEAM_ROLE)?.[0] ?? "";
    if (!role) return;
    const name = clean(
      container
        .find("h1,h2,h3,h4,h5,strong,[itemprop='name'],img[alt]")
        .first()
        .attr("alt") ??
        container.find("h1,h2,h3,h4,h5,strong,[itemprop='name']").first().text(),
    );
    addMember(members, {
      name,
      role,
      sourceUrl,
      confidence: 82,
      source: "container",
    });
  });

  const bodyText = clean($("body").text());

  // Visible "Name — Role" / "Name, Role" / "Name: Role" lines — this is what
  // server-rendered team cards (WordPress, static HTML) actually publish.
  const nameRoleRe =
    /\b([A-Z][a-zÀ-öø-ÿ'’]+(?:\s+[A-Z][a-zÀ-öø-ÿ'’]+){1,3})\s*(?:,|—|–|-|:|\||│)\s*([A-Za-zÀ-ÖØ-öø-ÿ'’&]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'’&]+){0,8})/g;
  for (const match of bodyText.matchAll(nameRoleRe)) {
    const name = clean(match[1]);
    const role = clean(match[2]);
    if (!TEAM_ROLE.test(role)) continue;
    addMember(members, {
      name,
      role,
      sourceUrl,
      confidence: 85,
      source: "visible",
    });
  }

  const roleFirstMatches = bodyText.matchAll(
    /(owner|founder|co-founder|president|principal|ceo)\s*(?:is|:|-|—)\s*([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,3})/gi,
  );
  for (const match of roleFirstMatches) {
    addMember(members, {
      name: clean(match[2]),
      role: clean(match[1]),
      sourceUrl,
      confidence: 88,
      source: "rolefirst",
    });
  }

  const foundedByMatches = bodyText.matchAll(
    /(?:founded|owned|led)(?:\s+in\s+\d{4})?\s+by\s+(?:(owner|founder|co-founder|president|principal|ceo)\s+)?([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,3})/gi,
  );
  for (const match of foundedByMatches) {
    addMember(members, {
      name: clean(match[2]),
      role: clean(match[1] || "Founder / Owner"),
      sourceUrl,
      confidence: 92,
      source: "foundedby",
    });
  }

  // Metadata (JSON-LD) must not override what the visible page says.
  crossCheckMembers(members, bodyText);

  // Plaintext emails — most contractor sites never use mailto:
  for (const match of deobfuscate(bodyText).matchAll(EMAIL_RE)) {
    if (isPlausibleEmail(match[0])) emails.add(match[0].toLowerCase());
  }
  for (const match of html.slice(0, 400_000).matchAll(EMAIL_RE)) {
    if (isPlausibleEmail(match[0])) emails.add(match[0].toLowerCase());
  }

  const contactLinks: string[] = [];
  const peopleLinks: string[] = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const label = clean($(element).text());
    if (!href) return;
    const hay = `${href} ${label}`;
    if (!PEOPLE_PATH.test(hay)) return;
    try {
      const url = new URL(href, sourceUrl);
      if (url.origin !== new URL(sourceUrl).origin) return;
      const abs = url.toString();
      if (CONTACT_PATH.test(hay)) contactLinks.push(abs);
      else peopleLinks.push(abs);
    } catch {
      // Ignore malformed links.
    }
  });

  return {
    members,
    email: pickBestEmail(emails),
    links: [...new Set([...contactLinks, ...peopleLinks])],
  };
}

async function fetchHtml(
  url: string,
  timeoutMs = 6_000,
): Promise<string | null> {
  if (timeoutMs <= 0) return null;
  try {
    const response = await safeFetch(
      url,
      {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        // Keep per-page fetches snappy so we can check contact pages too
        timeoutMs,
      },
      { allowHttp: true },
    );
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    ) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

function contactFallbacks(homepage: string): string[] {
  try {
    const origin = new URL(homepage).origin;
    return CONTACT_FALLBACKS.map((path) => `${origin}${path}`);
  } catch {
    return [];
  }
}

export async function extractWebsitePeople(
  website: string,
  options: { budgetMs?: number } = {},
): Promise<WebsitePeopleResult> {
  // Self-limit so callers that race us with a timeout still get partial data
  // (homepage email) instead of an empty result.
  const budgetMs = options.budgetMs ?? 8_000;
  const startedAt = Date.now();
  const remaining = () => budgetMs - (Date.now() - startedAt);

  const homepage = website.startsWith("http") ? website : `https://${website}`;
  const homeHtml = await fetchHtml(homepage, Math.min(5_000, remaining()));
  if (!homeHtml) {
    return {
      owner: null,
      team: [],
      email: null,
      emailSourceUrl: null,
      pagesChecked: [],
    };
  }

  const home = extractFromHtml(homeHtml, homepage);
  // Prefer discovered contact links; if none, try common /contact paths
  const follow = [
    ...home.links,
    ...(home.links.some((l) => CONTACT_PATH.test(l))
      ? []
      : contactFallbacks(homepage)),
  ];
  const pages = [homepage, ...[...new Set(follow)].slice(0, 4)];
  const members = [...home.members];
  let email = home.email;
  let emailSourceUrl = home.email ? homepage : null;

  // Only chase extra pages while there is time left in the budget.
  const followBudget = remaining();
  const extraPages =
    followBudget < 1_200
      ? []
      : await Promise.all(
          pages.slice(1).map(async (url) => {
            if (url.replace(/\/$/, "") === homepage.replace(/\/$/, "")) {
              return null;
            }
            const html = await fetchHtml(url, Math.min(5_000, followBudget));
            return html ? { url, parsed: extractFromHtml(html, url) } : null;
          }),
        );

  for (const page of extraPages) {
    if (!page) continue;
    page.parsed.members.forEach((member) => addMember(members, member));
    if (!email && page.parsed.email) {
      email = page.parsed.email;
      emailSourceUrl = page.url;
    } else if (
      email &&
      page.parsed.email &&
      emailScore(page.parsed.email) > emailScore(email)
    ) {
      // Prefer info@/contact@ from contact page over a random mailto on home
      email = page.parsed.email;
      emailSourceUrl = page.url;
    }
  }

  members.sort((a, b) => b.confidence - a.confidence);
  const owner = members.find((member) => OWNER_ROLE.test(member.role)) ?? null;
  const stripSource = (member: PersonCandidate): PublicTeamMember => ({
    name: member.name,
    role: member.role,
    sourceUrl: member.sourceUrl,
    confidence: member.confidence,
  });

  return {
    owner: owner ? stripSource(owner) : null,
    team: members.slice(0, 10).map(stripSource),
    email,
    emailSourceUrl,
    pagesChecked: pages,
  };
}
