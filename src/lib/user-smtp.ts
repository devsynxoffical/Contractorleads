import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto-secret";
import { sendUserResendEmail, verifyResendApiKey } from "@/lib/email";
import { assertPublicSmtpHost, BlockedUrlError } from "@/lib/safe-fetch";
import { appBaseUrl } from "@/lib/email-brand";

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

const SMTP_CONNECTION_MS = 15_000;
const SMTP_GREETING_MS = 12_000;
const SMTP_SOCKET_MS = 25_000;

/** Normalize port/secure pairs (465 = SSL, 587 = STARTTLS). */
export function normalizeSmtpSecurity(port: number, secure: boolean) {
  if (port === 465) return { port: 465, secure: true };
  if (port === 587) return { port: 587, secure: false };
  return { port, secure };
}

export function formatSmtpError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "Send failed");
  const lower = raw.toLowerCase();
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout")
  ) {
    return (
      "SMTP connection timed out. On cloud hosts outbound SMTP is often blocked. " +
      "Switch to Resend API delivery in Setup → Email instead."
    );
  }
  if (lower.includes("econnrefused") || lower.includes("connect")) {
    return "Could not connect to the SMTP server. Check host, port (465 + TLS or 587 + STARTTLS), and firewall rules.";
  }
  if (
    lower.includes("auth") ||
    lower.includes("credentials") ||
    lower.includes("535") ||
    lower.includes("534")
  ) {
    return "SMTP login failed. Use the full email as username and the mailbox password.";
  }
  if (lower.includes("certificate") || lower.includes("ssl") || lower.includes("tls")) {
    return "TLS error. Port 465 needs “TLS / secure” checked. Port 587 needs it unchecked.";
  }
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
}

export function isSmtpConnectivityError(err: unknown): boolean {
  const lower = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    lower.includes("econnrefused") ||
    lower.includes("connect") ||
    lower.includes("greeting never received")
  );
}

export function createSmtpTransport(cfg: SmtpPayload) {
  const { port, secure } = normalizeSmtpSecurity(cfg.port, cfg.secure);
  const options: SMTPTransport.Options = {
    host: cfg.host.trim(),
    port,
    secure,
    requireTLS: port === 587,
    auth: {
      user: cfg.username.trim(),
      pass: cfg.password,
    },
    connectionTimeout: SMTP_CONNECTION_MS,
    greetingTimeout: SMTP_GREETING_MS,
    socketTimeout: SMTP_SOCKET_MS,
    tls: {
      minVersion: "TLSv1.2",
      servername: cfg.host.trim(),
    },
  };
  return nodemailer.createTransport(options);
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

export type SenderConfig = {
  id?: string;
  label?: string;
  fromEmail: string;
  fromName?: string | null;
  deliveryMode: "platform" | "smtp";
  resendApiKey?: string;
  smtp?: SmtpPayload;
};

export type SmtpAccountStats = {
  id: string;
  label: string;
  fromEmail: string;
  enabled: boolean;
  sendWeight: number;
  desiredShare: number;
  actualShare: number;
  sent: number;
  failed: number;
  delivered: number;
  replied: number;
  opened: number;
  openRate: number;
  bounceRate: number;
  replyRate: number;
  healthScore: number;
  suggestedWeight: number;
};

function isResendDelivery(mode: string | null | undefined): boolean {
  return mode === "platform" || mode === "resend";
}

function inferDeliveryMode(row: {
  deliveryMode?: string | null;
  host?: string | null;
  resendApiKeyEnc?: string | null;
}): "platform" | "smtp" {
  if (row.deliveryMode === "smtp") return "smtp";
  if (isResendDelivery(row.deliveryMode) || row.resendApiKeyEnc?.trim()) {
    return "platform";
  }
  return row.host?.trim() ? "smtp" : "platform";
}

function rowToSenderConfig(row: {
  id: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordEnc: string;
  resendApiKeyEnc?: string;
  fromEmail: string;
  fromName: string | null;
  deliveryMode?: string | null;
  sendWeight?: number;
}): SenderConfig {
  const deliveryMode = inferDeliveryMode(row);
  const resendKey = row.resendApiKeyEnc?.trim()
    ? decryptSecret(row.resendApiKeyEnc)
    : undefined;
  return {
    id: row.id,
    label: row.label,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    deliveryMode,
    resendApiKey: isResendDelivery(deliveryMode) ? resendKey : undefined,
    smtp:
      deliveryMode === "smtp" && row.host.trim()
        ? rowToPayload(row)
        : undefined,
  };
}

/** Default sender (from name + reply-to). SMTP credentials optional. */
export async function getUserSenderConfig(
  userId: string,
  accountId?: string | null,
): Promise<SenderConfig | null> {
  await migrateLegacySmtpIfNeeded(userId);

  if (accountId) {
    const row = await prisma.smtpAccount.findFirst({
      where: { id: accountId, userId, enabled: true },
    });
    if (row) return rowToSenderConfig(row);
  }

  const preferred = await prisma.smtpAccount.findFirst({
    where: { userId, enabled: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (preferred) return rowToSenderConfig(preferred);

  const legacy = await prisma.userSmtpSettings.findUnique({ where: { userId } });
  if (!legacy || !legacy.enabled) return null;
  return {
    fromEmail: legacy.fromEmail,
    fromName: legacy.fromName,
    deliveryMode: legacy.host.trim() ? "smtp" : "platform",
    smtp: legacy.host.trim()
      ? {
          host: legacy.host,
          port: legacy.port,
          secure: legacy.secure,
          username: legacy.username,
          password: decryptSecret(legacy.passwordEnc),
          fromEmail: legacy.fromEmail,
          fromName: legacy.fromName,
        }
      : undefined,
  };
}

export async function listSmtpAccounts(userId: string) {
  await migrateLegacySmtpIfNeeded(userId);
  return prisma.smtpAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Weighted round-robin sender picker for cold outreach. Distributes sends
 * proportionally to each account's sendWeight. Self-correcting: picks the
 * enabled account whose recent share of sends is furthest below its desired
 * share, so weights can change mid-flight and distribution converges.
 */
export async function pickRotationSender(userId: string): Promise<SenderConfig | null> {
  await migrateLegacySmtpIfNeeded(userId);
  const accounts = await prisma.smtpAccount.findMany({
    where: { userId, enabled: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (!accounts.length) return getUserSenderConfig(userId);

  const totalWeight = accounts.reduce(
    (sum, a) => sum + Math.max(1, a.sendWeight),
    0,
  );

  const recent = await prisma.leadEmail.groupBy({
    by: ["smtpAccountId"],
    where: { userId, direction: "outbound", smtpAccountId: { not: null } },
    _count: { _all: true },
  });
  const recentMap = new Map<string, number>(
    recent
      .filter((r) => r.smtpAccountId)
      .map((r) => [r.smtpAccountId as string, r._count._all]),
  );
  const totalRecent = [...recentMap.values()].reduce((s, n) => s + n, 0);

  let best = accounts[0];
  let bestScore = -Infinity;
  for (const account of accounts) {
    const desired = Math.max(1, account.sendWeight) / totalWeight;
    const actual = totalRecent
      ? (recentMap.get(account.id) ?? 0) / totalRecent
      : 0;
    const score = desired - actual;
    if (score > bestScore) {
      bestScore = score;
      best = account;
    }
  }
  return rowToSenderConfig(best);
}

/**
 * Per-mailbox cold-outreach performance. Aggregates outbound LeadEmail rows
 * (sent / failed) and inbound replies. Opens are added once open tracking is
 * live (they ride on LeadEmail status). Health is a transparent score:
 * 100 - bouncePenalty + replyBonus, clamped 0..100.
 */
export async function getSmtpAccountPerformance(
  userId: string,
): Promise<SmtpAccountStats[]> {
  await migrateLegacySmtpIfNeeded(userId);
  const accounts = await listSmtpAccounts(userId);
  if (!accounts.length) return [];

  const enabled = accounts.filter((a) => a.enabled);
  const totalWeight = enabled.reduce(
    (sum, a) => sum + Math.max(1, a.sendWeight),
    0,
  );

  const [sentGroup, failedGroup, openedGroup, inboundGroup] = await Promise.all([
    prisma.leadEmail.groupBy({
      by: ["smtpAccountId"],
      where: { userId, direction: "outbound", smtpAccountId: { not: null } },
      _count: { _all: true },
    }),
    prisma.leadEmail.groupBy({
      by: ["smtpAccountId"],
      where: {
        userId,
        direction: "outbound",
        smtpAccountId: { not: null },
        status: "failed",
      },
      _count: { _all: true },
    }),
    prisma.leadEmail.groupBy({
      by: ["smtpAccountId"],
      where: {
        userId,
        direction: "outbound",
        smtpAccountId: { not: null },
        openedAt: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.leadEmail.groupBy({
      by: ["smtpAccountId"],
      where: { userId, direction: "inbound", smtpAccountId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const countMap = (rows: Array<{ smtpAccountId: string | null; _count: { _all: number } }>) =>
    new Map<string, number>(
      rows
        .filter((r) => r.smtpAccountId)
        .map((r) => [r.smtpAccountId as string, r._count._all]),
    );

  const sentMap = countMap(sentGroup);
  const failedMap = countMap(failedGroup);
  const openedMap = countMap(openedGroup);
  const inboundMap = countMap(inboundGroup);
  const totalSent = [...sentMap.values()].reduce((s, n) => s + n, 0);

  return accounts.map((a) => {
    const sent = sentMap.get(a.id) ?? 0;
    const failed = failedMap.get(a.id) ?? 0;
    const opened = openedMap.get(a.id) ?? 0;
    const replied = inboundMap.get(a.id) ?? 0;
    const delivered = Math.max(0, sent - failed);
    const weight = Math.max(1, a.sendWeight);
    const bounceRate = sent ? failed / sent : 0;
    const replyRate = sent ? replied / sent : 0;
    const openRate = sent ? opened / sent : 0;
    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(100 - bounceRate * 400 + replyRate * 150 + openRate * 60),
      ),
    );
    // Suggest weight by deliverability: good senders keep/raise share, bouncy ones drop.
    let suggested = weight;
    if (sent >= 10) {
      const factor = 1 - bounceRate * 2;
      suggested = Math.max(1, Math.round(weight * factor));
    }
    return {
      id: a.id,
      label: a.label,
      fromEmail: a.fromEmail,
      enabled: a.enabled,
      sendWeight: weight,
      desiredShare: totalWeight ? Math.round((weight / totalWeight) * 100) : 0,
      actualShare: totalSent ? Math.round(((sentMap.get(a.id) ?? 0) / totalSent) * 100) : 0,
      sent,
      failed,
      delivered,
      replied,
      opened,
      openRate: Math.round(openRate * 100),
      bounceRate: Math.round(bounceRate * 100),
      replyRate: Math.round(replyRate * 100),
      healthScore,
      suggestedWeight: suggested,
    };
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
  deliveryMode?: "platform" | "smtp";
  resendApiKey?: string;
  sendWeight?: number;
}) {
  await migrateLegacySmtpIfNeeded(opts.userId);

  const deliveryMode = opts.deliveryMode ?? "platform";
  const fromEmail = opts.fromEmail.trim();
  if (!fromEmail) throw new Error("From email is required");

  if (isResendDelivery(deliveryMode)) {
    if (opts.resendApiKey && !opts.resendApiKey.startsWith("re_")) {
      throw new Error("Resend API key must start with re_");
    }
  }

  if (deliveryMode === "smtp") {
    const host = opts.host.trim();
    if (!host) throw new Error("SMTP host is required for custom SMTP delivery");
    if (!opts.username.trim()) throw new Error("SMTP username is required");
    try {
      await assertPublicSmtpHost(host);
    } catch (e) {
      throw new Error(
        e instanceof BlockedUrlError ? e.message : "Invalid SMTP host",
      );
    }
  }

  const host = deliveryMode === "smtp" ? opts.host.trim() : "";
  const username = deliveryMode === "smtp" ? opts.username.trim() : "";
  const port = deliveryMode === "smtp" ? opts.port : 587;
  const secure = deliveryMode === "smtp" ? opts.secure : false;
  const sendWeight = Number.isFinite(opts.sendWeight)
    ? Math.max(1, Math.min(100, Math.round(opts.sendWeight ?? 1)))
    : undefined;

  if (opts.id) {
    const existing = await prisma.smtpAccount.findFirst({
      where: { id: opts.id, userId: opts.userId },
    });
    if (!existing) throw new Error("Sender not found");
    if (isResendDelivery(deliveryMode) && !opts.resendApiKey && !existing.resendApiKeyEnc?.trim()) {
      throw new Error("Resend API key is required");
    }
    if (deliveryMode === "smtp" && !opts.password && !existing.passwordEnc) {
      throw new Error("SMTP password is required");
    }
    const updated = await prisma.smtpAccount.update({
      where: { id: existing.id },
      data: {
        label: opts.label,
        deliveryMode,
        host,
        port,
        secure,
        username,
        fromEmail,
        fromName: opts.fromName ?? null,
        enabled: opts.enabled,
        ...(sendWeight !== undefined ? { sendWeight } : {}),
        ...(opts.password ? { passwordEnc: encryptSecret(opts.password) } : {}),
        ...(opts.resendApiKey
          ? { resendApiKeyEnc: encryptSecret(opts.resendApiKey) }
          : {}),
        ...(isResendDelivery(deliveryMode) && !opts.password
          ? { passwordEnc: existing.passwordEnc || encryptSecret("") }
          : {}),
      },
    });
    if (opts.isDefault) await ensureSingleDefault(opts.userId, updated.id);
    await syncLegacyFromDefault(opts.userId);
    return updated;
  }

  if (isResendDelivery(deliveryMode) && !opts.resendApiKey) {
    throw new Error("Resend API key is required");
  }
  if (deliveryMode === "smtp" && !opts.password) {
    throw new Error("SMTP password is required");
  }
  const count = await prisma.smtpAccount.count({ where: { userId: opts.userId } });
  const created = await prisma.smtpAccount.create({
    data: {
      userId: opts.userId,
      label: opts.label || "Primary",
      deliveryMode,
      host,
      port,
      secure,
      username,
      passwordEnc: encryptSecret(opts.password ?? ""),
      resendApiKeyEnc: encryptSecret(opts.resendApiKey ?? ""),
      fromEmail,
      fromName: opts.fromName ?? null,
      enabled: opts.enabled,
      sendWeight: sendWeight ?? 1,
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

async function sendViaUserResend(
  sender: SenderConfig,
  opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }>;
  },
) {
  const apiKey = sender.resendApiKey?.trim();
  if (!apiKey) {
    throw new Error(
      "Add your Resend API key under Setup → Email. Each account uses its own key for lead email.",
    );
  }
  const sent = await sendUserResendEmail({
    apiKey,
    fromEmail: sender.fromEmail,
    fromName: sender.fromName,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    tags: ["lead-email"],
    attachments: opts.attachments,
  });
  if (!sent.ok) {
    throw new Error(sent.error || "Resend could not send this email");
  }
  return {
    messageId: sent.messageId ?? null,
    smtpAccountId: sender.id ?? null,
    fromEmail: sender.fromEmail,
    delivery: "resend" as const,
  };
}

async function sendViaSmtpDirect(
  cfg: SmtpPayload,
  mail: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    inReplyTo?: string;
    references?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }>;
  },
) {
  const attempts: SmtpPayload[] = [cfg];
  const alt = normalizeSmtpSecurity(cfg.port, cfg.secure);
  if (alt.port === 465) {
    attempts.push({ ...cfg, port: 587, secure: false });
  }

  let lastErr: unknown;
  for (const attempt of attempts) {
    try {
      const transport = createSmtpTransport(attempt);
      const info = await transport.sendMail({
        ...mail,
        attachments: mail.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      return {
        messageId: typeof info.messageId === "string" ? info.messageId : null,
        smtpAccountId: cfg.id ?? null,
        fromEmail: cfg.fromEmail,
        delivery: "smtp" as const,
      };
    } catch (e) {
      lastErr = e;
      if (!isSmtpConnectivityError(e)) {
        throw new Error(formatSmtpError(e));
      }
    }
  }
  throw lastErr;
}

/** Send lead/outreach email via the user's Resend key or their SMTP server. */
export async function sendOutboundEmail(opts: {
  userId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  accountId?: string | null;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}) {
  // Explicit account = that mailbox. No account = weighted rotation across
  // enabled mailboxes (replies always pass the original account explicitly).
  const sender = opts.accountId
    ? await getUserSenderConfig(opts.userId, opts.accountId)
    : await pickRotationSender(opts.userId);
  if (!sender) {
    throw new Error(
      "Add a sender under Setup → Email (your name and reply-to address).",
    );
  }

  // Open tracking: embed a 1x1 pixel that records openedAt once on load. The
  // token is generated before send and returned so callers store it on the
  // LeadEmail row, letting the pixel resolve without a provider webhook.
  const trackingToken = randomBytes(16).toString("hex");
  const html = withTrackingPixel(opts.text, opts.html, trackingToken);
  const sendOpts = { ...opts, html };

  if (isResendDelivery(sender.deliveryMode)) {
    const sent = await sendViaUserResend(sender, sendOpts);
    return { ...sent, trackingToken };
  }

  if (!sender.smtp) {
    throw new Error(
      "Custom SMTP is selected but not configured. Add host and password, or switch to Resend API.",
    );
  }

  const mailFrom = sender.fromName
    ? `"${sender.fromName}" <${sender.fromEmail}>`
    : sender.fromEmail;

  try {
    const sent = await sendViaSmtpDirect(sender.smtp, {
      from: mailFrom,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html,
      replyTo: opts.replyTo,
      inReplyTo: opts.inReplyTo,
      references: opts.references,
      attachments: opts.attachments,
    });
    return { ...sent, trackingToken };
  } catch (lastErr) {
    if (sender.resendApiKey) {
      const sent = await sendViaUserResend(sender, sendOpts);
      return { ...sent, trackingToken };
    }
    throw new Error(formatSmtpError(lastErr));
  }
}

/** Build an HTML body that appends the open-tracking pixel. */
function withTrackingPixel(text: string, html: string | undefined, token: string) {
  const base = appBaseUrl();
  const pixel =
    `<img src="${base}/api/email/open?t=${encodeURIComponent(token)}" ` +
    `width="1" height="1" alt="" style="display:none;width:1px;height:1px" />`;
  if (html && html.trim()) return `${html}${pixel}`;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111">` +
    escaped +
    `</div>${pixel}`
  );
}

/** @deprecated Use sendOutboundEmail */
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
  return sendOutboundEmail(opts);
}

/** SMTP credentials for connection test (custom SMTP mode only). */
export async function getUserSmtpConfig(
  userId: string,
  accountId?: string | null,
): Promise<SmtpPayload | null> {
  const sender = await getUserSenderConfig(userId, accountId);
  return sender?.smtp ?? null;
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
  resendApiKeyEnc?: string;
  deliveryMode?: string | null;
  sendWeight?: number;
}) {
  const deliveryMode = inferDeliveryMode(row);
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
    deliveryMode,
    sendWeight: row.sendWeight ?? 1,
    hasPassword: deliveryMode === "smtp" && Boolean(row.passwordEnc),
    hasResendKey: isResendDelivery(deliveryMode) && Boolean(row.resendApiKeyEnc?.trim()),
  };
}
