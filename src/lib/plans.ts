/**
 * Product plans: Starter → Growth → Agency → Enterprise (+ trial).
 * Legacy "pro" maps to Growth.
 */

export const PLAN_IDS = [
  "trial",
  "starter",
  "growth",
  "agency",
  "enterprise",
] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanFeatures = {
  api: boolean;
  mcp: boolean;
  sso: boolean;
  /** Users & teams seats — Agency+ */
  teams: boolean;
  map: boolean;
  crm: boolean;
  reports: boolean;
  workspaces: boolean;
};

export const ADMIN_PLANS = [
  { value: "trial", label: "Free Trial", priceMonthly: 0 },
  { value: "starter", label: "Starter", priceMonthly: 10 },
  { value: "growth", label: "Growth", priceMonthly: 20 },
  { value: "agency", label: "Agency", priceMonthly: 40 },
  { value: "enterprise", label: "Enterprise", priceMonthly: 0 },
] as const;

export const PLAN_API_LIMITS: Record<PlanId, number> = {
  trial: 25,
  starter: 100,
  growth: 1500,
  agency: 8000,
  enterprise: 50000,
};

/** Soft seat caps (owner counts as 1). */
export const TEAM_SEAT_LIMITS: Record<PlanId, number> = {
  trial: 1,
  starter: 1,
  growth: 1,
  agency: 5,
  enterprise: 25,
};

export const PLAN_FEATURES: Record<PlanId, PlanFeatures> = {
  trial: {
    api: false,
    mcp: false,
    sso: false,
    teams: false,
    map: false,
    crm: false,
    reports: false,
    workspaces: false,
  },
  starter: {
    api: false,
    mcp: false,
    sso: false,
    teams: false,
    map: false,
    crm: false,
    reports: false,
    workspaces: false,
  },
  growth: {
    api: true,
    mcp: true,
    sso: false,
    teams: false,
    map: true,
    crm: true,
    reports: false,
    workspaces: false,
  },
  agency: {
    api: true,
    mcp: true,
    sso: true,
    teams: true,
    map: true,
    crm: true,
    reports: true,
    workspaces: true,
  },
  enterprise: {
    api: true,
    mcp: true,
    sso: true,
    teams: true,
    map: true,
    crm: true,
    reports: true,
    workspaces: true,
  },
};

export function normalizePlan(plan: string | null | undefined): PlanId {
  const p = String(plan || "trial").toLowerCase().trim();
  if (p === "pro") return "growth";
  if (p === "free" || p === "trialing") return "trial";
  if ((PLAN_IDS as readonly string[]).includes(p)) return p as PlanId;
  return "trial";
}

export function planLabel(plan: string | null | undefined) {
  const id = normalizePlan(plan);
  return ADMIN_PLANS.find((row) => row.value === id)?.label ?? id;
}

export function featuresForPlan(plan: string | null | undefined): PlanFeatures {
  return PLAN_FEATURES[normalizePlan(plan)];
}

export function planHasFeature(
  plan: string | null | undefined,
  feature: keyof PlanFeatures,
) {
  return Boolean(featuresForPlan(plan)[feature]);
}

export function teamSeatLimit(plan: string | null | undefined) {
  return TEAM_SEAT_LIMITS[normalizePlan(plan)];
}

export function defaultApiLimitForPlan(plan: string | null | undefined) {
  return PLAN_API_LIMITS[normalizePlan(plan)];
}
