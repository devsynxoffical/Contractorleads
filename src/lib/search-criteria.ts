import {
  getTierOneCountry,
  INDUSTRIES,
  TIER_ONE_COUNTRIES,
  US_STATES,
} from "@/lib/constants";

export const CUSTOM_INDUSTRY_VALUE = "__custom__";
export type LocationScope = "local" | "country";

export type SearchCriteriaInput = {
  industry?: string;
  customIndustry?: string;
  country?: string;
  locationScope?: LocationScope;
  state?: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius?: number | string;
  /** Keep only leads with LinkedIn + social + website owner name. Default false. */
  requireSocialPresence?: boolean | string;
  /** Desired number of leads (10–1000). Default 50. */
  targetLeadCount?: number | string;
};

export type ResolvedSearchCriteria = {
  industry: string;
  country: string;
  locationScope: LocationScope;
  state?: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius?: number;
  /** LinkedIn + social + website owner name required when true. */
  requireSocialPresence: boolean;
  targetLeadCount: number;
};

function parseBool(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  const s = String(value).toLowerCase();
  if (s === "true" || s === "1" || s === "on" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "off" || s === "no") return false;
  return defaultValue;
}

function extractStateFromText(text: string): string | null {
  for (const s of US_STATES) {
    if (new RegExp(`\\b${s.code}\\b`, "i").test(text)) return s.code;
    if (text.toLowerCase().includes(s.name.toLowerCase())) return s.code;
  }
  return null;
}

export function resolveSearchCriteria(
  input: SearchCriteriaInput
): { ok: true; criteria: ResolvedSearchCriteria } | { ok: false; error: string } {
  let industry = "";
  if (input.industry === CUSTOM_INDUSTRY_VALUE) {
    industry = input.customIndustry?.trim() ?? "";
    if (!industry) {
      return { ok: false, error: "Enter a custom service or industry name." };
    }
  } else {
    industry = input.industry?.trim() ?? "";
    if (!industry) {
      return { ok: false, error: "Industry or service is required." };
    }
  }

  const country = input.country?.trim().toUpperCase() || "US";
  if (!TIER_ONE_COUNTRIES.some((item) => item.code === country)) {
    return { ok: false, error: "Select a supported Tier 1 country." };
  }

  const locationScope: LocationScope =
    input.locationScope === "country" ? "country" : "local";
  const requireSocialPresence = parseBool(input.requireSocialPresence, false);
  const rawTarget = Number(input.targetLeadCount ?? 50);
  const targetLeadCount = Number.isFinite(rawTarget)
    ? Math.max(10, Math.min(1000, Math.floor(rawTarget)))
    : 50;

  if (locationScope === "country") {
    return {
      ok: true,
      criteria: {
        industry,
        country,
        locationScope,
        requireSocialPresence,
        targetLeadCount,
      },
    };
  }

  const radius = Number(input.radius ?? 25);
  // 0 = exact area only (city/ZIP/region); positive = wider local bias
  if (!Number.isFinite(radius) || radius < 0) {
    return { ok: false, error: "Radius must be 0 or greater." };
  }

  const customLocation = input.customLocation?.trim();
  if (customLocation) {
    const state =
      country === "US"
        ? extractStateFromText(customLocation) ?? undefined
        : input.state?.trim() || undefined;
    return {
      ok: true,
      criteria: {
        industry,
        country,
        locationScope,
        state,
        city: customLocation,
        zip: input.zip?.trim() || undefined,
        customLocation,
        radius,
        requireSocialPresence,
        targetLeadCount,
      },
    };
  }

  const state = input.state?.trim() ?? "";
  const city = input.city?.trim() ?? "";
  const zip = input.zip?.trim() ?? "";
  if (!state && !city && !zip) {
    return {
      ok: false,
      error: `Enter a ${getTierOneCountry(country).regionLabel.toLowerCase()}, city, or postal code — or choose Entire country.`,
    };
  }

  return {
    ok: true,
    criteria: {
      industry,
      country,
      locationScope,
      state: state || undefined,
      city: city || undefined,
      zip: zip || undefined,
      radius,
      requireSocialPresence,
      targetLeadCount,
    },
  };
}

export function isPresetIndustry(value: string): boolean {
  return (INDUSTRIES as readonly string[]).includes(value);
}

export function formatSearchLabel(criteria: {
  industry: string;
  country?: string;
  locationScope?: LocationScope;
  state?: string;
  city?: string;
  customLocation?: string;
}): string {
  const country = getTierOneCountry(criteria.country);
  if (criteria.locationScope === "country") {
    return `${criteria.industry} across ${country.name}`;
  }
  const place =
    criteria.customLocation ||
    [criteria.city, criteria.state, country.name].filter(Boolean).join(", ");
  return `${criteria.industry} in ${place}`;
}

/** Parse natural-language queries like "Window tinting in Brooklyn NY". */
export function parseLeadQuery(input: string): ResolvedSearchCriteria | null {
  const text = input.trim();
  if (!text) return null;

  const lower = text.toLowerCase();
  const inMatch = text.match(/\bin\s+(.+)$/i);
  const locationPart = inMatch?.[1]?.trim() ?? "";

  const presetIndustry =
    INDUSTRIES.find((i) => lower.includes(i.toLowerCase())) ??
    INDUSTRIES.find((i) =>
      lower.split(/\s+/).some((w) => i.toLowerCase().startsWith(w))
    );

  let industry = presetIndustry ?? "";
  if (!industry && inMatch?.index != null) {
    industry = text.slice(0, inMatch.index).trim();
  }
  if (!industry) return null;

  let state = "";
  let city = "";
  let customLocation: string | undefined;
  let country = "US";
  let locationScope: LocationScope = "local";

  if (locationPart) {
    const aliases: Array<[string, string[]]> = [
      ["US", ["united states", "usa", "u.s.", "america"]],
      ["CA", ["canada"]],
      ["GB", ["united kingdom", "uk", "u.k.", "great britain", "britain"]],
      ["AU", ["australia"]],
      ["NZ", ["new zealand"]],
    ];
    const normalizedLocation = locationPart.toLowerCase().trim();
    const matchedCountry = aliases.find(([, names]) =>
      names.some((name) => normalizedLocation.includes(name))
    );
    if (matchedCountry) country = matchedCountry[0];

    const countryNames = matchedCountry?.[1] ?? [];
    if (countryNames.some((name) => normalizedLocation === name)) {
      locationScope = "country";
    } else if (country === "US") {
      state = extractStateFromText(locationPart) ?? "";
    }

    if (locationScope === "country") {
      city = "";
    } else if (state) {
      const inCityMatch = locationPart.match(/\bin\s+([A-Za-z.\s]+?)(?:,|\s+[A-Z]{2}\b|$)/i);
      if (inCityMatch?.[1]) {
        city = inCityMatch[1]
          .replace(new RegExp(US_STATES.map((s) => s.name).join("|"), "ig"), "")
          .replace(/\b[A-Z]{2}\b/g, "")
          .trim()
          .replace(/\s+/g, " ");
      } else {
        city = locationPart
          .replace(new RegExp(US_STATES.map((s) => s.name).join("|"), "ig"), "")
          .replace(/\b[A-Z]{2}\b/g, "")
          .trim()
          .replace(/\s+/g, " ");
      }
    } else {
      customLocation = locationPart;
      city = locationPart;
    }
  }

  if (!state && !customLocation && locationScope !== "country") return null;

  return {
    industry,
    country,
    locationScope,
    state: state || undefined,
    city: city || customLocation,
    customLocation,
    radius: locationScope === "local" ? 25 : undefined,
    requireSocialPresence: false,
    targetLeadCount: 50,
  };
}
