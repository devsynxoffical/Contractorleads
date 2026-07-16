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
  state: string;
  city?: string;
  zip?: string;
}) {
  const city =
    params.city &&
    params.city.trim().toLowerCase() !== params.state.trim().toLowerCase() &&
    !/^(florida|texas|california|new york)$/i.test(params.city.trim())
      ? params.city.trim()
      : undefined;

  return [city, params.state, params.zip].filter(Boolean).join(", ");
}

export async function searchGooglePlaces(params: {
  industry: string;
  state: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius: number;
  limit?: number;
}): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey.includes("your-key") || apiKey === "AIza...") {
    throw new GooglePlacesError(
      "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to .env."
    );
  }

  const loc = params.customLocation?.trim() || locationQuery(params);
  const query = `${industryQuery(params.industry)} in ${loc || params.state}`;

  const searchUrl = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString(), {
    signal: AbortSignal.timeout(15000),
  });
  if (!searchRes.ok) {
    throw new GooglePlacesError(
      `Google Places HTTP ${searchRes.status}. Try again in a moment.`
    );
  }

  const searchData = (await searchRes.json()) as {
    status?: string;
    error_message?: string;
    results?: Array<{
      place_id: string;
      name: string;
      formatted_address?: string;
      rating?: number;
      user_ratings_total?: number;
      geometry?: { location?: { lat: number; lng: number } };
    }>;
  };

  if (searchData.status && searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
    const msg = searchData.error_message || searchData.status;
    if (searchData.status === "REQUEST_DENIED") {
      throw new GooglePlacesError(
        `Google Places denied the request. Enable Billing on your Google Cloud project, then enable Places API. Details: ${msg}`
      );
    }
    if (searchData.status === "OVER_QUERY_LIMIT") {
      throw new GooglePlacesError(
        "Google Places quota exceeded. Check billing/quota in Google Cloud Console."
      );
    }
    if (searchData.status === "INVALID_REQUEST") {
      throw new GooglePlacesError(
        `Invalid Places request. Try a city name with the state. (${msg})`
      );
    }
    throw new GooglePlacesError(`Google Places error: ${msg}`);
  }

  const results = searchData.results?.slice(0, params.limit ?? 10) ?? [];
  if (!results.length) return [];

  const enriched: PlaceResult[] = [];

  for (const place of results) {
    const detailsUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    detailsUrl.searchParams.set("place_id", place.place_id);
    detailsUrl.searchParams.set(
      "fields",
      "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,url,geometry"
    );
    detailsUrl.searchParams.set("key", apiKey);

    const detailsRes = await fetch(detailsUrl.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!detailsRes.ok) continue;

    const detailsData = (await detailsRes.json()) as {
      status?: string;
      result?: {
        name?: string;
        formatted_address?: string;
        formatted_phone_number?: string;
        website?: string;
        rating?: number;
        user_ratings_total?: number;
        url?: string;
        geometry?: { location?: { lat: number; lng: number } };
      };
    };

    const d = detailsData.result;
    if (!d?.name) {
      // Fall back to text-search row if details fail
      enriched.push({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address || "",
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
      });
      continue;
    }

    enriched.push({
      placeId: place.place_id,
      name: d.name,
      address: d.formatted_address || place.formatted_address || "",
      phone: d.formatted_phone_number,
      website: d.website,
      rating: d.rating ?? place.rating,
      reviewCount: d.user_ratings_total ?? place.user_ratings_total,
      mapsUrl:
        d.url ||
        `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      latitude: d.geometry?.location?.lat ?? place.geometry?.location?.lat,
      longitude: d.geometry?.location?.lng ?? place.geometry?.location?.lng,
    });
  }

  return enriched;
}

export async function verifyWebsite(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}
