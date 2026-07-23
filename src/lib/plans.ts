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
  { value: "starter", label: "Starter", priceMonthly: 19.99 },
  { value: "growth", label: "Growth", priceMonthly: 49 },
  { value: "agency", label: "Agency", priceMonthly: 99 },
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

/** Hardcoded catalog defaults (overridden by PlanPricingConfig in DB). */
export function planMonthlyPrice(plan: string | null | undefined): number {
  const id = normalizePlan(plan);
  return ADMIN_PLANS.find((row) => row.value === id)?.priceMonthly ?? 0;
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return planMonthlyPrice(plan) > 0;
}

export type PlanPriceMap = Record<PlanId, number>;

function defaultPriceMap(): PlanPriceMap {
  return Object.fromEntries(
    ADMIN_PLANS.map((p) => [p.value, p.priceMonthly]),
  ) as PlanPriceMap;
}

function parsePriceMap(raw: string | null | undefined): PlanPriceMap {
  const base = defaultPriceMap();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const id of PLAN_IDS) {
      const n = Number(parsed[id]);
      if (Number.isFinite(n) && n >= 0) base[id] = Math.round(n * 100) / 100;
    }
    return base;
  } catch {
    return base;
  }
}

export async function getPlanPriceMap(): Promise<PlanPriceMap> {
  const { prisma } = await import("@/lib/prisma");
  const row = await prisma.planPricingConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      pricesJson: JSON.stringify(defaultPriceMap()),
    },
  });
  return parsePriceMap(row.pricesJson);
}

export async function savePlanPriceMap(
  input: Partial<Record<string, number>>,
): Promise<PlanPriceMap> {
  const { prisma } = await import("@/lib/prisma");
  const current = await getPlanPriceMap();
  for (const id of PLAN_IDS) {
    if (input[id] === undefined) continue;
    const n = Number(input[id]);
    if (Number.isFinite(n) && n >= 0) {
      current[id] = Math.round(n * 100) / 100;
    }
  }
  const row = await prisma.planPricingConfig.upsert({
    where: { id: "default" },
    update: { pricesJson: JSON.stringify(current) },
    create: {
      id: "default",
      pricesJson: JSON.stringify(current),
    },
  });
  return parsePriceMap(row.pricesJson);
}

/** Effective monthly list price (admin override or catalog default). */
export async function getPlanMonthlyPrice(
  plan: string | null | undefined,
): Promise<number> {
  const prices = await getPlanPriceMap();
  return prices[normalizePlan(plan)] ?? 0;
}

export async function isPaidPlanEffective(
  plan: string | null | undefined,
): Promise<boolean> {
  return (await getPlanMonthlyPrice(plan)) > 0;
}
