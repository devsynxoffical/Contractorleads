import { ImapFlow } from "imapflow";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto-secret";
import { HOSTINGER_DEFAULT_MAILBOXES, GODADDY_DEFAULT_MAILBOXES } from "@/lib/system-smtp";
import { ingestInboundEmail } from "@/lib/lead-email";
import { ADMIN_STAFF_ROLES, OWNER_EMAIL } from "@/lib/roles";

export type ImapSyncResult = {
  mailbox: string;
  provider?: string;
  synced: number;
  totalInBox?: number;
  error?: string;
};

export type SyncMailboxOptions = {
  userId: string;
  email: string;
  pass: string;
  host?: string;
  port?: number;
  secure?: boolean;
  provider?: string;
  limit?: number;
  fetchAll?: boolean;
  systemSmtpAccountId?: string;
  smtpAccountId?: string;
};

/**
 * Determine default IMAP host and port based on email domain and provider
 */
export function getImapConfig(opts: {
  email: string;
  host?: string;
  port?: number;
  secure?: boolean;
  provider?: string;
}): { host: string; port: number; secure: boolean } {
  const email = opts.email.toLowerCase().trim();
  const rawHost = (opts.host || "").toLowerCase().trim();
  const provider = (opts.provider || "").toLowerCase().trim();

  // 1. GoDaddy check
  if (
    provider === "godaddy" ||
    rawHost.includes("secureserver.net") ||
    rawHost.includes("godaddy") ||
    GODADDY_DEFAULT_MAILBOXES.some((m) => m.email.toLowerCase() === email)
  ) {
    return {
      host: "imap.secureserver.net",
      port: 993,
      secure: true,
    };
  }

  // 2. Hostinger check
  if (
    provider === "hostinger" ||
    rawHost.includes("hostinger") ||
    HOSTINGER_DEFAULT_MAILBOXES.some((m) => m.email.toLowerCase() === email)
  ) {
    return {
      host: "imap.hostinger.com",
      port: 993,
      secure: true,
    };
  }

  // 3. Google Workspace / Gmail
  if (rawHost.includes("gmail") || rawHost.includes("google") || email.endsWith("@gmail.com")) {
    return {
      host: "imap.gmail.com",
      port: 993,
      secure: true,
    };
  }

  // 4. Microsoft Outlook / Office365
  if (rawHost.includes("office365") || rawHost.includes("outlook") || rawHost.includes("live.com")) {
    return {
      host: "outlook.office365.com",
      port: 993,
      secure: true,
    };
  }

  // 5. If user provided a host with smtp.* replace with imap.*
  if (rawHost.startsWith("smtp.")) {
    return {
      host: rawHost.replace(/^smtp\./, "imap."),
      port: opts.port === 465 || opts.port === 993 ? 993 : (opts.port || 993),
      secure: opts.secure !== false,
    };
  }

  if (rawHost) {
    return {
      host: rawHost,
      port: opts.port || 993,
      secure: opts.secure !== false,
    };
  }

  // Default fallback to hostinger
  return {
    host: "imap.hostinger.com",
    port: 993,
    secure: true,
  };
}

/**
 * Sync a single mailbox over IMAP
 */
export async function syncMailboxImap(opts: SyncMailboxOptions): Promise<ImapSyncResult> {
  const email = opts.email.toLowerCase().trim();
  const limit = Math.max(1, Math.min(200, opts.limit ?? 50));
  const imapConfig = getImapConfig(opts);

  const client = new ImapFlow({
    host: imapConfig.host,
    port: imapConfig.port,
    secure: imapConfig.secure,
    auth: {
      user: email,
      pass: opts.pass,
    },
    logger: false,
    tls: { rejectUnauthorized: false },
    clientInfo: { name: "LeadFlow-InboundSync", version: "2.0" },
  });

  let synced = 0;
  let totalInBox = 0;

  try {
    // 10-second connect timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`IMAP timeout (${imapConfig.host}:993)`)), 10000),
    );
    await Promise.race([connectPromise, timeoutPromise]);

    const lock = await client.getMailboxLock("INBOX");

    try {
      const status = await client.status("INBOX", { messages: true, unseen: true });
      totalInBox = status.messages || 0;

      if (totalInBox > 0) {
        // Calculate fetch range
        const startSeq = opts.fetchAll ? 1 : Math.max(1, totalInBox - limit + 1);
        const fetchRange = `${startSeq}:${totalInBox}`;

        const messages = client.fetch(
          fetchRange,
          { envelope: true, source: true, bodyStructure: true, internalDate: true },
        );

        for await (const msg of messages) {
          try {
            const messageId = msg.envelope?.messageId;
            const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase().trim();
            const toAddr = msg.envelope?.to?.[0]?.address?.toLowerCase().trim() || email;
            const subject = msg.envelope?.subject || "(no subject)";
            const date = msg.envelope?.date || msg.internalDate || new Date();

            // Skip messages sent from self
            if (!fromAddr || fromAddr === email) {
              continue;
            }

            // Check if message was already ingested
            const existing = await prisma.leadEmail.findFirst({
              where: {
                userId: opts.userId,
                direction: "inbound",
                OR: [
                  ...(messageId ? [{ messageId }] : []),
                  {
                    fromEmail: fromAddr,
                    toEmail: toAddr,
                    subject,
                    createdAt: {
                      gte: new Date(new Date(date).getTime() - 60000),
                      lte: new Date(new Date(date).getTime() + 60000),
                    },
                  },
                ],
              },
            });

            if (existing) continue;

            // Parse text body with mailparser
            let bodyText = "";
            let parsedSubject = subject;
            if (msg.source) {
              try {
                const { simpleParser } = await import("mailparser");
                const parsed = await simpleParser(msg.source);
                bodyText =
                  parsed.text ||
                  (typeof parsed.html === "string"
                    ? parsed.html.replace(/<[^>]+>/g, " ")
                    : "") ||
                  "";
                if (parsed.subject && (!parsedSubject || parsedSubject === "(no subject)")) {
                  parsedSubject = parsed.subject;
                }
              } catch {
                const raw = msg.source.toString("utf-8");
                const parts = raw.split(/\r?\n\r?\n/);
                bodyText = parts.slice(1).join("\n").replace(/<[^>]+>/g, " ").slice(0, 4000);
              }
            }
            if (!bodyText.trim()) {
              bodyText = `Received email from ${fromAddr}: "${parsedSubject}"`;
            }

            await ingestInboundEmail({
              userId: opts.userId,
              fromEmail: fromAddr,
              toEmail: toAddr,
              subject: parsedSubject,
              body: bodyText.trim().slice(0, 5000),
              messageId: messageId || undefined,
              inReplyTo: msg.envelope?.inReplyTo || undefined,
              systemSmtpAccountId: opts.systemSmtpAccountId || undefined,
              smtpAccountId: opts.smtpAccountId || undefined,
              receivedAt: new Date(date),
            });

            synced++;
          } catch {
            /* continue to next message */
          }
        }
      }
    } finally {
      lock.release();
    }

    try {
      await client.logout();
    } catch {
      /* ignore close errors */
    }

    return { mailbox: email, provider: opts.provider, synced, totalInBox };
  } catch (err) {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    return {
      mailbox: email,
      provider: opts.provider,
      synced,
      totalInBox,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sync all assigned / authorized mailboxes for a user (Hostinger, GoDaddy, and custom SMTP)
 */
export async function syncUserInboxes(
  userId: string,
  opts?: { fetchAll?: boolean; limitPerMailbox?: number },
): Promise<{
  totalSynced: number;
  results: ImapSyncResult[];
  mailboxesCount: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!user) {
    return { totalSynced: 0, results: [], mailboxesCount: 0 };
  }

  const role = (user.role || "").toUpperCase();
  const isSuperAdmin =
    role === "OWNER" ||
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "MANAGER" ||
    role === "SUB_ADMIN" ||
    user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() ||
    ADMIN_STAFF_ROLES.includes(role as any);

  // 1. Fetch system SMTP accounts
  // Super admins sync all system mailboxes; regular users only sync accounts assigned directly to them.
  let systemAccounts = await prisma.systemSmtpAccount.findMany({
    where: isSuperAdmin
      ? { enabled: true }
      : { assignedUserId: userId, enabled: true },
  });

  // If superadmin has 0 system accounts in DB, ensure seed
  if (isSuperAdmin && systemAccounts.length === 0) {
    try {
      const { seedSystemMailboxes } = await import("@/lib/system-smtp");
      await seedSystemMailboxes(false);
      systemAccounts = await prisma.systemSmtpAccount.findMany({
        where: { enabled: true },
      });
    } catch {
      /* fallback to seeds */
    }
  }

  // 2. Fetch custom user SMTP accounts
  const userAccounts = await prisma.smtpAccount.findMany({
    where: { userId, enabled: true },
  });

  const mailboxesToSync: SyncMailboxOptions[] = [];

  // Add system accounts
  for (const acc of systemAccounts) {
    let password = "";
    if (acc.passwordEnc) {
      password = decryptSecret(acc.passwordEnc);
    }
    if (!password) {
      const knownGodaddy = GODADDY_DEFAULT_MAILBOXES.find(
        (m) => m.email.toLowerCase() === acc.fromEmail.toLowerCase(),
      );
      if (knownGodaddy) password = knownGodaddy.pass;
      const knownHostinger = HOSTINGER_DEFAULT_MAILBOXES.find(
        (m) => m.email.toLowerCase() === acc.fromEmail.toLowerCase(),
      );
      if (knownHostinger) password = knownHostinger.pass;
    }

    if (password) {
      mailboxesToSync.push({
        userId,
        email: acc.fromEmail,
        pass: password,
        provider: acc.provider || (acc.domain?.includes("frank") ? "godaddy" : "hostinger"),
        systemSmtpAccountId: acc.id,
        limit: opts?.limitPerMailbox ?? 50,
        fetchAll: opts?.fetchAll ?? true,
      });
    }
  }

  // Add user custom accounts
  for (const acc of userAccounts) {
    if (acc.deliveryMode === "smtp" && acc.passwordEnc) {
      const pass = decryptSecret(acc.passwordEnc);
      if (pass && acc.fromEmail) {
        mailboxesToSync.push({
          userId,
          email: acc.fromEmail,
          pass,
          host: acc.host,
          port: acc.port,
          secure: acc.secure,
          smtpAccountId: acc.id,
          limit: opts?.limitPerMailbox ?? 50,
          fetchAll: opts?.fetchAll ?? true,
        });
      }
    }
  }

  // If superadmin and still no accounts loaded from DB, fallback to full in-memory seed list
  if (!mailboxesToSync.length && isSuperAdmin) {
    for (const m of GODADDY_DEFAULT_MAILBOXES) {
      mailboxesToSync.push({
        userId,
        email: m.email,
        pass: m.pass,
        provider: "godaddy",
        limit: opts?.limitPerMailbox ?? 30,
        fetchAll: opts?.fetchAll ?? true,
      });
    }
    for (const m of HOSTINGER_DEFAULT_MAILBOXES) {
      mailboxesToSync.push({
        userId,
        email: m.email,
        pass: m.pass,
        provider: "hostinger",
        limit: opts?.limitPerMailbox ?? 30,
        fetchAll: opts?.fetchAll ?? true,
      });
    }
  }

  let totalSynced = 0;
  const results: ImapSyncResult[] = [];

  // Run in concurrent chunks of 8 mailboxes for fast throughput
  const CHUNK_SIZE = 8;
  for (let i = 0; i < mailboxesToSync.length; i += CHUNK_SIZE) {
    const chunk = mailboxesToSync.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(chunk.map((mb) => syncMailboxImap(mb)));
    for (const res of chunkResults) {
      results.push(res);
      totalSynced += res.synced;
    }
  }

  return {
    totalSynced,
    results,
    mailboxesCount: mailboxesToSync.length,
  };
}
