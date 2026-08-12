import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { getTierOneCountry } from "@/lib/constants";
import {
  logGooglePlacesError,
  PUBLIC_PLACES_SEARCH_UNAVAILABLE,
  sanitizePlacesErrorForClient,
} from "@/lib/google-places-errors";
import { mapPool } from "@/lib/utils/async-pool";
import { getGooglePlacesKeys } from "@/lib/platform-keys";

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
  /** HTTP status when the failure came from a Places API response, if known. */
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "GooglePlacesError";
    if (statusCode) this.statusCode = statusCode;
  }
}

/** Key/billing/quota failures worth retrying with the backup key. */
const PLACES_KEY_FAILURE_STATUSES = new Set([400, 401, 403, 429]);

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const execFileAsync = promisify(execFile);

/** Better search phrases for preset industries. */
const PRESET_PHRASES: Record<string, string[]> = {
  Painting: ["painting contractors", "house painters"],
  Roofing: ["roofing contractors", "roofers"],
  HVAC: ["HVAC contractors", "heating and air conditioning contractors"],
  Plumbing: ["plumbers", "plumbing contractors"],
  Electrical: ["electricians", "electrical contractors"],
  Solar: ["solar panel installers", "solar companies"],
  Landscaping: ["landscaping contractors", "landscapers"],
  Remodeling: ["home remodeling contractors", "remodeling companies"],
  "Cleaning Services": ["house cleaning services", "cleaning companies"],
  "Pest Control": ["pest control companies", "exterminators"],
  "Pool Services": ["pool service", "pool cleaning companies"],
  "General Contractors": ["general contractors", "construction companies"],
};

/**
 * Natural search phrases for a service / industry.
 * Custom services are NOT forced into "X contractors" — that phrasing kills
 * results for things like window tinting, dog grooming, or gutter cleaning.
 */
function industryPhrases(industry: string): string[] {
  const raw = industry.trim();
  if (!raw) return [];
  const preset = PRESET_PHRASES[raw];
  if (preset?.length) return preset;
  const out = new Set<string>([raw]);
  out.add(`${raw} services`);
  out.add(`${raw} companies`);
  out.add(`${raw} company`);
  out.add(`best ${raw}`);
  return [...out];
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
  const phrases = industryPhrases(params.industry);
  if (!phrases.length) return [];

  const queries = new Set<string>();

  for (const phrase of phrases) {
    if (loc) {
      queries.add(`${phrase} in ${loc}`);
      queries.add(`${phrase} near ${loc}`);
      queries.add(`${phrase} ${loc}`);
    } else {
      queries.add(phrase);
    }
  }

  // Local: state-wide + postal-code variants for volume/diversity.
  const topPhrases = phrases.slice(0, 2);
  if (params.locationScope === "local" && params.state && params.city) {
    for (const phrase of topPhrases) {
      queries.add(`${phrase} in ${params.state}, ${country.name}`);
      queries.add(`${phrase} near ${params.state}`);
    }
  }
  if (params.zip) {
    for (const phrase of topPhrases) {
      queries.add(`${phrase} ${params.zip}`);
    }
  }

  // Country-wide: fan across major US metros for volume.
  if (params.locationScope === "country" && params.country === "US") {
    for (const metro of US_METROS) {
      queries.add(`${topPhrases[0]} in ${metro}`);
    }
  }

  return [...queries];
}

const US_METROS = [
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

/**
 * Spread the query budget across the whole pool (not just the first N near-
 * identical "in <loc>" queries). Guarantees the state-wide, postal-code, and
 * metro variants actually get run for volume searches.
 */
function selectQueries(pool: string[], budget: number): string[] {
  if (!pool.length) return [];
  if (budget <= 1) return [pool[0]];
  if (budget >= pool.length) return pool;
  const out: string[] = [];
  for (let i = 0; i < budget; i++) {
    const idx = Math.round((i * (pool.length - 1)) / (budget - 1));
    out.push(pool[idx]);
  }
  return [...new Set(out)];
}

type ScraperLead = {
  place_id?: string;
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  google_maps_url?: string;
  latitude?: number;
  longitude?: number;
};

type PlacesApiPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  businessStatus?: string;
};

type PlacesTextSearchResponse = {
  places?: PlacesApiPlace[];
  nextPageToken?: string;
  error?: { code?: number; status?: string; message?: string };
};

const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.googleMapsUri",
  "places.businessStatus",
].join(",");

function parseScraperJson(raw: string): {
  ok?: boolean;
  leads?: ScraperLead[];
  error?: string;
} {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // If any log noise leaked onto stdout, grab the last JSON object.
    const start = trimmed.lastIndexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Scraper returned invalid JSON");
  }
}

function coordsFromMapsUrl(url?: string): { lat?: number; lng?: number } {
  if (!url) return {};
  const m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (!m) return {};
  return { lat: Number(m[1]), lng: Number(m[2]) };
}

function playwrightBrowsersPath(): string {
  const current = process.env.PLAYWRIGHT_BROWSERS_PATH?.trim();
  // Cursor sandbox injects a temp path that often has no Chromium binaries.
  if (
    current &&
    !current.includes("cursor-sandbox-cache") &&
    existsSync(current)
  ) {
    return current;
  }
  // Docker / Railway image path
  if (existsSync("/ms-playwright")) return "/ms-playwright";
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  }
  if (process.platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
      "ms-playwright",
    );
  }
  return path.join(os.homedir(), ".cache", "ms-playwright");
}

function resolveScraperDir(): string {
  const candidates = [
    path.join(process.cwd(), "Gmap-scrapper"),
    path.join(process.cwd(), "..", "Gmap-scrapper"),
    path.join(process.cwd(), "..", "..", "Gmap-scrapper"),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "api_runner.py"))) return dir;
  }
  return candidates[0];
}

function resolvePythonBin(): string {
  const fromEnv = process.env.PYTHON_BIN?.trim();
  if (fromEnv) return fromEnv;
  return "python3";
}

async function runScraper(params: {
  query: string;
  workers: number;
  limit: number;
}): Promise<ScraperLead[]> {
  const scraperDir = resolveScraperDir();
  const runnerPath = path.join(scraperDir, "api_runner.py");
  if (!existsSync(runnerPath)) {
    logGooglePlacesError("scraper", `Missing runner at ${runnerPath}`);
    throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
  }
  const args = [
    runnerPath,
    "--quick",
    "--query",
    params.query,
    "--workers",
    String(params.workers),
    "--limit",
    String(params.limit),
  ];

  try {
    const { stdout, stderr } = await execFileAsync(resolvePythonBin(), args, {
      cwd: scraperDir,
      timeout: 180000,
      maxBuffer: 16 * 1024 * 1024,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        PLAYWRIGHT_BROWSERS_PATH: playwrightBrowsersPath(),
      },
    });
    const raw = stdout.trim();
    if (!raw) {
      logGooglePlacesError(
        "scraper",
        `Empty response. stderr=${stderr?.slice(0, 400)}`,
      );
      throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
    }
    const data = parseScraperJson(raw);
    if (!data.ok) {
      const detail = data.error || "unknown scraper error";
      logGooglePlacesError("scraper", detail);
      throw new GooglePlacesError(sanitizePlacesErrorForClient(detail));
    }
    return data.leads ?? [];
  } catch (error) {
    if (error instanceof GooglePlacesError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    logGooglePlacesError("scraper", msg);
    throw new GooglePlacesError(sanitizePlacesErrorForClient(msg));
  }
}

async function searchTextOnce(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<PlacesTextSearchResponse> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let detail = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(raw) as {
        error?: { message?: string; status?: string };
      };
      detail = parsed.error?.message || parsed.error?.status || detail;
    } catch {
      // non-JSON error body — keep HTTP status
    }
    logGooglePlacesError("places-api", `searchText ${detail}`);
    throw new GooglePlacesError(
      sanitizePlacesErrorForClient(detail),
      response.status,
    );
  }
  const data = (await response.json()) as PlacesTextSearchResponse;
  if (data.error) {
    const detail = data.error.message || data.error.status || "searchText error";
    logGooglePlacesError("places-api", `searchText ${detail}`);
    throw new GooglePlacesError(sanitizePlacesErrorForClient(detail));
  }
  return data;
}

async function placesTextSearch(opts: {
  query: string;
  regionCode: string;
  pageToken?: string;
}): Promise<PlacesTextSearchResponse> {
  const { primary, backup } = await getGooglePlacesKeys();
  const keys = [primary.trim(), backup.trim()].filter(Boolean);
  if (!keys.length) {
    throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
  }
  const body: Record<string, unknown> = {
    textQuery: opts.query,
    pageSize: 20,
    languageCode: "en",
    regionCode: opts.regionCode,
  };
  if (opts.pageToken) body.pageToken = opts.pageToken;

  let lastError: GooglePlacesError | null = null;
  for (let i = 0; i < keys.length; i++) {
    try {
      return await searchTextOnce(keys[i], body);
    } catch (error) {
      lastError =
        error instanceof GooglePlacesError
          ? error
          : new GooglePlacesError(
              sanitizePlacesErrorForClient(
                error instanceof Error ? error.message : String(error),
              ),
            );
      const status = lastError.statusCode;
      if (!(status && PLACES_KEY_FAILURE_STATUSES.has(status))) {
        // Not a key problem — no point trying the next key.
        throw lastError;
      }
      logGooglePlacesError(
        "places-api",
        `primary key failed (${status}) — ${i + 1 < keys.length ? "trying backup" : "no backup"}`,
      );
    }
  }
  throw lastError ?? new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
}

async function searchOfficialQuery(opts: {
  query: string;
  regionCode: string;
  maxPages: number;
  wanted: number;
}): Promise<PlaceResult[]> {
  const out: PlaceResult[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < opts.maxPages; page++) {
    const data = await placesTextSearch({
      query: opts.query,
      regionCode: opts.regionCode,
      pageToken,
    });
    for (const place of data.places ?? []) {
      if (out.length >= opts.wanted) break;
      const name = place.displayName?.text?.trim();
      if (!name) continue;
      if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
        continue;
      }
      const mapsUrl = place.googleMapsUri?.trim() || "";
      out.push({
        placeId:
          place.id?.trim() || `${name}-${place.formattedAddress || ""}`,
        name,
        address: place.formattedAddress?.trim() || "",
        phone: place.internationalPhoneNumber?.trim() || undefined,
        website: normalizeWebsiteUrl(place.websiteUri),
        rating: place.rating ?? undefined,
        reviewCount: place.userRatingCount ?? undefined,
        mapsUrl:
          mapsUrl ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
      });
    }
    pageToken = data.nextPageToken;
    if (!pageToken || out.length >= opts.wanted) break;
  }
  return out;
}

async function searchOfficialPlaces(opts: {
  queries: string[];
  wanted: number;
  regionCode: string;
}): Promise<PlaceResult[]> {
  const { queries, wanted, regionCode } = opts;
  const pagesPerQuery = wanted <= 20 ? 1 : wanted <= 60 ? 2 : 4;

  const failures: string[] = [];
  const batches = await mapPool(queries, 4, async (q) =>
    searchOfficialQuery({
      query: q,
      regionCode,
      maxPages: pagesPerQuery,
      wanted,
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${q} → ${msg}`);
      logGooglePlacesError("places-api-query", `${q} → ${msg}`);
      return [] as PlaceResult[];
    }),
  );

  const deduped = new Map<string, PlaceResult>();
  for (const row of batches.flat()) {
    const key = row.placeId || row.name;
    if (deduped.has(key)) continue;
    deduped.set(key, row);
    if (deduped.size >= wanted) break;
  }

  if (!deduped.size) {
    if (failures.length === queries.length) {
      const detail = failures[0].split(" → ")[1] ?? "";
      logGooglePlacesError(
        "places-api",
        `All ${failures.length} queries failed: ${failures.join(" | ")}`,
      );
      throw new GooglePlacesError(
        sanitizePlacesErrorForClient(detail) || PUBLIC_PLACES_SEARCH_UNAVAILABLE,
      );
    }
    return [];
  }

  return Array.from(deduped.values()).slice(0, wanted);
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
  // Scraper is slower than Places API — keep caps practical for Lead Finder.
  const wanted = Math.max(1, Math.min(params.limit ?? 10, 200));
  const workers = wanted >= 100 ? 5 : wanted >= 40 ? 3 : 2;

  const pool = buildPlacesQueries(params);
  // One query for small searches; fan out a few diverse queries for volume.
  const queryBudget =
    wanted <= 25 ? 1 : wanted <= 60 ? 2 : wanted <= 120 ? 3 : 4;
  const selectedQueries = selectQueries(pool, queryBudget);
  if (!selectedQueries.length) {
    logGooglePlacesError("scraper", `No search queries built for "${params.industry}"`);
    throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
  }

  const placesKeys = await getGooglePlacesKeys();
  if (placesKeys.primary.trim() || placesKeys.backup.trim()) {
    try {
      return await searchOfficialPlaces({
        queries: selectedQueries,
        wanted,
        regionCode: getTierOneCountry(params.country).code,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logGooglePlacesError(
        "places-api",
        `search failed (${msg}) — falling back to Maps scraper`,
      );
    }
  }

  const perQueryLimit = Math.min(
    80,
    Math.max(wanted, Math.ceil(wanted / selectedQueries.length) + 10),
  );

  const failures: string[] = [];
  // Max 2 headless browsers at once — parallel Chromium launches trip Google's
  // anti-bot checks, which is the main source of flaky empty scrapes.
  const batches = await mapPool(selectedQueries, 2, async (q) =>
    runScraper({
      query: q,
      workers,
      limit: perQueryLimit,
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${q} → ${msg}`);
      logGooglePlacesError("scraper-query", `${q} → ${msg}`);
      return [] as ScraperLead[];
    }),
  );

  const rows = batches.flat();
  if (!rows.length) {
    if (failures.length === selectedQueries.length) {
      // Every scrape attempt failed (blocked/timeout) — surface it instead of
      // silently returning an empty list the user mistakes for "no businesses".
      logGooglePlacesError(
        "scraper",
        `All ${failures.length} queries failed: ${failures.join(" | ")}`,
      );
      const detail = failures[0].split(" → ")[1] ?? "";
      throw new GooglePlacesError(
        sanitizePlacesErrorForClient(detail) || PUBLIC_PLACES_SEARCH_UNAVAILABLE,
      );
    }
    // Queries ran fine but genuinely found nothing for this service/area.
    return [];
  }

  const deduped = new Map<string, PlaceResult>();
  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    const mapsUrl = row.google_maps_url?.trim() || "";
    const placeId =
      row.place_id?.trim() ||
      mapsUrl ||
      `${name}-${row.phone || row.address || ""}`;
    if (deduped.has(placeId)) continue;
    const fromUrl = coordsFromMapsUrl(mapsUrl);
    deduped.set(placeId, {
      placeId,
      name,
      address: row.address?.trim() || "",
      phone: row.phone?.trim() || undefined,
      website: normalizeWebsiteUrl(row.website || undefined),
      rating: row.rating ?? undefined,
      reviewCount: row.review_count ?? undefined,
      mapsUrl:
        mapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      latitude: row.latitude ?? fromUrl.lat,
      longitude: row.longitude ?? fromUrl.lng,
    });
    if (deduped.size >= wanted) break;
  }

  return Array.from(deduped.values()).slice(0, wanted);
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
