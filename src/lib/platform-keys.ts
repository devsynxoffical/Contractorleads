import { prisma } from "@/lib/prisma";

/**
 * Admin-editable platform API secrets (Serper, Google Places, OpenAI,
 * NinjaPear, Yelp Fusion, Meta). Non-empty DB fields win over env vars;
 * empty fields fall back to the host environment (Railway / .env).
 */

export const PLATFORM_KEY_FIELDS = [
  "serperApiKey",
  "googlePlacesApiKey",
  "googlePlacesApiKey2",
  "openaiApiKey",
  "ninjapearApiKey",
  "apolloApiKey",
  "hunterApiKey",
  "prospeoApiKey",
  "zerobounceApiKey",
  "neverbounceApiKey",
  "millionverifierApiKey",
  "bouncerApiKey",
  "emaillistverifyApiKey",
  "yelpFusionApiKey",
  "metaAccessToken",
  "metaAppId",
  "metaAppSecret",
] as const;

export type PlatformKeyField = (typeof PLATFORM_KEY_FIELDS)[number];

export type PlatformKeyInput = Partial<Record<PlatformKeyField, string>>;

export type PlatformKeyStatus = {
  field: PlatformKeyField;
  /** Primary env var name (display key). */
  key: string;
  group: string;
  configured: boolean;
  source: "database" | "environment" | "none";
  hint: string | null;
};

type PlatformKeyRow = Record<PlatformKeyField, string>;

const ENV_VARS: Record<PlatformKeyField, string[]> = {
  serperApiKey: ["SERPER_API_KEY"],
  googlePlacesApiKey: ["GOOGLE_PLACES_API_KEY"],
  googlePlacesApiKey2: ["GOOGLE_PLACES_API_KEY_2"],
  openaiApiKey: ["OPENAI_API_KEY"],
  ninjapearApiKey: ["NINJAPEAR_API_KEY", "LINKEDIN_DATA_API_KEY"],
  apolloApiKey: ["APOLLO_API_KEY"],
  hunterApiKey: ["HUNTER_API_KEY"],
  prospeoApiKey: ["PROSPEO_API_KEY"],
  zerobounceApiKey: ["ZEROBOUNCE_API_KEY"],
  neverbounceApiKey: ["NEVERBOUNCE_API_KEY"],
  millionverifierApiKey: ["MILLIONVERIFIER_API_KEY"],
  bouncerApiKey: ["BOUNCER_API_KEY"],
  emaillistverifyApiKey: ["EMAILLISTVERIFY_API_KEY"],
  yelpFusionApiKey: ["YELP_FUSION_API_KEY"],
  metaAccessToken: ["META_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN"],
  metaAppId: ["META_APP_ID", "FACEBOOK_APP_ID"],
  metaAppSecret: ["META_APP_SECRET", "FACEBOOK_APP_SECRET"],
};

const GROUPS: Record<PlatformKeyField, string> = {
  serperApiKey: "Enrichment",
  googlePlacesApiKey: "Lead sources",
  googlePlacesApiKey2: "Lead sources",
  openaiApiKey: "AI",
  ninjapearApiKey: "Enrichment",
  apolloApiKey: "Enrichment",
  hunterApiKey: "Enrichment",
  prospeoApiKey: "Enrichment",
  zerobounceApiKey: "Email Verification",
  neverbounceApiKey: "Email Verification",
  millionverifierApiKey: "Email Verification",
  bouncerApiKey: "Email Verification",
  emaillistverifyApiKey: "Email Verification",
  yelpFusionApiKey: "Lead sources",
  metaAccessToken: "Meta",
  metaAppId: "Meta",
  metaAppSecret: "Meta",
};

const CACHE_TTL_MS = 15_000;

let cachedRow: PlatformKeyRow | null = null;
let cachedAt = 0;

function fromEnv(field: PlatformKeyField): string {
  for (const name of ENV_VARS[field]) {
    const v = process.env[name]?.trim();
    if (v) return v;
  }
  return "";
}

/** DB row with a short TTL so hot paths (Serper, Places) don't hit the DB every call. */
export async function getPlatformKeyRow(): Promise<PlatformKeyRow> {
  if (cachedRow && Date.now() - cachedAt < CACHE_TTL_MS) return cachedRow;

  const [row, pricingRow] = await Promise.all([
    prisma.platformKeyConfig
      .findUnique({ where: { id: "default" } })
      .catch(() => null),
    prisma.planPricingConfig
      .findUnique({ where: { id: "default" } })
      .catch(() => null),
  ]);

  let extraKeys: Record<string, string> = {};
  if (pricingRow?.pricesJson) {
    try {
      const parsed = JSON.parse(pricingRow.pricesJson) as Record<string, unknown>;
      if (parsed._platformKeys && typeof parsed._platformKeys === "object") {
        extraKeys = parsed._platformKeys as Record<string, string>;
      }
    } catch {
      extraKeys = {};
    }
  }

  cachedRow = {
    serperApiKey: row?.serperApiKey ?? "",
    googlePlacesApiKey: row?.googlePlacesApiKey ?? "",
    googlePlacesApiKey2: row?.googlePlacesApiKey2 ?? "",
    openaiApiKey: row?.openaiApiKey ?? "",
    ninjapearApiKey: row?.ninjapearApiKey ?? "",
    apolloApiKey: extraKeys.apolloApiKey ?? "",
    hunterApiKey: extraKeys.hunterApiKey ?? "",
    prospeoApiKey: extraKeys.prospeoApiKey ?? "",
    zerobounceApiKey: extraKeys.zerobounceApiKey ?? "",
    neverbounceApiKey: extraKeys.neverbounceApiKey ?? "",
    millionverifierApiKey: extraKeys.millionverifierApiKey ?? "",
    bouncerApiKey: extraKeys.bouncerApiKey ?? "",
    emaillistverifyApiKey: extraKeys.emaillistverifyApiKey ?? "",
    yelpFusionApiKey: row?.yelpFusionApiKey ?? "",
    metaAccessToken: row?.metaAccessToken ?? "",
    metaAppId: row?.metaAppId ?? "",
    metaAppSecret: row?.metaAppSecret ?? "",
  };
  cachedAt = Date.now();
  return cachedRow;
}

/** Force a fresh read after an admin save. */
export async function refreshPlatformKeyRow(): Promise<void> {
  cachedRow = null;
  cachedAt = 0;
  await getPlatformKeyRow();
}

/** Effective secret for a field: non-empty DB value wins, env as fallback. */
export async function resolvePlatformKey(
  field: PlatformKeyField,
): Promise<string> {
  const row = await getPlatformKeyRow();
  return row[field].trim() || fromEnv(field);
}

/** Google Places keys in priority order: primary, then backup. */
export async function getGooglePlacesKeys(): Promise<{
  primary: string;
  backup: string;
}> {
  return {
    primary: await resolvePlatformKey("googlePlacesApiKey"),
    backup: await resolvePlatformKey("googlePlacesApiKey2"),
  };
}

const EXTRA_KEY_FIELDS = new Set<PlatformKeyField>([
  "apolloApiKey",
  "hunterApiKey",
  "prospeoApiKey",
  "zerobounceApiKey",
  "neverbounceApiKey",
  "millionverifierApiKey",
  "bouncerApiKey",
  "emaillistverifyApiKey",
]);

export async function savePlatformKeyConfig(
  input: PlatformKeyInput,
): Promise<void> {
  const current = await getPlatformKeyRow();
  const update: Record<string, string> = {};
  const create: Record<string, string> = {};
  const extraUpdate: Record<string, string> = {
    apolloApiKey: current.apolloApiKey,
    hunterApiKey: current.hunterApiKey,
    prospeoApiKey: current.prospeoApiKey,
    zerobounceApiKey: current.zerobounceApiKey,
    neverbounceApiKey: current.neverbounceApiKey,
    millionverifierApiKey: current.millionverifierApiKey,
    bouncerApiKey: current.bouncerApiKey,
    emaillistverifyApiKey: current.emaillistverifyApiKey,
  };
  let hasExtraUpdate = false;

  for (const field of PLATFORM_KEY_FIELDS) {
    if (field in input) {
      const val = input[field]?.trim() ?? current[field];
      if (EXTRA_KEY_FIELDS.has(field)) {
        extraUpdate[field] = val;
        hasExtraUpdate = true;
      } else {
        update[field] = val;
        create[field] = input[field]?.trim() ?? "";
      }
    }
  }

  if (Object.keys(update).length > 0) {
    await prisma.platformKeyConfig.upsert({
      where: { id: "default" },
      update,
      create: { id: "default", ...create },
    });
  }

  if (hasExtraUpdate) {
    const existingPricing = await prisma.planPricingConfig
      .findUnique({ where: { id: "default" } })
      .catch(() => null);
    let rawObj: Record<string, unknown> = {};
    if (existingPricing?.pricesJson) {
      try {
        rawObj = JSON.parse(existingPricing.pricesJson) as Record<string, unknown>;
      } catch {
        rawObj = {};
      }
    }
    rawObj._platformKeys = extraUpdate;
    await prisma.planPricingConfig.upsert({
      where: { id: "default" },
      update: { pricesJson: JSON.stringify(rawObj) },
      create: { id: "default", pricesJson: JSON.stringify(rawObj) },
    });
  }

  await refreshPlatformKeyRow();
}

function maskHint(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return "••••";
  return `…${value.slice(-4)}`;
}

export async function getPlatformKeyStatuses(): Promise<PlatformKeyStatus[]> {
  const row = await getPlatformKeyRow();

  return PLATFORM_KEY_FIELDS.map((field) => {
    const dbValue = row[field].trim();
    const envValue = fromEnv(field);
    const source: PlatformKeyStatus["source"] = dbValue
      ? "database"
      : envValue
        ? "environment"
        : "none";
    return {
      field,
      key: ENV_VARS[field][0],
      group: GROUPS[field],
      configured: Boolean(dbValue || envValue),
      source,
      hint: maskHint(dbValue || envValue),
    };
  });
}
