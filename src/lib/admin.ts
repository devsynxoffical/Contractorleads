import { INDUSTRIES } from "@/lib/constants";

export const ADMIN_PLANS = [
  { value: "trial", label: "Free Trial", priceMonthly: 0 },
  { value: "starter", label: "Starter", priceMonthly: 49 },
  { value: "pro", label: "Pro", priceMonthly: 99 },
  { value: "agency", label: "Agency", priceMonthly: 0 },
] as const;

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
] as const;

export type EnvKeyStatus = {
  key: string;
  group: string;
  configured: boolean;
  hint: string | null;
};

function maskHint(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return "••••";
  return `…${value.slice(-4)}`;
}

export function getSystemKeyStatuses(): EnvKeyStatus[] {
  const rows: Array<{ key: string; group: string; env: string | undefined }> = [
    { key: "DATABASE_URL", group: "Core", env: process.env.DATABASE_URL },
    { key: "JWT_SECRET", group: "Core", env: process.env.JWT_SECRET },
    {
      key: "NEXT_PUBLIC_APP_URL",
      group: "Core",
      env: process.env.NEXT_PUBLIC_APP_URL,
    },
    {
      key: "GOOGLE_PLACES_API_KEY",
      group: "Lead sources",
      env: process.env.GOOGLE_PLACES_API_KEY,
    },
    {
      key: "YELP_FUSION_API_KEY",
      group: "Lead sources",
      env: process.env.YELP_FUSION_API_KEY,
    },
    {
      key: "OPENAI_API_KEY",
      group: "AI",
      env: process.env.OPENAI_API_KEY,
    },
    {
      key: "SERPER_API_KEY",
      group: "Enrichment",
      env: process.env.SERPER_API_KEY,
    },
    {
      key: "LINKEDIN_DATA_API_KEY",
      group: "Enrichment",
      env: process.env.LINKEDIN_DATA_API_KEY,
    },
    {
      key: "META_APP_ID",
      group: "Meta",
      env: process.env.META_APP_ID || process.env.FACEBOOK_APP_ID,
    },
    {
      key: "META_APP_SECRET",
      group: "Meta",
      env: process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET,
    },
    {
      key: "META_ACCESS_TOKEN",
      group: "Meta",
      env: process.env.META_ACCESS_TOKEN,
    },
  ];

  return rows.map((row) => ({
    key: row.key,
    group: row.group,
    configured: Boolean(row.env?.trim()),
    hint: maskHint(row.env),
  }));
}

export function isValidIndustry(value: string) {
  return (INDUSTRIES as readonly string[]).includes(value);
}
