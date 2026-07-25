import { prisma } from "@/lib/prisma";

export type TwilioSecrets = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  messagingServiceSid: string;
};

export type TwilioStatus = {
  accountSidConfigured: boolean;
  accountSidHint: string | null;
  authTokenConfigured: boolean;
  authTokenHint: string | null;
  fromNumber: string;
  messagingServiceSid: string;
  /** True when SID + token + (from number or messaging service) are set. */
  liveReady: boolean;
  source: "database" | "environment" | "mixed" | "none";
  updatedAt: string | null;
  webhookUrl: string;
};

function maskHint(value: string | undefined | null): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.length <= 4) return "••••";
  return `…${v.slice(-4)}`;
}

function fromEnv(): TwilioSecrets {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || "",
    authToken: process.env.TWILIO_AUTH_TOKEN?.trim() || "",
    fromNumber: process.env.TWILIO_FROM_NUMBER?.trim() || "",
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || "",
  };
}

/** Effective config: non-empty DB fields win over env. */
export async function getTwilioSecrets(): Promise<TwilioSecrets> {
  const env = fromEnv();
  const row = await prisma.twilioConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  if (!row) return env;

  return {
    accountSid: row.accountSid.trim() || env.accountSid,
    authToken: row.authToken.trim() || env.authToken,
    fromNumber: row.fromNumber.trim() || env.fromNumber,
    messagingServiceSid:
      row.messagingServiceSid.trim() || env.messagingServiceSid,
  };
}

export async function isTwilioConfigured(): Promise<boolean> {
  const s = await getTwilioSecrets();
  return Boolean(
    s.accountSid &&
      s.authToken &&
      (s.fromNumber || s.messagingServiceSid),
  );
}

export async function getTwilioStatus(
  appBase?: string,
): Promise<TwilioStatus> {
  const env = fromEnv();
  const row = await prisma.twilioConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  const effective = await getTwilioSecrets();

  const dbHasAny = Boolean(
    row &&
      (row.accountSid.trim() ||
        row.authToken.trim() ||
        row.fromNumber.trim() ||
        row.messagingServiceSid.trim()),
  );
  const envHasAny = Boolean(
    env.accountSid ||
      env.authToken ||
      env.fromNumber ||
      env.messagingServiceSid,
  );

  let source: TwilioStatus["source"] = "none";
  if (dbHasAny && envHasAny) source = "mixed";
  else if (dbHasAny) source = "database";
  else if (envHasAny) source = "environment";

  const liveReady = Boolean(
    effective.accountSid &&
      effective.authToken &&
      (effective.fromNumber || effective.messagingServiceSid),
  );

  const base = (appBase || process.env.NEXT_PUBLIC_APP_URL || "")
    .trim()
    .replace(/\/$/, "");

  return {
    accountSidConfigured: Boolean(effective.accountSid),
    accountSidHint: maskHint(effective.accountSid),
    authTokenConfigured: Boolean(effective.authToken),
    authTokenHint: maskHint(effective.authToken),
    fromNumber: effective.fromNumber,
    messagingServiceSid: effective.messagingServiceSid,
    liveReady,
    source,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
    webhookUrl: base
      ? `${base}/api/webhooks/twilio/sms`
      : "/api/webhooks/twilio/sms",
  };
}

export type TwilioSaveInput = {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  messagingServiceSid?: string;
  clearAccountSid?: boolean;
  clearAuthToken?: boolean;
  clearFromNumber?: boolean;
  clearMessagingServiceSid?: boolean;
};

export async function saveTwilioConfig(input: TwilioSaveInput) {
  const current = await prisma.twilioConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const next = {
    accountSid: current.accountSid,
    authToken: current.authToken,
    fromNumber: current.fromNumber,
    messagingServiceSid: current.messagingServiceSid,
  };

  if (input.clearAccountSid) next.accountSid = "";
  else if (typeof input.accountSid === "string" && input.accountSid.trim()) {
    next.accountSid = input.accountSid.trim();
  }

  if (input.clearAuthToken) next.authToken = "";
  else if (typeof input.authToken === "string" && input.authToken.trim()) {
    next.authToken = input.authToken.trim();
  }

  if (input.clearFromNumber) next.fromNumber = "";
  else if (typeof input.fromNumber === "string") {
    next.fromNumber = input.fromNumber.trim();
  }

  if (input.clearMessagingServiceSid) next.messagingServiceSid = "";
  else if (typeof input.messagingServiceSid === "string") {
    next.messagingServiceSid = input.messagingServiceSid.trim();
  }

  return prisma.twilioConfig.update({
    where: { id: "default" },
    data: next,
  });
}
