import dns from "dns";
import net from "net";
import { HOSTINGER_RELAY_ENDPOINTS, HOSTINGER_RELAY_SECRET } from "@/lib/user-smtp";

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

// Common role-based local parts
const ROLE_BASED_PREFIXES = new Set([
  "admin",
  "administrator",
  "billing",
  "careers",
  "compliance",
  "contact",
  "editor",
  "enquiries",
  "feedback",
  "finance",
  "general",
  "hello",
  "help",
  "hr",
  "info",
  "inquiry",
  "jobs",
  "legal",
  "mail",
  "marketing",
  "media",
  "news",
  "no-reply",
  "noreply",
  "office",
  "orders",
  "press",
  "privacy",
  "sales",
  "security",
  "service",
  "support",
  "team",
  "webmaster",
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

export type EmailVerificationStatus = "valid" | "risky" | "invalid";

export type EmailVerificationResult = {
  email: string;
  normalizedEmail: string;
  status: EmailVerificationStatus;
  score: number; // 0 to 100
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
    smtpCheck: "passed" | "failed" | "unreachable" | "skipped";
  };
  mxRecords: Array<{ host: string; priority: number }>;
  suggestion: string | null;
  durationMs: number;
};

/**
 * Basic syntax validation conforming to RFC 5322 specs.
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

  // Check double dots or leading/trailing dots
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

// Circuit breaker for outbound port 25
let smtpOutboundBlocked = false;
let smtpBlockedSince = 0;
let consecutiveSmtpFailures = 0;

/**
 * Resolve MX records with A-record fallback and in-memory cache.
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
        mxRecords: [{ host: aRecords[0], priority: 10 }],
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
 * Perform a lightweight SMTP handshake check (HELO -> MAIL FROM -> RCPT TO)
 * with strict 1000ms timeout and circuit breaker so it never freezes execution.
 */
async function checkSmtpMailbox(
  email: string,
  mxHost: string,
  timeoutMs = 1000,
): Promise<"passed" | "failed" | "unreachable" | "skipped"> {
  if (!mxHost) return "unreachable";

  // Check circuit breaker (if outbound port 25 is blocked on server)
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
        if (result === "passed") {
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
              socket.write("HELO contractorleads.co\r\n");
            } else {
              clearTimeout(timer);
              return finish("unreachable");
            }
          } else if (step === 1) {
            if (code === 250) {
              step = 2;
              socket.write("MAIL FROM:<verify@contractorleads.co>\r\n");
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

export interface RemoteVerifyResult {
  email: string;
  status: "valid" | "invalid" | "risky";
  score: number;
  verdict: string;
  smtpCheck: "passed" | "failed" | "unreachable" | "skipped" | "greylisted";
  response?: string;
}

/**
 * Verify a list of emails through the Hostinger Gateway on Port 25.
 * Hostinger shared hosting allows outbound Port 25 TCP connections
 * directly to target MX servers, bypassing cloud provider Port 25 blocks.
 */
export async function verifyViaHostingerGateway(
  emails: string[]
): Promise<Map<string, RemoteVerifyResult> | null> {
  const clean = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (clean.length === 0) return new Map();

  const customUrl = process.env.HOSTINGER_RELAY_URL?.trim();
  const endpoints = Array.from(
    new Set([
      customUrl || "https://sevenfigurestudio.us/mailer.php",
      "https://sevenfigurestudio.us/mailer.php",
      "http://sevenfigurestudio.us/mailer.php",
      ...HOSTINGER_RELAY_ENDPOINTS,
    ].filter(Boolean) as string[])
  );

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
 * Verify any email address with comprehensive validation rules.
 */
export async function verifyEmailAddress(
  rawEmail: string,
  options?: { skipSmtp?: boolean; useLocalSmtpOnly?: boolean },
): Promise<EmailVerificationResult> {
  const startTime = Date.now();
  const raw = String(rawEmail || "").trim();
  const { valid: formatValid, user, domain } = checkSyntax(raw);

  const normalizedEmail = formatValid ? `${user.toLowerCase()}@${domain.toLowerCase()}` : raw;

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
      score: 0,
      verdict: "Invalid email syntax or format",
      user,
      domain,
      checks: {
        formatValid: false,
        domainExists: false,
        mxFound: false,
        isDisposable: false,
        isFreeProvider: false,
        isRoleBased: false,
        smtpCheck: "skipped",
      },
      mxRecords: [],
      suggestion,
      durationMs: Date.now() - startTime,
    };
  }

  const isDisposable = DISPOSABLE_DOMAINS.has(domain);
  const isFreeProvider = FREE_EMAIL_PROVIDERS.has(domain);
  const isRoleBased = ROLE_BASED_PREFIXES.has(user.toLowerCase());

  if (isDisposable) {
    return {
      email: raw,
      normalizedEmail,
      status: "invalid",
      score: 5,
      verdict: "Disposable / temporary email address detected",
      user,
      domain,
      checks: {
        formatValid: true,
        domainExists: true,
        mxFound: true,
        isDisposable: true,
        isFreeProvider: false,
        isRoleBased,
        smtpCheck: "skipped",
      },
      mxRecords: [],
      suggestion,
      durationMs: Date.now() - startTime,
    };
  }

  // 1. Primary path: verify via Hostinger Gateway (Port 25 unblocked)
  if (!options?.skipSmtp && !options?.useLocalSmtpOnly) {
    try {
      const remoteMap = await verifyViaHostingerGateway([normalizedEmail]);
      if (remoteMap && remoteMap.has(normalizedEmail)) {
        const item = remoteMap.get(normalizedEmail)!;
        let score = item.score;
        let status = item.status;
        let verdict = item.verdict;

        if (isRoleBased && status !== "invalid") {
          score = Math.min(score, 75);
          status = "risky";
          verdict = "Role-based mailbox (admin/support/info - moderate deliverability)";
        }
        if (suggestion && status !== "invalid") {
          score = Math.min(score, 60);
          status = "risky";
          verdict = `Possible domain typo. Did you mean ${suggestion}?`;
        }

        return {
          email: raw,
          normalizedEmail,
          status,
          score,
          verdict,
          user,
          domain,
          checks: {
            formatValid: true,
            domainExists: item.status !== "invalid" || item.smtpCheck !== "failed",
            mxFound: item.status !== "invalid" || item.smtpCheck !== "failed",
            isDisposable: false,
            isFreeProvider,
            isRoleBased,
            smtpCheck: item.smtpCheck === "greylisted" ? "unreachable" : item.smtpCheck,
          },
          mxRecords: [],
          suggestion,
          durationMs: Date.now() - startTime,
        };
      }
    } catch {
      // Fallback to local DNS/MX check
    }
  }

  // 2. Fallback path: Local DNS / MX
  const { mxRecords, domainExists } = await resolveDomainMx(domain);

  if (!domainExists || mxRecords.length === 0) {
    return {
      email: raw,
      normalizedEmail,
      status: "invalid",
      score: 10,
      verdict: "No MX or mail server records found for this domain",
      user,
      domain,
      checks: {
        formatValid: true,
        domainExists,
        mxFound: false,
        isDisposable,
        isFreeProvider,
        isRoleBased,
        smtpCheck: "failed",
      },
      mxRecords: [],
      suggestion,
      durationMs: Date.now() - startTime,
    };
  }

  // Local SMTP Check (when Hostinger gateway is unavailable)
  let smtpCheck: "passed" | "failed" | "unreachable" | "skipped" = "skipped";
  if (!options?.skipSmtp && mxRecords.length > 0) {
    if (isFreeProvider) {
      smtpCheck = "skipped";
    } else {
      try {
        smtpCheck = await checkSmtpMailbox(normalizedEmail, mxRecords[0].host, 1200);
      } catch {
        smtpCheck = "unreachable";
      }
    }
  }

  // Calculate deliverability score (0 - 100)
  let score = 90;
  let status: EmailVerificationStatus = "valid";
  let verdict = "Deliverable and safe to email";

  if (smtpCheck === "passed") {
    score = 98;
    verdict = "Verified deliverable mailbox (SMTP 250 OK)";
  } else if (smtpCheck === "failed") {
    score = 15;
    status = "invalid";
    verdict = "Mailbox rejected by mail server (does not exist)";
  } else if (smtpCheck === "unreachable") {
    // Port 25 blocked by cloud host or firewall - do NOT mark as valid!
    score = 65;
    status = "risky";
    verdict = "Domain & MX active, but direct mailbox ping timed out or blocked";
  } else if (smtpCheck === "skipped" && isFreeProvider) {
    score = 70;
    status = "risky";
    verdict = "Free webmail address (direct mailbox ping skipped)";
  }

  if (status !== "invalid") {
    if (isRoleBased) {
      score = Math.min(score, 75);
      status = "risky";
      verdict = "Role-based mailbox (admin/support/info - moderate deliverability)";
    }
    if (suggestion) {
      score = Math.min(score, 60);
      status = "risky";
      verdict = `Possible domain typo. Did you mean ${suggestion}?`;
    }
  }

  return {
    email: raw,
    normalizedEmail,
    status,
    score,
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
      smtpCheck,
    },
    mxRecords,
    suggestion,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Batch verify a list of emails with Hostinger Port 25 gateway acceleration.
 */
export async function verifyEmailBatch(
  emails: string[],
  options?: { skipSmtp?: boolean; concurrency?: number },
): Promise<{
  total: number;
  valid: number;
  risky: number;
  invalid: number;
  deliverabilityRate: number;
  results: EmailVerificationResult[];
}> {
  const cleanList = [...new Set(emails.map((e) => e.trim()).filter(Boolean))].slice(0, 2500);
  const results: EmailVerificationResult[] = [];

  // If SMTP check is requested, verify via Hostinger Gateway in batches of 15
  if (!options?.skipSmtp && cleanList.length > 0) {
    const BATCH_SIZE = 15;
    for (let i = 0; i < cleanList.length; i += BATCH_SIZE) {
      const chunk = cleanList.slice(i, i + BATCH_SIZE);
      const validSyntaxChunk: string[] = [];

      for (const email of chunk) {
        const { valid: formatValid, user, domain } = checkSyntax(email);
        if (!formatValid) {
          results.push({
            email,
            normalizedEmail: email,
            status: "invalid",
            score: 0,
            verdict: "Invalid email syntax or format",
            user: user || "",
            domain: domain || "",
            checks: {
              formatValid: false,
              domainExists: false,
              mxFound: false,
              isDisposable: false,
              isFreeProvider: false,
              isRoleBased: false,
              smtpCheck: "skipped",
            },
            mxRecords: [],
            suggestion: null,
            durationMs: 0,
          });
        } else if (DISPOSABLE_DOMAINS.has(domain.toLowerCase())) {
          results.push({
            email,
            normalizedEmail: `${user.toLowerCase()}@${domain.toLowerCase()}`,
            status: "invalid",
            score: 5,
            verdict: "Disposable / temporary email address detected",
            user,
            domain,
            checks: {
              formatValid: true,
              domainExists: true,
              mxFound: true,
              isDisposable: true,
              isFreeProvider: false,
              isRoleBased: ROLE_BASED_PREFIXES.has(user.toLowerCase()),
              smtpCheck: "skipped",
            },
            mxRecords: [],
            suggestion: null,
            durationMs: 0,
          });
        } else {
          validSyntaxChunk.push(email);
        }
      }

      if (validSyntaxChunk.length > 0) {
        const remoteMap = await verifyViaHostingerGateway(validSyntaxChunk);
        if (remoteMap && remoteMap.size > 0) {
          for (const email of validSyntaxChunk) {
            const norm = email.toLowerCase();
            const remoteItem = remoteMap.get(norm);
            if (remoteItem) {
              const { user, domain } = checkSyntax(norm);
              const isRoleBased = ROLE_BASED_PREFIXES.has(user.toLowerCase());
              let score = remoteItem.score;
              let status = remoteItem.status;
              let verdict = remoteItem.verdict;

              if (isRoleBased && status !== "invalid") {
                score = Math.min(score, 75);
                status = "risky";
                verdict = "Role-based mailbox (admin/support/info - moderate deliverability)";
              }

              results.push({
                email,
                normalizedEmail: norm,
                status,
                score,
                verdict,
                user,
                domain,
                checks: {
                  formatValid: true,
                  domainExists: remoteItem.status !== "invalid" || remoteItem.smtpCheck !== "failed",
                  mxFound: remoteItem.status !== "invalid" || remoteItem.smtpCheck !== "failed",
                  isDisposable: false,
                  isFreeProvider: FREE_EMAIL_PROVIDERS.has(domain),
                  isRoleBased,
                  smtpCheck: remoteItem.smtpCheck === "greylisted" ? "unreachable" : remoteItem.smtpCheck,
                },
                mxRecords: [],
                suggestion: null,
                durationMs: 50,
              });
            } else {
              const fallback = await verifyEmailAddress(email, options);
              results.push(fallback);
            }
          }
        } else {
          // Hostinger gateway offline or failed, process chunk individually
          const fallbackResults = await Promise.all(
            validSyntaxChunk.map((em) => verifyEmailAddress(em, options))
          );
          results.push(...fallbackResults);
        }
      }
    }
  } else {
    // Smtp skipped or empty list
    const concurrency = options?.concurrency ?? 30;
    for (let i = 0; i < cleanList.length; i += concurrency) {
      const chunk = cleanList.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((email) => verifyEmailAddress(email, options)),
      );
      results.push(...chunkResults);
    }
  }

  let valid = 0;
  let risky = 0;
  let invalid = 0;

  for (const r of results) {
    if (r.status === "valid") valid++;
    else if (r.status === "risky") risky++;
    else invalid++;
  }

  const total = results.length;
  const deliverabilityRate = total > 0 ? Math.round(((valid + risky * 0.5) / total) * 100) : 0;

  return {
    total,
    valid,
    risky,
    invalid,
    deliverabilityRate,
    results,
  };
}
