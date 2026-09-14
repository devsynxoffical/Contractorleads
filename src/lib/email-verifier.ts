import dns from "dns";
import net from "net";

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

/**
 * Resolve MX records with A-record fallback.
 */
async function resolveDomainMx(
  domain: string,
): Promise<{ mxRecords: Array<{ host: string; priority: number }>; domainExists: boolean }> {
  try {
    const records = await dns.promises.resolveMx(domain);
    if (records && records.length > 0) {
      records.sort((a, b) => a.priority - b.priority);
      const normalizedMx = records.map((r) => ({
        host: r.exchange || (r as unknown as { host?: string }).host || "",
        priority: r.priority,
      }));
      return { mxRecords: normalizedMx, domainExists: true };
    }
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code !== "ENOTFOUND" && error.code !== "ENODATA") {
      // ignore other dns errors and try A record fallback
    }
  }

  // Fallback to checking A/AAAA record
  try {
    const aRecords = await dns.promises.resolve4(domain);
    if (aRecords && aRecords.length > 0) {
      return {
        mxRecords: [{ host: aRecords[0], priority: 10 }],
        domainExists: true,
      };
    }
  } catch {
    // domain does not exist
  }

  return { mxRecords: [], domainExists: false };
}

/**
 * Perform a lightweight SMTP handshake check (HELO -> MAIL FROM -> RCPT TO)
 * with strict timeouts so it runs swiftly without blocking.
 */
async function checkSmtpMailbox(
  email: string,
  mxHost: string,
  timeoutMs = 3000,
): Promise<"passed" | "failed" | "unreachable" | "skipped"> {
  if (!mxHost) return "unreachable";

  return new Promise<"passed" | "failed" | "unreachable" | "skipped">((resolve) => {
    let resolved = false;
    const finish = (result: "passed" | "failed" | "unreachable" | "skipped") => {
      if (!resolved) {
        resolved = true;
        try {
          socket.destroy();
        } catch {
          // ignore socket destroy error
        }
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish("unreachable");
    }, timeoutMs);

    const socket = net.createConnection({ host: mxHost, port: 25 });
    socket.setTimeout(timeoutMs);

    let step = 0;
    let buffer = "";

    socket.on("connect", () => {
      // Wait for server 220 banner
    });

    socket.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\r\n");
      // Keep last incomplete segment if any
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const code = parseInt(line.slice(0, 3), 10);
        const isLastLine = line.charAt(3) === " ";

        if (!isLastLine) continue;

        if (step === 0) {
          // Server 220 greeting
          if (code === 220) {
            step = 1;
            socket.write("HELO contractorleads.co\r\n");
          } else {
            clearTimeout(timer);
            return finish("unreachable");
          }
        } else if (step === 1) {
          // HELO response (250)
          if (code === 250) {
            step = 2;
            socket.write("MAIL FROM:<verify@contractorleads.co>\r\n");
          } else {
            clearTimeout(timer);
            return finish("unreachable");
          }
        } else if (step === 2) {
          // MAIL FROM response (250)
          if (code === 250) {
            step = 3;
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else {
            clearTimeout(timer);
            return finish("unreachable");
          }
        } else if (step === 3) {
          // RCPT TO response: 250/251 = valid mailbox, 550/551/552/553/554 = invalid mailbox
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
            // Greylisted (450/451) or strict anti-spam policy
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
  });
}

/**
 * Verify any email address with comprehensive validation rules.
 */
export async function verifyEmailAddress(
  rawEmail: string,
  options?: { skipSmtp?: boolean },
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

  // Resolve DNS / MX
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

  // SMTP Check
  let smtpCheck: "passed" | "failed" | "unreachable" | "skipped" = "skipped";
  if (!options?.skipSmtp && mxRecords.length > 0) {
    try {
      smtpCheck = await checkSmtpMailbox(normalizedEmail, mxRecords[0].host, 2800);
    } catch {
      smtpCheck = "unreachable";
    }
  }

  // Calculate deliverability score (0 - 100)
  let score = 90;
  let status: EmailVerificationStatus = "valid";
  let verdict = "Deliverable and safe to email";

  if (smtpCheck === "passed") {
    score = 98;
    verdict = "Verified deliverable mailbox";
  } else if (smtpCheck === "failed") {
    score = 15;
    status = "invalid";
    verdict = "Mailbox rejected by mail server (does not exist)";
  } else if (smtpCheck === "unreachable") {
    // Greylisted or firewall blocking port 25 — DNS and MX are good
    score = 85;
    verdict = "Domain & MX active (deliverable)";
  }

  if (status !== "invalid") {
    if (isRoleBased) {
      score = Math.min(score, 75);
      status = "risky";
      verdict = "Role-based mailbox (admin/support/info - moderate deliverability)";
    }
    if (isFreeProvider && score > 90) {
      score = 92;
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
 * Batch verify a list of emails with concurrency limit.
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
  const cleanList = [...new Set(emails.map((e) => e.trim()).filter(Boolean))].slice(0, 200);
  const concurrency = options?.concurrency ?? 5;
  const results: EmailVerificationResult[] = [];

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
