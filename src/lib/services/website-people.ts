import * as cheerio from "cheerio";

export type PublicTeamMember = {
  name: string;
  role: string;
  sourceUrl: string;
  confidence: number;
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
const PEOPLE_PATH =
  /\b(about|team|our-team|staff|leadership|company|who-we-are|meet-the-team|owner|founder|ceo|bio)\b/i;
const OWNER_ROLE =
  /\b(owner|founder|co-founder|president|principal|managing director|ceo)\b/i;
const TEAM_ROLE =
  /\b(owner|founder|co-founder|president|principal|ceo|manager|director|partner|supervisor|estimator|sales|operations|technician|specialist)\b/i;

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
    words.length <= 5 &&
    words.every((word) => /^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+$/.test(word))
  );
}

function addMember(members: PublicTeamMember[], candidate: PublicTeamMember) {
  if (!plausibleName(candidate.name) || !TEAM_ROLE.test(candidate.role)) return;
  const key = candidate.name.toLowerCase();
  const existing = members.find((member) => member.name.toLowerCase() === key);
  if (!existing) members.push(candidate);
  else if (candidate.confidence > existing.confidence) {
    Object.assign(existing, candidate);
  }
}

function walkJsonLd(
  node: unknown,
  sourceUrl: string,
  members: PublicTeamMember[],
) {
  if (Array.isArray(node)) {
    node.forEach((item) => walkJsonLd(item, sourceUrl, members));
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
    addMember(members, { name, role, sourceUrl, confidence: 95 });
  }

  for (const key of ["founder", "employee", "member", "worksFor", "@graph"]) {
    if (record[key]) walkJsonLd(record[key], sourceUrl, members);
  }
}

function extractFromHtml(html: string, sourceUrl: string) {
  const $ = cheerio.load(html.slice(0, 1_500_000));
  const members: PublicTeamMember[] = [];
  const emails = new Set<string>();

  $('a[href^="mailto:"]').each((_, element) => {
    const raw = $(element)
      .attr("href")
      ?.replace(/^mailto:/i, "")
      .split("?")[0];
    if (raw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      emails.add(raw.toLowerCase());
    }
  });

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      walkJsonLd(JSON.parse($(element).text()), sourceUrl, members);
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
      container.find("h1,h2,h3,h4,strong,[itemprop='name']").first().text(),
    );
    addMember(members, {
      name,
      role,
      sourceUrl,
      confidence: 82,
    });
  });

  const bodyText = clean($("body").text());
  const roleFirstMatches = bodyText.matchAll(
    /(owner|founder|co-founder|president|principal|ceo)\s*(?:is|:|-|—)\s*([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,3})/gi,
  );
  for (const match of roleFirstMatches) {
    addMember(members, {
      name: clean(match[2]),
      role: clean(match[1]),
      sourceUrl,
      confidence: 88,
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
    });
  }

  const links: string[] = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const label = clean($(element).text());
    if (!href || (!PEOPLE_PATH.test(href) && !PEOPLE_PATH.test(label))) return;
    try {
      const url = new URL(href, sourceUrl);
      if (url.origin === new URL(sourceUrl).origin) links.push(url.toString());
    } catch {
      // Ignore malformed links.
    }
  });

  return {
    members,
    email: [...emails][0] ?? null,
    links: [...new Set(links)],
  };
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(10_000),
    });
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

export async function extractWebsitePeople(
  website: string,
): Promise<WebsitePeopleResult> {
  const homepage = website.startsWith("http") ? website : `https://${website}`;
  const homeHtml = await fetchHtml(homepage);
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
  const pages = [homepage, ...home.links.slice(0, 3)];
  const members = [...home.members];
  let email = home.email;
  let emailSourceUrl = home.email ? homepage : null;

  const extraPages = await Promise.all(
    pages.slice(1).map(async (url) => {
      const html = await fetchHtml(url);
      return html ? extractFromHtml(html, url) : null;
    }),
  );

  extraPages.forEach((page, index) => {
    if (!page) return;
    page.members.forEach((member) => addMember(members, member));
    if (!email && page.email) {
      email = page.email;
      emailSourceUrl = pages[index + 1];
    }
  });

  members.sort((a, b) => b.confidence - a.confidence);
  const owner = members.find((member) => OWNER_ROLE.test(member.role)) ?? null;

  return {
    owner,
    team: members.slice(0, 10),
    email,
    emailSourceUrl,
    pagesChecked: pages,
  };
}
