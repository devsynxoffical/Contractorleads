import { resolvePlatformKey } from "@/lib/platform-keys";

export type FacebookAd = {
  id: string;
  pageName: string;
  pageId: string;
  adSnapshotUrl: string;
  adCreativeBodies: string[];
  adDeliveryStartTime?: string;
  adDeliveryStopTime?: string;
  publisherPlatforms: string[];
  spend?: { lower: string; upper: string };
};

export type FacebookAdsResult = {
  ads: FacebookAd[];
  totalCount: number;
  searchUrl: string;
  source: "api" | "link";
  message?: string;
};

async function getMetaAccessToken(): Promise<string | null> {
  const token = (await resolvePlatformKey("metaAccessToken")).trim();
  if (token) return token;

  const appId = (await resolvePlatformKey("metaAppId")).trim();
  const appSecret = (await resolvePlatformKey("metaAppSecret")).trim();
  if (appId && appSecret) return `${appId}|${appSecret}`;
  return null;
}

/** True when publisher platforms include Stories placements. */
export function adHasStoryPlacement(platforms: string[] | null | undefined): boolean {
  if (!platforms?.length) return false;
  return platforms.some((p) => /stor/i.test(String(p)));
}

export function classifyAdPlacements(platforms: string[] | null | undefined) {
  const list = Array.isArray(platforms) ? platforms.map((p) => String(p)) : [];
  const normalized = list.map((p) => p.toLowerCase());
  return {
    hasStory: adHasStoryPlacement(list),
    hasFeed: normalized.some((p) =>
      /facebook|instagram|messenger|audience/.test(p),
    ),
    labels: list,
  };
}

/** Strip wrapping single/double quotes; report whether the input was double-quoted. */
export function parseAdsSearchTerm(input: string): { term: string; quoted: boolean } {
  const raw = (input || "").trim();
  const quoted = /^".+"$/.test(raw);
  const term = raw.replace(/^['"]+|['"]+$/g, "").trim();
  return { term, quoted };
}

export function buildAdsLibraryUrl(
  businessName: string,
  country = "US",
  opts?: { exact?: boolean },
) {
  const { term, quoted } = parseAdsSearchTerm(businessName);
  const exact = opts?.exact ?? quoted;
  const params = new URLSearchParams({
    active_status: "all",
    ad_type: "all",
    country: country && country !== "ALL" ? country : "ALL",
    is_targeted_country: "false",
    media_type: "all",
    q: term,
    search_type: exact ? "keyword_exact_phrase" : "keyword_unordered",
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

export async function discoverSocialFromWebsite(website: string): Promise<{
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
}> {
  const { scrapeWebsiteSocialPack } = await import("./website-social-pack");
  const pack = await scrapeWebsiteSocialPack(website);
  return {
    facebook: pack.facebook,
    instagram: pack.instagram,
    youtube: pack.youtube,
    tiktok: pack.tiktok,
  };
}

export async function searchFacebookPage(
  businessName: string
): Promise<string | null> {
  const token = await getMetaAccessToken();
  if (!token) return null;

  try {
    const { matchesBusinessName } = await import("./linkedin");
    const url = new URL("https://graph.facebook.com/v21.0/pages/search");
    url.searchParams.set("q", businessName);
    url.searchParams.set("fields", "id,name,link");
    url.searchParams.set("access_token", token);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      data?: Array<{ link?: string; name?: string }>;
    };
    const match = data.data?.find((page) =>
      page.name ? matchesBusinessName(page.name, businessName) : false,
    );
    return match?.link ?? null;
  } catch {
    return null;
  }
}

type AdsArchiveRow = {
  id: string;
  page_name?: string;
  page_id?: string;
  ad_snapshot_url?: string;
  ad_creative_bodies?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
  spend?: { lower_bound?: string; upper_bound?: string };
};

type AdsArchiveResponse = {
  data?: AdsArchiveRow[];
  paging?: { next?: string };
  error?: { message?: string };
};

const ADS_ARCHIVE_FIELDS =
  "id,page_name,page_id,ad_snapshot_url,ad_creative_bodies,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,spend";
const ADS_MAX_PAGES = 3;
const ADS_MAX_RESULTS = 75;

type AdsFetchOutcome =
  | { ok: true; rows: AdsArchiveRow[] }
  | { ok: false; message: string };

/** Fetch up to ADS_MAX_PAGES pages of ads_archive results. */
async function fetchAdsArchive(opts: {
  token: string;
  term: string;
  exact: boolean;
  pageId?: string;
  /** ISO country or "ALL" to omit ad_reached_countries. */
  country: string;
}): Promise<AdsFetchOutcome> {
  const url = new URL("https://graph.facebook.com/v21.0/ads_archive");
  if (opts.pageId) {
    url.searchParams.set("search_page_ids", JSON.stringify([opts.pageId]));
  } else {
    url.searchParams.set("search_terms", opts.term);
    if (opts.exact) url.searchParams.set("search_type", "KEYWORD_EXACT_PHRASE");
  }
  if (opts.country !== "ALL") {
    // Meta expects a JSON array string, e.g. ["US"]
    url.searchParams.set("ad_reached_countries", JSON.stringify([opts.country]));
  }
  url.searchParams.set("fields", ADS_ARCHIVE_FIELDS);
  url.searchParams.set("ad_active_status", "ACTIVE");
  url.searchParams.set("ad_type", "ALL");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", opts.token);

  const rows: AdsArchiveRow[] = [];
  let next: string | undefined = url.toString();
  for (let page = 0; page < ADS_MAX_PAGES && next; page++) {
    const response = await fetch(next, { signal: AbortSignal.timeout(20000) });

    if (!response.ok) {
      const err = await response.text();
      const permission =
        /permission|ads_read|ads_archive|#10|#200|2332002|ads\/library\/api|Authorisation and login needed/i.test(
          err,
        );
      const expired =
        !permission &&
        /session has expired|has expired|expired access token|invalid.*session|error_subcode.:463/i.test(
          err,
        );
      return {
        ok: false,
        message: permission
          ? "Meta Ads Library API is not enabled for this app. Open facebook.com/ads/library/api, accept access for the Contractor Leads app, then try again. You can still use the public Ads Library link below."
          : expired
            ? "Meta access token expired. Generate a new long-lived META_ACCESS_TOKEN in Graph API Explorer, update .env / Railway, then try again. You can still open the Ads Library link below."
            : `Ads API unavailable (${response.status}). Open Ads Library manually.`,
      };
    }

    const data = (await response.json()) as AdsArchiveResponse;
    if (data.error?.message) {
      return {
        ok: false,
        message: `${data.error.message} — open the Ads Library link below.`,
      };
    }
    rows.push(...(data.data ?? []));
    if (rows.length >= ADS_MAX_RESULTS) break;
    next = data.paging?.next;
  }
  return { ok: true, rows: rows.slice(0, ADS_MAX_RESULTS) };
}

function mapAdsArchiveRows(rows: AdsArchiveRow[]): FacebookAd[] {
  return rows.map((ad) => ({
    id: ad.id,
    pageName: ad.page_name ?? "Unknown",
    pageId: ad.page_id ?? "",
    adSnapshotUrl: ad.ad_snapshot_url ?? "",
    adCreativeBodies: ad.ad_creative_bodies ?? [],
    adDeliveryStartTime: ad.ad_delivery_start_time,
    adDeliveryStopTime: ad.ad_delivery_stop_time,
    publisherPlatforms: ad.publisher_platforms ?? [],
    spend:
      ad.spend?.lower_bound || ad.spend?.upper_bound
        ? {
            lower: ad.spend.lower_bound ?? "",
            upper: ad.spend.upper_bound ?? "",
          }
        : undefined,
  }));
}

/**
 * Search the Meta Ads Library.
 *
 * - Wrapping the name in double quotes (or `opts.exact`) requests an exact
 *   page-name match: the API gets `search_type=KEYWORD_EXACT_PHRASE` and the
 *   results are filtered to ads whose page_name equals the term.
 * - `country = "ALL"` omits `ad_reached_countries`. A country-specific call
 *   that returns nothing is retried once with ALL.
 * - `opts.pageId` searches by `search_page_ids` instead of search_terms.
 */
export async function searchFacebookAdsLibrary(
  businessName: string,
  country = "US",
  opts?: { accessToken?: string | null; exact?: boolean; pageId?: string },
): Promise<FacebookAdsResult> {
  const { term, quoted } = parseAdsSearchTerm(businessName);
  const exact = Boolean(opts?.exact || quoted);
  const requestedCountry = (country || "US").trim().toUpperCase() || "US";
  const searchUrl = buildAdsLibraryUrl(term, requestedCountry, { exact });
  const token = opts?.accessToken?.trim() || (await getMetaAccessToken());

  if (!token) {
    return {
      ads: [],
      totalCount: 0,
      searchUrl,
      source: "link",
      message:
        "Connect your Facebook profile in the FB section, or add META_APP_ID / META_APP_SECRET for live ad data. You can still open the public Ads Library link below.",
    };
  }

  if (!term && !opts?.pageId) {
    return {
      ads: [],
      totalCount: 0,
      searchUrl,
      source: "link",
      message: "Enter a Facebook Page name to search.",
    };
  }

  try {
    const notes: string[] = [];
    let outcome = await fetchAdsArchive({
      token,
      term,
      exact,
      pageId: opts?.pageId,
      country: requestedCountry,
    });

    if (outcome.ok && outcome.rows.length === 0 && requestedCountry !== "ALL") {
      const retry = await fetchAdsArchive({
        token,
        term,
        exact,
        pageId: opts?.pageId,
        country: "ALL",
      });
      if (retry.ok && retry.rows.length > 0) {
        notes.push(
          `No active ads reached ${requestedCountry}; showing ads from all countries instead.`,
        );
        outcome = retry;
      }
    }

    if (!outcome.ok) {
      return {
        ads: [],
        totalCount: 0,
        searchUrl,
        source: "link",
        message: outcome.message,
      };
    }

    const mapped = mapAdsArchiveRows(outcome.rows);
    const needle = term.toLowerCase();

    // Prefer ads whose page name matches the business; keep others as fallback
    const byContains = [...mapped].sort((a, b) => {
      const aMatch = a.pageName.toLowerCase().includes(needle) ? 0 : 1;
      const bMatch = b.pageName.toLowerCase().includes(needle) ? 0 : 1;
      return aMatch - bMatch;
    });

    let ads: FacebookAd[] = byContains;
    if (exact && !opts?.pageId && mapped.length > 0) {
      const exactMatches = mapped.filter(
        (ad) => ad.pageName.trim().toLowerCase() === needle,
      );
      if (exactMatches.length > 0) {
        ads = exactMatches;
      } else {
        notes.push(
          `No Page named exactly "${term}" is running ads. Showing the closest matches instead.`,
        );
      }
    }

    if (ads.length === 0) {
      notes.push(
        "No active ads found via the Meta API for this name. Try the public Ads Library link — some advertisers only appear there.",
      );
    }

    return {
      ads,
      totalCount: ads.length,
      searchUrl,
      source: "api",
      message: notes.length ? notes.join(" ") : undefined,
    };
  } catch {
    return {
      ads: [],
      totalCount: 0,
      searchUrl,
      source: "link",
      message: "Could not reach Meta Ads API. Use the Ads Library link below.",
    };
  }
}

export async function isMetaConfigured(): Promise<boolean> {
  return Boolean(await getMetaAccessToken());
}
