import { prisma } from "@/lib/prisma";

/** Clear a mailbox's failure state after a successful connection test or credential fix. */
export async function clearMailboxFailure(mailboxEmail: string) {
  const email = (mailboxEmail || "").toLowerCase().trim();
  softFailures.delete(email);
  await prisma.warmupSettings
    .updateMany({
      where: { mailboxEmail: email },
      // The login was just verified, so it counts as a recent success.
      data: { consecutiveSendFailures: 0, lastSendErrorAt: null, lastSendError: null, lastSendErrorRaw: null, lastSendOkAt: new Date() },
    })
    .catch(() => {});
}

export type MailboxProblem =
  | "wrong_password"
  | "server_unreachable"
  | "relay_unreachable"
  | "relay_token"
  | "provider_blocked"
  | "provider_throttled"
  | "account_restricted"
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
/**
 * The mail server refused the login only for now: a 4xx reply ("421 too many connections",
 * "451 try again later"), or no reply at all, at the AUTH step. mailer.php reports every
 * non-235 AUTH reply as "Auth failed on host:port: <reply>", so without this check a
 * GoDaddy throttle looked like a wrong password.
 */
/**
 * The provider accepted the login but has blocked this mailbox from sending, e.g. GoDaddy:
 * "535 <id> User x@y.com has been restricted." (returned after DATA). A new password does not
 * help and Re-test (login only) passes, so this must not look like a password problem.
 */
export function isAccountRestricted(raw: string | null | undefined): boolean {
  return /has been restricted|(account|user|mailbox) (is |has been )?(restricted|suspended|disabled|blocked)|sending (is |has been )?(blocked|suspended|restricted)|outbound[^.]{0,40}(blocked|restricted|suspended)/i.test(
    raw || "",
  );
}

/** How long a restricted mailbox is kept out of warmup and campaigns before it is tried again. */
export const RESTRICTED_PAUSE_MS = 24 * 60 * 60 * 1000;

/** A send from this mailbox was refused as restricted within the pause window. */
export function isRecentlyRestricted(w: { lastSendErrorAt?: Date | null; lastSendErrorRaw?: string | null; lastSendOkAt?: Date | null } | null | undefined): boolean {
  if (!w?.lastSendErrorAt || !isAccountRestricted(w.lastSendErrorRaw)) return false;
  if (w.lastSendOkAt && w.lastSendOkAt > w.lastSendErrorAt) return false;
  return Date.now() - w.lastSendErrorAt.getTime() < RESTRICTED_PAUSE_MS;
}

export function isTemporaryLoginRefusal(raw: string | null | undefined): boolean {
  const e = raw || "";
  if (/Auth failed on [\w.-]+:\d+:\s*(?:\)|$|\.|4\d\d\b)/i.test(e)) return true;
  return /\b(421|450|451|452|454)\b|too many (connections|logins?|auth\w*|sessions)|try (again )?later|temporar(il)?y|rate.?limit|throttl/i.test(e) &&
    !/\b535\b|\b534\b/.test(e);
}

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
  if (isAccountRestricted(e)) {
    const provider = /secureserver/i.test(e) ? "GoDaddy" : /hostinger|titan/i.test(e) ? "Hostinger" : /office365|outlook/i.test(e) ? "Microsoft" : "The email provider";
    return {
      problem: "account_restricted",
      title: `${provider} has restricted sending from this mailbox`,
      explanation: `${provider} accepted the login (the password is correct) but refuses to send mail from this mailbox. Providers do this when a mailbox sends more than its plan allows or gets spam complaints. Re-test only checks the login, so it can pass while sending is still blocked.`,
      steps: [
        `Contact ${provider} support and ask them to lift the outbound sending restriction on this mailbox.`,
        "Sending from it is paused for 24 hours so the restriction is not made worse; campaigns use your other mailboxes.",
        "Once it is lifted, send less per day from it, and keep SPF, DKIM and DMARC passing.",
      ],
      canUpdatePassword: false,
      canEditServer: false,
    };
  }
  if (isTemporaryLoginRefusal(e)) {
    const provider = /secureserver/i.test(e) ? "GoDaddy" : /hostinger|titan/i.test(e) ? "Hostinger" : "The mail server";
    return {
      problem: "provider_throttled",
      title: `${provider} is temporarily refusing logins`,
      explanation: `${provider} turned away the login for now, usually because many mailboxes signed in from our sending server in a short time. The password is not the problem, and sending resumes on its own.`,
      steps: [
        "No change is needed. The mailbox is retried automatically after a short pause.",
        "Click Re-test in a few minutes if you want to confirm it now.",
      ],
      canUpdatePassword: false,
      canEditServer: false,
    };
  }
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
    // The server name is a real provider's: the problem is the connection, not the settings.
    const known = e.match(/smtpout\.secureserver\.net|smtp\.hostinger\.com|smtp\.office365\.com|smtp\.gmail\.com|smtp\.titan\.email/i);
    if (known) {
      const provider = /secureserver/i.test(known[0]) ? "GoDaddy" : /hostinger|titan/i.test(known[0]) ? "Hostinger" : /office365/i.test(known[0]) ? "Microsoft 365" : "Google";
      return {
        problem: "provider_blocked",
        title: `Can't connect to ${provider}'s mail server`,
        explanation: opts.admin
          ? `The sending gateway could not open a connection to ${known[0]} on any SMTP port. The server name is correct, so retyping the password will not help.`
          : `Our sending service can't reach ${provider}'s mail server right now. Your server settings look right and your password may be correct; this is a connection problem on our side.`,
        steps: opts.admin
          ? [
              "Click Check connection below to see which ports the gateway can reach.",
              `If every port is closed, the gateway host blocks outgoing mail to ${provider}. Ask the host's support to allow outbound SMTP to ${known[0]} (ports 465 / 587), or run the gateway on a host that allows it.`,
              "When a port opens, click Re-test: the working port is remembered automatically.",
            ]
          : ["Wait a little and click Re-test.", "If it keeps failing, contact support; your mailbox details do not need to change."],
        canUpdatePassword: true,
        canEditServer: true,
      };
    }
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
/** Problems with the sending gateway itself, not with any one mailbox. */
export function isPlatformProblem(raw: string | null | undefined): boolean {
  const p = diagnoseMailboxError(raw).problem;
  return p === "relay_unreachable" || p === "relay_token";
}

/** Last gateway-wide problem seen by this server (shown to platform admins only). */
let lastGatewayIssue: { at: string; error: string; count: number } | null = null;
export function getGatewayIssue() {
  return lastGatewayIssue;
}

/**
 * Temporary login refusals per mailbox (in memory: one app replica). They do not mark the
 * mailbox broken; warmup pauses the mailbox for a while instead (see isMailboxCoolingDown).
 */
const SOFT_COOLDOWN_MS = 30 * 60 * 1000;
/** A login refusal right after the same saved password worked is treated as temporary this many times in a row. */
const MAX_SOFT_AUTH_FAILURES = 3;
const RECENT_SUCCESS_MS = 12 * 60 * 60 * 1000;
const softFailures = new Map<string, { count: number; until: number }>();

/** True while a mailbox is paused after a temporary login refusal (warmup skips it). */
export function isMailboxCoolingDown(mailboxEmail: string): boolean {
  const s = softFailures.get((mailboxEmail || "").toLowerCase().trim());
  return Boolean(s && s.until > Date.now());
}

function noteSoftFailure(email: string, error: string) {
  const prev = softFailures.get(email);
  const count = (prev?.count ?? 0) + 1;
  softFailures.set(email, { count, until: Date.now() + SOFT_COOLDOWN_MS });
  console.warn(`[mail] temporary login refusal for ${email} (${count} in a row, not marked broken): ${error.slice(0, 300)}`);
}

export async function recordMailboxSendResult(mailboxEmail: string, ok: boolean, error?: string) {
  const email = (mailboxEmail || "").toLowerCase().trim();
  if (!email.includes("@")) return;
  if (ok) softFailures.delete(email);
  if (!ok) {
    const problem = diagnoseMailboxError(error).problem;
    if (problem === "account_restricted") {
      // Keep it out of warmup for the pause window (in memory; warmup also checks the DB).
      softFailures.set(email, { count: MAX_SOFT_AUTH_FAILURES, until: Date.now() + RESTRICTED_PAUSE_MS });
      console.warn(`[mail] ${email} is restricted by the provider; sending paused: ${(error || "").slice(0, 300)}`);
    }
    if (problem === "provider_throttled") {
      noteSoftFailure(email, error || "");
      return;
    }
    // A "wrong password" right after the same saved password worked is almost always the
    // provider blocking logins for a while (GoDaddy does this when many mailboxes sign in
    // from one server). Treat the first few as temporary; a real password change keeps
    // failing and is marked after MAX_SOFT_AUTH_FAILURES attempts.
    if (problem === "wrong_password" && (softFailures.get(email)?.count ?? 0) < MAX_SOFT_AUTH_FAILURES) {
      const w = await prisma.warmupSettings
        .findUnique({ where: { mailboxEmail: email }, select: { lastSendOkAt: true, lastSendErrorAt: true } })
        .catch(() => null);
      const okAt = w?.lastSendOkAt?.getTime() ?? 0;
      const recentlyWorked = okAt > Date.now() - RECENT_SUCCESS_MS && (!w?.lastSendErrorAt || okAt > w.lastSendErrorAt.getTime());
      if (recentlyWorked) {
        noteSoftFailure(email, error || "");
        return;
      }
    }
  }
  // A busy or unreachable gateway says nothing about this mailbox: do not mark it broken
  // (that made every mailbox look failed and campaigns skip them).
  if (!ok && isPlatformProblem(error)) {
    const recent = lastGatewayIssue && Date.now() - new Date(lastGatewayIssue.at).getTime() < 60 * 60 * 1000;
    lastGatewayIssue = {
      at: new Date().toISOString(),
      error: (error || "").slice(0, 300),
      count: recent ? lastGatewayIssue!.count + 1 : 1,
    };
    console.warn(`[mail] gateway problem (not counted against ${email}): ${(error || "").slice(0, 300)}`);
    return;
  }
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
              // A restricted mailbox must be skipped by campaigns at once (they skip at 2+).
              consecutiveSendFailures: isAccountRestricted(error)
                ? Math.max(2, existing.consecutiveSendFailures + 1)
                : { increment: 1 },
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
              consecutiveSendFailures: isAccountRestricted(error) ? 2 : 1,
            }),
      },
    });
  } catch {
    // ignore: a lost status update is better than a failed send
  }
}
