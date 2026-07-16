import { INDUSTRIES, US_STATES } from "@/lib/constants";

export const CUSTOM_INDUSTRY_VALUE = "__custom__";

export type SearchCriteriaInput = {
  industry?: string;
  customIndustry?: string;
  state?: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius?: number | string;
};

export type ResolvedSearchCriteria = {
  industry: string;
  state: string;
  city?: string;
  zip?: string;
  customLocation?: string;
  radius: number;
};

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
  const radius = Number(input.radius ?? 25);
  if (!Number.isFinite(radius) || radius <= 0) {
    return { ok: false, error: "Radius must be a positive number." };
  }

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

  const customLocation = input.customLocation?.trim();
  if (customLocation) {
    const state = extractStateFromText(customLocation) ?? "US";
    return {
      ok: true,
      criteria: {
        industry,
        state,
        city: customLocation,
        zip: input.zip?.trim() || undefined,
        customLocation,
        radius,
      },
    };
  }

  const state = input.state?.trim() ?? "";
  if (!state) {
    return {
      ok: false,
      error: "State is required, or enter a custom location.",
    };
  }

  return {
    ok: true,
    criteria: {
      industry,
      state,
      city: input.city?.trim() || undefined,
      zip: input.zip?.trim() || undefined,
      radius,
    },
  };
}

export function isPresetIndustry(value: string): boolean {
  return (INDUSTRIES as readonly string[]).includes(value);
}

export function formatSearchLabel(criteria: {
  industry: string;
  state: string;
  city?: string;
  customLocation?: string;
}): string {
  const place =
    criteria.customLocation ||
    [criteria.city, criteria.state].filter(Boolean).join(", ");
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

  if (locationPart) {
    state = extractStateFromText(locationPart) ?? "";
    if (state) {
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
      state = "US";
      city = locationPart;
    }
  }

  if (!state && !customLocation) return null;

  return {
    industry,
    state: state || "US",
    city: city || customLocation,
    customLocation,
    radius: 25,
  };
}
