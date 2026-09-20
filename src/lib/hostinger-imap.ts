import { ImapFlow } from "imapflow";
import { prisma } from "@/lib/prisma";
import { HOSTINGER_DEFAULT_MAILBOXES } from "@/lib/system-smtp";
import { ingestInboundEmail } from "@/lib/lead-email";

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
          bodyText = `Received message from ${fromAddr}: "${parsedSubject}"`;
        }

        await ingestInboundEmail({
          userId: opts.userId,
          fromEmail: fromAddr,
          toEmail: toAddr,
          subject: parsedSubject,
          body: bodyText.trim().slice(0, 5000),
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

  // Sync up to 5 mailboxes concurrently
  for (const mb of mailboxesToSync.slice(0, 10)) {
    const res = await syncMailboxImap({
      userId,
      email: mb.email,
      pass: mb.pass,
      limit: 10,
    });
    results.push(res);
    totalSynced += res.synced;
  }

  return { totalSynced, results };
}
