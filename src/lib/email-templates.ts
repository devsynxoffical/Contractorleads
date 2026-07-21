import {
  EMAIL_BRAND,
  EMAIL_FONT,
  appBaseUrl,
  emailLogoUrl,
} from "@/lib/email-brand";
import type { EmailTemplateFields } from "@/lib/email-template-defaults";
import { applyEmailPlaceholders } from "@/lib/email-template-defaults";

export type EmailShellLinks = {
  unsubscribeUrl?: string;
  preferencesUrl?: string;
  loginUrl?: string;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ctaButton(label: string, href: string) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0">
    <tr>
      <td style="border-radius:8px;background:${EMAIL_BRAND.buttonBg};background-image:${EMAIL_BRAND.buttonGradient};">
        <a href="${esc(href)}" style="display:inline-block;padding:12px 22px;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;letter-spacing:-0.01em;color:${EMAIL_BRAND.buttonText};text-decoration:none;border-radius:8px;">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function featureRow(_icon: string, title: string, body: string, linkLabel?: string, linkHref?: string) {
  return `
  <tr>
    <td style="padding:16px 0;border-bottom:1px solid ${EMAIL_BRAND.border};">
      <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;letter-spacing:-0.01em;color:${EMAIL_BRAND.ink};">${esc(title)}</p>
      <p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(body)}</p>
      ${
        linkLabel && linkHref
          ? `<p style="margin:8px 0 0;"><a href="${esc(linkHref)}" style="font-family:${EMAIL_FONT};font-size:13px;font-weight:500;color:${EMAIL_BRAND.link};text-decoration:underline;">${esc(linkLabel)}</a></p>`
          : ""
      }
    </td>
  </tr>`;
}

function statsRow(leadCount: number, hotCount?: number, warmCount?: number) {
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border:1px solid ${EMAIL_BRAND.border};border-radius:8px;border-collapse:separate;overflow:hidden;">
    <tr>
      <td style="padding:18px 12px;width:33.33%;text-align:center;background:${EMAIL_BRAND.cardBg};">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:22px;font-weight:600;letter-spacing:-0.03em;color:${EMAIL_BRAND.ink};">${leadCount}</p>
        <p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:11px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Total</p>
      </td>
      <td style="padding:18px 12px;width:33.33%;text-align:center;background:${EMAIL_BRAND.cardBg};border-left:1px solid ${EMAIL_BRAND.border};">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:22px;font-weight:600;letter-spacing:-0.03em;color:${EMAIL_BRAND.pink};">${hotCount ?? "—"}</p>
        <p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:11px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Hot</p>
      </td>
      <td style="padding:18px 12px;width:33.33%;text-align:center;background:${EMAIL_BRAND.cardBg};border-left:1px solid ${EMAIL_BRAND.border};">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:22px;font-weight:600;letter-spacing:-0.03em;color:${EMAIL_BRAND.purple};">${warmCount ?? "—"}</p>
        <p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:11px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Warm</p>
      </td>
    </tr>
  </table>`;
}

function sampleList(names: string[]) {
  if (!names.length) return "";
  const rows = names
    .map(
      (n, i) => `
    <tr>
      <td style="padding:11px 0;font-family:${EMAIL_FONT};font-size:13px;color:${EMAIL_BRAND.ink};border-bottom:${
        i === names.length - 1 ? "none" : `1px solid ${EMAIL_BRAND.border}`
      };">
        ${esc(n)}
      </td>
    </tr>`,
    )
    .join("");
  return `
    <p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Sample businesses</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
      ${rows}
    </table>`;
}

/**
 * Professional product email shell — clean system typography, no gradient heroes.
 */
export function renderEmailShell(params: {
  preheader: string;
  heroTitle: string;
  heroSubtitle: string;
  bodyHtml: string;
  secondaryHtml?: string;
  links?: EmailShellLinks;
}): { html: string; text: string } {
  const base = appBaseUrl();
  const logo = emailLogoUrl();
  const loginUrl = params.links?.loginUrl || `${base}/login`;
  const unsub = params.links?.unsubscribeUrl || `${base}/email/unsubscribe`;
  const prefs = params.links?.preferencesUrl || `${base}/email/preferences`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(EMAIL_BRAND.name)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.pageBg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${esc(params.preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-radius:12px;overflow:hidden;background:${EMAIL_BRAND.cardBg};border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:20px 28px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <a href="${esc(EMAIL_BRAND.siteUrl)}" style="text-decoration:none;color:${EMAIL_BRAND.ink};">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align:middle;padding-right:10px;">
                            <img src="${esc(logo)}" width="32" height="32" alt="${esc(EMAIL_BRAND.name)}" style="display:block;border:0;border-radius:999px;width:32px;height:32px;" />
                          </td>
                          <td style="vertical-align:middle;font-family:${EMAIL_FONT};font-size:15px;font-weight:600;letter-spacing:-0.02em;color:${EMAIL_BRAND.ink};">
                            Contractor <span style="color:${EMAIL_BRAND.magenta};">Leads</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <a href="${esc(loginUrl)}" style="font-family:${EMAIL_FONT};font-size:13px;font-weight:500;color:${EMAIL_BRAND.link};text-decoration:none;">
                      Log in
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px;">
              <div style="height:3px;border-radius:999px;background:${EMAIL_BRAND.buttonGradient};line-height:3px;font-size:0;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 8px;font-family:${EMAIL_FONT};">
              <p style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:22px;line-height:1.3;font-weight:600;letter-spacing:-0.03em;color:${EMAIL_BRAND.ink};">
                ${esc(params.heroTitle)}
              </p>
              ${
                params.heroSubtitle.trim()
                  ? `<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(params.heroSubtitle)}</p>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 28px;font-family:${EMAIL_FONT};color:${EMAIL_BRAND.ink};">
              ${params.bodyHtml}
            </td>
          </tr>

          ${
            params.secondaryHtml
              ? `<tr>
            <td style="padding:0 28px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-radius:8px;border:1px solid ${EMAIL_BRAND.border};background:${EMAIL_BRAND.softBg};">
                <tr>
                  <td style="padding:18px 18px;font-family:${EMAIL_FONT};color:${EMAIL_BRAND.ink};">
                    ${params.secondaryHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <tr>
            <td style="padding:0 28px 24px;font-family:${EMAIL_FONT};font-size:13px;color:${EMAIL_BRAND.muted};">
              <p style="margin:0;">— ${esc(EMAIL_BRAND.name)}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};font-family:${EMAIL_FONT};">
              <p style="margin:0 0 10px;font-size:12px;">
                <a href="${esc(EMAIL_BRAND.siteUrl)}" style="color:${EMAIL_BRAND.link};text-decoration:none;font-weight:500;">www.contractorleads.us</a>
                <span style="color:${EMAIL_BRAND.faint};"> · </span>
                <a href="${esc(prefs)}" style="color:${EMAIL_BRAND.faint};text-decoration:underline;">Email preferences</a>
                <span style="color:${EMAIL_BRAND.faint};"> · </span>
                <a href="${esc(unsub)}" style="color:${EMAIL_BRAND.faint};text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:0 0 4px;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.faint};">
                © ${new Date().getFullYear()} ${esc(EMAIL_BRAND.name)}. ${esc(EMAIL_BRAND.address)}.
              </p>
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.faint};">
                <a href="mailto:${esc(EMAIL_BRAND.supportEmail)}" style="color:${EMAIL_BRAND.faint};text-decoration:none;">${esc(EMAIL_BRAND.supportEmail)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    params.preheader,
    "",
    params.heroTitle,
    params.heroSubtitle,
    "",
    "Log in: " + loginUrl,
    "",
    "Email preferences: " + prefs,
    "Unsubscribe: " + unsub,
    "",
    `© ${new Date().getFullYear()} ${EMAIL_BRAND.name}`,
    EMAIL_BRAND.address,
    EMAIL_BRAND.supportEmail,
  ].join("\n");

  return { html, text };
}

export function verificationEmailContent(opts: {
  verifyUrl: string;
  name?: string | null;
  unsubscribeUrl?: string;
}) {
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi,";
  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(greeting)} Confirm this email to finish creating your account and set your password.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${featureRow("", "Business email verification", "We only accept work emails so your workspace stays professional.")}
      ${featureRow("", "Starter credits included", "Run live Google Places searches with Hot / Warm / Nurture scoring.")}
      ${featureRow("", "Pipeline ready", "Save leads and sync status changes to Slack or GoHighLevel.")}
    </table>
    <div style="margin:28px 0 8px;">
      ${ctaButton("Verify email", opts.verifyUrl)}
    </div>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.faint};">
      This link expires in 24 hours. If you didn’t create an account, you can ignore this message.
    </p>`;

  return renderEmailShell({
    preheader: "Confirm your email to finish signup.",
    heroTitle: "Verify your email",
    heroSubtitle: "One step left before you can sign in.",
    bodyHtml,
    secondaryHtml: `
      <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:${EMAIL_BRAND.ink};">Need help?</p>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
        Contact ${esc(EMAIL_BRAND.supportEmail)}.
      </p>
      ${ctaButton("Log in", `${appBaseUrl()}/login`)}`,
    links: { unsubscribeUrl: opts.unsubscribeUrl },
  });
}

export function welcomeEmailContent(opts: {
  name?: string | null;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}) {
  const base = appBaseUrl();
  const dash = opts.dashboardUrl || `${base}/dashboard`;
  const greeting = opts.name ? `Welcome, ${opts.name}` : "Welcome";
  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      Your account is ready. Search for contractors by trade and location, review scored results, and save the best leads to your pipeline.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${featureRow("", "Lead Finder", "Search by trade, city, ZIP, and radius.", "Open Lead Finder", `${base}/leads/search`)}
      ${featureRow("", "Hot leads", "Filter to the highest-scoring opportunities.", "View hot leads", `${base}/leads/hot`)}
      ${featureRow("", "Pipeline", "Track stages and sync Slack or GoHighLevel.", "Open pipeline", `${base}/leads/pipeline`)}
    </table>
    <div style="margin:28px 0 8px;">
      ${ctaButton("Open dashboard", dash)}
    </div>`;

  return renderEmailShell({
    preheader: "Your Contractor Leads account is ready.",
    heroTitle: greeting,
    heroSubtitle: "You’re set up and ready to run your first search.",
    bodyHtml,
    secondaryHtml: `
      <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:${EMAIL_BRAND.ink};">Need more capacity?</p>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
        Upgrade under Plans &amp; Billing for higher monthly limits and integrations.
      </p>
      ${ctaButton("View plans", `${base}/billing`)}`,
    links: {
      unsubscribeUrl: opts.unsubscribeUrl,
      preferencesUrl: opts.preferencesUrl,
    },
  });
}

export function passwordResetEmailContent(opts: {
  resetUrl: string;
  name?: string | null;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}) {
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi,";
  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(greeting)} We received a request to reset your password. Use the button below to choose a new one. This link expires in 1 hour.
    </p>
    <div style="margin:8px 0 16px;">
      ${ctaButton("Reset password", opts.resetUrl)}
    </div>
    <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.faint};">
      If you didn’t request this, you can ignore this email. Your password will stay the same.
    </p>`;

  return renderEmailShell({
    preheader: "Reset your password — link expires in 1 hour.",
    heroTitle: "Reset your password",
    heroSubtitle: "This link is only valid for one hour.",
    bodyHtml,
    links: {
      unsubscribeUrl: opts.unsubscribeUrl,
      preferencesUrl: opts.preferencesUrl,
    },
  });
}

export function leadScrapeEmailContent(opts: {
  name?: string | null;
  industry: string;
  locationLabel: string;
  leadCount: number;
  hotCount?: number;
  warmCount?: number;
  sampleNames?: string[];
  searchUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}) {
  const base = appBaseUrl();
  const searchUrl = opts.searchUrl || `${base}/leads/search`;
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi,";
  const samples = (opts.sampleNames || []).slice(0, 5);

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(greeting)} Your <strong style="font-weight:600;color:${EMAIL_BRAND.ink};">${esc(opts.industry)}</strong> search ${esc(opts.locationLabel)} returned <strong style="font-weight:600;color:${EMAIL_BRAND.ink};">${opts.leadCount}</strong> leads.
    </p>
    ${statsRow(opts.leadCount, opts.hotCount, opts.warmCount)}
    ${sampleList(samples)}
    <div style="margin:24px 0 8px;">
      ${ctaButton("Review leads", searchUrl)}
    </div>`;

  return renderEmailShell({
    preheader: `${opts.leadCount} ${opts.industry} leads ready ${opts.locationLabel}.`,
    heroTitle: "Your search results are ready",
    heroSubtitle: `${opts.leadCount} ${opts.industry} leads ${opts.locationLabel}.`,
    bodyHtml,
    secondaryHtml: `
      <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:${EMAIL_BRAND.ink};">Next</p>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
        Save leads to your pipeline, export CSV, or sync status updates to Slack and GoHighLevel.
      </p>
      ${ctaButton("Open pipeline", `${base}/leads/pipeline`)}`,
    links: {
      unsubscribeUrl: opts.unsubscribeUrl,
      preferencesUrl: opts.preferencesUrl,
    },
  });
}

export { ctaButton, featureRow };

export function renderManagedTemplate(opts: {
  template: EmailTemplateFields;
  vars?: Record<string, string | number | null | undefined>;
  /** Absolute CTA URL override (verify/reset tokens). */
  ctaUrl?: string;
  scrapeStats?: { leadCount: number; hotCount?: number; warmCount?: number };
  sampleNames?: string[];
  links?: EmailShellLinks;
}): { subject: string; html: string; text: string } {
  const vars = opts.vars ?? {};
  const t = opts.template;
  const fill = (s: string) => applyEmailPlaceholders(s, vars);
  const base = appBaseUrl();
  const ctaHref =
    opts.ctaUrl ||
    `${base}${t.ctaPath.startsWith("/") ? t.ctaPath : `/${t.ctaPath}`}`;

  const features: Array<[string, string, string]> = [];
  if (t.feature1Title.trim())
    features.push(["", fill(t.feature1Title), fill(t.feature1Body)]);
  if (t.feature2Title.trim())
    features.push(["", fill(t.feature2Title), fill(t.feature2Body)]);
  if (t.feature3Title.trim())
    features.push(["", fill(t.feature3Title), fill(t.feature3Body)]);

  const statsHtml =
    opts.scrapeStats != null
      ? statsRow(
          opts.scrapeStats.leadCount,
          opts.scrapeStats.hotCount,
          opts.scrapeStats.warmCount,
        )
      : "";

  const featureTable = features.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
        ${features.map(([icon, title, body]) => featureRow(icon, title, body)).join("")}
      </table>`
    : "";

  const bodyHtml = `
    ${
      t.headline.trim()
        ? `<p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:15px;font-weight:600;letter-spacing:-0.01em;color:${EMAIL_BRAND.ink};">${esc(fill(t.headline))}</p>`
        : ""
    }
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(fill(t.body))}
    </p>
    ${statsHtml}
    ${sampleList(opts.sampleNames || [])}
    ${featureTable}
    <div style="margin:24px 0 8px;">
      ${ctaButton(fill(t.ctaLabel), ctaHref)}
    </div>`;

  let secondaryHtml: string | undefined;
  if (t.secondaryTitle.trim() || t.secondaryBody.trim()) {
    const secCta =
      t.secondaryCtaLabel.trim() && t.secondaryCtaPath.trim()
        ? `<div style="margin-top:12px;">${ctaButton(
            fill(t.secondaryCtaLabel),
            `${base}${t.secondaryCtaPath.startsWith("/") ? t.secondaryCtaPath : `/${t.secondaryCtaPath}`}`,
          )}</div>`
        : "";
    secondaryHtml = `
      ${t.secondaryTitle.trim() ? `<p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:${EMAIL_BRAND.ink};">${esc(fill(t.secondaryTitle))}</p>` : ""}
      ${t.secondaryBody.trim() ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">${esc(fill(t.secondaryBody))}</p>` : ""}
      ${secCta}`;
  }

  const shell = renderEmailShell({
    preheader: fill(t.preheader),
    heroTitle: fill(t.heroTitle),
    heroSubtitle: fill(t.heroSubtitle),
    bodyHtml,
    secondaryHtml,
    links: opts.links,
  });

  return {
    subject: fill(t.subject),
    html: shell.html,
    text: [
      fill(t.preheader),
      "",
      fill(t.heroTitle),
      fill(t.heroSubtitle),
      "",
      fill(t.headline),
      fill(t.body),
      "",
      `CTA: ${ctaHref}`,
    ].join("\n"),
  };
}
