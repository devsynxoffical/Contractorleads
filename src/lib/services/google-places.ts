import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { getTierOneCountry } from "@/lib/constants";
import {
  logGooglePlacesError,
  PUBLIC_PLACES_SEARCH_UNAVAILABLE,
} from "@/lib/google-places-errors";

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

const execFileAsync = promisify(execFile);

/** Map industry labels to better search phrases */
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
  if (current && !current.includes("cursor-sandbox-cache")) {
    return current;
  }
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

async function runScraper(params: {
  query: string;
  workers: number;
  limit: number;
}): Promise<ScraperLead[]> {
  const scraperDir = path.join(process.cwd(), "Gmap-scrapper");
  const runnerPath = path.join(scraperDir, "api_runner.py");
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
    const { stdout, stderr } = await execFileAsync("python3", args, {
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
      logGooglePlacesError("scraper", data.error || "unknown scraper error");
      throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
    }
    return data.leads ?? [];
  } catch (error) {
    if (error instanceof GooglePlacesError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    logGooglePlacesError("scraper", msg);
    throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
  }
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
  const workers = wanted >= 100 ? 6 : wanted >= 40 ? 4 : 3;

  const queries = buildPlacesQueries(params);
  // One query for small searches; fan out a few quick searches for volume.
  const queryBudget =
    wanted <= 25 ? 1 : wanted <= 60 ? 2 : wanted <= 120 ? 3 : 4;
  const selectedQueries = queries.slice(0, queryBudget);
  const perQueryLimit = Math.min(
    80,
    Math.max(wanted, Math.ceil(wanted / selectedQueries.length) + 10),
  );

  const failures: string[] = [];
  const batches = await Promise.all(
    selectedQueries.map((q) =>
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
    ),
  );

  const rows = batches.flat();
  if (!rows.length) {
    if (failures.length) {
      logGooglePlacesError(
        "scraper",
        `All queries failed (${failures.length}): ${failures[0]}`,
      );
    }
    // Soft empty — do not 503 the user for flaky Maps scrapes.
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
