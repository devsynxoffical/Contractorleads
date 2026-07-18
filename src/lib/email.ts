/**
 * Send transactional email via Resend (preferred) or SendGrid.
 * Without a provider key, logs the payload (dev) and returns { ok: true, mocked: true }.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; mocked?: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "Contractor Leads <onboarding@resend.dev>";

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: body || `Resend HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Resend failed",
      };
    }
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: from.includes("<") ? from.replace(/.*<|>.*/g, "") : from, name: "Contractor Leads" },
          subject: params.subject,
          content: [
            ...(params.text
              ? [{ type: "text/plain", value: params.text }]
              : []),
            { type: "text/html", value: params.html },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: body || `SendGrid HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "SendGrid failed",
      };
    }
  }

  console.info(
    `[email:mock] to=${params.to} subject=${params.subject} app=${appUrl}\n${params.text ?? params.html}`
  );
  return { ok: true, mocked: true };
}

export function verificationEmailHtml(verifyUrl: string, name?: string | null) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1224">
      <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#7b1fa2;font-weight:700">Contractor Leads</p>
      <h1 style="font-size:22px;margin:8px 0 16px">Verify your business email</h1>
      <p>${greeting}</p>
      <p>Confirm this business email to finish creating your Contractor Leads account, then set your password.</p>
      <p style="margin:28px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#e6007e,#7b1fa2);color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">Verify email</a>
      </p>
      <p style="font-size:13px;color:#6b7280">This link expires in 24 hours. If you did not sign up, you can ignore this email.</p>
    </div>
  `;
}
