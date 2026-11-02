import { relayFetch } from "@/lib/relay-fetch";
import {
  relayEndpoints,
  HOSTINGER_RELAY_SECRET,
  sendViaSmtpDirect,
  resolveSmtpCredentialsForEmail,
  type SmtpPayload,
} from "@/lib/user-smtp";
import { testSmtpConnection } from "@/lib/system-smtp";
import { publicMailError, recordMailboxSendResult } from "@/lib/mailbox-send-status";

export type MailboxRelayPayload = {
  fromEmail: string;
  fromName?: string | null;
  password?: string;
  host?: string;
  port?: number;
  provider?: string;
};

export type SendRelayOptions = {
  fromEmail: string;
  fromName?: string | null;
  password?: string;
  host?: string;
  port?: number;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  warmupId?: string;
  inReplyTo?: string;
  references?: string;
};

/**
 * Get all configured Hostinger relay URLs, prioritized by custom env then active domains
 */
export function getRelayEndpoints(): string[] {
  return relayEndpoints();
}

/**
 * Save / Register an email account on Hostinger mailer.php so it can be managed remotely
 */
export async function saveAccountToHostingerRelay(payload: MailboxRelayPayload): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const endpoints = getRelayEndpoints();
  let lastErr = "Relay endpoint unreachable";

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const res = await relayFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HOSTINGER_RELAY_SECRET}`,
        },
        body: JSON.stringify({
          secret: HOSTINGER_RELAY_SECRET,
          action: "save_account",
          fromEmail: payload.fromEmail.toLowerCase().trim(),
          fromName: payload.fromName || "",
          password: payload.password || "",
          host: payload.host || "",
          port: payload.port || 465,
          provider: payload.provider || "custom",
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.ok) {
          return { ok: true, message: data.message || "Account registered on Hostinger gateway" };
        }
        if (data.error) lastErr = `${url}: ${data.error}`;
      } else {
        lastErr = `${url} returned status ${res.status}`;
      }
    } catch (e: any) {
      lastErr = `${url} connection failed: ${e.message || String(e)}`;
    }
  }

  // If the remote PHP script doesn't yet have save_account action or failed,
  // we still return ok: true with fallback because the credentials are saved in Railway DB
  // and passed dynamically on every send/test call.
  return { ok: true, message: "Saved locally; dynamic relay enabled" };
}

/**
 * Test SMTP connectivity for an email account via Hostinger relay
 */
/** Ask the gateway which SMTP ports of a mail server it can reach (admin diagnostics). */
export async function relayPortCheck(host: string): Promise<{
  ok: boolean;
  results?: Array<{ port: number; open: boolean; ms: number; banner?: string; error?: string }>;
  error?: string;
}> {
  const errors: string[] = [];
  for (const url of getRelayEndpoints()) {
    try {
      const res = await relayFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${HOSTINGER_RELAY_SECRET}` },
        body: JSON.stringify({ secret: HOSTINGER_RELAY_SECRET, action: "port_check", host }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return { ok: true, results: data.results };
      errors.push(`${url}: ${data.error || `status ${res.status}`}`);
    } catch (e: unknown) {
      errors.push(`${url}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { ok: false, error: errors.join(" | ") || "Gateway unreachable" };
}

export async function testAccountViaHostingerRelay(payload: MailboxRelayPayload): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  /** Port the gateway actually authenticated on (it tries fallbacks) */
  port?: number;
}> {
  const endpoints = getRelayEndpoints();
  const relayErrors: string[] = [];
  // Once a relay answers with its own error (e.g. "Auth failed"), that is the real answer:
  // a direct SMTP test from this host is blocked on Railway and would only hide it.
  let relayAnswered = false;

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      // The gateway may try up to four ports (8s connect each) for GoDaddy.
      const timer = setTimeout(() => controller.abort(), 60000);

      const res = await relayFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HOSTINGER_RELAY_SECRET}`,
        },
        body: JSON.stringify({
          secret: HOSTINGER_RELAY_SECRET,
          action: "test",
          fromEmail: payload.fromEmail.toLowerCase().trim(),
          ...(payload.password ? { password: payload.password } : {}),
          ...(payload.host ? { host: payload.host } : {}),
          port: payload.port || 465,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const text = await res.text().catch(() => "");
      let data: { ok?: boolean; message?: string; error?: string; port?: number } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (res.ok && data.ok) {
        return {
          ok: true,
          message: data.message || "Connection & authentication verified via the mail relay",
          port: typeof (data as { port?: unknown }).port === "number" ? (data as { port: number }).port : undefined,
        };
      }
      if (data.error) {
        relayAnswered = true;
        relayErrors.push(`${url} error: ${data.error}`);
      } else {
        relayErrors.push(`${url} returned status ${res.status}${text ? ` (${text.slice(0, 200)})` : ""}`);
      }
    } catch (e: unknown) {
      relayErrors.push(`${url} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const lastErr = relayErrors.join(" | ") || "Relay endpoint unreachable";
  if (relayAnswered) return { ok: false, error: lastErr };

  // Relay unreachable: try a direct authenticated SMTP test (works where outbound SMTP is allowed).
  try {
    const creds = await resolveSmtpCredentialsForEmail(payload.fromEmail);
    const testPayload: SmtpPayload = {
      host: payload.host || creds?.host || "smtp.hostinger.com",
      port: payload.port || creds?.port || 465,
      secure: (payload.port || creds?.port || 465) !== 587,
      username: creds?.username || payload.fromEmail,
      password: payload.password || creds?.password || "",
      fromEmail: payload.fromEmail,
      fromName: payload.fromName || "",
    };
    if (testPayload.password) {
      const direct = await testSmtpConnection(testPayload);
      if (direct.ok) {
        return { ok: true, message: `Connected & verified directly via ${testPayload.host}:${testPayload.port}` };
      }
      return { ok: false, error: `${lastErr} | Direct SMTP test: ${direct.message}` };
    }
  } catch (directErr: unknown) {
    return {
      ok: false,
      error: `${lastErr} | Direct SMTP test failed: ${directErr instanceof Error ? directErr.message : String(directErr)}`,
    };
  }

  return { ok: false, error: lastErr };
}

/**
 * Send an email (campaign or warmup) via Hostinger relay
 */
/** Send (campaign or warmup) and record the outcome on the mailbox (shown on Email Accounts). */
export async function sendEmailViaHostingerRelay(opts: SendRelayOptions): Promise<{
  ok: boolean;
  messageId?: string | null;
  error?: string;
}> {
  const res = await sendEmailViaHostingerRelayRaw(opts);
  await recordMailboxSendResult(opts.fromEmail, res.ok, res.error);
  if (!res.ok) {
    // Full detail for operators in the server log; a plain reason for the app and its users.
    console.warn(`[mail] send failed for ${opts.fromEmail}: ${res.error}`);
    return { ...res, error: publicMailError(res.error) };
  }
  return res;
}

async function sendEmailViaHostingerRelayRaw(opts: SendRelayOptions): Promise<{
  ok: boolean;
  messageId?: string | null;
  error?: string;
}> {
  const endpoints = getRelayEndpoints();
  let lastErr = "Relay endpoint unreachable";

  const headers = { ...(opts.headers || {}) };
  if (opts.warmupId) {
    headers["X-Warmup-ID"] = opts.warmupId;
    headers["X-ContractorLeads-Warmup"] = "true";
  }
  if (opts.inReplyTo) {
    headers["In-Reply-To"] = opts.inReplyTo;
  }
  if (opts.references) {
    headers["References"] = opts.references;
  }

  // Use the mailbox's saved credentials when the caller (e.g. warmup) passed none.
  let password = opts.password || "";
  let host = opts.host || "";
  let port = opts.port || 0;
  if (!password) {
    const creds = await resolveSmtpCredentialsForEmail(opts.fromEmail).catch(() => null);
    if (creds?.password) {
      password = creds.password;
      host = host || creds.host || "";
      port = port || creds.port || 0;
    }
  }

  // Keep every relay's error, so the log shows why the primary relay failed
  // rather than only the last host tried.
  const relayErrors: string[] = [];
  // True once a relay answered with its own SMTP error: the relay is reachable, so
  // retrying direct SMTP from this host (blocked on Railway) cannot help.
  let relayAnswered = false;
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      // The gateway may try up to four ports (8s connect each) for GoDaddy.
      const timer = setTimeout(() => controller.abort(), 60000);

      const res = await relayFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HOSTINGER_RELAY_SECRET}`,
        },
        body: JSON.stringify({
          secret: HOSTINGER_RELAY_SECRET,
          action: "send",
          fromEmail: opts.fromEmail.toLowerCase().trim(),
          fromName: opts.fromName || "Contractor Leads",
          // Omit when unknown: mailer.php then uses its stored password (it only
          // falls back when the field is absent, not when it is empty).
          ...(password ? { password } : {}),
          ...(host ? { host } : {}),
          port: port || 465,
          to: opts.to,
          subject: opts.subject,
          html: opts.html || "",
          text: opts.text || "",
          headers,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.ok) {
          return { ok: true, messageId: data.messageId || null };
        }
        relayAnswered = true;
        relayErrors.push(`${url} error: ${data.error || "relay answered without ok"}`);
        break; // the gateway's own answer is final
      } else {
        const detail = await res.text().catch(() => "");
        relayErrors.push(`${url} returned status ${res.status}${detail ? ` (${detail.slice(0, 200)})` : ""}`);
        if (detail.trim().startsWith("{")) {
          relayAnswered = true;
          break; // the gateway's own answer is final
        }
      }
    } catch (e: any) {
      relayErrors.push(`${url} failed: ${e.message || String(e)}`);
    }
  }
  if (relayErrors.length) lastErr = relayErrors.join(" | ");

  if (relayAnswered) {
    console.warn(`[Hostinger Relay] Send failed for ${opts.fromEmail}: ${lastErr}`);
    return { ok: false, error: lastErr };
  }

  // --- AUTOMATIC DIRECT SMTP FALLBACK ---
  // If HTTP relay gateway returned 404 or was unreachable, seamlessly try direct authenticated SMTP
  console.warn(`[Hostinger Relay Fallback] HTTP relay unreachable (${lastErr}). Falling back to direct SMTP for ${opts.fromEmail}...`);
  try {
    const creds = await resolveSmtpCredentialsForEmail(opts.fromEmail);
    const smtpPayload: SmtpPayload = {
      host: opts.host || creds?.host || "smtp.hostinger.com",
      port: opts.port || creds?.port || 465,
      secure: opts.port === 465 || creds?.port === 465 || true,
      username: creds?.username || opts.fromEmail,
      password: opts.password || creds?.password || "",
      fromEmail: opts.fromEmail,
      fromName: opts.fromName || "Contractor Leads",
    };

    if (smtpPayload.password) {
      const direct = await sendViaSmtpDirect(smtpPayload, {
        from: opts.fromName ? `"${opts.fromName}" <${opts.fromEmail}>` : opts.fromEmail,
        to: opts.to,
        subject: opts.subject,
        text: opts.text || "",
        html: opts.html,
        inReplyTo: opts.inReplyTo,
        references: opts.references,
      });
      return { ok: true, messageId: direct.messageId };
    } else {
      lastErr = `Sending gateway unavailable (${lastErr}). No saved password for ${opts.fromEmail} to try direct SMTP.`;
    }
  } catch (directErr: any) {
    console.error("[Hostinger Relay Fallback] Direct SMTP error:", directErr);
    lastErr = `Sending gateway unavailable (${lastErr}). Direct SMTP also failed: ${directErr?.message || directErr}`;
  }

  return { ok: false, error: lastErr };
}
