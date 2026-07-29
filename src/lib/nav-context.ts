/**
 * Shared navigation context for lead detail + section back links.
 * Keep query `from` values in sync with lead-detail-view and app-shell.
 */

export const LEAD_FROM_VALUES = [
  "all",
  "hot",
  "saved",
  "digest",
  "map",
  "pipeline",
  "search",
  "dashboard",
  "scrape",
] as const;

export type LeadFrom = (typeof LEAD_FROM_VALUES)[number];

export type AppLeadFrom = Exclude<LeadFrom, "scrape">;

const APP_FROM_SET = new Set<string>([
  "hot",
  "saved",
  "all",
  "digest",
  "map",
  "pipeline",
  "search",
  "dashboard",
]);

export function parseLeadFrom(
  value: string | null | undefined,
  fallback: AppLeadFrom = "all",
): AppLeadFrom {
  if (value && APP_FROM_SET.has(value)) {
    return value as AppLeadFrom;
  }
  return fallback;
}

export function parseAdminLeadFrom(
  value: string | null | undefined,
): "scrape" | "all" {
  return value === "scrape" ? "scrape" : "all";
}

export const LEAD_FROM_HREF: Record<AppLeadFrom, string> = {
  all: "/leads",
  hot: "/leads/hot",
  saved: "/leads/saved",
  digest: "/digest",
  map: "/leads/map",
  pipeline: "/leads/pipeline",
  search: "/leads/search",
  dashboard: "/dashboard",
};

export const LEAD_FROM_LABEL: Record<AppLeadFrom, string> = {
  all: "Back to all leads",
  hot: "Back to hot leads",
  saved: "Back to saved leads",
  digest: "Back to morning digest",
  map: "Back to lead map",
  pipeline: "Back to pipeline",
  search: "Back to Lead Finder",
  dashboard: "Back to dashboard",
};

export const LEAD_FROM_CRUMB: Record<AppLeadFrom, string> = {
  all: "All leads",
  hot: "Hot leads",
  saved: "Saved leads",
  digest: "Digest",
  map: "Lead map",
  pipeline: "Pipeline",
  search: "Lead Finder",
  dashboard: "Dashboard",
};

export function leadDetailHref(id: string, from: AppLeadFrom = "all") {
  return `/leads/${id}?from=${from}`;
}

export function withLeadFrom(path: string, from?: string | null) {
  if (!from) return path;
  const parsed = parseLeadFrom(from, "all");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}from=${parsed}`;
}
