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
        feature: "Free trial — first 10 leads on us",
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
        feature: "API access & SSO",
        starter: "—",
        growth: "—",
        agency: "—",
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

export const MARKETING_PLANS: MarketingPlanCard[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Start generating and closing contractor leads — free trial included.",
    priceMonthly: 10,
    priceAnnualMonthly: 8,
    creditsLabel: "1,330 credits / mo (1,000 leads)",
    creditsDetail: "1.33 credits per lead · 10 free leads on signup to start",
    ctaLabel: "Get started free",
    ctaHref: "/register",
    trialOffer: true,
    features: [
      "1,000 leads / month included",
      "10 free leads on signup to try",
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
    priceMonthly: 20,
    priceAnnualMonthly: 15,
    creditsLabel: "9,975 credits / mo (7,500 leads)",
    creditsDetail: "1.33 credits per lead · best for daily outreach",
    ctaLabel: "Buy now",
    ctaHref: "/register",
    secondaryCtaLabel: "Start free trial",
    secondaryCtaHref: "/register",
    popular: true,
    features: [
      "Everything in Starter",
      "7,500 leads / month included",
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
    priceMonthly: 40,
    priceAnnualMonthly: 30,
    creditsLabel: "26,600 credits / mo (20,000 leads)",
    creditsDetail: "1.33 credits per lead · shared team pool",
    ctaLabel: "Buy now",
    ctaHref: "/register",
    secondaryCtaLabel: "Talk to sales",
    secondaryCtaHref: "mailto:hello@contractorleads.us",
    features: [
      "Everything in Growth",
      "20,000 leads / month included",
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
