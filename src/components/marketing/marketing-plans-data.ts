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

export const MARKETING_PLANS = [
  {
    name: "Starter",
    blurb: "Try the full pipeline on us — score, save, and export your first batch.",
    tier: "Your first 10 leads are on us",
    trialOffer: true,
    features: [
      "10 free leads on signup (Starter only)",
      "Lead Finder + live search",
      "AI scoring + owner enrichment",
      "Pipeline CRM + saved leads",
      "Outreach Studio + scripts",
      "CSV & Excel export",
    ],
  },
  {
    name: "Growth",
    blurb: "Lead Map, Meta intel, webhooks — what most agencies run day to day.",
    tier: "Most popular",
    popular: true,
    features: [
      "All Starter features (paid credits)",
      "Lead Map + social filters",
      "Meta Ads intel",
      "Dashboard & analytics",
      "Full email automation",
      "CRM webhooks (Zapier, HubSpot)",
    ],
  },
  {
    name: "Agency",
    blurb: "Client reports, workspaces, team seats, and priority support.",
    tier: "For teams",
    custom: true,
    features: [
      "Everything in Growth",
      "Client reports",
      "Multi-tenant workspaces",
      "Team seats",
      "Priority AI assistant",
      "Custom credit pool",
    ],
  },
  {
    name: "Enterprise",
    blurb: "API access, SSO, dedicated CSM, and custom integrations.",
    tier: "Custom scale",
    custom: true,
    features: [
      "Everything in Agency",
      "Advanced analytics",
      "White-label reports",
      "API access",
      "SSO & custom integrations",
      "Dedicated customer success",
    ],
  },
] as const;
