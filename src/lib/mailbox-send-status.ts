import { prisma } from "@/lib/prisma";

/** Clear a mailbox's failure state after a successful connection test or credential fix. */
export async function clearMailboxFailure(mailboxEmail: string) {
  const email = (mailboxEmail || "").toLowerCase().trim();
  await prisma.warmupSettings
    .updateMany({
      where: { mailboxEmail: email },
      data: { consecutiveSendFailures: 0, lastSendErrorAt: null, lastSendError: null, lastSendErrorRaw: null },
    })
    .catch(() => {});
}

export type MailboxProblem =
  | "wrong_password"
  | "server_unreachable"
  | "relay_unreachable"
  | "relay_token"
  | "recipient_rejected"
  | "unknown";

export type MailboxDiagnosis = {
  problem: MailboxProblem;
  title: string;
  explanation: string;
  steps: string[];
  /** Show the password / login form */
  canUpdatePassword: boolean;
  /** Show host / port fields */
  canEditServer: boolean;
};

/**
 * Classify a raw relay / SMTP error and say what the user can do about it.
 * Order matters: an SMTP auth error inside a relay response is a password problem,
 * not a relay problem.
 */
export function diagnoseMailboxError(
  raw: string | null | undefined,
  opts: { admin?: boolean } = {},
): MailboxDiagnosis {
  const e = raw || "";
  // Platform-side sending problems: users get a plain message, admins get the technical steps.
  const platformDown = (adminSteps: string[]): MailboxDiagnosis => ({
    problem: /Unauthorized|relay token|invalid token/i.test(e) ? "relay_token" : "relay_unreachable",
    title: "Sending service temporarily unavailable",
    explanation: opts.admin
      ? "The sending gateway did not accept or answer the request. This affects every mailbox, not just this one."
      : "This is a problem on our side, not with your mailbox, and it affects all mailboxes. Your settings are fine.",
    steps: opts.admin
      ? adminSteps
      : ["Wait a few minutes, then click Re-test.", "If it still fails after an hour, contact support."],
    canUpdatePassword: false,
    canEditServer: false,
  });
  if (/\b535\b|\b534\b|auth(entication)? failed|invalid (login|credentials)|username and password|authentication unsuccessful/i.test(e)) {
    return {
      problem: "wrong_password",
      title: "Wrong password or username",
      explanation: "The mail server rejected the login for this mailbox, so nothing can be sent from it.",
      steps: [
        "Open your email host (Hostinger hPanel → Emails, or GoDaddy → Email & Office) and check or reset this mailbox's password.",
        "Enter the same password below and click Test & save.",
        "If you just changed it at the host, wait a minute before testing.",
      ],
      canUpdatePassword: true,
      canEditServer: true,
    };
  }
  if (/Unauthorized|relay token|invalid token/i.test(e)) {
    return platformDown([
      "The gateway rejected the app's token: HOSTINGER_RELAY_SECRET in Railway must match the token in the deployed mailer.php.",
      "Redeploy after changing it, then click Re-test.",
    ]);
  }
  const serverUnreachable: MailboxDiagnosis = {
    problem: "server_unreachable",
    title: "Mail server not reachable",
    explanation: "We could not connect to this mailbox's SMTP server. The server name or port is usually wrong.",
    steps: [
      "Hostinger: server smtp.hostinger.com, port 465.",
      "GoDaddy: server smtpout.secureserver.net, port 465.",
      "Microsoft 365: server smtp.office365.com, port 587.",
      "Correct the server and port below and click Test & save.",
    ],
    canUpdatePassword: true,
    canEditServer: true,
  };
  // The gateway answered, but could not reach the mailbox's own SMTP server.
  if (/SMTP socket connection failed|STARTTLS failed|Could not connect to the SMTP/i.test(e)) {
    return serverUnreachable;
  }
  // The gateway itself did not answer (missing, offline, timed out).
  if (
    /mailer\.php|relay|gateway|sending service/i.test(e) &&
    /\b404\b|not found|fetch failed|ECONNREFUSED|ENOTFOUND|aborted|unreachable|timed? ?out|status 5\d\d/i.test(e)
  ) {
    return platformDown([
      "The gateway did not answer. Check that the current mailer.php is uploaded to the relay site's public_html and that the site is online.",
      "If the relay lives at another URL, set HOSTINGER_RELAY_URL in Railway, then click Re-test.",
    ]);
  }
  if (/socket|connection (failed|timeout|refused)|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|timed? ?out/i.test(e)) {
    return serverUnreachable;
  }
  if (/\b55\d\b|mailbox (unavailable|not found)|user unknown|recipient/i.test(e)) {
    return {
      problem: "recipient_rejected",
      title: "Recipient rejected the email",
      explanation: "The mailbox itself works; the receiving server refused one message. Usually a bad recipient address.",
      steps: ["No change is needed on this mailbox. Click Re-test to clear the warning."],
      canUpdatePassword: false,
      canEditServer: false,
    };
  }
  return {
    problem: "unknown",
    title: "Sending failed",
    explanation: e ? `The last attempt failed with: ${e.slice(0, 240)}` : "The last send attempt failed.",
    steps: [
      "Click Re-test to check the mailbox again.",
      "If it keeps failing, re-enter the password and server below and click Test & save.",
    ],
    canUpdatePassword: true,
    canEditServer: true,
  };
}

/** Turn a raw relay / SMTP error into a short reason a user can act on. */
export function summarizeSendError(raw: string): string {
  return publicMailError(raw);
}

/**
 * Error text safe to show any user: a plain reason, never gateway URLs, file names or
 * setting names. The raw text is kept server-side (logs, admin view) for diagnosis.
 */
export function publicMailError(raw: string | null | undefined): string {
  const d = diagnoseMailboxError(raw);
  if (d.problem !== "unknown") return `${d.title}. ${d.explanation}`;
  const cleaned = (raw || "Sending failed")
    .replace(/https?:\/\/\S+/gi, "the sending service")
    .replace(/mailer\.php|hostinger (relay|gateway)|relay endpoint|HOSTINGER_RELAY_\w+|public_html/gi, "the sending service")
    .replace(/\s*\|\s*/g, "; ");
  return cleaned.slice(0, 200);
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
              lastSendErrorRaw: (error || "").slice(0, 1000),
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
          : {
              lastSendErrorAt: now,
              lastSendError: summarizeSendError(error || ""),
              lastSendErrorRaw: (error || "").slice(0, 1000),
              consecutiveSendFailures: 1,
            }),
      },
    });
  } catch {
    // ignore: a lost status update is better than a failed send
  }
}
