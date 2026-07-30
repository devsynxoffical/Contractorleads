import { getTierOneCountry } from "@/lib/constants";

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type AutocompletePlacesResult = {
  suggestions: PlaceSuggestion[];
  error?: string;
};

/**
 * Lightweight local suggestions while we run scraper-based lead discovery.
 * No external API dependency.
 */
export async function autocompletePlaces(params: {
  query: string;
  country?: string;
}): Promise<AutocompletePlacesResult> {
  const q = params.query.trim();
  if (q.length < 2) return { suggestions: [] };

  const country = getTierOneCountry(params.country);
  const base = q.replace(/\s+/g, " ").trim();
  const countryName = country.name;
  const options = [
    `${base}, ${countryName}`,
    `${base} downtown, ${countryName}`,
    `${base} near city center, ${countryName}`,
  ];
  if (base.includes(",")) {
    options.unshift(base);
  }
  const unique = Array.from(new Set(options)).slice(0, 8);
  return {
    suggestions: unique.map((description, idx) => {
      const [mainText, ...rest] = description.split(",");
      return {
        placeId: `${country.code}-${idx}-${description.toLowerCase()}`,
        description,
        mainText: mainText?.trim() || description,
        secondaryText: rest.join(",").trim(),
      };
    }),
  };
}
