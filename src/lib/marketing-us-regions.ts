/** US state groupings for marketing industry / region pages. */
export const US_MARKET_REGIONS = [
  {
    label: "West",
    codes: [
      "AK",
      "AZ",
      "CA",
      "CO",
      "HI",
      "ID",
      "MT",
      "NV",
      "NM",
      "OR",
      "UT",
      "WA",
      "WY",
    ],
  },
  {
    label: "South",
    codes: [
      "AL",
      "AR",
      "FL",
      "GA",
      "KY",
      "LA",
      "MS",
      "NC",
      "OK",
      "SC",
      "TN",
      "TX",
      "VA",
      "WV",
    ],
  },
  {
    label: "Midwest",
    codes: [
      "IA",
      "IL",
      "IN",
      "KS",
      "MI",
      "MN",
      "MO",
      "ND",
      "NE",
      "OH",
      "SD",
      "WI",
    ],
  },
  {
    label: "Northeast",
    codes: [
      "CT",
      "DE",
      "MA",
      "MD",
      "ME",
      "NH",
      "NJ",
      "NY",
      "PA",
      "RI",
      "VT",
    ],
  },
] as const;

export const FEATURED_US_STATE_CODES = [
  "TX",
  "FL",
  "CA",
  "GA",
  "NC",
  "AZ",
  "OH",
  "PA",
  "IL",
  "NY",
  "CO",
  "TN",
] as const;

export function usRegionLabelForState(stateCode: string) {
  return (
    US_MARKET_REGIONS.find((group) =>
      (group.codes as readonly string[]).includes(stateCode),
    )?.label ?? "US"
  );
}

export function siblingStateCodes(stateCode: string, limit = 8) {
  const group = US_MARKET_REGIONS.find((g) =>
    (g.codes as readonly string[]).includes(stateCode),
  );
  if (!group) return [];
  return group.codes.filter((c) => c !== stateCode).slice(0, limit);
}

export function leadFinderDeepLink(industry: string, stateCode?: string) {
  const params = new URLSearchParams({ industry });
  if (stateCode) params.set("state", stateCode);
  return `/leads/search?${params.toString()}`;
}
