import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto-secret";
import { assertPublicSmtpHost } from "@/lib/safe-fetch";
import {
  formatSmtpError,
  normalizeSmtpSecurity,
  type SenderConfig,
  type SmtpPayload,
} from "@/lib/user-smtp";

export type HostingerMailboxSeed = {
  name: string;
  email: string;
  pass: string;
  domain: string;
};

/**
 * 25 Hostinger Mailboxes across 5 domains
 * Host: smtp.hostinger.com | Port: 465 (SSL)
 */
export const HOSTINGER_DEFAULT_MAILBOXES: HostingerMailboxSeed[] = [
  // 1. roofingagency.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingagency.us",
    pass: "7p+zii>=prC",
    domain: "roofingagency.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofingagency.us",
    pass: ";7tTw7=lUz",
    domain: "roofingagency.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofingagency.us",
    pass: "6sYsTSO?",
    domain: "roofingagency.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofingagency.us",
    pass: "fuZo^Ssh2;W",
    domain: "roofingagency.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingagency.us",
    pass: "P1>>>#CVfCu",
    domain: "roofingagency.us",
  },

  // 2. roofinggrowth.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofinggrowth.us",
    pass: "p/mzZuB:7",
    domain: "roofinggrowth.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofinggrowth.us",
    pass: "~@JyD0$5b8&R",
    domain: "roofinggrowth.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofinggrowth.us",
    pass: "quG=+pFp4To;",
    domain: "roofinggrowth.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofinggrowth.us",
    pass: "Sw097y#yQxx+",
    domain: "roofinggrowth.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofinggrowth.us",
    pass: "3jhzodD:",
    domain: "roofinggrowth.us",
  },

  // 3. roofingmedia.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingmedia.us",
    pass: "4!d=?8FZq;",
    domain: "roofingmedia.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingmedia.us",
    pass: "f?M5Dim/",
    domain: "roofingmedia.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofingmedia.us",
    pass: "Wmy6tl?bi7:2",
    domain: "roofingmedia.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofingmedia.us",
    pass: "ryjt7~Be",
    domain: "roofingmedia.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofingmedia.us",
    pass: "5m>FFsvo",
    domain: "roofingmedia.us",
  },

  // 4. roofingpartners.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingpartners.us",
    pass: "m~16B>z^eQ2",
    domain: "roofingpartners.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofingpartners.us",
    pass: "5;T+N5KLt!",
    domain: "roofingpartners.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingpartners.us",
    pass: "Zd6ygm+w~",
    domain: "roofingpartners.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofingpartners.us",
    pass: "w#W8;H8B$~",
    domain: "roofingpartners.us",
  },
  {
    name: "Daniel Brooks",
    email: "daniel@roofingpartners.us",
    pass: "D?x5>xeT>1l",
    domain: "roofingpartners.us",
  },

  // 5. roofingclients.us (5)
  {
    name: "Gaurav Kapoor",
    email: "gaurav@roofingclients.us",
    pass: "iRR$zYmhuP0@",
    domain: "roofingclients.us",
  },
  {
    name: "Ethan Carter",
    email: "ethan@roofingclients.us",
    pass: "S!HSd2;6:bT",
    domain: "roofingclients.us",
  },
  {
    name: "Frank Miller",
    email: "frank@roofingclients.us",
    pass: "0b>9*Xx1",
    domain: "roofingclients.us",
  },
  {
    name: "Jake Wilson",
    email: "jake@roofingclients.us",
    pass: "?3KAJ~~ef",
    domain: "roofingclients.us",
  },
  {
    name: "Ryan Cooper",
    email: "ryan@roofingclients.us",
    pass: "/Q>rvne5uA",
    domain: "roofingclients.us",
  },
];

const DEFAULT_HOSTINGER_HOST = "smtp.hostinger.com";
const DEFAULT_HOSTINGER_PORT = 465;

export type SystemSmtpRow = {
  id: string;
  label: string;
  domain: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string | null;
  enabled: boolean;
  isDefault: boolean;
  sendWeight: number;
  lastTestedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    emails: number;
  };
};

/** Seed / Upsert the 25 Hostinger mailboxes in database */
export async function seedHostingerMailboxes(forceUpdatePasswords = true) {
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of HOSTINGER_DEFAULT_MAILBOXES) {
    const existing = await prisma.systemSmtpAccount.findUnique({
      where: { fromEmail: item.email.toLowerCase().trim() },
    });

    const passwordEnc = encryptSecret(item.pass);

    if (!existing) {
      await prisma.systemSmtpAccount.create({
        data: {
          label: `${item.name} (${item.domain})`,
          domain: item.domain.toLowerCase().trim(),
          host: DEFAULT_HOSTINGER_HOST,
          port: DEFAULT_HOSTINGER_PORT,
          secure: true,
          username: item.email.toLowerCase().trim(),
          passwordEnc,
          fromEmail: item.email.toLowerCase().trim(),
          fromName: item.name,
          enabled: true,
          isDefault: false,
          sendWeight: 1,
        },
      });
      createdCount++;
    } else if (forceUpdatePasswords) {
      await prisma.systemSmtpAccount.update({
        where: { id: existing.id },
        data: {
          label: `${item.name} (${item.domain})`,
          domain: item.domain.toLowerCase().trim(),
          host: DEFAULT_HOSTINGER_HOST,
          port: DEFAULT_HOSTINGER_PORT,
          secure: true,
          username: item.email.toLowerCase().trim(),
          passwordEnc,
          fromName: item.name,
        },
      });
      updatedCount++;
    }
  }

  return { createdCount, updatedCount, total: HOSTINGER_DEFAULT_MAILBOXES.length };
}

/** Check if seeding is required and seed if empty */
export async function ensureSystemSmtpSeeded() {
  try {
    const count = await prisma.systemSmtpAccount.count();
    if (count === 0) {
      await seedHostingerMailboxes(false);
    }
  } catch {
    // Database might not be ready or reachable at boot, ignore gracefully
  }
}

/** List all system SMTP accounts for super admin or sender pools */
export async function listSystemSmtpAccounts(options?: { onlyEnabled?: boolean }) {
  await ensureSystemSmtpSeeded();
  const where = options?.onlyEnabled ? { enabled: true } : {};
  return prisma.systemSmtpAccount.findMany({
    where,
    orderBy: [{ domain: "asc" }, { fromName: "asc" }, { fromEmail: "asc" }],
    include: {
      _count: {
        select: { emails: true },
      },
    },
  });
}

/** Convert a SystemSmtpAccount to SmtpPayload */
export function systemRowToPayload(row: {
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
  let password = "";
  try {
    password = decryptSecret(row.passwordEnc);
  } catch {
    password = "";
  }
  const known = HOSTINGER_DEFAULT_MAILBOXES.find(
    (m) =>
      m.email.toLowerCase() === row.username.toLowerCase() ||
      m.email.toLowerCase() === row.fromEmail.toLowerCase(),
  );
  const host = known ? "smtp.hostinger.com" : (row.host?.trim() || "smtp.hostinger.com");
  const port = known ? 465 : (row.port || 465);
  const secure = known ? true : (row.secure ?? true);
  if (known?.pass) {
    password = known.pass;
  }
  return {
    id: row.id,
    label: row.label,
    host,
    port,
    secure,
    username: row.username,
    password,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
  };
}

/** Convert a SystemSmtpAccount to SenderConfig */
export function systemRowToSenderConfig(row: {
  id: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordEnc: string;
  fromEmail: string;
  fromName: string | null;
}): SenderConfig {
  return {
    id: row.id,
    label: row.label,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    deliveryMode: "smtp",
    smtp: systemRowToPayload(row),
    isSystem: true,
    systemSmtpAccountId: row.id,
  };
}

/** Get a specific system sender configuration by ID or email */
export async function getSystemSenderConfig(
  idOrEmail: string,
): Promise<SenderConfig | null> {
  const row = await prisma.systemSmtpAccount.findFirst({
    where: {
      OR: [{ id: idOrEmail }, { fromEmail: idOrEmail.toLowerCase().trim() }],
      enabled: true,
    },
  });
  if (!row) return null;
  return systemRowToSenderConfig(row);
}

/**
 * Pick a system sender via weighted round-robin distribution across active Hostinger accounts.
 */
export async function pickSystemRotationSender(): Promise<SenderConfig | null> {
  await ensureSystemSmtpSeeded();
  const accounts = await prisma.systemSmtpAccount.findMany({
    where: { enabled: true },
    orderBy: [{ domain: "asc" }, { createdAt: "asc" }],
  });
  if (!accounts.length) return null;

  const totalWeight = accounts.reduce(
    (sum, a) => sum + Math.max(1, a.sendWeight),
    0,
  );

  const recent = await prisma.leadEmail.groupBy({
    by: ["systemSmtpAccountId"],
    where: { direction: "outbound", systemSmtpAccountId: { not: null } },
    _count: { _all: true },
  });

  const recentMap = new Map<string, number>(
    recent
      .filter((r) => r.systemSmtpAccountId)
      .map((r) => [r.systemSmtpAccountId as string, r._count._all]),
  );

  const totalSends = Array.from(recentMap.values()).reduce((a, b) => a + b, 0);

  if (totalSends === 0) {
    const pick = accounts[Math.floor(Math.random() * accounts.length)];
    return systemRowToSenderConfig(pick);
  }

  let bestAccount = accounts[0];
  let biggestDeficit = -Infinity;

  for (const acc of accounts) {
    const weight = Math.max(1, acc.sendWeight);
    const desiredShare = weight / totalWeight;
    const actualShare = (recentMap.get(acc.id) ?? 0) / totalSends;
    const deficit = desiredShare - actualShare;
    if (deficit > biggestDeficit) {
      biggestDeficit = deficit;
      bestAccount = acc;
    }
  }

  return systemRowToSenderConfig(bestAccount);
}

/** Test an SMTP connection */
export async function testSmtpConnection(payload: SmtpPayload): Promise<{ ok: boolean; message: string }> {
  try {
    await assertPublicSmtpHost(payload.host);
    const { port, secure } = normalizeSmtpSecurity(payload.port, payload.secure);
    const transport = nodemailer.createTransport({
      host: payload.host.trim(),
      port,
      secure,
      requireTLS: port === 587,
      auth: {
        user: payload.username.trim(),
        pass: payload.password,
      },
      connectionTimeout: 15_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
      tls: {
        minVersion: "TLSv1.2",
        servername: payload.host.trim(),
      },
    });

    await transport.verify();
    return { ok: true, message: "Hostinger SMTP connection verified successfully" };
  } catch (e) {
    return { ok: false, message: formatSmtpError(e) };
  }
}

/** Test a stored system SMTP account */
export async function testSystemSmtpAccount(id: string) {
  const account = await prisma.systemSmtpAccount.findUnique({ where: { id } });
  if (!account) throw new Error("Account not found");

  const payload = systemRowToPayload(account);
  const result = await testSmtpConnection(payload);

  if (result.ok) {
    await prisma.systemSmtpAccount.update({
      where: { id },
      data: { lastTestedAt: new Date() },
    });
  }

  return result;
}

/** Mask system SMTP account for display in admin or user UI */
export function maskSystemSmtpAccount(row: {
  id: string;
  label: string;
  domain: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string | null;
  enabled: boolean;
  isDefault: boolean;
  sendWeight: number;
  lastTestedAt: Date | null;
  createdAt: Date;
  _count?: { emails: number };
}) {
  return {
    id: row.id,
    label: row.label || `${row.fromName || row.fromEmail} (${row.domain})`,
    domain: row.domain,
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    enabled: row.enabled,
    isDefault: row.isDefault,
    sendWeight: row.sendWeight,
    lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    emailsSent: row._count?.emails ?? 0,
    isSystem: true,
  };
}
