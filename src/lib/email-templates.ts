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

function ctaButton(label: string, href: string, opts?: { fullWidth?: boolean }) {
  const widthStyle = opts?.fullWidth ? "width:100%;text-align:center;" : "";
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="${opts?.fullWidth ? "width:100%;" : ""}">
    <tr>
      <td style="border-radius:10px;background:${EMAIL_BRAND.buttonBg};background-image:${EMAIL_BRAND.buttonGradient};${widthStyle}">
        <a href="${esc(href)}" style="display:inline-block;${opts?.fullWidth ? "width:100%;box-sizing:border-box;text-align:center;" : ""}padding:13px 24px;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;letter-spacing:-0.01em;color:${EMAIL_BRAND.buttonText};text-decoration:none;border-radius:10px;">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function secondaryButton(label: string, href: string) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;">
    <tr>
      <td style="border-radius:999px;border:1px solid ${EMAIL_BRAND.footerBorder};background:rgba(255,255,255,0.06);text-align:center;">
        <a href="${esc(href)}" style="display:inline-block;width:100%;box-sizing:border-box;padding:11px 20px;font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:${EMAIL_BRAND.footerText};text-decoration:none;border-radius:999px;">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function whitePillButton(label: string, href: string) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;">
    <tr>
      <td style="border-radius:999px;background:#ffffff;text-align:center;">
        <a href="${esc(href)}" style="display:inline-block;width:100%;box-sizing:border-box;padding:11px 20px;font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:#171717;text-decoration:none;border-radius:999px;">
          ${esc(label)} →
        </a>
      </td>
    </tr>
  </table>`;
}

function featureRow(
  _icon: string,
  title: string,
  body: string,
  linkLabel?: string,
  linkHref?: string,
) {
  return `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid ${EMAIL_BRAND.border};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="40" valign="top" style="padding-right:12px;">
            <div style="width:32px;height:32px;border-radius:9px;background:${EMAIL_BRAND.heroBg};border:1px solid ${EMAIL_BRAND.border};text-align:center;line-height:32px;font-family:${EMAIL_FONT};font-size:13px;font-weight:700;color:${EMAIL_BRAND.magenta};">
              ◆
            </div>
          </td>
          <td valign="top">
            <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;letter-spacing:-0.01em;color:${EMAIL_BRAND.ink};">${esc(title)}</p>
            <p style="margin:5px 0 0;font-family:${EMAIL_FONT};font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(body)}</p>
            ${
              linkLabel && linkHref
                ? `<p style="margin:8px 0 0;"><a href="${esc(linkHref)}" style="font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:${EMAIL_BRAND.link};text-decoration:none;">${esc(linkLabel)} →</a></p>`
                : ""
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function statsRow(leadCount: number, hotCount?: number, warmCount?: number) {
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;border:1px solid ${EMAIL_BRAND.border};border-radius:12px;border-collapse:separate;overflow:hidden;background:${EMAIL_BRAND.softBg};">
    <tr>
      <td style="padding:18px 12px;width:33.33%;text-align:center;">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:24px;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_BRAND.ink};">${leadCount}</p>
        <p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Total</p>
      </td>
      <td style="padding:18px 12px;width:33.33%;text-align:center;border-left:1px solid ${EMAIL_BRAND.border};">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:24px;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_BRAND.pink};">${hotCount ?? "—"}</p>
        <p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Hot</p>
      </td>
      <td style="padding:18px 12px;width:33.33%;text-align:center;border-left:1px solid ${EMAIL_BRAND.border};">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:24px;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_BRAND.purple};">${warmCount ?? "—"}</p>
        <p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Warm</p>
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
      <td style="padding:12px 14px;font-family:${EMAIL_FONT};font-size:13px;font-weight:500;color:${EMAIL_BRAND.ink};border-bottom:${
        i === names.length - 1 ? "none" : `1px solid ${EMAIL_BRAND.border}`
      };">
        <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:${EMAIL_BRAND.magenta};margin-right:10px;vertical-align:middle;"></span>
        ${esc(n)}
      </td>
    </tr>`,
    )
    .join("");
  return `
    <p style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.faint};">Sample businesses</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;border:1px solid ${EMAIL_BRAND.border};border-radius:12px;border-collapse:separate;overflow:hidden;background:${EMAIL_BRAND.cardBg};">
      ${rows}
    </table>`;
}

/** Site-style header: logo, nav, Sign in, Start free trial */
function emailHeader(loginUrl: string, registerUrl: string, logo: string) {
  const site = EMAIL_BRAND.siteUrl;
  return `
  <tr>
    <td style="padding:18px 24px;background:${EMAIL_BRAND.cardBg};border-bottom:1px solid ${EMAIL_BRAND.border};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="left" style="vertical-align:middle;">
            <a href="${esc(site)}" style="text-decoration:none;color:${EMAIL_BRAND.ink};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${esc(logo)}" width="36" height="36" alt="${esc(EMAIL_BRAND.name)}" style="display:block;border:0;border-radius:999px;width:36px;height:36px;" />
                  </td>
                  <td style="vertical-align:middle;font-family:${EMAIL_FONT};font-size:15px;font-weight:600;letter-spacing:-0.02em;color:${EMAIL_BRAND.ink};">
                    Contractor <span style="background:${EMAIL_BRAND.buttonGradient};-webkit-background-clip:text;background-clip:text;color:${EMAIL_BRAND.magenta};">Leads</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
          <td align="right" style="vertical-align:middle;">
            <a href="${esc(loginUrl)}" style="font-family:${EMAIL_FONT};font-size:12px;font-weight:500;color:${EMAIL_BRAND.muted};text-decoration:none;padding-right:10px;">Sign in</a>
            <a href="${esc(registerUrl)}" style="display:inline-block;padding:9px 14px;font-family:${EMAIL_FONT};font-size:12px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background:${EMAIL_BRAND.buttonBg};background-image:${EMAIL_BRAND.buttonGradient};">Start free trial</a>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
        <tr>
          <td align="left" style="font-family:${EMAIL_FONT};font-size:12px;">
            <a href="${esc(site)}/#features" style="color:${EMAIL_BRAND.muted};text-decoration:none;font-weight:500;padding-right:14px;">Features</a>
            <a href="${esc(site)}/#technology" style="color:${EMAIL_BRAND.muted};text-decoration:none;font-weight:500;padding-right:14px;">Technology</a>
            <a href="${esc(site)}/#pricing" style="color:${EMAIL_BRAND.muted};text-decoration:none;font-weight:500;padding-right:14px;">Pricing</a>
            <a href="${esc(site)}/#faq" style="color:${EMAIL_BRAND.muted};text-decoration:none;font-weight:500;">FAQ</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Soft brand hero panel under header */
function emailHero(title: string, subtitle: string) {
  return `
  <tr>
    <td style="padding:20px 24px 8px;background:${EMAIL_BRAND.cardBg};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-radius:16px;overflow:hidden;background:${EMAIL_BRAND.heroBg};border:1px solid ${EMAIL_BRAND.border};">
        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_BRAND.magenta};">
              ${esc(EMAIL_BRAND.name)}
            </p>
            <h1 style="margin:0;font-family:${EMAIL_FONT};font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_BRAND.ink};">
              ${esc(title)}
            </h1>
            ${
              subtitle.trim()
                ? `<p style="margin:12px 0 0;font-family:${EMAIL_FONT};font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};max-width:440px;">${esc(subtitle)}</p>`
                : ""
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Dark marketing-style footer with CTAs + link columns */
function emailFooter(opts: {
  logo: string;
  loginUrl: string;
  registerUrl: string;
  prefs: string;
  unsub: string;
}) {
  const site = EMAIL_BRAND.siteUrl;
  const year = new Date().getFullYear();
  return `
  <tr>
    <td style="padding:0;background:${EMAIL_BRAND.footerBg};background-image:linear-gradient(180deg,${EMAIL_BRAND.footerBgTop} 0%,${EMAIL_BRAND.footerBg} 42%,#120a28 100%);">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:28px 24px 8px;text-align:center;">
            <p style="margin:0;font-family:${EMAIL_FONT};font-size:18px;font-weight:800;letter-spacing:-0.04em;text-transform:uppercase;color:rgba(255,255,255,0.18);">
              CONTRACTOR LEADS
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 8px;border-top:1px solid ${EMAIL_BRAND.footerBorder};">
            <p style="margin:0 0 12px;font-family:${EMAIL_FONT};font-size:13px;font-weight:600;color:${EMAIL_BRAND.footerText};">Get started</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-bottom:8px;">
                  ${whitePillButton("Start free trial", opts.registerUrl)}
                </td>
              </tr>
              <tr>
                <td>
                  ${secondaryButton("Sign in", opts.loginUrl)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%" valign="top" style="padding-right:10px;">
                  <p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:12px;font-weight:600;color:${EMAIL_BRAND.footerText};">Product</p>
                  <p style="margin:0 0 6px;"><a href="${esc(site)}/#features" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">Features</a></p>
                  <p style="margin:0 0 6px;"><a href="${esc(site)}/#pricing" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">Pricing</a></p>
                  <p style="margin:0 0 6px;"><a href="${esc(site)}/leads/search" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">Lead Finder</a></p>
                  <p style="margin:0;"><a href="${esc(site)}/leads/pipeline" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">Pipeline CRM</a></p>
                </td>
                <td width="50%" valign="top" style="padding-left:10px;">
                  <p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:12px;font-weight:600;color:${EMAIL_BRAND.footerText};">Company</p>
                  <p style="margin:0 0 6px;"><a href="${esc(site)}" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">About</a></p>
                  <p style="margin:0 0 6px;"><a href="${esc(site)}/#faq" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">Help / FAQ</a></p>
                  <p style="margin:0 0 6px;"><a href="mailto:${esc(EMAIL_BRAND.contactEmail)}" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">Contact</a></p>
                  <p style="margin:0;"><a href="${esc(site)}" style="font-family:${EMAIL_FONT};font-size:12px;color:${EMAIL_BRAND.footerMuted};text-decoration:none;">www.contractorleads.us</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 24px 10px;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <img src="${esc(opts.logo)}" width="28" height="28" alt="" style="display:block;border:0;border-radius:999px;width:28px;height:28px;" />
                </td>
                <td style="vertical-align:middle;font-family:${EMAIL_FONT};font-size:12px;line-height:1.4;color:${EMAIL_BRAND.footerMuted};">
                  ${esc(EMAIL_BRAND.tagline)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid ${EMAIL_BRAND.footerBorder};">
            <p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:11px;">
              <a href="${esc(opts.prefs)}" style="color:${EMAIL_BRAND.footerFaint};text-decoration:underline;">Email preferences</a>
              <span style="color:${EMAIL_BRAND.footerFaint};"> · </span>
              <a href="${esc(opts.unsub)}" style="color:${EMAIL_BRAND.footerFaint};text-decoration:underline;">Unsubscribe</a>
              <span style="color:${EMAIL_BRAND.footerFaint};"> · </span>
              <a href="mailto:${esc(EMAIL_BRAND.supportEmail)}" style="color:${EMAIL_BRAND.footerFaint};text-decoration:none;">${esc(EMAIL_BRAND.supportEmail)}</a>
            </p>
            <p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:11px;color:${EMAIL_BRAND.footerFaint};">
              © ${year} ${esc(EMAIL_BRAND.name)}. All rights reserved.
            </p>
            <p style="margin:0;font-family:${EMAIL_FONT};font-size:11px;color:${EMAIL_BRAND.footerFaint};">
              ${esc(EMAIL_BRAND.address)} · Built for agencies that sell to contractors.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/**
 * Full branded shell matching contractorleads.us header + dark footer.
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
  const registerUrl = `${EMAIL_BRAND.siteUrl}/register`;
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
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.pageBg};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-collapse:separate;border-radius:16px;overflow:hidden;background:${EMAIL_BRAND.cardBg};border:1px solid ${EMAIL_BRAND.border};box-shadow:0 12px 40px rgba(26,20,36,0.08);">
          ${emailHeader(loginUrl, registerUrl, logo)}
          ${emailHero(params.heroTitle, params.heroSubtitle)}

          <tr>
            <td style="padding:20px 28px 28px;font-family:${EMAIL_FONT};color:${EMAIL_BRAND.ink};background:${EMAIL_BRAND.cardBg};">
              ${params.bodyHtml}
            </td>
          </tr>

          ${
            params.secondaryHtml
              ? `<tr>
            <td style="padding:0 24px 28px;background:${EMAIL_BRAND.cardBg};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-radius:14px;border:1px solid ${EMAIL_BRAND.border};background:${EMAIL_BRAND.softBg};">
                <tr>
                  <td style="padding:20px 20px;font-family:${EMAIL_FONT};color:${EMAIL_BRAND.ink};">
                    ${params.secondaryHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          ${emailFooter({ logo, loginUrl, registerUrl, prefs, unsub })}
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
    "Sign in: " + loginUrl,
    "Start free trial: " + registerUrl,
    "",
    "Email preferences: " + prefs,
    "Unsubscribe: " + unsub,
    "",
    `© ${new Date().getFullYear()} ${EMAIL_BRAND.name}`,
    EMAIL_BRAND.address,
    EMAIL_BRAND.siteUrl,
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
