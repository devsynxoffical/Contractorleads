import { prisma } from "@/lib/prisma";

export type EmailProviderSecrets = {
  resendApiKey: string;
  sendgridApiKey: string;
  fromEmail: string;
};

export type EmailProviderStatus = {
  resendConfigured: boolean;
  resendHint: string | null;
  sendgridConfigured: boolean;
  sendgridHint: string | null;
  fromEmail: string;
  /** True when a provider key exists, so live email sending works. */
  liveReady: boolean;
  provider: "resend" | "sendgrid" | "none";
  source: "database" | "environment" | "mixed" | "none";
  updatedAt: string | null;
};

export const DEFAULT_FROM_EMAIL =
  "Contractor Leads <hello@contractorleads.us>";

function maskHint(value: string | undefined | null): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.length <= 4) return "••••";
  return `…${v.slice(-4)}`;
}

function fromEnv(): EmailProviderSecrets {
  return {
    resendApiKey: process.env.RESEND_API_KEY?.trim() || "",
    sendgridApiKey: process.env.SENDGRID_API_KEY?.trim() || "",
    fromEmail:
      process.env.EMAIL_FROM?.trim() || process.env.RESEND_FROM?.trim() || "",
  };
}

/** Effective config: non-empty DB fields win over env. */
export async function getEmailProviderSecrets(): Promise<EmailProviderSecrets> {
  const env = fromEnv();
  const row = await prisma.emailProviderConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  if (!row) return env;

  return {
    resendApiKey: row.resendApiKey.trim() || env.resendApiKey,
    sendgridApiKey: row.sendgridApiKey.trim() || env.sendgridApiKey,
    fromEmail: row.fromEmail.trim() || env.fromEmail,
  };
}

export async function getEmailProviderStatus(): Promise<EmailProviderStatus> {
  const env = fromEnv();
  const row = await prisma.emailProviderConfig
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  const effective = await getEmailProviderSecrets();

  const dbHasAny = Boolean(
    row &&
      (row.resendApiKey.trim() ||
        row.sendgridApiKey.trim() ||
        row.fromEmail.trim()),
  );
  const envHasAny = Boolean(
    env.resendApiKey || env.sendgridApiKey || env.fromEmail,
  );

  let source: EmailProviderStatus["source"] = "none";
  if (dbHasAny && envHasAny) source = "mixed";
  else if (dbHasAny) source = "database";
  else if (envHasAny) source = "environment";

  const provider = effective.resendApiKey
    ? ("resend" as const)
    : effective.sendgridApiKey
      ? ("sendgrid" as const)
      : ("none" as const);

  return {
    resendConfigured: Boolean(effective.resendApiKey),
    resendHint: maskHint(effective.resendApiKey),
    sendgridConfigured: Boolean(effective.sendgridApiKey),
    sendgridHint: maskHint(effective.sendgridApiKey),
    fromEmail: effective.fromEmail,
    liveReady: provider !== "none",
    provider,
    source,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

export type EmailProviderSaveInput = {
  /** Pass a new key, or omit/empty to keep the existing one */
  resendApiKey?: string;
  sendgridApiKey?: string;
  fromEmail?: string;
  clearResendApiKey?: boolean;
  clearSendgridApiKey?: boolean;
};

export async function saveEmailProviderConfig(input: EmailProviderSaveInput) {
  const current = await prisma.emailProviderConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const next = {
    resendApiKey: current.resendApiKey,
    sendgridApiKey: current.sendgridApiKey,
    fromEmail: current.fromEmail,
  };

  if (input.clearResendApiKey) next.resendApiKey = "";
  else if (
    typeof input.resendApiKey === "string" &&
    input.resendApiKey.trim()
  ) {
    next.resendApiKey = input.resendApiKey.trim();
  }

  if (input.clearSendgridApiKey) next.sendgridApiKey = "";
  else if (
    typeof input.sendgridApiKey === "string" &&
    input.sendgridApiKey.trim()
  ) {
    next.sendgridApiKey = input.sendgridApiKey.trim();
  }

  if (typeof input.fromEmail === "string") {
    next.fromEmail = input.fromEmail.trim();
  }

  return prisma.emailProviderConfig.update({
    where: { id: "default" },
    data: next,
  });
}
