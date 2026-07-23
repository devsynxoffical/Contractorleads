import { INDUSTRIES } from "@/lib/constants";
import { isOpenAIConfigured } from "@/lib/openai-config";
import {
  ADMIN_PLANS,
  PLAN_API_LIMITS,
  PLAN_FEATURES,
  type PlanId,
} from "@/lib/plans";

export { ADMIN_PLANS, PLAN_API_LIMITS, PLAN_FEATURES };
export type PlanKey = PlanId;

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
      key: "NINJAPEAR_API_KEY",
      group: "Enrichment",
      env: process.env.NINJAPEAR_API_KEY || process.env.LINKEDIN_DATA_API_KEY,
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
    {
      key: "RESEND_API_KEY",
      group: "Email",
      env: process.env.RESEND_API_KEY,
    },
    {
      key: "SENDGRID_API_KEY",
      group: "Email",
      env: process.env.SENDGRID_API_KEY,
    },
    {
      key: "EMAIL_FROM",
      group: "Email",
      env: process.env.EMAIL_FROM || process.env.RESEND_FROM,
    },
    {
      key: "INBOUND_EMAIL_SECRET",
      group: "Email",
      env: process.env.INBOUND_EMAIL_SECRET,
    },
    {
      key: "SECRET_ENCRYPTION_KEY",
      group: "Security",
      env: process.env.SECRET_ENCRYPTION_KEY || process.env.CREDENTIALS_SECRET,
    },
  ];

  return rows.map((row) => {
    const configured =
      row.key === "OPENAI_API_KEY"
        ? isOpenAIConfigured()
        : Boolean(row.env?.trim());
    return {
      key: row.key,
      group: row.group,
      configured,
      hint: configured ? maskHint(row.env) : null,
    };
  });
}

export function isValidIndustry(value: string) {
  return (INDUSTRIES as readonly string[]).includes(value);
}
