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

function getMetaAccessToken(): string | null {
  const token = process.env.META_ACCESS_TOKEN;
  if (token) return token;

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret =
    process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  if (appId && appSecret) return `${appId}|${appSecret}`;
  return null;
}

export function buildAdsLibraryUrl(businessName: string, country = "US") {
  const params = new URLSearchParams({
    active_status: "active",
    ad_type: "all",
    country,
    q: businessName,
    search_type: "keyword_unordered",
    media_type: "all",
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

export async function discoverSocialFromWebsite(website: string): Promise<{
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
}> {
  const empty = {
    facebook: null as string | null,
    instagram: null as string | null,
    youtube: null as string | null,
    tiktok: null as string | null,
  };

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
    if (!response.ok) return empty;

    const html = await response.text();

    const fbMatch = html.match(
      /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/i
    );
    const igMatch = html.match(
      /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/i
    );
    const ytMatch = html.match(
      /https?:\/\/(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[a-zA-Z0-9._-]+/i
    );
    const ttMatch = html.match(
      /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/i
    );

    return {
      facebook: fbMatch?.[0] ?? null,
      instagram: igMatch?.[0] ?? null,
      youtube: ytMatch?.[0] ?? null,
      tiktok: ttMatch?.[0] ?? null,
    };
  } catch {
    return empty;
  }
}

export async function searchFacebookPage(
  businessName: string
): Promise<string | null> {
  const token = getMetaAccessToken();
  if (!token) return null;

  try {
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
    const match = data.data?.[0];
    return match?.link ?? null;
  } catch {
    return null;
  }
}

export async function searchFacebookAdsLibrary(
  businessName: string,
  country = "US"
): Promise<FacebookAdsResult> {
  const searchUrl = buildAdsLibraryUrl(businessName, country);
  const token = getMetaAccessToken();

  if (!token) {
    return {
      ads: [],
      totalCount: 0,
      searchUrl,
      source: "link",
      message:
        "Add META_APP_ID and META_APP_SECRET to .env for live ad data. Open the link below to browse the public Ads Library.",
    };
  }

  try {
    const url = new URL("https://graph.facebook.com/v21.0/ads_archive");
    url.searchParams.set("search_terms", businessName);
    // Meta expects a JSON array string, e.g. ["US"]
    url.searchParams.set("ad_reached_countries", `["${country}"]`);
    url.searchParams.set(
      "fields",
      "id,page_name,page_id,ad_snapshot_url,ad_creative_bodies,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,spend"
    );
    url.searchParams.set("ad_active_status", "ACTIVE");
    url.searchParams.set("ad_type", "ALL");
    url.searchParams.set("limit", "25");
    url.searchParams.set("access_token", token);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const err = await response.text();
      const expired =
        /session has expired|expired|invalid.*token|oauth/i.test(err);
      const permission =
        /permission|ads_read|ads_archive|#10|#200/i.test(err);
      return {
        ads: [],
        totalCount: 0,
        searchUrl,
        source: "link",
        message: expired
          ? "Meta access token expired. Generate a new long-lived META_ACCESS_TOKEN in Graph API Explorer, update .env / Railway, then try again. You can still open the Ads Library link below."
          : permission
            ? "This Meta token cannot access Ads Library (needs ads_read / Ads Archive access). Open the public Ads Library link below, or update META_ACCESS_TOKEN."
            : `Ads API unavailable (${response.status}). Open Ads Library manually.`,
      };
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        page_name?: string;
        page_id?: string;
        ad_snapshot_url?: string;
        ad_creative_bodies?: string[];
        ad_delivery_start_time?: string;
        ad_delivery_stop_time?: string;
        publisher_platforms?: string[];
        spend?: { lower_bound?: string; upper_bound?: string };
      }>;
      error?: { message?: string };
    };

    if (data.error?.message) {
      return {
        ads: [],
        totalCount: 0,
        searchUrl,
        source: "link",
        message: `${data.error.message} — open the Ads Library link below.`,
      };
    }

    const needle = businessName.trim().toLowerCase();
    const mapped = (data.data ?? []).map((ad) => ({
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

    // Prefer ads whose page name matches the business; keep others as fallback
    const ads: FacebookAd[] = mapped.sort((a, b) => {
      const aMatch = a.pageName.toLowerCase().includes(needle) ? 0 : 1;
      const bMatch = b.pageName.toLowerCase().includes(needle) ? 0 : 1;
      return aMatch - bMatch;
    });

    return {
      ads,
      totalCount: ads.length,
      searchUrl,
      source: "api",
      message:
        ads.length === 0
          ? "No active ads found via the Meta API for this name. Try the public Ads Library link — some advertisers only appear there."
          : undefined,
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

export function isMetaConfigured(): boolean {
  return Boolean(getMetaAccessToken());
}
