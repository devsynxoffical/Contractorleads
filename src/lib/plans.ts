/**
 * Product plans: Starter → Growth → Agency → Enterprise.
 * Legacy "trial" / "pro" map via normalizePlan.
 */

export const PLAN_IDS = [
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
  { value: "starter", label: "Starter", priceMonthly: 19.99 },
  { value: "growth", label: "Growth", priceMonthly: 49 },
  { value: "agency", label: "Agency", priceMonthly: 99 },
  { value: "enterprise", label: "Enterprise", priceMonthly: 0 },
] as const;

/** Free leads included on signup / unpaid Starter (1 credit = 1 lead). */
export const STARTER_FREE_LEADS = 10;
export const STARTER_FREE_CREDITS = 10;

/**
 * Monthly credit allotment per paid checkout plan.
 * 1 credit = 1 lead. Enterprise is custom / unlimited.
 */
export const PLAN_MONTHLY_CREDITS: Record<
  Exclude<PlanId, "enterprise">,
  number
> = {
  starter: 750,
  growth: 2500,
  agency: 6000,
};

export const PLAN_API_LIMITS: Record<PlanId, number> = {
  starter: 100,
  growth: 1500,
  agency: 8000,
  enterprise: 50000,
};

/** Soft seat caps (owner counts as 1). */
export const TEAM_SEAT_LIMITS: Record<PlanId, number> = {
  starter: 1,
  growth: 1,
  agency: 5,
  enterprise: 25,
};

export const PLAN_FEATURES: Record<PlanId, PlanFeatures> = {
  starter: {
    api: false,
    mcp: false,
    sso: false,
    teams: false,
    map: true,
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
  const p = String(plan || "starter").toLowerCase().trim();
  if (p === "pro") return "growth";
  // Legacy Free Trial accounts → Starter
  if (p === "free" || p === "trial" || p === "trialing") return "starter";
  if ((PLAN_IDS as readonly string[]).includes(p)) return p as PlanId;
  return "starter";
}

export function monthlyCreditsForPlan(
  plan: string | null | undefined,
): number | null {
  const id = normalizePlan(plan);
  if (id === "enterprise") return null;
  return PLAN_MONTHLY_CREDITS[id] ?? null;
}

export function monthlyLeadsForPlan(
  plan: string | null | undefined,
): number | null {
  return monthlyCreditsForPlan(plan);
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

/** Lowest paid tier that includes a feature (for upgrade copy). */
export function lowestPlanWithFeature(feature: keyof PlanFeatures): PlanId {
  for (const id of PLAN_IDS) {
    if (PLAN_FEATURES[id][feature]) return id;
  }
  return "enterprise";
}

export const PLAN_FEATURE_COPY: Record<
  keyof PlanFeatures,
  { label: string; blurb: string }
> = {
  map: {
    label: "Lead Map",
    blurb: "See your verified leads pinned on a live territory map.",
  },
  crm: {
    label: "CRM webhooks",
    blurb: "Push lead events to Zapier, Make, HubSpot, Slack, or GoHighLevel.",
  },
  api: {
    label: "API · MCP · SSO",
    blurb: "Call public search endpoints and connect Contractor Leads to your stack.",
  },
  mcp: {
    label: "MCP access",
    blurb: "Connect AI agents to your Contractor Leads workspace via MCP.",
  },
  sso: {
    label: "SSO",
    blurb: "Single sign-on for your agency team.",
  },
  teams: {
    label: "Users & teams",
    blurb: "Invite seats, assign roles, and share your credit pool across the team.",
  },
  reports: {
    label: "Client Reports",
    blurb: "Generate polished lead reports you can send to clients.",
  },
  workspaces: {
    label: "Workspaces",
    blurb: "Separate workspaces for agencies managing multiple brands.",
  },
};

export function upgradeCopyForFeature(
  feature: keyof PlanFeatures,
  currentPlan?: string | null,
) {
  const meta = PLAN_FEATURE_COPY[feature];
  const required = lowestPlanWithFeature(feature);
  return {
    feature,
    featureLabel: meta.label,
    description: meta.blurb,
    requiredPlan: required,
    requiredPlanLabel: planLabel(required),
    currentPlanLabel: planLabel(currentPlan),
  };
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

/** Read-only price map — safe when DB is unavailable (e.g. Railway build). */
export async function getPlanPriceMap(): Promise<PlanPriceMap> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const row = await prisma.planPricingConfig.findUnique({
      where: { id: "default" },
    });
    if (row) return parsePriceMap(row.pricesJson);
  } catch (err) {
    console.warn("getPlanPriceMap: using catalog defaults", err);
  }
  return defaultPriceMap();
}

export async function savePlanPriceMap(
  input: Partial<Record<string, number>>,
): Promise<PlanPriceMap> {
  const { prisma } = await import("@/lib/prisma");
  const existingRow = await prisma.planPricingConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  let rawObj: Record<string, unknown> = {};
  if (existingRow?.pricesJson) {
    try {
      rawObj = JSON.parse(existingRow.pricesJson) as Record<string, unknown>;
    } catch {
      rawObj = {};
    }
  }
  const current = await getPlanPriceMap();
  for (const id of PLAN_IDS) {
    if (input[id] === undefined) continue;
    const n = Number(input[id]);
    if (Number.isFinite(n) && n >= 0) {
      current[id] = Math.round(n * 100) / 100;
    }
  }
  const merged = { ...rawObj, ...current };
  const row = await prisma.planPricingConfig.upsert({
    where: { id: "default" },
    update: { pricesJson: JSON.stringify(merged) },
    create: {
      id: "default",
      pricesJson: JSON.stringify(merged),
    },
  });
  return parsePriceMap(row.pricesJson);
}

/**
 * Admin-editable credit cost per lead enriched via Waterfall Enrichment.
 * Stored inside PlanPricingConfig.pricesJson under `_waterfallEnrichCost` (default: 2).
 */
export async function getWaterfallEnrichCreditCost(): Promise<number> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const row = await prisma.planPricingConfig.findUnique({
      where: { id: "default" },
    });
    if (row?.pricesJson) {
      const parsed = JSON.parse(row.pricesJson) as Record<string, unknown>;
      const val = Number(parsed._waterfallEnrichCost);
      if (Number.isFinite(val) && val >= 0) {
        return Math.round(val * 100) / 100;
      }
    }
  } catch {
    // Fallback to default
  }
  return 2;
}

export async function saveWaterfallEnrichCreditCost(
  cost: number,
): Promise<number> {
  const { prisma } = await import("@/lib/prisma");
  const cleanCost = Math.max(0, Math.round(Number(cost) * 100) / 100);
  const existingRow = await prisma.planPricingConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  let rawObj: Record<string, unknown> = { ...defaultPriceMap() };
  if (existingRow?.pricesJson) {
    try {
      rawObj = {
        ...rawObj,
        ...(JSON.parse(existingRow.pricesJson) as Record<string, unknown>),
      };
    } catch {
      // ignore
    }
  }
  rawObj._waterfallEnrichCost = cleanCost;
  await prisma.planPricingConfig.upsert({
    where: { id: "default" },
    update: { pricesJson: JSON.stringify(rawObj) },
    create: {
      id: "default",
      pricesJson: JSON.stringify(rawObj),
    },
  });
  return cleanCost;
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
