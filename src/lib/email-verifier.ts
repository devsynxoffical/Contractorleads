import dns from "dns";
import net from "net";
import { HOSTINGER_RELAY_SECRET, relayEndpoints } from "@/lib/user-smtp";
import { resolvePlatformKey } from "@/lib/platform-keys";

// Common disposable / temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "20minutemail.it",
  "burnermail.io",
  "crazymailing.com",
  "dispostable.com",
  "dropmail.me",
  "fakemailgenerator.com",
  "generator.email",
  "getairmail.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.block",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "harakirimail.com",
  "inboxkitten.com",
  "incognitomail.org",
  "maildrop.cc",
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "mailinator2.com",
  "mailnesia.com",
  "mailnull.com",
  "mailsac.com",
  "mohmal.com",
  "mytemp.email",
  "nada.ltd",
  "nada.email",
  "sharklasers.com",
  "spam4.me",
  "spambog.com",
  "spambox.us",
  "spamex.com",
  "spamevaporator.com",
  "spaml.de",
  "temp-mail.org",
  "tempail.com",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.net",
  "tempmailaddress.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "zippymail.info",
]);

// Free webmail providers
const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "yahoo.ca",
  "yahoo.es",
  "yahoo.com.br",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "hotmail.es",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "aim.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "mail.com",
  "yandex.com",
  "yandex.ru",
  "fastmail.com",
  "tutanota.com",
  "tuta.com",
]);

// Automated / Never-Send Prefixes (Section 02: Never send to noreply@, do-not-reply@, postmaster@, abuse@, webmaster@)
const AUTOMATED_NEVER_SEND_PREFIXES = new Set([
  "noreply",
  "no-reply",
  "no_reply",
  "donotreply",
  "do-not-reply",
  "do_not_reply",
  "postmaster",
  "abuse",
  "webmaster",
  "mailer-daemon",
  "daemon",
  "bounce",
  "bounces",
  "auto-reply",
  "autoreply",
]);

// Role Account Pattern Metadata (Section 02)
export const ROLE_ACCOUNT_METADATA: Record<
  string,
  { whoReadsIt: string; spamRisk: "Very High" | "High" | "Medium" | "Never send"; allowCarefulSend: boolean }
> = {
  info: { whoReadsIt: "Everyone / Receptionist", spamRisk: "Very High", allowCarefulSend: false },
  admin: { whoReadsIt: "IT / Multiple Staff", spamRisk: "Very High", allowCarefulSend: false },
  administrator: { whoReadsIt: "IT / Multiple Staff", spamRisk: "Very High", allowCarefulSend: false },
  office: { whoReadsIt: "Front Desk / Receptionist", spamRisk: "Very High", allowCarefulSend: false },
  contact: { whoReadsIt: "Sales or Support Team", spamRisk: "High", allowCarefulSend: false },
  support: { whoReadsIt: "Support Team", spamRisk: "High", allowCarefulSend: false },
  help: { whoReadsIt: "Support Team", spamRisk: "High", allowCarefulSend: false },
  service: { whoReadsIt: "Customer Service Team", spamRisk: "High", allowCarefulSend: false },
  billing: { whoReadsIt: "Accounting / Billing Team", spamRisk: "High", allowCarefulSend: false },
  finance: { whoReadsIt: "Finance Department", spamRisk: "High", allowCarefulSend: false },
  hr: { whoReadsIt: "Human Resources", spamRisk: "High", allowCarefulSend: false },
  careers: { whoReadsIt: "HR / Recruiting", spamRisk: "High", allowCarefulSend: false },
  jobs: { whoReadsIt: "HR / Recruiting", spamRisk: "High", allowCarefulSend: false },
  legal: { whoReadsIt: "Legal / Compliance", spamRisk: "Very High", allowCarefulSend: false },
  compliance: { whoReadsIt: "Compliance Team", spamRisk: "Very High", allowCarefulSend: false },
  privacy: { whoReadsIt: "Privacy / Legal Team", spamRisk: "Very High", allowCarefulSend: false },
  security: { whoReadsIt: "Security Team", spamRisk: "Very High", allowCarefulSend: false },
  sales: { whoReadsIt: "Sales Team", spamRisk: "Medium", allowCarefulSend: true },
  estimates: { whoReadsIt: "Estimating / Sales Team", spamRisk: "Medium", allowCarefulSend: true },
  quotes: { whoReadsIt: "Quotes / Sales Team", spamRisk: "Medium", allowCarefulSend: true },
  hello: { whoReadsIt: "Marketing / General", spamRisk: "Medium", allowCarefulSend: false },
  marketing: { whoReadsIt: "Marketing Team", spamRisk: "Medium", allowCarefulSend: false },
  media: { whoReadsIt: "PR / Media Team", spamRisk: "High", allowCarefulSend: false },
  press: { whoReadsIt: "Press Team", spamRisk: "High", allowCarefulSend: false },
  team: { whoReadsIt: "Shared Team Inbox", spamRisk: "High", allowCarefulSend: false },
  general: { whoReadsIt: "General Shared Inbox", spamRisk: "High", allowCarefulSend: false },
  mail: { whoReadsIt: "General Mail Inbox", spamRisk: "High", allowCarefulSend: false },
  enquiries: { whoReadsIt: "General Enquiries", spamRisk: "High", allowCarefulSend: false },
  inquiry: { whoReadsIt: "General Inquiries", spamRisk: "High", allowCarefulSend: false },
};

// Common role-based local parts
const ROLE_BASED_PREFIXES = new Set([
  ...Object.keys(ROLE_ACCOUNT_METADATA),
  ...AUTOMATED_NEVER_SEND_PREFIXES,
  "editor",
  "feedback",
  "news",
  "orders",
]);

// Common domain typos and corrections
const DOMAIN_TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmaik.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaol.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmali.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outloook.com": "outlook.com",
  "iclud.com": "icloud.com",
  "iclou.com": "icloud.com",
  "prton.me": "proton.me",
  "protomail.com": "protonmail.com",
};

/** Legacy 3-value status kept for backward compatibility */
export type EmailVerificationStatus = "valid" | "risky" | "invalid";

/** Section 02 & 06: 4 Core Categories + unknown */
export type EmailCategoryStatus = "safe" | "catchall" | "role" | "invalid" | "unknown";

/** Section 06: Bounce Risk levels */
export type EmailBounceRisk = "low" | "medium" | "high" | "critical";

export interface ColdEmailStrategyInfo {
  category: EmailCategoryStatus;
  label: string;
  deliverable: "YES" | "MAYBE" | "NO";
  bounceRiskLabel: string;
  spamRiskLabel: string;
  action: string;
  priority: "1st" | "2nd" | "3rd" | "Never";
  volumeStrategy: string;
  sendingTool: string;
  sequenceLength: string;
  expectedOpenRate: string;
  whoReadsIt?: string;
}

export type EmailVerificationResult = {
  email: string;
  normalizedEmail: string;
  /** Legacy 3-bucket status: valid | risky | invalid */
  status: EmailVerificationStatus;
  /** Section 02 & 06: 4-category status: safe | catchall | role | invalid | unknown */
  emailStatus: EmailCategoryStatus;
  /** Section 06: Detailed sub-status */
  emailSubStatus: string;
  /** Section 06: Bounce risk level: low | medium | high | critical */
  emailBounceRisk: EmailBounceRisk;
  /** Section 06: Role account flag */
  isRoleAccount: boolean;
  /** Section 06: Which provider/method verified this email */
  emailVerifySource: string;
  /** Section 06: 0.00 - 1.00 decimal confidence score */
  emailScore: number;
  /** Section 06: ISO timestamp when verified */
  emailVerifiedAt: string;
  /** 0 to 100 integer confidence score */
  score: number;
  verdict: string;
  user: string;
  domain: string;
  checks: {
    formatValid: boolean;
    domainExists: boolean;
    mxFound: boolean;
    isDisposable: boolean;
    isFreeProvider: boolean;
    isRoleBased: boolean;
    isCatchall: boolean;
    smtpCheck: "passed" | "failed" | "unreachable" | "skipped";
  };
  mxRecords: Array<{ host: string; priority: number }>;
  suggestion: string | null;
  strategy: ColdEmailStrategyInfo;
  durationMs: number;
};

/**
 * Build Section 03 & 09 Cold Email Marketing Strategy guidance for a category.
 */
export function buildColdEmailStrategy(
  category: EmailCategoryStatus,
  prefix?: string,
): ColdEmailStrategyInfo {
  const cleanPrefix = (prefix || "").toLowerCase().trim();
  const roleMeta = ROLE_ACCOUNT_METADATA[cleanPrefix];

  switch (category) {
    case "safe":
      return {
        category: "safe",
        label: "Safe (Valid)",
        deliverable: "YES",
        bounceRiskLabel: "< 1% (Almost zero)",
        spamRiskLabel: "Low",
        action: "Send directly — Primary cold email list",
        priority: "1st",
        volumeStrategy: "Full volume — no limit",
        sendingTool: "Main domain (primary)",
        sequenceLength: "5–8 steps",
        expectedOpenRate: "25–45%",
      };
    case "catchall":
      return {
        category: "catchall",
        label: "Catchall (Accept-All)",
        deliverable: "MAYBE",
        bounceRiskLabel: "40–60% (Medium–High)",
        spamRiskLabel: "Medium",
        action: "Keep in Risky segment — send from secondary/warmed domain",
        priority: "2nd",
        volumeStrategy: "Max 20% of daily sends",
        sendingTool: "Secondary / warmed domain",
        sequenceLength: "2–3 steps only",
        expectedOpenRate: "10–25% (variable)",
      };
    case "role":
      return {
        category: "role",
        label: "Role Account",
        deliverable: "YES",
        bounceRiskLabel: "< 5% (Low)",
        spamRiskLabel: roleMeta ? `${roleMeta.spamRisk} (Shared inbox)` : "HIGH (Shared inbox)",
        action: roleMeta?.allowCarefulSend
          ? "Sales role inbox — send carefully in low volume (max 5%)"
          : "Filter out / Avoid — multiple staff read this inbox (high spam complaint risk)",
        priority: "3rd",
        volumeStrategy: "Only sales@ type — 5% max",
        sendingTool: "Separate sending account",
        sequenceLength: "1–2 steps max",
        expectedOpenRate: "5–15%",
        whoReadsIt: roleMeta?.whoReadsIt ?? "Department / Shared Staff Inbox",
      };
    case "invalid":
      return {
        category: "invalid",
        label: "Invalid",
        deliverable: "NO",
        bounceRiskLabel: "100% (Hard Bounce)",
        spamRiskLabel: "N/A",
        action: "NEVER SEND — Immediately remove from all lists and campaigns",
        priority: "Never",
        volumeStrategy: "NEVER SEND",
        sendingTool: "Remove permanently",
        sequenceLength: "N/A",
        expectedOpenRate: "0% (bounces)",
      };
    default:
      return {
        category: "unknown",
        label: "Unverified",
        deliverable: "MAYBE",
        bounceRiskLabel: "Unknown",
        spamRiskLabel: "Unknown",
        action: "Verify before sending cold outreach",
        priority: "Never",
        volumeStrategy: "Verify first",
        sendingTool: "Hold until verified",
        sequenceLength: "N/A",
        expectedOpenRate: "N/A",
      };
  }
}

/**
 * Step 1: Format / Syntax validation conforming to RFC 5322 specs.
 */
function checkSyntax(email: string): { valid: boolean; user: string; domain: string } {
  if (!email || typeof email !== "string") {
    return { valid: false, user: "", domain: "" };
  }

  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { valid: false, user: "", domain: "" };
  }

  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1 || atIndex === 0 || atIndex === trimmed.length - 1) {
    return { valid: false, user: "", domain: "" };
  }

  const user = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (user.length > 64 || domain.length > 255) {
    return { valid: false, user, domain };
  }

  if (user.startsWith(".") || user.endsWith(".") || user.includes("..")) {
    return { valid: false, user, domain };
  }
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return { valid: false, user, domain };
  }

  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  return { valid: regex.test(trimmed), user, domain: domain.toLowerCase() };
}

// In-memory MX cache (domain -> records) with 1-hour TTL
const mxCache = new Map<
  string,
  { mxRecords: Array<{ host: string; priority: number }>; domainExists: boolean; timestamp: number }
>();

// In-memory Catchall cache (domain -> boolean) with 1-hour TTL
const catchallCache = new Map<string, { isCatchall: boolean; timestamp: number }>();

// Circuit breaker for outbound port 25
let smtpOutboundBlocked = false;
let smtpBlockedSince = 0;
let consecutiveSmtpFailures = 0;

/**
 * Step 2 & Step 3: Resolve Domain Existence + MX records with A-record fallback.
 */
export async function resolveDomainMx(
  domain: string,
): Promise<{ mxRecords: Array<{ host: string; priority: number }>; domainExists: boolean }> {
  const normDomain = domain.toLowerCase().trim();
  const cached = mxCache.get(normDomain);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60) {
    return { mxRecords: cached.mxRecords, domainExists: cached.domainExists };
  }

  // Common provider fast-path
  if (normDomain === "gmail.com" || normDomain === "googlemail.com") {
    const res = { mxRecords: [{ host: "gmail-smtp-in.l.google.com", priority: 5 }], domainExists: true };
    mxCache.set(normDomain, { ...res, timestamp: Date.now() });
    return res;
  }
  if (normDomain === "yahoo.com" || normDomain === "aol.com") {
    const res = { mxRecords: [{ host: "mta5.am0.yahoodns.net", priority: 10 }], domainExists: true };
    mxCache.set(normDomain, { ...res, timestamp: Date.now() });
    return res;
  }
  if (normDomain === "outlook.com" || normDomain === "hotmail.com" || normDomain === "live.com") {
    const res = { mxRecords: [{ host: "outlook-com.olc.protection.outlook.com", priority: 10 }], domainExists: true };
    mxCache.set(normDomain, { ...res, timestamp: Date.now() });
    return res;
  }
  if (normDomain === "icloud.com" || normDomain === "me.com" || normDomain === "mac.com") {
    const res = { mxRecords: [{ host: "mx1.mail.icloud.com", priority: 10 }], domainExists: true };
    mxCache.set(normDomain, { ...res, timestamp: Date.now() });
    return res;
  }

  try {
    const records = await dns.promises.resolveMx(normDomain);
    if (records && records.length > 0) {
      records.sort((a, b) => a.priority - b.priority);
      const normalizedMx = records.map((r) => ({
        host: r.exchange || (r as unknown as { host?: string }).host || "",
        priority: r.priority,
      }));
      const res = { mxRecords: normalizedMx, domainExists: true };
      mxCache.set(normDomain, { ...res, timestamp: Date.now() });
      return res;
    }
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code !== "ENOTFOUND" && error.code !== "ENODATA") {
      // ignore other dns errors and try A record fallback
    }
  }

  // Fallback to checking A/AAAA record
  try {
    const aRecords = await dns.promises.resolve4(normDomain);
    if (aRecords && aRecords.length > 0) {
      const res = {
        mxRecords: [],
        domainExists: true,
      };
      mxCache.set(normDomain, { ...res, timestamp: Date.now() });
      return res;
    }
  } catch {
    // domain does not exist
  }

  const res = { mxRecords: [], domainExists: false };
  mxCache.set(normDomain, { ...res, timestamp: Date.now() });
  return res;
}

/**
 * Step 4 & Step 5: Perform SMTP handshake check (HELO -> MAIL FROM -> RCPT TO)
 */
async function checkSmtpMailbox(
  email: string,
  mxHost: string,
  timeoutMs = 1200,
): Promise<"passed" | "failed" | "unreachable" | "skipped"> {
  if (!mxHost) return "unreachable";

  if (smtpOutboundBlocked) {
    if (Date.now() - smtpBlockedSince > 1000 * 60 * 5) {
      smtpOutboundBlocked = false;
      consecutiveSmtpFailures = 0;
    } else {
      return "unreachable";
    }
  }

  return new Promise<"passed" | "failed" | "unreachable" | "skipped">((resolve) => {
    let resolved = false;
    let socket: net.Socket;

    const finish = (result: "passed" | "failed" | "unreachable" | "skipped") => {
      if (!resolved) {
        resolved = true;
        if (result === "passed" || result === "failed") {
          consecutiveSmtpFailures = 0;
        } else if (result === "unreachable") {
          consecutiveSmtpFailures++;
          if (consecutiveSmtpFailures >= 3) {
            smtpOutboundBlocked = true;
            smtpBlockedSince = Date.now();
          }
        }
        try {
          socket?.destroy();
        } catch {
          // ignore
        }
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish("unreachable");
    }, timeoutMs);

    try {
      socket = net.createConnection({ host: mxHost, port: 25 });
      socket.setTimeout(timeoutMs);

      let step = 0;
      let buffer = "";

      socket.on("connect", () => {
        // Connected, wait for 220 banner
      });

      socket.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const code = parseInt(line.slice(0, 3), 10);
          const isLastLine = line.charAt(3) === " ";

          if (!isLastLine) continue;

          if (step === 0) {
            if (code === 220) {
              step = 1;
              socket.write("HELO contractorleads.us\r\n");
            } else {
              clearTimeout(timer);
              return finish("unreachable");
            }
          } else if (step === 1) {
            if (code === 250) {
              step = 2;
              socket.write("MAIL FROM:<verify@contractorleads.us>\r\n");
            } else {
              clearTimeout(timer);
              return finish("unreachable");
            }
          } else if (step === 2) {
            if (code === 250) {
              step = 3;
              socket.write(`RCPT TO:<${email}>\r\n`);
            } else {
              clearTimeout(timer);
              return finish("unreachable");
            }
          } else if (step === 3) {
            clearTimeout(timer);
            try {
              socket.write("QUIT\r\n");
            } catch {
              // ignore
            }

            if (code === 250 || code === 251) {
              return finish("passed");
            } else if (code >= 500 && code < 600) {
              return finish("failed");
            } else {
              return finish("unreachable");
            }
          }
        }
      });

      socket.on("error", () => {
        clearTimeout(timer);
        finish("unreachable");
      });

      socket.on("timeout", () => {
        clearTimeout(timer);
        finish("unreachable");
      });

      socket.on("close", () => {
        clearTimeout(timer);
        if (!resolved) finish("unreachable");
      });
    } catch {
      clearTimeout(timer);
      finish("unreachable");
    }
  });
}

/**
 * Step 6: Catchall Check — Test a guaranteed non-existent probe address on the same domain.
 * If the mail server returns 250 OK for `xyz-probe-98271@domain.com`, the domain is Catchall (Accept-All).
 */
async function checkDomainIsCatchall(domain: string, mxHost: string): Promise<boolean> {
  const normDomain = domain.toLowerCase().trim();
  if (FREE_EMAIL_PROVIDERS.has(normDomain)) return false;

  const cached = catchallCache.get(normDomain);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60) {
    return cached.isCatchall;
  }

  const probeAddress = `xv99-catchall-probe-${Math.random().toString(36).slice(2, 8)}@${normDomain}`;

  // Try Hostinger Gateway first if local port 25 is blocked
  if (smtpOutboundBlocked) {
    try {
      const probeMap = await verifyViaHostingerGateway([probeAddress]);
      if (probeMap && probeMap.has(probeAddress)) {
        const probeRes = probeMap.get(probeAddress)!;
        const isCatchall = probeRes.smtpCheck === "passed" || probeRes.status === "valid";
        catchallCache.set(normDomain, { isCatchall, timestamp: Date.now() });
        return isCatchall;
      }
    } catch {
      // ignore
    }
    return false;
  }

  const smtpProbe = await checkSmtpMailbox(probeAddress, mxHost, 1100);
  const isCatchall = smtpProbe === "passed";
  catchallCache.set(normDomain, { isCatchall, timestamp: Date.now() });
  return isCatchall;
}

export interface RemoteVerifyResult {
  email: string;
  status: "valid" | "invalid" | "risky";
  score: number;
  verdict: string;
  smtpCheck: "passed" | "failed" | "unreachable" | "skipped" | "greylisted";
  isCatchall?: boolean;
  response?: string;
}

/**
 * Verify a list of emails through the Hostinger Gateway on Port 25.
 */
export async function verifyViaHostingerGateway(
  emails: string[],
): Promise<Map<string, RemoteVerifyResult> | null> {
  const clean = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (clean.length === 0) return new Map();

  const endpoints = relayEndpoints();

  const payload = {
    action: "verify",
    secret: HOSTINGER_RELAY_SECRET,
    emails: clean,
  };

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HOSTINGER_RELAY_SECRET}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          results?: RemoteVerifyResult[];
        };
        if (data.ok && Array.isArray(data.results)) {
          const map = new Map<string, RemoteVerifyResult>();
          for (const item of data.results) {
            map.set(item.email.toLowerCase(), item);
          }
          return map;
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return null;
}

/**
 * Section 07: Third-Party Verification APIs (ZeroBounce, NeverBounce, MillionVerifier, Bouncer, EmailListVerify, Hunter)
 * Automatically called when Admin configures any of these API keys in /admin/system.
 */
async function verifyViaExternalProvider(
  email: string,
  userPrefix: string,
  domain: string,
): Promise<{
  emailStatus: EmailCategoryStatus;
  emailSubStatus: string;
  emailBounceRisk: EmailBounceRisk;
  isRoleAccount: boolean;
  emailVerifySource: string;
  emailScore: number;
  verdict: string;
} | null> {
  const isRolePrefix = ROLE_BASED_PREFIXES.has(userPrefix.toLowerCase());
  const isAutomatedNoReply = AUTOMATED_NEVER_SEND_PREFIXES.has(userPrefix.toLowerCase());

  // 1. ZeroBounce API (Section 07 primary example)
  const zbKey = await resolvePlatformKey("zerobounceApiKey").catch(() => "");
  if (zbKey) {
    try {
      const url = `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(zbKey)}&email=${encodeURIComponent(email)}&ip_address=`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = (await res.json()) as {
          status?: string;
          sub_status?: string;
          free_email?: boolean;
          did_you_mean?: string | null;
          processed_at?: string;
          error?: string;
        };
        if (!data.error && data.status) {
          const rawStatus = data.status.toLowerCase();
          const subStatus = (data.sub_status || "").toLowerCase();
          const roleDetected =
            isRolePrefix ||
            subStatus === "role_based" ||
            subStatus === "role_based_catch_all";

          let emailStatus: EmailCategoryStatus = "unknown";
          let emailBounceRisk: EmailBounceRisk = "medium";
          let emailScore = 0.5;
          let verdict = "Verification completed via ZeroBounce";

          if (isAutomatedNoReply || rawStatus === "invalid" || rawStatus === "spamtrap" || rawStatus === "abuse") {
            emailStatus = "invalid";
            emailBounceRisk = "critical";
            emailScore = 0.0;
            verdict = `Invalid / Undeliverable (${subStatus || rawStatus})`;
          } else if (rawStatus === "catch-all") {
            emailStatus = "catchall";
            emailBounceRisk = "medium";
            emailScore = 0.55;
            verdict = "Catch-all (Accept-All) domain — 40–60% bounce risk";
          } else if (rawStatus === "do_not_mail") {
            if (subStatus.includes("disposable") || subStatus.includes("toxic")) {
              emailStatus = "invalid";
              emailBounceRisk = "critical";
              emailScore = 0.0;
              verdict = `Do Not Mail (${subStatus}) — Never send`;
            } else {
              emailStatus = "role";
              emailBounceRisk = "high";
              emailScore = 0.72;
              verdict = `Role account (${userPrefix}@) — shared inbox`;
            }
          } else if (rawStatus === "valid") {
            if (roleDetected) {
              emailStatus = "role";
              emailBounceRisk = "high";
              emailScore = 0.78;
              verdict = `Valid Role Account (${userPrefix}@) — shared department inbox`;
            } else {
              emailStatus = "safe";
              emailBounceRisk = "low";
              emailScore = 0.99;
              verdict = "Safe (100% Valid mailbox confirmed by ZeroBounce)";
            }
          }

          return {
            emailStatus,
            emailSubStatus: subStatus || rawStatus,
            emailBounceRisk,
            isRoleAccount: roleDetected,
            emailVerifySource: "zerobounce",
            emailScore,
            verdict,
          };
        }
      }
    } catch {
      // Fall through to next provider
    }
  }

  // 2. NeverBounce API
  const nbKey = await resolvePlatformKey("neverbounceApiKey").catch(() => "");
  if (nbKey) {
    try {
      const url = `https://api.neverbounce.com/v4/single/check?key=${encodeURIComponent(nbKey)}&email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = (await res.json()) as {
          status?: string;
          result?: string;
          flags?: string[];
        };
        if (data.status === "success" && data.result) {
          const r = data.result.toLowerCase();
          const flags = Array.isArray(data.flags) ? data.flags : [];
          const roleDetected = isRolePrefix || flags.includes("role_account");

          if (isAutomatedNoReply || r === "invalid" || r === "disposable") {
            return {
              emailStatus: "invalid",
              emailSubStatus: r,
              emailBounceRisk: "critical",
              isRoleAccount: roleDetected,
              emailVerifySource: "neverbounce",
              emailScore: 0.0,
              verdict: `Invalid mailbox (${r}) — NeverBounce`,
            };
          }
          if (r === "catchall") {
            return {
              emailStatus: "catchall",
              emailSubStatus: "accept_all",
              emailBounceRisk: "medium",
              isRoleAccount: roleDetected,
              emailVerifySource: "neverbounce",
              emailScore: 0.55,
              verdict: "Catch-all (Accept-All) domain — NeverBounce",
            };
          }
          if (r === "valid") {
            if (roleDetected) {
              return {
                emailStatus: "role",
                emailSubStatus: "role_based",
                emailBounceRisk: "high",
                isRoleAccount: true,
                emailVerifySource: "neverbounce",
                emailScore: 0.75,
                verdict: `Role Account (${userPrefix}@) — NeverBounce`,
              };
            }
            return {
              emailStatus: "safe",
              emailSubStatus: "mailbox_verified",
              emailBounceRisk: "low",
              isRoleAccount: false,
              emailVerifySource: "neverbounce",
              emailScore: 0.99,
              verdict: "Safe (100% Valid mailbox) — NeverBounce",
            };
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  // 3. MillionVerifier API
  const mvKey = await resolvePlatformKey("millionverifierApiKey").catch(() => "");
  if (mvKey) {
    try {
      const url = `https://api.millionverifier.com/api/v3/?api=${encodeURIComponent(mvKey)}&email=${encodeURIComponent(email)}&timeout=8`;
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (res.ok) {
        const data = (await res.json()) as {
          result?: string;
          subresult?: string;
          role?: boolean;
        };
        if (data.result) {
          const r = data.result.toLowerCase();
          const roleDetected = Boolean(data.role || isRolePrefix);
          if (isAutomatedNoReply || r === "invalid" || r === "disposable") {
            return {
              emailStatus: "invalid",
              emailSubStatus: data.subresult || r,
              emailBounceRisk: "critical",
              isRoleAccount: roleDetected,
              emailVerifySource: "millionverifier",
              emailScore: 0.0,
              verdict: `Invalid mailbox (${data.subresult || r}) — MillionVerifier`,
            };
          }
          if (r === "catch_all") {
            return {
              emailStatus: "catchall",
              emailSubStatus: "accept_all",
              emailBounceRisk: "medium",
              isRoleAccount: roleDetected,
              emailVerifySource: "millionverifier",
              emailScore: 0.55,
              verdict: "Catch-all (Accept-All) domain — MillionVerifier",
            };
          }
          if (r === "ok") {
            if (roleDetected) {
              return {
                emailStatus: "role",
                emailSubStatus: "role_based",
                emailBounceRisk: "high",
                isRoleAccount: true,
                emailVerifySource: "millionverifier",
                emailScore: 0.75,
                verdict: `Role Account (${userPrefix}@) — MillionVerifier`,
              };
            }
            return {
              emailStatus: "safe",
              emailSubStatus: "mailbox_verified",
              emailBounceRisk: "low",
              isRoleAccount: false,
              emailVerifySource: "millionverifier",
              emailScore: 0.98,
              verdict: "Safe (100% Valid mailbox) — MillionVerifier",
            };
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  // 4. Bouncer.io API
  const bouncerKey = await resolvePlatformKey("bouncerApiKey").catch(() => "");
  if (bouncerKey) {
    try {
      const url = `https://api.usebouncer.com/v1.1/email/verify?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, {
        headers: { "x-api-key": bouncerKey },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          status?: string;
          reason?: string;
           account?: { role?: string };
          domain?: { acceptAll?: string };
          score?: number;
        };
        if (data.status) {
          const st = data.status.toLowerCase();
          const roleDetected = Boolean(data.account?.role === "yes" || isRolePrefix);
          const isAcceptAll = data.domain?.acceptAll === "yes";

          if (isAutomatedNoReply || st === "undeliverable") {
            return {
              emailStatus: "invalid",
              emailSubStatus: data.reason || "undeliverable",
              emailBounceRisk: "critical",
              isRoleAccount: roleDetected,
              emailVerifySource: "bouncer",
              emailScore: 0.0,
              verdict: `Invalid (${data.reason || "undeliverable"}) — Bouncer`,
            };
          }
          if (isAcceptAll || st === "risky") {
            return {
              emailStatus: roleDetected ? "role" : "catchall",
              emailSubStatus: isAcceptAll ? "accept_all" : (data.reason || "risky"),
              emailBounceRisk: roleDetected ? "high" : "medium",
              isRoleAccount: roleDetected,
              emailVerifySource: "bouncer",
              emailScore: 0.58,
              verdict: isAcceptAll
                ? "Catch-all (Accept-All) domain — Bouncer"
                : `Risky (${data.reason || "risky"}) — Bouncer`,
            };
          }
          if (st === "deliverable") {
            return {
              emailStatus: roleDetected ? "role" : "safe",
              emailSubStatus: roleDetected ? "role_based" : "mailbox_verified",
              emailBounceRisk: roleDetected ? "high" : "low",
              isRoleAccount: roleDetected,
              emailVerifySource: "bouncer",
              emailScore: roleDetected ? 0.76 : 0.99,
              verdict: roleDetected
                ? `Role Account (${userPrefix}@) — Bouncer`
                : "Safe (100% Deliverable) — Bouncer",
            };
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  // 5. Hunter.io Email Verifier API
  const hunterKey = await resolvePlatformKey("hunterApiKey").catch(() => "");
  if (hunterKey) {
    try {
      const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(hunterKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = (await res.json()) as {
          data?: {
            status?: string;
            result?: string;
            score?: number;
            role?: boolean;
            accept_all?: boolean;
            disposable?: boolean;
          };
        };
        const d = json.data;
        if (d?.status) {
          const st = d.status.toLowerCase();
          const roleDetected = Boolean(d.role || isRolePrefix);
          if (isAutomatedNoReply || st === "invalid" || d.disposable) {
            return {
              emailStatus: "invalid",
              emailSubStatus: d.disposable ? "disposable" : "mailbox_not_found",
              emailBounceRisk: "critical",
              isRoleAccount: roleDetected,
              emailVerifySource: "hunter",
              emailScore: 0.0,
              verdict: "Invalid / Undeliverable mailbox — Hunter.io",
            };
          }
          if (st === "accept_all" || d.accept_all) {
            return {
              emailStatus: "catchall",
              emailSubStatus: "accept_all",
              emailBounceRisk: "medium",
              isRoleAccount: roleDetected,
              emailVerifySource: "hunter",
              emailScore: Math.min(0.68, (d.score ?? 55) / 100),
              verdict: "Catch-all (Accept-All) domain — Hunter.io",
            };
          }
          if (st === "valid") {
            return {
              emailStatus: roleDetected ? "role" : "safe",
              emailSubStatus: roleDetected ? "role_based" : "mailbox_verified",
              emailBounceRisk: roleDetected ? "high" : "low",
              isRoleAccount: roleDetected,
              emailVerifySource: "hunter",
              emailScore: roleDetected ? 0.75 : Math.max(0.92, (d.score ?? 95) / 100),
              verdict: roleDetected
                ? `Role Account (${userPrefix}@) — Hunter.io`
                : "Safe (Verified mailbox) — Hunter.io",
            };
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  void domain;
  return null;
}

/**
 * Map our 4-category status back to legacy 3-value status (`valid | risky | invalid`)
 * so existing callers remain 100% compatible.
 */
function toLegacyStatus(cat: EmailCategoryStatus): EmailVerificationStatus {
  if (cat === "safe") return "valid";
  if (cat === "catchall" || cat === "role" || cat === "unknown") return "risky";
  return "invalid";
}

/**
 * Verify any email address with the 7-Step Technical Verification Logic (Section 04):
 * Step 1: Format / Syntax
 * Step 2: Domain Existence (DNS)
 * Step 3: MX Record check
 * Step 4: SMTP Ping
 * Step 5: Mailbox Check (RCPT TO: 250 OK vs 550 Hard Bounce)
 * Step 6: Catchall Check (Probe fake address on domain)
 * Step 7: Role Account Detection (info@, admin@, sales@, noreply@, etc.)
 */
export async function verifyEmailAddress(
  rawEmail: string,
  options?: { skipSmtp?: boolean; useLocalSmtpOnly?: boolean },
): Promise<EmailVerificationResult> {
  const startTime = Date.now();
  const nowIso = new Date().toISOString();
  const raw = String(rawEmail || "").trim();

  // STEP 1: Format / Syntax Check
  const { valid: formatValid, user, domain } = checkSyntax(raw);
  const normalizedEmail = formatValid ? `${user.toLowerCase()}@${domain.toLowerCase()}` : raw;
  const lowerUser = user.toLowerCase();

  // Typo detection
  let suggestion: string | null = null;
  if (domain && DOMAIN_TYPO_MAP[domain]) {
    suggestion = `${user}@${DOMAIN_TYPO_MAP[domain]}`;
  }

  if (!formatValid) {
    return {
      email: raw,
      normalizedEmail,
      status: "invalid",
      emailStatus: "invalid",
      emailSubStatus: "invalid_syntax",
      emailBounceRisk: "critical",
      isRoleAccount: false,
      emailVerifySource: "syntax_check",
      emailScore: 0.0,
      emailVerifiedAt: nowIso,
      score: 0,
      verdict: "Invalid email syntax or format (Hard Bounce risk 100%)",
      user,
      domain,
      checks: {
        formatValid: false,
        domainExists: false,
        mxFound: false,
        isDisposable: false,
        isFreeProvider: false,
        isRoleBased: false,
        isCatchall: false,
        smtpCheck: "skipped",
      },
      mxRecords: [],
      suggestion,
      strategy: buildColdEmailStrategy("invalid", lowerUser),
      durationMs: Date.now() - startTime,
    };
  }

  const isDisposable = DISPOSABLE_DOMAINS.has(domain);
  const isFreeProvider = FREE_EMAIL_PROVIDERS.has(domain);
  const isAutomatedNoReply = AUTOMATED_NEVER_SEND_PREFIXES.has(lowerUser);
  const isRoleBased = ROLE_BASED_PREFIXES.has(lowerUser);

  // Automated no-reply addresses (noreply@, do-not-reply@, postmaster@, abuse@, webmaster@)
  // Section 02: "Never Send to: noreply@, do-not-reply@, postmaster@, abuse@, webmaster@ — yeh automated hain"
  if (isAutomatedNoReply) {
    return {
      email: raw,
      normalizedEmail,
      status: "invalid",
      emailStatus: "invalid",
      emailSubStatus: "automated_no_reply",
      emailBounceRisk: "critical",
      isRoleAccount: true,
      emailVerifySource: "role_filter",
      emailScore: 0.0,
      emailVerifiedAt: nowIso,
      score: 5,
      verdict: `Automated system address (${lowerUser}@) — Never send cold email`,
      user,
      domain,
      checks: {
        formatValid: true,
        domainExists: true,
        mxFound: true,
        isDisposable: false,
        isFreeProvider,
        isRoleBased: true,
        isCatchall: false,
        smtpCheck: "skipped",
      },
      mxRecords: [],
      suggestion,
      strategy: buildColdEmailStrategy("invalid", lowerUser),
      durationMs: Date.now() - startTime,
    };
  }

  if (isDisposable) {
    return {
      email: raw,
      normalizedEmail,
      status: "invalid",
      emailStatus: "invalid",
      emailSubStatus: "disposable",
      emailBounceRisk: "critical",
      isRoleAccount: isRoleBased,
      emailVerifySource: "disposable_filter",
      emailScore: 0.05,
      emailVerifiedAt: nowIso,
      score: 5,
      verdict: "Disposable / temporary email address — Never send",
      user,
      domain,
      checks: {
        formatValid: true,
        domainExists: true,
        mxFound: true,
        isDisposable: true,
        isFreeProvider: false,
        isRoleBased,
        isCatchall: false,
        smtpCheck: "skipped",
      },
      mxRecords: [],
      suggestion,
      strategy: buildColdEmailStrategy("invalid", lowerUser),
      durationMs: Date.now() - startTime,
    };
  }

  // STEP 2 & STEP 3: Domain Existence & MX Record Check
  const { mxRecords, domainExists } = await resolveDomainMx(domain);

  if (!domainExists || mxRecords.length === 0) {
    const subStatus = !domainExists ? "domain_not_found" : "no_mx_record";
    return {
      email: raw,
      normalizedEmail,
      status: "invalid",
      emailStatus: "invalid",
      emailSubStatus: subStatus,
      emailBounceRisk: "critical",
      isRoleAccount: isRoleBased,
      emailVerifySource: "mx_dns",
      emailScore: 0.0,
      emailVerifiedAt: nowIso,
      score: !domainExists ? 0 : 10,
      verdict: !domainExists
        ? "Domain does not exist (DNS lookup failed — 100% hard bounce)"
        : "No MX mail server records found for this domain (100% hard bounce)",
      user,
      domain,
      checks: {
        formatValid: true,
        domainExists,
        mxFound: false,
        isDisposable: false,
        isFreeProvider,
        isRoleBased,
        isCatchall: false,
        smtpCheck: "failed",
      },
      mxRecords: [],
      suggestion,
      strategy: buildColdEmailStrategy("invalid", lowerUser),
      durationMs: Date.now() - startTime,
    };
  }

  // Optional External Verification API (ZeroBounce / NeverBounce / MillionVerifier / Bouncer / Hunter)
  if (!options?.skipSmtp && !options?.useLocalSmtpOnly) {
    const extResult = await verifyViaExternalProvider(normalizedEmail, lowerUser, domain);
    if (extResult) {
      const intScore = Math.round(extResult.emailScore * 100);
      return {
        email: raw,
        normalizedEmail,
        status: toLegacyStatus(extResult.emailStatus),
        emailStatus: extResult.emailStatus,
        emailSubStatus: extResult.emailSubStatus,
        emailBounceRisk: extResult.emailBounceRisk,
        isRoleAccount: extResult.isRoleAccount,
        emailVerifySource: extResult.emailVerifySource,
        emailScore: extResult.emailScore,
        emailVerifiedAt: nowIso,
        score: intScore,
        verdict: extResult.verdict,
        user,
        domain,
        checks: {
          formatValid: true,
          domainExists: true,
          mxFound: true,
          isDisposable: false,
          isFreeProvider,
          isRoleBased: extResult.isRoleAccount,
          isCatchall: extResult.emailStatus === "catchall",
          smtpCheck: extResult.emailStatus === "invalid" ? "failed" : "passed",
        },
        mxRecords,
        suggestion,
        strategy: buildColdEmailStrategy(extResult.emailStatus, lowerUser),
        durationMs: Date.now() - startTime,
      };
    }
  }

  // STEP 4, 5, 6: SMTP Ping + Mailbox RCPT TO Check + Catchall Detection
  // First try Hostinger Port 25 Gateway if enabled
  if (!options?.skipSmtp && !options?.useLocalSmtpOnly) {
    try {
      const probeAddr = `xv99-catchall-probe-${Math.random().toString(36).slice(2, 7)}@${domain}`;
      const cachedCatchall = catchallCache.get(domain);
      const batchToQuery =
        cachedCatchall || isFreeProvider ? [normalizedEmail] : [normalizedEmail, probeAddr];

      const remoteMap = await verifyViaHostingerGateway(batchToQuery);
      if (remoteMap && remoteMap.has(normalizedEmail)) {
        const item = remoteMap.get(normalizedEmail)!;
        const probeItem = remoteMap.get(probeAddr);
        const isCatchall = cachedCatchall
          ? cachedCatchall.isCatchall
          : Boolean(
              item.isCatchall ||
                (probeItem && (probeItem.smtpCheck === "passed" || probeItem.status === "valid")),
            );
        if (!cachedCatchall && !isFreeProvider) {
          catchallCache.set(domain, { isCatchall, timestamp: Date.now() });
        }

        let emailStatus: EmailCategoryStatus = "safe";
        let emailBounceRisk: EmailBounceRisk = "low";
        let emailSubStatus = "mailbox_verified";
        let emailScore = Math.min(1, Math.max(0, item.score / 100));
        let verdict = item.verdict;

        if (item.status === "invalid" || item.smtpCheck === "failed") {
          emailStatus = "invalid";
          emailBounceRisk = "critical";
          emailSubStatus = "mailbox_not_found";
          emailScore = 0.0;
          verdict = "Invalid — Mailbox rejected by mail server (550 User does not exist)";
        } else if (isRoleBased) {
          // Step 7: Role Detection
          emailStatus = "role";
          emailBounceRisk = "high";
          emailSubStatus = ROLE_ACCOUNT_METADATA[lowerUser]?.allowCarefulSend
            ? "role_sales"
            : isCatchall
              ? "role_based_catch_all"
              : "role_based";
          emailScore = isCatchall ? 0.58 : 0.74;
          const roleMeta = ROLE_ACCOUNT_METADATA[lowerUser];
          verdict = `Role Account (${lowerUser}@) — Read by ${roleMeta?.whoReadsIt ?? "Shared Inbox"} · Spam Risk: ${roleMeta?.spamRisk ?? "High"}`;
        } else if (isCatchall) {
          // Step 6: Catchall Detection
          emailStatus = "catchall";
          emailBounceRisk = "medium";
          emailSubStatus = "accept_all";
          // Section 09: firstname.lastname@ pattern on catchall is more likely real
          const hasPersonPattern = /^[a-z]+\.[a-z]+$/i.test(lowerUser);
          emailScore = hasPersonPattern ? 0.68 : 0.55;
          verdict = "Catchall (Accept-All) server — accepts all mail on domain (40–60% bounce risk)";
        } else if (item.smtpCheck === "passed" || item.status === "valid") {
          emailStatus = "safe";
          emailBounceRisk = "low";
          emailSubStatus = "mailbox_verified";
          emailScore = 0.98;
          verdict = "Safe (100% Valid mailbox confirmed via SMTP RCPT TO)";
        } else {
          // Unreachable / Greylisted — treat as Catchall / Risky
          emailStatus = "catchall";
          emailBounceRisk = "medium";
          emailSubStatus = "smtp_unreachable";
          emailScore = 0.64;
          verdict = "MX server active, but direct RCPT TO ping was greylisted — treat as Catchall";
        }

        if (suggestion && emailStatus !== "invalid") {
          emailStatus = "catchall";
          emailBounceRisk = "high";
          emailSubStatus = "possible_typo";
          emailScore = 0.45;
          verdict = `Possible domain typo. Did you mean ${suggestion}?`;
        }

        const intScore = Math.round(emailScore * 100);
        return {
          email: raw,
          normalizedEmail,
          status: toLegacyStatus(emailStatus),
          emailStatus,
          emailSubStatus,
          emailBounceRisk,
          isRoleAccount: isRoleBased,
          emailVerifySource: "hostinger_smtp",
          emailScore: Number(emailScore.toFixed(2)),
          emailVerifiedAt: nowIso,
          score: intScore,
          verdict,
          user,
          domain,
          checks: {
            formatValid: true,
            domainExists: true,
            mxFound: true,
            isDisposable: false,
            isFreeProvider,
            isRoleBased,
            isCatchall,
            smtpCheck: item.smtpCheck === "greylisted" ? "unreachable" : item.smtpCheck,
          },
          mxRecords,
          suggestion,
          strategy: buildColdEmailStrategy(emailStatus, lowerUser),
          durationMs: Date.now() - startTime,
        };
      }
    } catch {
      // Fallback to direct local SMTP + MX check
    }
  }

  // Direct Local SMTP Handshake + Catchall Check
  let smtpCheck: "passed" | "failed" | "unreachable" | "skipped" = "skipped";
  let isCatchall = false;

  if (!options?.skipSmtp && mxRecords.length > 0) {
    if (isFreeProvider) {
      smtpCheck = "skipped";
    } else {
      try {
        smtpCheck = await checkSmtpMailbox(normalizedEmail, mxRecords[0].host, 1200);
        if (smtpCheck === "passed") {
          isCatchall = await checkDomainIsCatchall(domain, mxRecords[0].host);
        }
      } catch {
        smtpCheck = "unreachable";
      }
    }
  }

  // Classify into the 4 Categories (Safe | Catchall | Role | Invalid)
  let emailStatus: EmailCategoryStatus = "safe";
  let emailBounceRisk: EmailBounceRisk = "low";
  let emailSubStatus = "mailbox_verified";
  let emailScore = 0.92;
  let verdict = "Safe — Deliverable mailbox";

  if (smtpCheck === "failed") {
    emailStatus = "invalid";
    emailBounceRisk = "critical";
    emailSubStatus = "mailbox_not_found";
    emailScore = 0.0;
    verdict = "Invalid — Hard Bounce (550 Mailbox does not exist)";
  } else if (isRoleBased) {
    emailStatus = "role";
    emailBounceRisk = "high";
    emailSubStatus = ROLE_ACCOUNT_METADATA[lowerUser]?.allowCarefulSend
      ? "role_sales"
      : isCatchall
        ? "role_based_catch_all"
        : "role_based";
    emailScore = isCatchall ? 0.58 : 0.74;
    const roleMeta = ROLE_ACCOUNT_METADATA[lowerUser];
    verdict = `Role Account (${lowerUser}@) — Read by ${roleMeta?.whoReadsIt ?? "Shared Inbox"} · Spam Risk: ${roleMeta?.spamRisk ?? "High"}`;
  } else if (isCatchall) {
    emailStatus = "catchall";
    emailBounceRisk = "medium";
    emailSubStatus = "accept_all";
    const hasPersonPattern = /^[a-z]+\.[a-z]+$/i.test(lowerUser);
    emailScore = hasPersonPattern ? 0.68 : 0.55;
    verdict = "Catchall (Accept-All) server — accepts all mail on domain (40–60% bounce risk)";
  } else if (smtpCheck === "passed") {
    emailStatus = "safe";
    emailBounceRisk = "low";
    emailSubStatus = "mailbox_verified";
    emailScore = 0.98;
    verdict = "Safe (100% Valid mailbox confirmed via SMTP RCPT TO)";
  } else if (smtpCheck === "unreachable") {
    // When outbound port 25 is blocked on cloud host, classify by pattern + MX strength
    const hasPersonPattern = /^[a-z]+(\.[a-z]+)?$/i.test(lowerUser) && !isRoleBased;
    if (hasPersonPattern && mxRecords.length > 0) {
      emailStatus = "safe";
      emailBounceRisk = "low";
      emailSubStatus = "mx_verified_personal";
      emailScore = 0.88;
      verdict = "Safe — Verified domain & MX records with personal mailbox format";
    } else {
      emailStatus = "catchall";
      emailBounceRisk = "medium";
      emailSubStatus = "smtp_unreachable";
      emailScore = 0.62;
      verdict = "Active MX mail server, but direct port 25 ping blocked — treat as Catchall";
    }
  } else if (smtpCheck === "skipped" && isFreeProvider) {
    emailStatus = "safe";
    emailBounceRisk = "low";
    emailSubStatus = "free_webmail_mx";
    emailScore = 0.85;
    verdict = "Valid consumer webmail domain (Gmail/Yahoo/Outlook MX verified)";
  }

  if (emailStatus !== "invalid" && suggestion) {
    emailStatus = "catchall";
    emailBounceRisk = "high";
    emailSubStatus = "possible_typo";
    emailScore = 0.45;
    verdict = `Possible domain typo. Did you mean ${suggestion}?`;
  }

  const intScore = Math.round(emailScore * 100);

  return {
    email: raw,
    normalizedEmail,
    status: toLegacyStatus(emailStatus),
    emailStatus,
    emailSubStatus,
    emailBounceRisk,
    isRoleAccount: isRoleBased,
    emailVerifySource: smtpCheck === "passed" ? "smtp_handshake" : "mx_dns",
    emailScore: Number(emailScore.toFixed(2)),
    emailVerifiedAt: nowIso,
    score: intScore,
    verdict,
    user,
    domain,
    checks: {
      formatValid: true,
      domainExists: true,
      mxFound: true,
      isDisposable: false,
      isFreeProvider,
      isRoleBased,
      isCatchall,
      smtpCheck,
    },
    mxRecords,
    suggestion,
    strategy: buildColdEmailStrategy(emailStatus, lowerUser),
    durationMs: Date.now() - startTime,
  };
}

/**
 * Batch verify a list of emails with full 4-Category breakdown (Safe, Catchall, Role, Invalid).
 */
export async function verifyEmailBatch(
  emails: string[],
  options?: { skipSmtp?: boolean; concurrency?: number },
): Promise<{
  total: number;
  valid: number;
  risky: number;
  invalid: number;
  safe: number;
  catchall: number;
  role: number;
  deliverabilityRate: number;
  results: EmailVerificationResult[];
}> {
  const cleanList = [...new Set(emails.map((e) => e.trim()).filter(Boolean))].slice(0, 2500);
  const results: EmailVerificationResult[] = [];

  const concurrency = options?.concurrency ?? 10;
  for (let i = 0; i < cleanList.length; i += concurrency) {
    const chunk = cleanList.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((email) => verifyEmailAddress(email, options)),
    );
    results.push(...chunkResults);
  }

  let valid = 0;
  let risky = 0;
  let invalid = 0;
  let safe = 0;
  let catchall = 0;
  let role = 0;

  for (const r of results) {
    if (r.status === "valid") valid++;
    else if (r.status === "risky") risky++;
    else invalid++;

    if (r.emailStatus === "safe") safe++;
    else if (r.emailStatus === "catchall") catchall++;
    else if (r.emailStatus === "role") role++;
  }

  const total = results.length;
  const deliverabilityRate =
    total > 0 ? Math.round(((safe + (catchall + role) * 0.5) / total) * 100) : 0;

  return {
    total,
    valid,
    risky,
    invalid,
    safe,
    catchall,
    role,
    deliverabilityRate,
    results,
  };
}
