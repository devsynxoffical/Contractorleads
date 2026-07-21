import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/email-brand";
import {
  renderManagedTemplate,
  verificationEmailContent,
} from "@/lib/email-templates";
import { getEmailTemplate } from "@/lib/email-template-store";
import type { EmailTemplateKey } from "@/lib/email-template-defaults";

/**
 * Send transactional email via Resend (preferred) or SendGrid.
 * Without a provider key, logs the payload (dev) and returns { ok: true, mocked: true }.
 *
 * Deliverability helpers:
 * - plain-text alternative
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
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "Contractor Leads <onboarding@resend.dev>";

  const listUnsub = params.unsubscribeUrl
    ? `<${params.unsubscribeUrl}>`
    : undefined;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const payload: Record<string, unknown> = {
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
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

  const sendgridKey = process.env.SENDGRID_API_KEY;
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
            ...(params.text
              ? [{ type: "text/plain", value: params.text }]
              : []),
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

  console.info(
    `[email:mock] to=${params.to} subject=${params.subject}\n${params.text ?? params.html}`,
  );
  return { ok: true, mocked: true };
}

function unsubscribeSecret() {
  return process.env.JWT_SECRET || "leadflow-dev-secret-change-in-production";
}

/** Signed token so users can unsubscribe without logging in. */
export function createEmailActionToken(userId: string, purpose: "unsub" | "prefs") {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 90;
  const payload = `${purpose}.${userId}.${exp}`;
  const sig = crypto
    .createHmac("sha256", unsubscribeSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 32);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
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
    const payload = `${p}.${userId}.${expStr}`;
    const expected = crypto
      .createHmac("sha256", unsubscribeSecret())
      .update(payload)
      .digest("hex")
      .slice(0, 32);
    if (expected !== sig) return { ok: false, error: "Invalid signature" };
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
  const template = await getEmailTemplate("verify");
  if (!template.enabled) {
    return { ok: true as const, skipped: true as const };
  }
  const rendered = renderManagedTemplate({
    template,
    vars: { name: opts.name || "there" },
    ctaUrl: opts.verifyUrl,
  });
  return sendEmail({
    to: opts.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
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
  const template = await getEmailTemplate("reset");
  if (!template.enabled) {
    return { ok: true as const, skipped: true as const };
  }
  const unsub = unsubscribeUrlForUser(opts.userId);
  const prefs = preferencesUrlForUser(opts.userId);
  const rendered = renderManagedTemplate({
    template,
    vars: { name: opts.name || "there" },
    ctaUrl: opts.resetUrl,
    links: { unsubscribeUrl: unsub, preferencesUrl: prefs },
  });
  return sendEmail({
    to: opts.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
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

export type { EmailTemplateKey };
