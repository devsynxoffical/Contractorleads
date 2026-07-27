import { CREDIT_COSTS } from "@/lib/constants";
import {
  PLAN_MONTHLY_CREDITS,
  STARTER_FREE_CREDITS,
  STARTER_FREE_LEADS,
} from "@/lib/plans";

export type PlanColumnId = "starter" | "growth" | "agency" | "enterprise";

export type PlanMatrixRow = Record<PlanColumnId, string> & { feature: string };

export type PlanMatrixGroup = {
  id: string;
  label: string;
  rows: PlanMatrixRow[];
};

export const PLAN_COLUMNS: {
  id: PlanColumnId;
  label: string;
  featured?: boolean;
}[] = [
  { id: "starter", label: "Starter" },
  { id: "growth", label: "Growth", featured: true },
  { id: "agency", label: "Agency" },
  { id: "enterprise", label: "Enterprise" },
];

/** Grouped comparison — balanced length (not tiny, not mega) */
export const PLAN_MATRIX_GROUPS: PlanMatrixGroup[] = [
  {
    id: "access",
    label: "Getting started",
    rows: [
      {
        feature: "10 free leads on signup — pay after you scrape them",
        starter: "✓",
        growth: "—",
        agency: "—",
        enterprise: "—",
      },
    ],
  },
  {
    id: "core",
    label: "Core pipeline",
    rows: [
      {
        feature: "AI scoring + owner enrichment",
        starter: "✓",
        growth: "✓",
        agency: "✓",
        enterprise: "✓",
      },
      {
        feature: "Pipeline CRM, saved leads & notes",
        starter: "✓",
        growth: "✓",
        agency: "✓",
        enterprise: "✓",
      },
      {
        feature: "CSV & Excel export",
        starter: "✓",
        growth: "✓",
        agency: "✓",
        enterprise: "✓",
      },
    ],
  },
  {
    id: "ai",
    label: "AI & outreach",
    rows: [
      {
        feature: "Ask Contractor Leads + Outreach Studio",
        starter: "✓",
        growth: "✓",
        agency: "Priority",
        enterprise: "Priority",
      },
      {
        feature: "Email automation (your SMTP)",
        starter: "1 sequence",
        growth: "✓",
        agency: "✓",
        enterprise: "✓",
      },
    ],
  },
  {
    id: "intel",
    label: "Intelligence & automation",
    rows: [
      {
        feature: "Dashboard & analytics",
        starter: "✓",
        growth: "✓",
        agency: "✓",
        enterprise: "Advanced",
      },
      {
        feature: "Lead Map, social filters & Meta intel",
        starter: "—",
        growth: "✓",
        agency: "✓",
        enterprise: "✓",
      },
      {
        feature: "CRM webhooks (Zapier, HubSpot, etc.)",
        starter: "—",
        growth: "✓",
        agency: "✓",
        enterprise: "✓",
      },
    ],
  },
  {
    id: "teams",
    label: "Teams & enterprise",
    rows: [
      {
        feature: "Client reports & workspaces",
        starter: "—",
        growth: "—",
        agency: "✓",
        enterprise: "White-label",
      },
      {
        feature: "Team seats & priority support",
        starter: "—",
        growth: "—",
        agency: "✓",
        enterprise: "Dedicated CSM",
      },
      {
        feature: "API + MCP access",
        starter: "—",
        growth: "✓",
        agency: "✓",
        enterprise: "✓",
      },
      {
        feature: "SSO",
        starter: "—",
        growth: "—",
        agency: "✓",
        enterprise: "✓",
      },
      {
        feature: "Users & teams seats",
        starter: "—",
        growth: "—",
        agency: "✓",
        enterprise: "✓",
      },
    ],
  },
];

/** Flat list derived from groups (for filters / counts) */
export const PLAN_COMPARISON_ROWS: PlanMatrixRow[] = PLAN_MATRIX_GROUPS.flatMap(
  (g) => g.rows,
);

export type MarketingPlanCard = {
  id: PlanColumnId;
  name: string;
  blurb: string;
  /** Monthly list price; null = custom / talk to sales */
  priceMonthly: number | null;
  /** Shown when annual billing selected (per-month equivalent) */
  priceAnnualMonthly: number | null;
  /** Leads included in the monthly allotment (null = unlimited / custom) */
  leadsIncluded: number | null;
  creditsLabel: string;
  creditsDetail: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  popular?: boolean;
  trialOffer?: boolean;
  custom?: boolean;
  features: string[];
};

/** Format plan price for marketing cards ($19.99 stays precise). */
export function formatPlanPrice(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/** Effective $ per lead for marketing (4 decimals). */
export function pricePerLead(
  planPrice: number | null | undefined,
  leadsIncluded: number | null | undefined,
): number | null {
  if (
    planPrice == null ||
    leadsIncluded == null ||
    !Number.isFinite(planPrice) ||
    !Number.isFinite(leadsIncluded) ||
    leadsIncluded <= 0
  ) {
    return null;
  }
  return planPrice / leadsIncluded;
}

export function formatPricePerLead(amount: number) {
  return `$${amount.toFixed(4)}`;
}

export const MARKETING_PLANS: MarketingPlanCard[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: `Start free with ${STARTER_FREE_LEADS} leads, then subscribe when you're ready to scale.`,
    priceMonthly: 19.99,
    priceAnnualMonthly: 15.99,
    leadsIncluded: PLAN_MONTHLY_CREDITS.starter,
    creditsLabel: `${PLAN_MONTHLY_CREDITS.starter.toLocaleString()} credits / mo (${PLAN_MONTHLY_CREDITS.starter.toLocaleString()} leads)`,
    creditsDetail: `${CREDIT_COSTS.lead} credit per lead · ${STARTER_FREE_CREDITS} free leads included to start — pay after you use them`,
    ctaLabel: "Get started free",
    ctaHref: "/register",
    trialOffer: true,
    features: [
      `${STARTER_FREE_LEADS} free leads on signup to try`,
      "Lead Finder + live search",
      "AI scoring + owner enrichment",
      "Pipeline CRM + saved leads",
      "Outreach Studio + scripts",
      "CSV & Excel export",
      "1 email nurture sequence",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "Essential maps, Meta intel, and webhooks for agencies closing every week.",
    priceMonthly: 49,
    priceAnnualMonthly: 39,
    leadsIncluded: PLAN_MONTHLY_CREDITS.growth,
    creditsLabel: `${PLAN_MONTHLY_CREDITS.growth.toLocaleString()} credits / mo (${PLAN_MONTHLY_CREDITS.growth.toLocaleString()} leads)`,
    creditsDetail: `${CREDIT_COSTS.lead} credit per lead · best for daily outreach`,
    ctaLabel: "Buy now",
    ctaHref: "/register",
    secondaryCtaLabel: "Get started free",
    secondaryCtaHref: "/register",
    popular: true,
    features: [
      "Everything in Starter",
      "Lead Map + social filters",
      "Meta Ads intel",
      "Dashboard & analytics",
      "Full email automation",
      "CRM webhooks (Zapier, HubSpot)",
      "API + MCP access",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    blurb: "For teams running multiple clients who need seats, reports, and priority support.",
    priceMonthly: 99,
    priceAnnualMonthly: 79,
    leadsIncluded: PLAN_MONTHLY_CREDITS.agency,
    creditsLabel: `${PLAN_MONTHLY_CREDITS.agency.toLocaleString()} credits / mo (${PLAN_MONTHLY_CREDITS.agency.toLocaleString()} leads)`,
    creditsDetail: `${CREDIT_COSTS.lead} credit per lead · shared team pool`,
    ctaLabel: "Buy now",
    ctaHref: "/register",
    secondaryCtaLabel: "Talk to sales",
    secondaryCtaHref: "mailto:hello@contractorleads.us",
    features: [
      "Everything in Growth",
      "Client reports",
      "Multi-tenant workspaces",
      "Team seats",
      "Priority AI assistant",
      "Custom credit pool options",
      "SSO available",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "Power, flexibility, and governance for large orgs and white-label rollouts.",
    priceMonthly: null,
    priceAnnualMonthly: null,
    leadsIncluded: null,
    creditsLabel: "Unlimited leads",
    creditsDetail: "No lead cap · custom SLA & volume terms",
    ctaLabel: "Talk to sales",
    ctaHref: "mailto:hello@contractorleads.us",
    custom: true,
    features: [
      "Everything in Agency",
      "Unlimited leads",
      "Advanced analytics",
      "White-label reports",
      "Full API + SSO",
      "Custom integrations",
      "Dedicated customer success",
      "Volume pricing",
    ],
  },
] as const;

const ANNUAL_DISCOUNT = 0.8;

/** Overlay admin Plan Pricing onto marketing cards (homepage + /pricing). */
export function withLivePlanPrices(
  plans: readonly MarketingPlanCard[],
  prices: Partial<Record<string, number>>,
): MarketingPlanCard[] {
  return plans.map((plan) => {
    if (plan.custom || plan.id === "enterprise" || plan.priceMonthly == null) {
      return { ...plan };
    }
    const live = prices[plan.id];
    if (live == null || !Number.isFinite(live) || live < 0) {
      return { ...plan };
    }
    const monthly = Math.round(live * 100) / 100;
    const catalogMonthly = plan.priceMonthly;
    const catalogAnnual = plan.priceAnnualMonthly;
    const annual =
      catalogAnnual != null && catalogMonthly > 0
        ? Math.round(monthly * (catalogAnnual / catalogMonthly) * 100) / 100
        : Math.round(monthly * ANNUAL_DISCOUNT * 100) / 100;
    return {
      ...plan,
      priceMonthly: monthly,
      priceAnnualMonthly: annual,
    };
  });
}

/** Server helper — same prices Super Admin edits under Plans & Entitlements. */
export async function getMarketingPlansLive(): Promise<MarketingPlanCard[]> {
  const { getPlanPriceMap } = await import("@/lib/plans");
  const prices = await getPlanPriceMap();
  return withLivePlanPrices(MARKETING_PLANS, prices);
}
