import * as cheerio from "cheerio";
import { safeFetch } from "@/lib/safe-fetch";
import { plausiblePersonName } from "./owner-discovery";

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
  /\b(about|team|our-team|staff|leadership|company|who-we-are|meet-the-team|owner|founder|ceo|bio|contact|contact-us|get-in-touch|reach-us|connect|locations?|estimates?|quote|quotes)\b/i;

/** Prefer these when ranking follow links for email discovery. */
const CONTACT_PATH =
  /\b(contact|contact-us|get-in-touch|reach-us|connect|estimates?|quote)\b/i;

const OWNER_ROLE =
  /\b(owner|founder|co-founder|president|principal|managing director|ceo)\b/i;
const TEAM_ROLE =
  /\b(owner|founder|co-founder|president|principal|ceo|manager|director|partner|supervisor|estimator|sales|operations|technician|specialist)\b/i;

/** Throw away tracking / CDN / image / developer / non-lead addresses. */
const BAD_EMAIL =
  /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|postmaster|sentry|wixpress|squarespace|wordpress|godaddy|cloudflare|schema\.org|googleapis|gstatic|w3\.org|jquery|example\.com|domain\.com|email\.com|yourdomain|placeholder|test@|sample@|user@|name@|email@|billing@|invoices?@|accounting@|careers@|jobs@|hr@|employment@|legal@|privacy@|abuse@|security@|press@|media@|affiliates?@|newsletter@|subscribe@|unsubscribe@|webmaster@|hostmaster@)/i;

/** Common contact paths to try when the homepage has no contact link. */
const CONTACT_FALLBACKS = [
  "/contact",
  "/contact-us",
  "/contactus",
  "/get-in-touch",
  "/about",
  "/about-us",
  "/our-team",
  "/meet-the-team",
  "/estimates",
  "/quote",
];

const COMMON_FIRST_NAMES = new Set([
  "aaron","adam","alex","alexander","allan","allen","alyssa","amanda","amber","amy","andrew","andy","angela","ann","anna","anthony","antonio","arthur","ashley","austin",
  "barbara","barry","bart","ben","benjamin","bill","billy","blake","bob","bobby","brad","bradley","brandon","brenda","brent","brian","bryan","bruce",
  "caleb","cameron","carl","carlos","carol","caroline","carolyn","casey","chad","charles","charlie","charlotte","chase","chelsea","chris","christian","christina","christine","christopher","clay","clayton","cliff","clifford","cody","colin","conner","connor","corey","cory","craig","curtis","cynthia",
  "dale","damon","dan","dana","daniel","danielle","danny","daren","darin","daryl","dave","david","dawn","dean","debbie","deborah","del","dennis","derek","derrick","devin","diana","diane","dillon","don","donald","donnie","doug","douglas","drew","dustin","dwayne","dwight","dylan",
  "earl","ed","eddie","edward","elizabeth","ellen","emily","eric","erik","erin","ethan","eugene","evan",
  "felicia","frank","frankie","franklin","fred","freddie",
  "garrett","gary","george","gerald","glenn","gordon","grant","greg","gregory","guy",
  "hank","harold","harry","heath","heather","henry","howard","hunter",
  "ian","isaac",
  "jack","jackson","jacob","jake","james","jamie","jared","jarrod","jason","jay","jeff","jeffery","jeffrey","jenna","jennifer","jeremy","jerry","jesse","jessica","jim","jimmy","joe","joel","joey","john","johnathan","johnny","johnson","jon","jonathan","jordan","jose","joseph","josh","joshua","juan","justin",
  "kareem","karen","karl","keith","kelly","kelsey","ken","kendra","kenneth","kenny","kent","kevin","khalil","kris","kristen","kyle",
  "lance","larry","laura","lauren","lawrence","lee","leo","leon","leonard","leslie","levi","lewis","linda","lisa","logan","louis","lucas","luke",
  "marcus","margaret","maria","mario","mark","marshall","martin","mason","mathew","matt","matthew","maurice","max","megan","melissa","michael","micheal","michelle","mick","mike","mitch","mitchell","monica","morgan",
  "nathan","nathaniel","neal","neil","nicholas","nick","noah","norman",
  "oliver","omar","orlando","oscar","owen",
  "patrick","paul","pedro","perry","pete","peter","phil","philip","phillip",
  "quentin","quincy",
  "rachel","ralph","randall","randy","ray","raymond","rebecca","reed","reid","rex","rich","richard","rick","ricky","rob","robbie","robert","roberto","robin","rod","rodney","roger","ron","ronald","ronnie","ross","roy","ruben","russ","russell","rusty","ryan",
  "sam","sammy","samuel","sarah","scott","sean","seth","shane","shannon","shawn","spencer","stan","stanley","stephanie","stephen","steve","steven","stuart",
  "tammy","tanner","taylor","ted","teddy","terrance","terry","thomas","tim","timmy","timothy","toby","todd","tom","tommy","tony","tracey","tracy","travis","trent","trevor","troy","tyler",
  "van","vernon","victor","vincent",
  "wade","walter","warren","wayne","wes","wesley","will","william","willie","wyatt",
  "zach","zachary","zack"
]);

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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
  if (!plausiblePersonName(candidate.name) || !TEAM_ROLE.test(candidate.role)) return;
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
 * Sales" or "Gregory Noland — Outside Sales".
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
      return clean(role.split(/\s*(?:—|–|-|,|\(|\|)\s*/)[0]).slice(0, 60);
    }
  }
  return null;
}

function crossCheckMembers(members: PersonCandidate[], bodyText: string) {
  for (const member of members) {
    const visible = visibleRoleForName(bodyText, member.name);
    if (!visible) {
      if (member.source === "jsonld") {
        member.confidence = Math.min(member.confidence, 70);
      }
      continue;
    }
    const visibleOwner = OWNER_ROLE.test(visible);
    const claimedOwner = OWNER_ROLE.test(member.role);
    if (claimedOwner && !visibleOwner) {
      member.role = visible;
      member.confidence = Math.min(member.confidence, 82);
    } else if (claimedOwner && visibleOwner) {
      member.confidence = Math.max(member.confidence, 90);
    }
  }
}

function decodeCfEmail(hex: string): string | null {
  const cleanHex = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{4,}$/.test(cleanHex) || cleanHex.length % 2 !== 0) return null;
  try {
    const key = parseInt(cleanHex.slice(0, 2), 16);
    let out = "";
    for (let i = 2; i < cleanHex.length; i += 2) {
      out += String.fromCharCode(parseInt(cleanHex.slice(i, i + 2), 16) ^ key);
    }
    return out;
  } catch {
    return null;
  }
}

function deobfuscate(text: string): string {
  return text
    .replace(/\s*[([{]\s*at\s*[)\]}]\s*/gi, "@")
    .replace(/\s*[([{]\s*dot\s*[)\]}]\s*/gi, ".");
}

export function isPlausibleEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 120) return false;
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i.test(email)) return false;
  if (BAD_EMAIL.test(email)) return false;
  if (/\.(png|jpe?g|gif|webp|svg|css|js|woff2?|ico|json|map|min|xml)$/i.test(email)) return false;
  return true;
}

export type EmailQualityTier =
  | "decision_maker"
  | "executive"
  | "department"
  | "catchall"
  | "invalid";

/**
 * Score emails prioritizing authentic decision-maker addresses over generic catch-alls.
 */
export function evaluateEmailQuality(
  email: string,
  ownerName?: string | null,
  websiteUrl?: string | null,
): { score: number; tier: EmailQualityTier } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isPlausibleEmail(cleanEmail)) {
    return { score: -999, tier: "invalid" };
  }

  const [localPart, domainPart] = cleanEmail.split("@");
  if (!localPart || !domainPart) {
    return { score: -999, tier: "invalid" };
  }

  let score = 0;
  let tier: EmailQualityTier = "catchall";

  // Check matching with owner name if available
  if (ownerName) {
    const nameWords = ownerName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    if (nameWords.length >= 2) {
      const first = nameWords[0];
      const last = nameWords[nameWords.length - 1];
      const firstInitial = first.charAt(0);
      const lastInitial = last.charAt(0);

      // Matches exact full name combos: mike.miller@, mikemiller@, mmiller@, m.miller@, mike_miller@, mike-miller@
      if (
        localPart === `${first}.${last}` ||
        localPart === `${first}${last}` ||
        localPart === `${firstInitial}${last}` ||
        localPart === `${firstInitial}.${last}` ||
        localPart === `${first}_${last}` ||
        localPart === `${first}-${last}`
      ) {
        score = 125;
        tier = "decision_maker";
      } else if (
        localPart === first ||
        localPart === `${first}${lastInitial}` ||
        localPart === last
      ) {
        score = 120;
        tier = "decision_maker";
      }
    } else if (nameWords.length === 1) {
      if (localPart === nameWords[0]) {
        score = 115;
        tier = "decision_maker";
      }
    }
  }

  if (score === 0) {
    // If localPart matches a recognized human first name
    const baseLocal = localPart.replace(/[._\-\d]+/g, "");
    if (
      COMMON_FIRST_NAMES.has(localPart) ||
      (localPart.includes(".") && COMMON_FIRST_NAMES.has(localPart.split(".")[0]))
    ) {
      score = 85;
      tier = "decision_maker";
    } else if (COMMON_FIRST_NAMES.has(baseLocal) && baseLocal.length >= 3) {
      score = 80;
      tier = "decision_maker";
    }
    // Executive aliases
    else if (
      /^(owner|president|founder|ceo|principal|managingdirector|management|director|gm)\b/i.test(
        localPart,
      )
    ) {
      score = 75;
      tier = "executive";
    }
    // Estimating & Project aliases
    else if (
      /^(estimates?|estimating|estimator|quotes?|bids?|projects?|operations|ops|dispatch|superintendent)\b/i.test(
        localPart,
      )
    ) {
      score = 50;
      tier = "department";
    }
    // Office & Team aliases
    else if (
      /^(office|team|frontdesk|service|services|scheduling|appointments?)\b/i.test(
        localPart,
      )
    ) {
      score = 35;
      tier = "department";
    }
    // Generic Catch-All Fallback aliases
    else if (
      /^(info|contact|contactus|hello|inquiry|inquiries|mail|help|support|admin|sales|enquiries)\b/i.test(
        localPart,
      )
    ) {
      score = 15;
      tier = "catchall";
    } else {
      if (/^[a-z]{3,15}$/i.test(localPart)) {
        score = 60;
        tier = "decision_maker";
      } else {
        score = 25;
        tier = "catchall";
      }
    }
  }

  // Domain Authenticity Bonus:
  // If the email domain matches the website domain, give +30 bonus over random webmail
  if (websiteUrl) {
    try {
      const siteHost = new URL(
        websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`,
      ).hostname
        .replace(/^www\./, "")
        .toLowerCase();
      if (
        domainPart === siteHost ||
        siteHost.endsWith(`.${domainPart}`) ||
        domainPart.endsWith(`.${siteHost}`)
      ) {
        score += 30;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  return { score, tier };
}

export function pickBestEmail(
  emails: Iterable<string>,
  ownerName?: string | null,
  websiteUrl?: string | null,
): string | null {
  const list = [
    ...new Set(
      [...emails].map((e) => e.toLowerCase().trim()).filter(isPlausibleEmail),
    ),
  ];
  if (!list.length) return null;

  list.sort((a, b) => {
    const scoreB = evaluateEmailQuality(b, ownerName, websiteUrl).score;
    const scoreA = evaluateEmailQuality(a, ownerName, websiteUrl).score;
    return scoreB - scoreA;
  });

  return list[0];
}

const EMAIL_RE =
  /\b[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.(?:com|org|net|co\.uk|co|io|us|ca|gov|edu|info|biz|me|cc|tv|ai|app|pro|live|tech|agency|solutions|solar|energy|construction|roof|plumbing|contractors|services|company|ltd|uk|eu|de|fr|au|nz|[a-z]{2,8})\b/gi;

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
    // Strict person name validation on JSON-LD to discard "UKAE Admin", "Admin", etc.
    if (plausiblePersonName(name)) {
      addMember(members, {
        name,
        role: role || "Owner / Executive",
        sourceUrl,
        confidence: 90,
        source: "jsonld",
      });
    }
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

  // Direct and encoded mailto attributes
  $('a[href*="mailto:"], a[href*="mailto%3A"]').each((_, element) => {
    let raw = $(element).attr("href") || "";
    try {
      raw = decodeURIComponent(raw);
    } catch {
      /* ignore */
    }
    const match = raw.match(/mailto:\s*([^\s?"'&<>]+)/i);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[<>]/g, "").trim().toLowerCase();
      if (isPlausibleEmail(cleaned)) {
        emails.add(cleaned);
      }
    }
  });

  $("[data-email], [itemprop='email']").each((_, element) => {
    const raw =
      $(element).attr("data-email") ||
      $(element).attr("content") ||
      $(element).text()?.trim();
    if (raw && isPlausibleEmail(raw)) {
      emails.add(raw.toLowerCase());
    }
  });

  // Meta tags with email or description containing email
  $("meta[property='og:email'], meta[name='email'], meta[itemprop='email']").each((_, element) => {
    const raw = $(element).attr("content")?.trim();
    if (raw && isPlausibleEmail(raw)) {
      emails.add(raw.toLowerCase());
    }
  });
  $("meta[name='description'], meta[property='og:description']").each((_, element) => {
    const raw = $(element).attr("content") || "";
    for (const match of deobfuscate(raw).matchAll(EMAIL_RE)) {
      if (isPlausibleEmail(match[0])) emails.add(match[0].toLowerCase());
    }
  });

  // Cloudflare-protected addresses (very common on contractor sites)
  $("[data-cfemail], .__cf_email__").each((_, element) => {
    const hex = $(element).attr("data-cfemail");
    const decoded = hex ? decodeCfEmail(hex) : null;
    if (decoded && isPlausibleEmail(decoded)) {
      emails.add(decoded.toLowerCase());
    }
  });
  $('a[href*="/cdn-cgi/l/email-protection#"]').each((_, element) => {
    const hex = $(element).attr("href")?.split("#")[1];
    const decoded = hex ? decodeCfEmail(hex) : null;
    if (decoded && isPlausibleEmail(decoded)) {
      emails.add(decoded.toLowerCase());
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
    '[class*="team-member"], [class*="staff-member"], [class*="leadership-member"], [class*="profile-card"], [id*="team-member"]',
  ).each((_, element) => {
    const container = $(element);
    const text = clean(container.text());
    const role = text.match(TEAM_ROLE)?.[0] ?? "";
    if (!role) return;
    const name = clean(
      container
        .find("h2,h3,h4,h5,strong,[itemprop='name'],img[alt]")
        .first()
        .attr("alt") ??
        container.find("h2,h3,h4,h5,strong,[itemprop='name']").first().text(),
    );
    if (plausiblePersonName(name)) {
      addMember(members, {
        name,
        role,
        sourceUrl,
        confidence: 84,
        source: "container",
      });
    }
  });

  // Clone and space out HTML elements so text() doesn't merge words across tags
  const rootClone = $.root().clone();
  rootClone.find("script, style, noscript, svg, img").remove();
  rootClone
    .find("br, p, div, li, td, th, section, article, header, footer, a, span, h1, h2, h3, h4, h5, h6")
    .after(" ");
  const bodyText = clean(rootClone.text());

  // Visible "Name — Role" / "Name, Role" lines
  const nameRoleRe =
    /\b([A-Z][a-zÀ-öø-ÿ'’]+(?:\s+[A-Z][a-zÀ-öø-ÿ'’]+){1,2})\s*(?:,|—|–|-|:|\||│)\s*([A-Za-zÀ-ÖØ-öø-ÿ'’&]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'’&]+){0,6})/g;
  for (const match of bodyText.matchAll(nameRoleRe)) {
    const name = clean(match[1]);
    const role = clean(match[2]);
    if (!TEAM_ROLE.test(role)) continue;
    if (!plausiblePersonName(name)) continue;
    addMember(members, {
      name,
      role,
      sourceUrl,
      confidence: 86,
      source: "visible",
    });
  }

  const roleFirstMatches = bodyText.matchAll(
    /(owner|founder|co-founder|president|principal|ceo)\s*(?:is|:|-|—)\s*([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,2})/gi,
  );
  for (const match of roleFirstMatches) {
    const name = clean(match[2]);
    if (!plausiblePersonName(name)) continue;
    addMember(members, {
      name,
      role: clean(match[1]),
      sourceUrl,
      confidence: 88,
      source: "rolefirst",
    });
  }

  const foundedByMatches = bodyText.matchAll(
    /(?:founded|owned|led)(?:\s+in\s+\d{4})?\s+by\s+(?:(owner|founder|co-founder|president|principal|ceo)\s+)?([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,2})/gi,
  );
  for (const match of foundedByMatches) {
    const name = clean(match[2]);
    if (!plausiblePersonName(name)) continue;
    addMember(members, {
      name,
      role: clean(match[1] || "Founder / Owner"),
      sourceUrl,
      confidence: 92,
      source: "foundedby",
    });
  }

  crossCheckMembers(members, bodyText);

  // Plaintext emails from properly-spaced text
  for (const match of deobfuscate(bodyText).matchAll(EMAIL_RE)) {
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
    emails: [...emails],
    contactLinks: [...new Set(contactLinks)],
    peopleLinks: [...new Set(peopleLinks)],
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
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
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
    // If HTTPS fails, try HTTP fallback for local contractor sites with SSL issues
    if (url.startsWith("https://")) {
      try {
        const httpUrl = url.replace(/^https:\/\//i, "http://");
        const fallbackRes = await safeFetch(
          httpUrl,
          {
            headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
            timeoutMs: Math.min(timeoutMs, 3500),
          },
          { allowHttp: true },
        );
        if (
          fallbackRes.ok &&
          fallbackRes.headers.get("content-type")?.includes("text/html")
        ) {
          return await fallbackRes.text();
        }
      } catch {
        /* ignore */
      }
    }
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
  
  // Build a prioritized list of subpages ensuring both contact and about/team pages are included
  const fallbackUrls = contactFallbacks(homepage);
  const contactFallbacksList = fallbackUrls.filter((u) => CONTACT_PATH.test(u));
  const teamFallbacksList = fallbackUrls.filter((u) => !CONTACT_PATH.test(u));

  const prioritizedFollow: string[] = [
    ...(home.contactLinks.length ? home.contactLinks : contactFallbacksList.slice(0, 3)),
    ...(home.peopleLinks.length ? home.peopleLinks : teamFallbacksList.slice(0, 3)),
  ];

  const uniquePages = [
    homepage,
    ...[...new Set(prioritizedFollow)].filter(
      (u) => u.replace(/\/$/, "") !== homepage.replace(/\/$/, ""),
    ),
  ].slice(0, 6);

  const members = [...home.members];
  const allEmails = new Set<string>(home.emails);
  const emailSourceMap = new Map<string, string>();
  home.emails.forEach((e) => emailSourceMap.set(e, homepage));

  const followBudget = remaining();
  const extraPages =
    followBudget < 800
      ? []
      : await Promise.all(
          uniquePages.slice(1).map(async (url) => {
            const html = await fetchHtml(url, Math.min(4_500, followBudget));
            return html ? { url, parsed: extractFromHtml(html, url) } : null;
          }),
        );

  for (const page of extraPages) {
    if (!page) continue;
    page.parsed.members.forEach((member) => addMember(members, member));
    page.parsed.emails.forEach((email) => {
      allEmails.add(email);
      if (!emailSourceMap.has(email)) {
        emailSourceMap.set(email, page.url);
      }
    });
  }

  members.sort((a, b) => b.confidence - a.confidence);
  const owner = members.find((member) => OWNER_ROLE.test(member.role)) ?? null;
  const stripSource = (member: PersonCandidate): PublicTeamMember => ({
    name: member.name,
    role: member.role,
    sourceUrl: member.sourceUrl,
    confidence: member.confidence,
  });

  const bestEmail = pickBestEmail(allEmails, owner?.name, homepage);
  const emailSourceUrl = bestEmail ? emailSourceMap.get(bestEmail) ?? homepage : null;

  return {
    owner: owner ? stripSource(owner) : null,
    team: members.slice(0, 10).map(stripSource),
    email: bestEmail,
    emailSourceUrl,
    pagesChecked: uniquePages,
  };
}

