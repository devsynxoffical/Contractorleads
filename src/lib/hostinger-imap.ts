import { ImapFlow } from "imapflow";
import { prisma } from "@/lib/prisma";
import { HOSTINGER_DEFAULT_MAILBOXES } from "@/lib/system-smtp";
import { ingestInboundEmail } from "@/lib/lead-email";
import { cleanEmailBody } from "@/lib/email-content";

export type ImapSyncResult = {
  mailbox: string;
  synced: number;
  error?: string;
};

export async function syncMailboxImap(opts: {
  userId: string;
  email: string;
  pass: string;
  limit?: number;
}): Promise<ImapSyncResult> {
  const email = opts.email.toLowerCase().trim();
  const limit = opts.limit ?? 20;

  const client = new ImapFlow({
    host: "imap.hostinger.com",
    port: 993,
    secure: true,
    auth: {
      user: email,
      pass: opts.pass,
    },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  let synced = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for unseen or recent messages
      const messages = client.fetch(
        { seq: "1:*" },
        { envelope: true, source: true, bodyStructure: true },
      );

      for await (const msg of messages) {
        const messageId = msg.envelope?.messageId;
        const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase().trim();
        const toAddr = msg.envelope?.to?.[0]?.address?.toLowerCase().trim() || email;
        const subject = msg.envelope?.subject || "(no subject)";
        const date = msg.envelope?.date || new Date();

        if (!fromAddr || fromAddr === email) {
          // Skip if from self
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

        // Parse text body from source
        let bodyText = "";
        if (msg.source) {
          const raw = msg.source.toString("utf-8");
          bodyText = cleanEmailBody(raw);
        }
        if (!bodyText.trim()) {
          bodyText = `Received message from ${fromAddr}: "${subject}"`;
        }

        await ingestInboundEmail({
          userId: opts.userId,
          fromEmail: fromAddr,
          toEmail: toAddr,
          subject,
          body: bodyText,
          messageId: messageId || undefined,
          inReplyTo: msg.envelope?.inReplyTo || undefined,
        });

        synced++;
        if (synced >= limit) break;
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return { mailbox: email, synced };
  } catch (err) {
    return {
      mailbox: email,
      synced,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Sync all Hostinger mailboxes for a user */
export async function syncUserHostingerMailboxes(userId: string): Promise<{
  totalSynced: number;
  results: ImapSyncResult[];
}> {
  // 1. Get user's assigned SMTP accounts
  const userAccounts = await prisma.smtpAccount.findMany({
    where: { userId, enabled: true },
  });

  const mailboxesToSync: Array<{ email: string; pass: string }> = [];

  for (const acc of userAccounts) {
    const known = HOSTINGER_DEFAULT_MAILBOXES.find(
      (m) =>
        m.email.toLowerCase() === acc.fromEmail.toLowerCase() ||
        m.email.toLowerCase() === acc.username.toLowerCase(),
    );
    if (known) {
      mailboxesToSync.push({ email: known.email, pass: known.pass });
    }
  }

  // If no specific accounts assigned, sync all default Hostinger mailboxes
  if (!mailboxesToSync.length) {
    for (const m of HOSTINGER_DEFAULT_MAILBOXES) {
      mailboxesToSync.push({ email: m.email, pass: m.pass });
    }
  }

  let totalSynced = 0;
  const results: ImapSyncResult[] = [];

  // Sync mailboxes in parallel concurrently for high-speed performance
  const settled = await Promise.allSettled(
    mailboxesToSync.slice(0, 15).map((mb) =>
      syncMailboxImap({
        userId,
        email: mb.email,
        pass: mb.pass,
        limit: 10,
      }),
    ),
  );

  for (const s of settled) {
    if (s.status === "fulfilled") {
      results.push(s.value);
      totalSynced += s.value.synced;
    }
  }

  return { totalSynced, results };
}
