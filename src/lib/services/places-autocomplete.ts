import { getTierOneCountry } from "@/lib/constants";

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

/**
 * Google Places Autocomplete (legacy) — returns city/region suggestions.
 * Requires Places API (or Places API New) enabled on the Google Cloud key.
 */
export async function autocompletePlaces(params: {
  query: string;
  country?: string;
}): Promise<PlaceSuggestion[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey.includes("your-key") || apiKey === "AIza...") {
    return [];
  }

  const q = params.query.trim();
  if (q.length < 2) return [];

  const country = getTierOneCountry(params.country);
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  );
  url.searchParams.set("input", q);
  url.searchParams.set("types", "(regions)");
  url.searchParams.set("components", `country:${country.googleRegion}`);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    status?: string;
    predictions?: Array<{
      place_id: string;
      description: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
    }>;
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return [];
  }

  return (data.predictions ?? []).slice(0, 8).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? "",
  }));
}
