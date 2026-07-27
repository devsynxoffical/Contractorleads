import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/email-brand";
import {
  checkoutAbandonedEmailContent,
  enterpriseBookingConfirmationEmail,
  enterpriseBookingNotifyEmail,
  passwordResetEmailContent,
  paymentReceiptEmailContent,
  purchaseConfirmationEmailContent,
  renderManagedTemplate,
  verificationEmailContent,
} from "@/lib/email-templates";
import { getEmailTemplate } from "@/lib/email-template-store";
import {
  DEFAULT_FROM_EMAIL,
  getEmailProviderSecrets,
} from "@/lib/email-config";
import type { EmailTemplateKey } from "@/lib/email-template-defaults";
import { requireSessionSecret } from "@/lib/server-secrets";

/** Strip HTML for a reliable plain-text alternative (Resend deliverability). */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/(div|h[1-6]|li)>/gi, "\n")
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Send transactional email via Resend (preferred) or SendGrid.
 * Keys come from admin settings (DB) first, then env.
 *
 * In production a missing provider key is a hard error — never a silent mock —
 * so live signups can't hand out verification links in the browser.
 *
 * Deliverability helpers:
 * - plain-text alternative (always included)
 * - List-Unsubscribe headers when unsubscribeUrl is provided
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  unsubscribeUrl?: string;
  tags?: string[];
}): Promise<{ ok: boolean; mocked?: boolean; error?: string }> {
  const config = await getEmailProviderSecrets().catch(() => null);
  const from = config?.fromEmail || DEFAULT_FROM_EMAIL;
  const text =
    (params.text && params.text.trim()) || htmlToPlainText(params.html);

  const listUnsub = params.unsubscribeUrl
    ? `<${params.unsubscribeUrl}>`
    : undefined;

  const resendKey = config?.resendApiKey;
  if (resendKey) {
    try {
      const payload: Record<string, unknown> = {
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text,
        headers: listUnsub
          ? {
              "List-Unsubscribe": listUnsub,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            }
          : undefined,
        tags: params.tags?.map((name) => ({ name })),
      };
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

  const sendgridKey = config?.sendgridApiKey;
  if (sendgridKey) {
    try {
      const fromEmail = from.includes("<")
        ? from.replace(/.*<|>.*/g, "")
        : from;
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: fromEmail, name: "Contractor Leads" },
          subject: params.subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: params.html },
          ],
          headers: listUnsub
            ? {
                "List-Unsubscribe": listUnsub,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              }
            : undefined,
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

  if (process.env.NODE_ENV === "production") {
    return {
      ok: false,
      error:
        "No email provider configured. Add a Resend or SendGrid API key under Admin → System & API Keys.",
    };
  }

  console.info(
    `[email:mock] to=${params.to} subject=${params.subject}\n${params.text ?? params.html}`,
  );
  return { ok: true, mocked: true };
}

function signEmailAction(payload: string) {
  return crypto
    .createHmac("sha256", requireSessionSecret())
    .update(payload)
    .digest("hex");
}

/** Signed token so users can unsubscribe without logging in. */
export function createEmailActionToken(userId: string, purpose: "unsub" | "prefs") {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 90;
  const payload = `${purpose}.${userId}.${exp}`;
  return Buffer.from(`${payload}.${signEmailAction(payload)}`).toString("base64url");
}

export function verifyEmailActionToken(
  token: string,
  purpose: "unsub" | "prefs",
): { ok: true; userId: string } | { ok: false; error: string } {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [p, userId, expStr, sig] = raw.split(".");
    if (p !== purpose || !userId || !expStr || !sig) {
      return { ok: false, error: "Invalid token" };
    }
    if (Number(expStr) < Date.now()) {
      return { ok: false, error: "Token expired" };
    }
    const expected = signEmailAction(`${p}.${userId}.${expStr}`);
    const expectedBuf = Buffer.from(expected, "utf8");
    const sigBuf = Buffer.from(sig, "utf8");
    if (
      expectedBuf.length !== sigBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, sigBuf)
    ) {
      return { ok: false, error: "Invalid signature" };
    }
    return { ok: true, userId };
  } catch {
    return { ok: false, error: "Invalid token" };
  }
}

export function unsubscribeUrlForUser(userId: string) {
  const token = createEmailActionToken(userId, "unsub");
  return `${appBaseUrl()}/email/unsubscribe?token=${token}`;
}

export function preferencesUrlForUser(userId: string) {
  const token = createEmailActionToken(userId, "prefs");
  return `${appBaseUrl()}/email/preferences?token=${token}`;
}

/** @deprecated use sendVerificationEmail — kept for older imports */
export function verificationEmailHtml(verifyUrl: string, name?: string | null) {
  return verificationEmailContent({ verifyUrl, name }).html;
}

export async function sendVerificationEmail(opts: {
  to: string;
  verifyUrl: string;
  name?: string | null;
}) {
  // Auth-critical: never silently skip when an admin disables the template.
  const template = await getEmailTemplate("verify");
  let subject: string;
  let html: string;
  let text: string;
  if (template.enabled) {
    const rendered = renderManagedTemplate({
      template,
      vars: { name: opts.name || "there" },
      ctaUrl: opts.verifyUrl,
    });
    subject = rendered.subject;
    html = rendered.html;
    text = rendered.text;
  } else {
    const fallback = verificationEmailContent({
      verifyUrl: opts.verifyUrl,
      name: opts.name,
    });
    subject = "Verify your Contractor Leads email";
    html = fallback.html;
    text = fallback.text;
  }
  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
    tags: ["verification"],
  });
}

export async function sendWelcomeEmail(opts: {
  userId: string;
  to: string;
  name?: string | null;
}) {
  const template = await getEmailTemplate("welcome");
  if (!template.enabled) {
    return { ok: true as const, skipped: true as const };
  }
  const unsub = unsubscribeUrlForUser(opts.userId);
  const prefs = preferencesUrlForUser(opts.userId);
  const rendered = renderManagedTemplate({
    template,
    vars: { name: opts.name || "there" },
    links: { unsubscribeUrl: unsub, preferencesUrl: prefs },
  });
  return sendEmail({
    to: opts.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    unsubscribeUrl: unsub,
    tags: ["welcome"],
  });
}

export async function sendPasswordResetEmail(opts: {
  userId: string;
  to: string;
  resetUrl: string;
  name?: string | null;
}) {
  // Auth-critical: always send, even if the admin template toggle is off.
  const template = await getEmailTemplate("reset");
  const unsub = unsubscribeUrlForUser(opts.userId);
  const prefs = preferencesUrlForUser(opts.userId);
  let subject: string;
  let html: string;
  let text: string;
  if (template.enabled) {
    const rendered = renderManagedTemplate({
      template,
      vars: { name: opts.name || "there" },
      ctaUrl: opts.resetUrl,
      links: { unsubscribeUrl: unsub, preferencesUrl: prefs },
    });
    subject = rendered.subject;
    html = rendered.html;
    text = rendered.text;
  } else {
    const fallback = passwordResetEmailContent({
      resetUrl: opts.resetUrl,
      name: opts.name,
      unsubscribeUrl: unsub,
      preferencesUrl: prefs,
    });
    subject = "Reset your Contractor Leads password";
    html = fallback.html;
    text = fallback.text;
  }
  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
    unsubscribeUrl: unsub,
    tags: ["password-reset"],
  });
}

export async function sendLeadScrapeEmail(opts: {
  userId: string;
  to: string;
  name?: string | null;
  industry: string;
  locationLabel: string;
  leadCount: number;
  hotCount?: number;
  warmCount?: number;
  sampleNames?: string[];
  searchUrl?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { emailMarketingOptIn: true },
  });
  if (user && user.emailMarketingOptIn === false) {
    return { ok: true as const, skipped: true as const };
  }

  const template = await getEmailTemplate("scrape");
  if (!template.enabled) {
    return { ok: true as const, skipped: true as const };
  }

  const unsub = unsubscribeUrlForUser(opts.userId);
  const prefs = preferencesUrlForUser(opts.userId);
  const rendered = renderManagedTemplate({
    template,
    vars: {
      name: opts.name || "there",
      industry: opts.industry,
      location: opts.locationLabel,
      leadCount: opts.leadCount,
      hotCount: opts.hotCount ?? 0,
      warmCount: opts.warmCount ?? 0,
    },
    ctaUrl: opts.searchUrl,
    scrapeStats: {
      leadCount: opts.leadCount,
      hotCount: opts.hotCount,
      warmCount: opts.warmCount,
    },
    sampleNames: opts.sampleNames,
    links: { unsubscribeUrl: unsub, preferencesUrl: prefs },
  });
  return sendEmail({
    to: opts.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    unsubscribeUrl: unsub,
    tags: ["lead-scrape"],
  });
}

/**
 * Purchase / subscription confirmation ("thank you for purchasing").
 * Transactional — always sent (not gated by marketing opt-in).
 */
export async function sendPurchaseConfirmationEmail(opts: {
  userId: string;
  to: string;
  name?: string | null;
  planName: string;
  monthlyCredits?: number | null;
  monthlyLeads?: number | null;
  isUpgrade?: boolean;
}) {
  const unsub = unsubscribeUrlForUser(opts.userId);
  const prefs = preferencesUrlForUser(opts.userId);
  const content = purchaseConfirmationEmailContent({
    name: opts.name,
    planName: opts.planName,
    monthlyCredits: opts.monthlyCredits,
    monthlyLeads: opts.monthlyLeads,
    isUpgrade: opts.isUpgrade,
    dashboardUrl: `${appBaseUrl()}/dashboard`,
    billingUrl: `${appBaseUrl()}/billing`,
    unsubscribeUrl: unsub,
    preferencesUrl: prefs,
  });
  return sendEmail({
    to: opts.to,
    subject: opts.isUpgrade
      ? `You're now on ${opts.planName} — Contractor Leads`
      : `Thanks for subscribing to ${opts.planName}`,
    html: content.html,
    text: content.text,
    unsubscribeUrl: unsub,
    tags: ["purchase-confirmation"],
  });
}

/**
 * Payment receipt for every successful Stripe invoice (first charge + renewals).
 * Transactional — always sent (not gated by marketing opt-in).
 */
export async function sendPaymentReceiptEmail(opts: {
  userId: string;
  to: string;
  name?: string | null;
  planName: string;
  amountLabel: string;
  invoiceNumber?: string | null;
  paidAtLabel: string;
  invoiceUrl?: string | null;
  pdfUrl?: string | null;
}) {
  const unsub = unsubscribeUrlForUser(opts.userId);
  const prefs = preferencesUrlForUser(opts.userId);
  const content = paymentReceiptEmailContent({
    name: opts.name,
    planName: opts.planName,
    amountLabel: opts.amountLabel,
    invoiceNumber: opts.invoiceNumber,
    paidAtLabel: opts.paidAtLabel,
    invoiceUrl: opts.invoiceUrl,
    pdfUrl: opts.pdfUrl,
    billingUrl: `${appBaseUrl()}/billing`,
    unsubscribeUrl: unsub,
    preferencesUrl: prefs,
  });
  return sendEmail({
    to: opts.to,
    subject: `Receipt: ${opts.amountLabel} — ${opts.planName} · Contractor Leads`,
    html: content.html,
    text: content.text,
    unsubscribeUrl: unsub,
    tags: ["payment-receipt"],
  });
}

/**
 * Checkout started but not completed (canceled or expired session).
 * Transactional — always sent (not gated by marketing opt-in).
 */
export async function sendCheckoutAbandonedEmail(opts: {
  userId: string;
  to: string;
  name?: string | null;
  planName: string;
}) {
  const unsub = unsubscribeUrlForUser(opts.userId);
  const prefs = preferencesUrlForUser(opts.userId);
  const content = checkoutAbandonedEmailContent({
    name: opts.name,
    planName: opts.planName,
    billingUrl: `${appBaseUrl()}/billing`,
    unsubscribeUrl: unsub,
    preferencesUrl: prefs,
  });
  return sendEmail({
    to: opts.to,
    subject: `Still interested in ${opts.planName}? Finish checkout anytime`,
    html: content.html,
    text: content.text,
    unsubscribeUrl: unsub,
    tags: ["checkout-abandoned"],
  });
}

/** Confirmation to the prospect + internal alert to sales inbox. */
export async function sendEnterpriseBookingEmails(opts: {
  to: string;
  notifyTo: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  message?: string | null;
  whenLabel: string;
  source?: string | null;
}) {
  const confirm = enterpriseBookingConfirmationEmail({
    name: opts.name,
    whenLabel: opts.whenLabel,
    company: opts.company,
  });
  const internal = enterpriseBookingNotifyEmail({
    name: opts.name,
    email: opts.to,
    company: opts.company,
    phone: opts.phone,
    message: opts.message,
    whenLabel: opts.whenLabel,
    source: opts.source,
  });

  const [clientRes, teamRes] = await Promise.all([
    sendEmail({
      to: opts.to,
      subject: `Enterprise call confirmed — ${opts.whenLabel}`,
      html: confirm.html,
      text: confirm.text,
      tags: ["enterprise-booking-confirm"],
    }),
    sendEmail({
      to: opts.notifyTo,
      subject: `New Enterprise booking: ${opts.name} · ${opts.whenLabel}`,
      html: internal.html,
      text: internal.text,
      tags: ["enterprise-booking-notify"],
    }),
  ]);

  return {
    clientOk: clientRes.ok,
    teamOk: teamRes.ok,
    clientError: clientRes.error,
    teamError: teamRes.error,
  };
}

export type { EmailTemplateKey };
