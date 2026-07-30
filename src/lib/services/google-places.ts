import { execFile } from "node:child_process";
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

async function runScraper(params: {
  quick: boolean;
  query?: string;
  niche?: string;
  city?: string;
  workers: number;
  limit: number;
  grid?: number;
  radius?: number;
}): Promise<ScraperLead[]> {
  const runnerPath = path.join(process.cwd(), "Gmap-scrapper", "api_runner.py");
  const args = [runnerPath];
  if (params.quick) {
    args.push("--quick", "--query", params.query ?? "");
  } else {
    args.push("--niche", params.niche ?? "", "--city", params.city ?? "");
  }
  args.push("--workers", String(params.workers), "--limit", String(params.limit));
  if (params.grid) args.push("--grid", String(params.grid));
  if (params.radius) args.push("--radius", String(params.radius));

  try {
    const { stdout, stderr } = await execFileAsync("python3", args, {
      cwd: process.cwd(),
      timeout: 280000,
      maxBuffer: 16 * 1024 * 1024,
    });
    const raw = stdout.trim();
    if (!raw) {
      logGooglePlacesError("scraper", `Empty response. stderr=${stderr?.slice(0, 300)}`);
      throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
    }
    const data = JSON.parse(raw) as {
      ok?: boolean;
      leads?: ScraperLead[];
      error?: string;
    };
    if (!data.ok) {
      logGooglePlacesError("scraper", data.error || "unknown scraper error");
      throw new GooglePlacesError(PUBLIC_PLACES_SEARCH_UNAVAILABLE);
    }
    return data.leads ?? [];
  } catch (error) {
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
  const country = getTierOneCountry(params.country);
  const wanted = Math.max(1, Math.min(params.limit ?? 10, 1200));
  const location =
    params.customLocation?.trim() || locationQuery(params) || country.name;
  const query = `${industryQuery(params.industry)} in ${location}`;

  const workers = wanted >= 300 ? 8 : wanted >= 120 ? 6 : 4;
  let rows: ScraperLead[];
  if (params.locationScope === "local") {
    rows = await runScraper({
      quick: false,
      niche: params.industry,
      city: location,
      workers,
      limit: wanted,
      grid: wanted >= 300 ? 5 : wanted >= 120 ? 4 : 3,
      radius: Math.max(6, Math.min(25, params.radius ?? 10)),
    });
  } else {
    rows = await runScraper({
      quick: true,
      query,
      workers,
      limit: wanted,
    });
  }

  const deduped = new Map<string, PlaceResult>();
  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    const mapsUrl = row.google_maps_url?.trim() || "";
    const placeId = row.place_id?.trim() || mapsUrl || `${name}-${row.phone || row.address || ""}`;
    if (deduped.has(placeId)) continue;
    deduped.set(placeId, {
      placeId,
      name,
      address: row.address?.trim() || "",
      phone: row.phone?.trim() || undefined,
      website: normalizeWebsiteUrl(row.website || undefined),
      rating: row.rating ?? undefined,
      reviewCount: row.review_count ?? undefined,
      mapsUrl: mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
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
