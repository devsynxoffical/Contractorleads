import { prisma } from "@/lib/prisma";

export type StripeBillingSecrets = {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  priceStarter: string;
  priceStarterAnnual: string;
  priceGrowth: string;
  priceGrowthAnnual: string;
  priceAgency: string;
  priceAgencyAnnual: string;
  priceMessaging: string;
  priceSeoReport: string;
};

export type StripeBillingStatus = {
  secretKeyConfigured: boolean;
  secretKeyHint: string | null;
  publishableKeyConfigured: boolean;
  publishableKeyHint: string | null;
  webhookSecretConfigured: boolean;
  webhookSecretHint: string | null;
  priceStarter: string;
  priceStarterAnnual: string;
  priceGrowth: string;
  priceGrowthAnnual: string;
  priceAgency: string;
  priceAgencyAnnual: string;
  priceMessaging: string;
  priceSeoReport: string;
  /** True when secret + monthly/annual IDs for three plans are present. */
  checkoutReady: boolean;
  /** True when secret + messaging price are present. */
  messagingReady: boolean;
  /** True when secret + AI SEO report add-on price are present. */
  seoReportReady: boolean;
  source: "database" | "environment" | "mixed" | "none";
  updatedAt: string | null;
};

function maskHint(value: string | undefined | null): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.length <= 4) return "••••";
  return `…${v.slice(-4)}`;
}

function fromEnv(): StripeBillingSecrets {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY?.trim() || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || "",
    priceStarter: process.env.STRIPE_PRICE_STARTER?.trim() || "",
    priceStarterAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL?.trim() || "",
    priceGrowth: process.env.STRIPE_PRICE_GROWTH?.trim() || "",
    priceGrowthAnnual: process.env.STRIPE_PRICE_GROWTH_ANNUAL?.trim() || "",
    priceAgency: process.env.STRIPE_PRICE_AGENCY?.trim() || "",
    priceAgencyAnnual: process.env.STRIPE_PRICE_AGENCY_ANNUAL?.trim() || "",
    priceMessaging: process.env.STRIPE_PRICE_MESSAGING?.trim() || "",
    priceSeoReport: process.env.STRIPE_PRICE_SEO_REPORT?.trim() || "",
  };
}

/** Effective config: non-empty DB fields win over env. */
export async function getStripeBillingSecrets(): Promise<StripeBillingSecrets> {
  const env = fromEnv();
  const row = await prisma.stripeBillingConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  if (!row) return env;

  return {
    secretKey: row.secretKey.trim() || env.secretKey,
    publishableKey: row.publishableKey.trim() || env.publishableKey,
    webhookSecret: row.webhookSecret.trim() || env.webhookSecret,
    priceStarter: row.priceStarter.trim() || env.priceStarter,
    priceStarterAnnual: row.priceStarterAnnual.trim() || env.priceStarterAnnual,
    priceGrowth: row.priceGrowth.trim() || env.priceGrowth,
    priceGrowthAnnual: row.priceGrowthAnnual.trim() || env.priceGrowthAnnual,
    priceAgency: row.priceAgency.trim() || env.priceAgency,
    priceAgencyAnnual: row.priceAgencyAnnual.trim() || env.priceAgencyAnnual,
    priceMessaging: row.priceMessaging.trim() || env.priceMessaging,
    priceSeoReport: row.priceSeoReport.trim() || env.priceSeoReport,
  };
}

export async function getStripeBillingStatus(): Promise<StripeBillingStatus> {
  const env = fromEnv();
  const row = await prisma.stripeBillingConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  const effective = await getStripeBillingSecrets();
  const dbHasAny = Boolean(
    row &&
      (row.secretKey.trim() ||
        row.publishableKey.trim() ||
        row.webhookSecret.trim() ||
        row.priceStarter.trim() ||
        row.priceStarterAnnual.trim() ||
        row.priceGrowth.trim() ||
        row.priceGrowthAnnual.trim() ||
        row.priceAgency.trim() ||
        row.priceAgencyAnnual.trim() ||
        row.priceMessaging.trim() ||
        row.priceSeoReport.trim()),
  );
  const envHasAny = Boolean(
    env.secretKey ||
      env.publishableKey ||
      env.webhookSecret ||
      env.priceStarter ||
      env.priceStarterAnnual ||
      env.priceGrowth ||
      env.priceGrowthAnnual ||
      env.priceAgency ||
      env.priceAgencyAnnual ||
      env.priceMessaging ||
      env.priceSeoReport,
  );

  let source: StripeBillingStatus["source"] = "none";
  if (dbHasAny && envHasAny) source = "mixed";
  else if (dbHasAny) source = "database";
  else if (envHasAny) source = "environment";

  return {
    secretKeyConfigured: Boolean(effective.secretKey),
    secretKeyHint: maskHint(effective.secretKey),
    publishableKeyConfigured: Boolean(effective.publishableKey),
    publishableKeyHint: maskHint(effective.publishableKey),
    webhookSecretConfigured: Boolean(effective.webhookSecret),
    webhookSecretHint: maskHint(effective.webhookSecret),
    // Price IDs are not highly sensitive — show stored/effective values for editing
    priceStarter: effective.priceStarter,
    priceStarterAnnual: effective.priceStarterAnnual,
    priceGrowth: effective.priceGrowth,
    priceGrowthAnnual: effective.priceGrowthAnnual,
    priceAgency: effective.priceAgency,
    priceAgencyAnnual: effective.priceAgencyAnnual,
    priceMessaging: effective.priceMessaging,
    priceSeoReport: effective.priceSeoReport,
    checkoutReady: Boolean(
      effective.secretKey &&
        effective.priceStarter &&
        effective.priceStarterAnnual &&
        effective.priceGrowth &&
        effective.priceGrowthAnnual &&
        effective.priceAgency &&
        effective.priceAgencyAnnual,
    ),
    messagingReady: Boolean(effective.secretKey && effective.priceMessaging),
    seoReportReady: Boolean(effective.secretKey && effective.priceSeoReport),
    source,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

export type StripeBillingSaveInput = {
  /** Pass new secret, or omit/empty to keep existing */
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
  priceStarter?: string;
  priceStarterAnnual?: string;
  priceGrowth?: string;
  priceGrowthAnnual?: string;
  priceAgency?: string;
  priceAgencyAnnual?: string;
  priceMessaging?: string;
  priceSeoReport?: string;
  /** Clear a field explicitly */
  clearSecretKey?: boolean;
  clearPublishableKey?: boolean;
  clearWebhookSecret?: boolean;
};

export async function saveStripeBillingConfig(input: StripeBillingSaveInput) {
  const current = await prisma.stripeBillingConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const next = {
    secretKey: current.secretKey,
    publishableKey: current.publishableKey,
    webhookSecret: current.webhookSecret,
    priceStarter: current.priceStarter,
    priceStarterAnnual: current.priceStarterAnnual,
    priceGrowth: current.priceGrowth,
    priceGrowthAnnual: current.priceGrowthAnnual,
    priceAgency: current.priceAgency,
    priceAgencyAnnual: current.priceAgencyAnnual,
    priceMessaging: current.priceMessaging,
    priceSeoReport: current.priceSeoReport,
  };

  if (input.clearSecretKey) next.secretKey = "";
  else if (typeof input.secretKey === "string" && input.secretKey.trim()) {
    next.secretKey = input.secretKey.trim();
  }

  if (input.clearPublishableKey) next.publishableKey = "";
  else if (
    typeof input.publishableKey === "string" &&
    input.publishableKey.trim()
  ) {
    next.publishableKey = input.publishableKey.trim();
  }

  if (input.clearWebhookSecret) next.webhookSecret = "";
  else if (
    typeof input.webhookSecret === "string" &&
    input.webhookSecret.trim()
  ) {
    next.webhookSecret = input.webhookSecret.trim();
  }

  if (typeof input.priceStarter === "string") {
    next.priceStarter = input.priceStarter.trim();
  }
  if (typeof input.priceStarterAnnual === "string") {
    next.priceStarterAnnual = input.priceStarterAnnual.trim();
  }
  if (typeof input.priceGrowth === "string") {
    next.priceGrowth = input.priceGrowth.trim();
  }
  if (typeof input.priceGrowthAnnual === "string") {
    next.priceGrowthAnnual = input.priceGrowthAnnual.trim();
  }
  if (typeof input.priceAgency === "string") {
    next.priceAgency = input.priceAgency.trim();
  }
  if (typeof input.priceAgencyAnnual === "string") {
    next.priceAgencyAnnual = input.priceAgencyAnnual.trim();
  }
  if (typeof input.priceMessaging === "string") {
    next.priceMessaging = input.priceMessaging.trim();
  }
  if (typeof input.priceSeoReport === "string") {
    next.priceSeoReport = input.priceSeoReport.trim();
  }

  const row = await prisma.stripeBillingConfig.update({
    where: { id: "default" },
    data: next,
  });

  // Force Stripe SDK to rebuild with new secret on next call
  const { resetStripeClient } = await import("@/lib/stripe");
  resetStripeClient();

  return row;
}
