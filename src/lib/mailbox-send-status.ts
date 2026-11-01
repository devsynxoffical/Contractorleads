import { prisma } from "@/lib/prisma";

/** Turn a raw relay / SMTP error into a short reason a user can act on. */
export function summarizeSendError(raw: string): string {
  const e = raw || "";
  if (/\b535\b|auth(entication)? failed|invalid login|username and password/i.test(e)) {
    return "Login failed: the mailbox password saved for sending is wrong. Update it in hosting and here.";
  }
  if (/aborted|timed? ?out|ETIMEDOUT/i.test(e)) return "The mail relay did not answer in time.";
  if (/Unauthorized|relay token/i.test(e)) return "The mail relay rejected the app's relay token.";
  if (/\b404\b/.test(e)) return "The mail relay (mailer.php) was not found at its address.";
  if (/\b55\d\b|mailbox (unavailable|not found)|user unknown/i.test(e)) return "The recipient server rejected the message.";
  return e.slice(0, 200);
}

/**
 * Record the outcome of a real send attempt for a mailbox, so the Email Accounts page can
 * show "Sending failed" instead of a healthy score. Never throws: status tracking must not
 * break sending.
 */
export async function recordMailboxSendResult(mailboxEmail: string, ok: boolean, error?: string) {
  const email = (mailboxEmail || "").toLowerCase().trim();
  if (!email.includes("@")) return;
  const now = new Date();
  try {
    const date = now.toISOString().split("T")[0];
    await prisma.mailboxDailyStat.upsert({
      where: { mailboxEmail_date: { mailboxEmail: email, date } },
      update: ok ? { sendOk: { increment: 1 } } : { sendFailures: { increment: 1 } },
      create: { mailboxEmail: email, date, sendOk: ok ? 1 : 0, sendFailures: ok ? 0 : 1 },
    });
  } catch {
    // ignore
  }
  try {
    const existing = await prisma.warmupSettings.findUnique({ where: { mailboxEmail: email } });
    if (existing) {
      await prisma.warmupSettings.update({
        where: { mailboxEmail: email },
        data: ok
          ? { lastSendOkAt: now, consecutiveSendFailures: 0 }
          : {
              lastSendErrorAt: now,
              lastSendError: summarizeSendError(error || ""),
              consecutiveSendFailures: { increment: 1 },
            },
      });
      return;
    }
    // First record for this mailbox: keep its current warmup on/off state so creating the
    // row does not switch warmup on for a mailbox where it was turned off.
    const system = await prisma.systemSmtpAccount.findFirst({
      where: { fromEmail: { equals: email, mode: "insensitive" } },
      select: { warmupEnabled: true },
    });
    await prisma.warmupSettings.create({
      data: {
        mailboxEmail: email,
        enabled: system ? system.warmupEnabled : true,
        weekdaysOnly: false,
        startedAt: new Date(),
        ...(ok
          ? { lastSendOkAt: now }
          : { lastSendErrorAt: now, lastSendError: summarizeSendError(error || ""), consecutiveSendFailures: 1 }),
      },
    });
  } catch {
    // ignore: a lost status update is better than a failed send
  }
}
