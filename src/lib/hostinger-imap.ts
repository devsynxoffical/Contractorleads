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
  const limit = opts.limit ?? 10;

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

  // Critical: Attach error listener immediately so socket drop never crashes the Node process
  client.on("error", () => {});

  let synced = 0;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("IMAP timeout")), 4000),
    );

    const syncWork = async () => {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        const total = (client.mailbox as { exists?: number })?.exists || 0;
        if (total === 0) return;

        const startSeq = Math.max(1, total - Math.min(limit, 10) + 1);
        const messages = client.fetch(
          { seq: `${startSeq}:*` },
          { envelope: true, source: true },
        );

        for await (const msg of messages) {
          const messageId = msg.envelope?.messageId;
          const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase().trim();
          const toAddr = msg.envelope?.to?.[0]?.address?.toLowerCase().trim() || email;
          const subject = msg.envelope?.subject || "(no subject)";
          const date = msg.envelope?.date || new Date();

          if (!fromAddr || fromAddr === email) continue;

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
        }
      } finally {
        lock.release();
        await client.logout().catch(() => {});
      }
    };

    await Promise.race([syncWork(), timeoutPromise]);
    return { mailbox: email, synced };
  } catch (err) {
    try {
      await client.logout().catch(() => {});
    } catch {
      // ignore
    }
    return {
      mailbox: email,
      synced,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Sync all Hostinger mailboxes for a user safely in small batches */
export async function syncUserHostingerMailboxes(userId: string): Promise<{
  totalSynced: number;
  results: ImapSyncResult[];
}> {
  try {
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

    if (!mailboxesToSync.length) {
      for (const m of HOSTINGER_DEFAULT_MAILBOXES) {
        mailboxesToSync.push({ email: m.email, pass: m.pass });
      }
    }

    let totalSynced = 0;
    const results: ImapSyncResult[] = [];

    // Process in batches of 3 concurrently to preserve container stability
    const targets = mailboxesToSync.slice(0, 10);
    for (let i = 0; i < targets.length; i += 3) {
      const batch = targets.slice(i, i + 3);
      const settled = await Promise.allSettled(
        batch.map((mb) =>
          syncMailboxImap({
            userId,
            email: mb.email,
            pass: mb.pass,
            limit: 5,
          }),
        ),
      );

      for (const s of settled) {
        if (s.status === "fulfilled") {
          results.push(s.value);
          totalSynced += s.value.synced;
        }
      }
    }

    return { totalSynced, results };
  } catch (err) {
    return {
      totalSynced: 0,
      results: [{ mailbox: "all", synced: 0, error: String(err) }],
    };
  }
}
