import {
  relayEndpoints,
  HOSTINGER_RELAY_SECRET,
  sendViaSmtpDirect,
  resolveSmtpCredentialsForEmail,
  type SmtpPayload,
} from "@/lib/user-smtp";
import { testSmtpConnection } from "@/lib/system-smtp";

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

      const res = await fetch(url, {
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
export async function testAccountViaHostingerRelay(payload: MailboxRelayPayload): Promise<{
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

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HOSTINGER_RELAY_SECRET}`,
        },
        body: JSON.stringify({
          secret: HOSTINGER_RELAY_SECRET,
          action: "test",
          fromEmail: payload.fromEmail.toLowerCase().trim(),
          password: payload.password || "",
          host: payload.host || "",
          port: payload.port || 465,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.ok) {
          return { ok: true, message: data.message || "Connection & authentication verified via Hostinger" };
        }
        if (data.error) lastErr = data.error;
      } else {
        lastErr = `${url} returned status ${res.status}`;
      }
    } catch (e: any) {
      lastErr = `${url} failed: ${e.message || String(e)}`;
    }
  }

  // Fallback: Test directly via authenticated SMTP socket if HTTP relay returned 404 or unreachable
  try {
    const creds = await resolveSmtpCredentialsForEmail(payload.fromEmail);
    const testPayload: SmtpPayload = {
      host: payload.host || creds?.host || "smtp.hostinger.com",
      port: payload.port || creds?.port || 465,
      secure: payload.port === 465 || creds?.port === 465 || true,
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
      return { ok: false, error: direct.message };
    }
  } catch (directErr: any) {
    lastErr = `Hostinger relay unreachable (mailer.php 404). Direct test also failed: ${directErr?.message || directErr}`;
  }

  return { ok: false, error: lastErr };
}

/**
 * Send an email (campaign or warmup) via Hostinger relay
 */
export async function sendEmailViaHostingerRelay(opts: SendRelayOptions): Promise<{
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

  // Keep every relay's error, so the log shows why the primary relay failed
  // rather than only the last host tried.
  const relayErrors: string[] = [];
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
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
          password: opts.password || "",
          host: opts.host || "",
          port: opts.port || 465,
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
        relayErrors.push(`${url} error: ${data.error || "relay answered without ok"}`);
      } else {
        const detail = await res.text().catch(() => "");
        relayErrors.push(`${url} returned status ${res.status}${detail ? ` (${detail.slice(0, 160)})` : ""}`);
      }
    } catch (e: any) {
      relayErrors.push(`${url} failed: ${e.message || String(e)}`);
    }
  }
  if (relayErrors.length) lastErr = relayErrors.join(" | ");

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
      lastErr = `Hostinger relay returned 404 (mailer.php not uploaded to host). Direct SMTP could not find password for ${opts.fromEmail}. Please upload public/mailer.php to your Hostinger public_html or set HOSTINGER_RELAY_URL.`;
    }
  } catch (directErr: any) {
    console.error("[Hostinger Relay Fallback] Direct SMTP error:", directErr);
    lastErr = `Hostinger relay returned 404 (mailer.php not found on server). Direct SMTP also failed: ${directErr?.message || directErr}. Please upload public/mailer.php to your Hostinger public_html or configure HOSTINGER_RELAY_URL.`;
  }

  return { ok: false, error: lastErr };
}
