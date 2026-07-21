import { getTierOneCountry } from "@/lib/constants";
import { chunkArray, mapPool } from "@/lib/utils/async-pool";

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  mapsUrl: string;
  latitude?: number;
  longitude?: number;
  yearsInBusiness?: number;
};

export class GooglePlacesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GooglePlacesError";
  }
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** Map industry labels to better Places text queries */
function industryQuery(industry: string) {
  const map: Record<string, string> = {
    Painting: "painting contractors house painters",
    Roofing: "roofing contractors",
    HVAC: "HVAC heating air conditioning contractors",
    Plumbing: "plumbers",
    Electrical: "electricians electrical contractors",
    Solar: "solar panel installation",
    Landscaping: "landscaping contractors",
    Remodeling: "home remodeling contractors",
    "Cleaning Services": "house cleaning services",
    "Pest Control": "pest control",
    "Pool Services": "pool service pool cleaning",
    "General Contractors": "general contractors",
  };
  return map[industry] ?? `${industry} contractors`;
}

function locationQuery(params: {
  country: string;
  state?: string;
  city?: string;
  zip?: string;
}) {
  const city =
    params.city &&
    params.city.trim().toLowerCase() !== params.state?.trim().toLowerCase() &&
    !/^(florida|texas|california|new york)$/i.test(params.city.trim())
      ? params.city.trim()
      : undefined;

  return [
    city,
    params.state,
    params.zip,
    getTierOneCountry(params.country).name,
  ]
    .filter(Boolean)
    .join(", ");
}

/** Clean + canonicalize a Google Business Profile website URL */
export function normalizeWebsiteUrl(raw?: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  try {
    let value = raw.trim();
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return undefined;

    // Drop tracking noise but keep the real path
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ].forEach((p) => parsed.searchParams.delete(p));

    parsed.hash = "";
    // Prefer https
    if (parsed.protocol === "http:") parsed.protocol = "https:";

    const host = parsed.hostname.toLowerCase();
    // Skip Google Maps / short links — keep real business sites (incl. *.business.site)
    if (
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "goo.gl" ||
      host.endsWith(".goo.gl") ||
      host === "maps.app.goo.gl"
    ) {
      return undefined;
    }

    return parsed.toString().replace(/\/$/, "") || parsed.origin;
  } catch {
    return undefined;
  }
}

type PlaceDetails = {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  url?: string;
  geometry?: { location?: { lat: number; lng: number } };
};

async function fetchPlaceDetailsLegacy(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails | null> {
  const detailsUrl = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  detailsUrl.searchParams.set("place_id", placeId);
  detailsUrl.searchParams.set(
    "fields",
    "name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,url,geometry"
  );
  detailsUrl.searchParams.set("key", apiKey);

  const detailsRes = await fetch(detailsUrl.toString(), {
    signal: AbortSignal.timeout(12000),
  });
  if (!detailsRes.ok) return null;

  const detailsData = (await detailsRes.json()) as {
    status?: string;
    result?: PlaceDetails;
  };

  if (detailsData.status && detailsData.status !== "OK") return null;
  return detailsData.result ?? null;
}

/** Places API (New) — often returns websiteUri when legacy Details omits it */
async function fetchWebsiteFromPlacesNew(
  placeId: string,
  apiKey: string
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "websiteUri,nationalPhoneNumber,internationalPhoneNumber",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      websiteUri?: string;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
    };
    return normalizeWebsiteUrl(data.websiteUri);
  } catch {
    return undefined;
  }
}

async function enrichOnePlace(
  place: {
    place_id: string;
    name: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    geometry?: { location?: { lat: number; lng: number } };
  },
  apiKey: string,
  opts?: { fast?: boolean },
): Promise<PlaceResult> {
  let details = await fetchPlaceDetailsLegacy(place.place_id, apiKey);

  // One retry — Details occasionally flakes without website (skip in fast mode)
  if (!opts?.fast && !details?.website) {
    await new Promise((r) => setTimeout(r, 200));
    const retry = await fetchPlaceDetailsLegacy(place.place_id, apiKey);
    if (retry) {
      details = details
        ? { ...details, ...retry, website: retry.website || details.website }
        : retry;
    }
  }

  let website = normalizeWebsiteUrl(details?.website);
  if (!opts?.fast && !website) {
    website = await fetchWebsiteFromPlacesNew(place.place_id, apiKey);
  }

  const phone =
    details?.formatted_phone_number ||
    details?.international_phone_number ||
    undefined;

  return {
    placeId: place.place_id,
    name: details?.name || place.name,
    address: details?.formatted_address || place.formatted_address || "",
    phone,
    website,
    rating: details?.rating ?? place.rating,
    reviewCount: details?.user_ratings_total ?? place.user_ratings_total,
    mapsUrl:
      details?.url ||
      `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    latitude: details?.geometry?.location?.lat ?? place.geometry?.location?.lat,
    longitude:
      details?.geometry?.location?.lng ?? place.geometry?.location?.lng,
  };
}

function buildPlacesQueries(params: {
  industry: string;
  country: string;
  locationScope: "local" | "country";
  state?: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius?: number;
}): string[] {
  const country = getTierOneCountry(params.country);
  const loc =
    params.locationScope === "country"
      ? country.name
      : params.customLocation?.trim() || locationQuery(params);
  const trade = industryQuery(params.industry);
  const industry = params.industry;

  const queries = new Set<string>();
  queries.add(`${trade} in ${loc}`);
  queries.add(`${trade} near ${loc}`);
  queries.add(`${industry} contractors ${loc}`);
  queries.add(`${industry} company ${loc}`);
  queries.add(`best ${trade} ${loc}`);
  queries.add(`residential ${industry} ${loc}`);
  queries.add(`commercial ${industry} ${loc}`);
  queries.add(`${industry} services ${loc}`);

  if (params.locationScope === "local" && params.state && params.city) {
    queries.add(`${trade} in ${params.state}, ${country.name}`);
    queries.add(`${trade} near ${params.state}`);
  }
  if (params.zip) {
    queries.add(`${trade} ${params.zip}`);
  }

  // Country-wide: fan across major US metros for volume
  if (params.locationScope === "country" && params.country === "US") {
    const metros = [
      "New York NY",
      "Los Angeles CA",
      "Chicago IL",
      "Houston TX",
      "Phoenix AZ",
      "Philadelphia PA",
      "San Antonio TX",
      "San Diego CA",
      "Dallas TX",
      "Austin TX",
      "Jacksonville FL",
      "Miami FL",
      "Atlanta GA",
      "Denver CO",
      "Seattle WA",
      "Boston MA",
      "Nashville TN",
      "Charlotte NC",
      "Detroit MI",
      "Las Vegas NV",
    ];
    for (const metro of metros) {
      queries.add(`${trade} in ${metro}`);
    }
  }

  return [...queries];
}

async function textSearchPages(
  query: string,
  apiKeyValue: string,
  googleRegion: string,
  maxResults: number,
): Promise<
  Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    geometry?: { location?: { lat: number; lng: number } };
  }>
> {
  const combined: Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    geometry?: { location?: { lat: number; lng: number } };
  }> = [];

  let pageToken: string | undefined;
  for (let page = 0; page < 3 && combined.length < maxResults; page++) {
    if (pageToken) {
      await new Promise((r) => setTimeout(r, 1800));
    }
    const searchUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
    );
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("region", googleRegion);
    searchUrl.searchParams.set("key", apiKeyValue);
    if (pageToken) searchUrl.searchParams.set("pagetoken", pageToken);

    const searchRes = await fetch(searchUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    });
    if (!searchRes.ok) {
      throw new GooglePlacesError(
        `Google Places HTTP ${searchRes.status}. Try again in a moment.`,
      );
    }
    const searchData = (await searchRes.json()) as {
      status?: string;
      error_message?: string;
      next_page_token?: string;
      results?: Array<{
        place_id: string;
        name: string;
        formatted_address?: string;
        rating?: number;
        user_ratings_total?: number;
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };

    if (
      searchData.status &&
      searchData.status !== "OK" &&
      searchData.status !== "ZERO_RESULTS"
    ) {
      const msg = searchData.error_message || searchData.status;
      if (searchData.status === "REQUEST_DENIED") {
        throw new GooglePlacesError(
          `Google Places denied the request. Enable Billing on your Google Cloud project, then enable Places API. Details: ${msg}`,
        );
      }
      if (searchData.status === "OVER_QUERY_LIMIT") {
        throw new GooglePlacesError(
          "Google Places quota exceeded. Check billing/quota in Google Cloud Console.",
        );
      }
      if (searchData.status === "INVALID_REQUEST") {
        throw new GooglePlacesError(
          `Invalid Places request. Try a city name with the state. (${msg})`,
        );
      }
      throw new GooglePlacesError(`Google Places error: ${msg}`);
    }

    combined.push(...(searchData.results ?? []));
    pageToken = searchData.next_page_token || undefined;
    if (!pageToken) break;
  }

  return combined;
}

export async function searchGooglePlaces(params: {
  industry: string;
  country: string;
  locationScope: "local" | "country";
  state?: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius?: number;
  limit?: number;
}): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey.includes("your-key") || apiKey === "AIza...") {
    throw new GooglePlacesError(
      "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to .env.",
    );
  }
  const apiKeyValue = apiKey;
  const country = getTierOneCountry(params.country);
  const wanted = Math.max(1, Math.min(params.limit ?? 10, 1200));
  const fast = wanted >= 80;

  const queries = buildPlacesQueries(params);
  // Fewer query fan-outs for small searches; more for large targets
  const queryBudget =
    wanted <= 25
      ? 2
      : wanted <= 60
        ? 6
        : wanted <= 120
          ? 10
          : wanted <= 250
            ? 14
            : wanted <= 500
              ? 18
              : 24;
  const selectedQueries = queries.slice(0, queryBudget);

  const deduped = new Map<
    string,
    {
      place_id: string;
      name: string;
      formatted_address?: string;
      rating?: number;
      user_ratings_total?: number;
      geometry?: { location?: { lat: number; lng: number } };
    }
  >();

  // Fan-out Places text searches in parallel batches (each query ≤ ~60 results)
  for (const batch of chunkArray(selectedQueries, 3)) {
    if (deduped.size >= wanted) break;
    const pages = await Promise.all(
      batch.map((q) =>
        textSearchPages(
          q,
          apiKeyValue,
          country.googleRegion,
          Math.min(60, wanted - deduped.size + 20),
        ).catch((err) => {
          if (err instanceof GooglePlacesError) throw err;
          return [] as Awaited<ReturnType<typeof textSearchPages>>;
        }),
      ),
    );
    for (const rows of pages) {
      for (const row of rows) {
        if (!deduped.has(row.place_id)) deduped.set(row.place_id, row);
      }
    }
  }

  const results = Array.from(deduped.values()).slice(0, wanted);
  if (!results.length) return [];

  // Cap Details concurrency higher for volume searches
  return mapPool(results, fast ? 20 : 12, (place) =>
    enrichOnePlace(place, apiKeyValue, { fast }),
  );
}

/**
 * Soft reachability check. Many real sites block HEAD or bot IPs —
 * never use a failed check to erase a Google Business Profile website.
 */
export async function verifyWebsite(url: string): Promise<boolean> {
  const normalized = normalizeWebsiteUrl(url);
  if (!normalized) return false;

  const candidates = [normalized];
  try {
    const u = new URL(normalized);
    if (u.hostname.startsWith("www.")) {
      candidates.push(normalized.replace("://www.", "://"));
    } else {
      candidates.push(normalized.replace("://", "://www."));
    }
  } catch {
    // ignore
  }

  for (const candidate of candidates) {
    // Try HEAD first
    try {
      const head = await fetch(candidate, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": BROWSER_UA, Accept: "*/*" },
        signal: AbortSignal.timeout(7000),
      });
      if (head.status >= 200 && head.status < 400) return true;
      // Many hosts reject HEAD with 405/403 but still serve GET
      if (head.status === 405 || head.status === 403 || head.status === 401) {
        const get = await fetch(candidate, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": BROWSER_UA,
            Accept: "text/html,application/xhtml+xml",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (get.status >= 200 && get.status < 400) return true;
      }
    } catch {
      // try GET fallback
      try {
        const get = await fetch(candidate, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": BROWSER_UA,
            Accept: "text/html,application/xhtml+xml",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (get.status >= 200 && get.status < 400) return true;
      } catch {
        // next candidate
      }
    }
  }

  return false;
}
