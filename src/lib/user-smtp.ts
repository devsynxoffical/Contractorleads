import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto-secret";

export type SmtpPayload = {
  id?: string;
  label?: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName?: string | null;
};

export function createSmtpTransport(cfg: SmtpPayload) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.username,
      pass: cfg.password,
    },
  });
}

/** One-time migrate legacy UserSmtpSettings → SmtpAccount when accounts empty. */
export async function migrateLegacySmtpIfNeeded(userId: string) {
  const count = await prisma.smtpAccount.count({ where: { userId } });
  if (count > 0) return;

  const legacy = await prisma.userSmtpSettings.findUnique({ where: { userId } });
  if (!legacy) return;

  await prisma.smtpAccount.create({
    data: {
      userId,
      label: "Primary",
      host: legacy.host,
      port: legacy.port,
      secure: legacy.secure,
      username: legacy.username,
      passwordEnc: legacy.passwordEnc,
      fromEmail: legacy.fromEmail,
      fromName: legacy.fromName,
      enabled: legacy.enabled,
      isDefault: true,
      lastTestedAt: legacy.lastTestedAt,
    },
  });
}

function rowToPayload(row: {
  id: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordEnc: string;
  fromEmail: string;
  fromName: string | null;
}): SmtpPayload {
  return {
    id: row.id,
    label: row.label,
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    password: decryptSecret(row.passwordEnc),
    fromEmail: row.fromEmail,
    fromName: row.fromName,
  };
}

/** Default enabled SMTP account (or specific id). Falls back to legacy row. */
export async function getUserSmtpConfig(
  userId: string,
  accountId?: string | null,
): Promise<SmtpPayload | null> {
  await migrateLegacySmtpIfNeeded(userId);

  if (accountId) {
    const row = await prisma.smtpAccount.findFirst({
      where: { id: accountId, userId, enabled: true },
    });
    if (row) return rowToPayload(row);
  }

  const preferred = await prisma.smtpAccount.findFirst({
    where: { userId, enabled: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (preferred) return rowToPayload(preferred);

  const legacy = await prisma.userSmtpSettings.findUnique({ where: { userId } });
  if (!legacy || !legacy.enabled) return null;
  return {
    host: legacy.host,
    port: legacy.port,
    secure: legacy.secure,
    username: legacy.username,
    password: decryptSecret(legacy.passwordEnc),
    fromEmail: legacy.fromEmail,
    fromName: legacy.fromName,
  };
}

export async function listSmtpAccounts(userId: string) {
  await migrateLegacySmtpIfNeeded(userId);
  return prisma.smtpAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function ensureSingleDefault(userId: string, preferId?: string) {
  const accounts = await prisma.smtpAccount.findMany({ where: { userId } });
  if (!accounts.length) return;
  const target =
    (preferId && accounts.find((a) => a.id === preferId)) ||
    accounts.find((a) => a.isDefault) ||
    accounts[0];
  await prisma.$transaction([
    prisma.smtpAccount.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.smtpAccount.update({
      where: { id: target.id },
      data: { isDefault: true },
    }),
  ]);
}

export async function upsertSmtpAccount(opts: {
  userId: string;
  id?: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName?: string | null;
  enabled: boolean;
  isDefault?: boolean;
}) {
  await migrateLegacySmtpIfNeeded(opts.userId);

  if (opts.id) {
    const existing = await prisma.smtpAccount.findFirst({
      where: { id: opts.id, userId: opts.userId },
    });
    if (!existing) throw new Error("SMTP account not found");
    if (!opts.password && !existing.passwordEnc) {
      throw new Error("SMTP password is required");
    }
    const updated = await prisma.smtpAccount.update({
      where: { id: existing.id },
      data: {
        label: opts.label,
        host: opts.host,
        port: opts.port,
        secure: opts.secure,
        username: opts.username,
        fromEmail: opts.fromEmail,
        fromName: opts.fromName ?? null,
        enabled: opts.enabled,
        ...(opts.password ? { passwordEnc: encryptSecret(opts.password) } : {}),
      },
    });
    if (opts.isDefault) await ensureSingleDefault(opts.userId, updated.id);
    // Keep legacy row in sync with default for older code paths
    await syncLegacyFromDefault(opts.userId);
    return updated;
  }

  if (!opts.password) throw new Error("SMTP password is required");
  const count = await prisma.smtpAccount.count({ where: { userId: opts.userId } });
  const created = await prisma.smtpAccount.create({
    data: {
      userId: opts.userId,
      label: opts.label || "Mailbox",
      host: opts.host,
      port: opts.port,
      secure: opts.secure,
      username: opts.username,
      passwordEnc: encryptSecret(opts.password),
      fromEmail: opts.fromEmail,
      fromName: opts.fromName ?? null,
      enabled: opts.enabled,
      isDefault: count === 0 || Boolean(opts.isDefault),
    },
  });
  if (created.isDefault) await ensureSingleDefault(opts.userId, created.id);
  await syncLegacyFromDefault(opts.userId);
  return created;
}

async function syncLegacyFromDefault(userId: string) {
  const def = await prisma.smtpAccount.findFirst({
    where: { userId, isDefault: true },
  });
  if (!def) return;
  await prisma.userSmtpSettings.upsert({
    where: { userId },
    create: {
      userId,
      host: def.host,
      port: def.port,
      secure: def.secure,
      username: def.username,
      passwordEnc: def.passwordEnc,
      fromEmail: def.fromEmail,
      fromName: def.fromName,
      enabled: def.enabled,
      lastTestedAt: def.lastTestedAt,
    },
    update: {
      host: def.host,
      port: def.port,
      secure: def.secure,
      username: def.username,
      passwordEnc: def.passwordEnc,
      fromEmail: def.fromEmail,
      fromName: def.fromName,
      enabled: def.enabled,
      lastTestedAt: def.lastTestedAt,
    },
  });
}

export async function sendViaUserSmtp(opts: {
  userId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  accountId?: string | null;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
}) {
  const cfg = await getUserSmtpConfig(opts.userId, opts.accountId);
  if (!cfg) {
    throw new Error(
      "SMTP is not configured. Add a mailbox under Settings → Email automation.",
    );
  }
  const transport = createSmtpTransport(cfg);
  const from = cfg.fromName
    ? `"${cfg.fromName}" <${cfg.fromEmail}>`
    : cfg.fromEmail;
  const info = await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    replyTo: opts.replyTo,
    inReplyTo: opts.inReplyTo,
    references: opts.references,
  });
  return {
    messageId: typeof info.messageId === "string" ? info.messageId : null,
    smtpAccountId: cfg.id ?? null,
    fromEmail: cfg.fromEmail,
  };
}

export function renderSequenceTemplate(
  template: string,
  vars: Record<string, string>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function maskSmtpAccount(row: {
  id: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string | null;
  enabled: boolean;
  isDefault: boolean;
  lastTestedAt: Date | null;
  passwordEnc: string;
}) {
  return {
    id: row.id,
    label: row.label,
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    enabled: row.enabled,
    isDefault: row.isDefault,
    lastTestedAt: row.lastTestedAt,
    hasPassword: Boolean(row.passwordEnc),
  };
}
