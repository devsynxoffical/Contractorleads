import { EMAIL_BRAND, appBaseUrl } from "@/lib/email-brand";
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

function heroBanner(title: string, subtitle: string) {
  return `
  <tr>
    <td style="padding:0 24px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-radius:18px;overflow:hidden;background:linear-gradient(135deg,#fce7f3 0%,#f5d0fe 28%,#ddd6fe 55%,#fbcfe8 78%,#fef3c7 100%);">
        <tr>
          <td style="padding:36px 28px;text-align:center;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.ink};">
              ${esc(title)}
            </h1>
            <p style="margin:12px auto 0;max-width:420px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.ink};opacity:0.88;">
              ${esc(subtitle)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function ctaButton(label: string, href: string) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
    <tr>
      <td style="border-radius:10px;background:${EMAIL_BRAND.buttonBg};">
        <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:${EMAIL_BRAND.buttonText};text-decoration:none;border-radius:10px;">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function featureRow(icon: string, title: string, body: string, linkLabel?: string, linkHref?: string) {
  return `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid ${EMAIL_BRAND.border};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="48" valign="top" style="padding-right:14px;">
            <div style="width:40px;height:40px;border-radius:10px;background:${EMAIL_BRAND.softBg};text-align:center;line-height:40px;font-size:18px;">
              ${icon}
            </div>
          </td>
          <td valign="top">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:${EMAIL_BRAND.ink};">${esc(title)}</p>
            <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">${esc(body)}</p>
            ${
              linkLabel && linkHref
                ? `<p style="margin:8px 0 0;"><a href="${esc(linkHref)}" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${EMAIL_BRAND.link};text-decoration:underline;">${esc(linkLabel)}</a></p>`
                : ""
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/**
 * Apollo-style branded shell: soft page background, white card, gradient hero,
 * black CTA, legal footer with unsubscribe + physical address.
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
  const loginUrl = params.links?.loginUrl || `${base}/login`;
  const unsub =
    params.links?.unsubscribeUrl || `${base}/email/unsubscribe`;
  const prefs =
    params.links?.preferencesUrl || `${base}/email/preferences`;

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
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-collapse:separate;border-radius:22px;overflow:hidden;background:${EMAIL_BRAND.cardBg};box-shadow:0 12px 40px rgba(26,18,36,0.08);">
          <tr>
            <td style="padding:18px 24px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <a href="${esc(base)}" style="text-decoration:none;color:${EMAIL_BRAND.ink};">
                      <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;letter-spacing:-0.02em;">
                        <span style="background:linear-gradient(135deg,${EMAIL_BRAND.primary},${EMAIL_BRAND.secondary});-webkit-background-clip:text;color:${EMAIL_BRAND.primary};">✦</span>
                        ${esc(EMAIL_BRAND.name)}
                      </span>
                    </a>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <a href="${esc(loginUrl)}" style="display:inline-block;padding:8px 14px;border:1px solid ${EMAIL_BRAND.ink};border-radius:999px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:${EMAIL_BRAND.ink};text-decoration:none;">
                      Log in
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${heroBanner(params.heroTitle, params.heroSubtitle)}

          <tr>
            <td style="padding:8px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${EMAIL_BRAND.ink};">
              ${params.bodyHtml}
            </td>
          </tr>

          ${
            params.secondaryHtml
              ? `<tr>
            <td style="padding:0 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-radius:16px;background:${EMAIL_BRAND.softBg};">
                <tr>
                  <td style="padding:22px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${EMAIL_BRAND.ink};">
                    ${params.secondaryHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <tr>
            <td style="padding:8px 28px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${EMAIL_BRAND.muted};">
              <p style="margin:0;">— The ${esc(EMAIL_BRAND.name)} Team</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 10px;font-size:12px;">
                <a href="${esc(prefs)}" style="color:${EMAIL_BRAND.faint};text-decoration:underline;">Manage preferences</a>
                <span style="color:${EMAIL_BRAND.faint};"> · </span>
                <a href="${esc(unsub)}" style="color:${EMAIL_BRAND.faint};text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:0 0 6px;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.faint};">
                © ${new Date().getFullYear()} ${esc(EMAIL_BRAND.name)}. ${esc(EMAIL_BRAND.address)}.
              </p>
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.faint};">
                Questions? <a href="mailto:${esc(EMAIL_BRAND.supportEmail)}" style="color:${EMAIL_BRAND.faint};">${esc(EMAIL_BRAND.supportEmail)}</a>
              </p>
              <p style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:${EMAIL_BRAND.ink};opacity:0.55;">
                ✦ ${esc(EMAIL_BRAND.name)}
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
    "Manage preferences: " + prefs,
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
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${EMAIL_BRAND.ink};">
      Confirm your business email
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(greeting)} You’re one step from your Contractor Leads workspace. Verify this email, set a password, and start finding scored contractor leads.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${featureRow("✉", "Business-only signup", "We verify real agency emails so your pipeline stays clean.", "Open Lead Finder later", `${appBaseUrl()}/leads/search`)}
      ${featureRow("⚡", "20 starter credits", "Run live Google Places searches with AI Hot / Warm / Nurture scores.")}
      ${featureRow("◎", "Pipeline CRM ready", "Save leads, move stages, and push to Slack or GoHighLevel.")}
    </table>
    <div style="margin:28px 0 8px;text-align:center;">
      ${ctaButton("Verify email", opts.verifyUrl)}
    </div>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.faint};text-align:center;">
      This link expires in 24 hours. If you didn’t sign up, you can ignore this email.
    </p>`;

  return renderEmailShell({
    preheader: "Verify your Contractor Leads business email to finish signup.",
    heroTitle: "Your workspace is almost ready",
    heroSubtitle:
      "Confirm your email, set a password, and unlock live lead search with AI scoring.",
    bodyHtml,
    secondaryHtml: `
      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;">Need help?</p>
      <p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
        Reply to this email or write ${esc(EMAIL_BRAND.supportEmail)} — we’re happy to help.
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
  const greeting = opts.name ? `Welcome, ${opts.name}` : "Welcome aboard";
  const bodyHtml = `
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${EMAIL_BRAND.ink};">
      ${esc(greeting)}
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      Your Contractor Leads account is live. Generate verified contractor leads, score them with AI, save to pipeline CRM, and export when you’re ready.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${featureRow("🔍", "Lead Finder", "Search by trade, city, ZIP, and radius — Places-backed, not placeholders.", "Open Lead Finder", `${base}/leads/search`)}
      ${featureRow("🔥", "Hot leads", "Jump straight to highest-scoring opportunities.", "View hot leads", `${base}/leads/hot`)}
      ${featureRow("▦", "Pipeline CRM", "Move New → Contacted → Qualified → Closed and sync Slack / GHL.", "Open pipeline", `${base}/leads/pipeline`)}
    </table>
    <div style="margin:28px 0 8px;text-align:center;">
      ${ctaButton("Open dashboard", dash)}
    </div>`;

  return renderEmailShell({
    preheader: "Your Contractor Leads account is ready — start generating leads.",
    heroTitle: "You’re in. Let’s find your next clients.",
    heroSubtitle:
      "Credits are loaded. Run your first search and watch Hot / Warm / Nurture scores fill your dashboard.",
    bodyHtml,
    secondaryHtml: `
      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;">Want more volume?</p>
      <p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
        Upgrade anytime under Plans & Billing for higher monthly capacity and integrations.
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
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${EMAIL_BRAND.ink};">
      Reset your password
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(greeting)} We received a request to reset your Contractor Leads password. Click below to choose a new one. This link expires in 1 hour.
    </p>
    <div style="margin:24px 0;text-align:center;">
      ${ctaButton("Reset password", opts.resetUrl)}
    </div>
    <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.faint};text-align:center;">
      If you didn’t request this, you can safely ignore this email — your password won’t change.
    </p>`;

  return renderEmailShell({
    preheader: "Reset your Contractor Leads password (link expires in 1 hour).",
    heroTitle: "Password reset request",
    heroSubtitle:
      "Secure link inside — use it only if you asked to reset your password.",
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
  const sampleHtml = samples.length
    ? `<ul style="margin:12px 0 0;padding-left:18px;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.muted};">
        ${samples.map((n) => `<li>${esc(n)}</li>`).join("")}
      </ul>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${EMAIL_BRAND.ink};">
      Your lead scrape is ready
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(greeting)} We finished generating <strong style="color:${EMAIL_BRAND.ink};">${opts.leadCount}</strong> leads for <strong style="color:${EMAIL_BRAND.ink};">${esc(opts.industry)}</strong> in <strong style="color:${EMAIL_BRAND.ink};">${esc(opts.locationLabel)}</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border-collapse:separate;border-radius:14px;background:${EMAIL_BRAND.softBg};">
      <tr>
        <td style="padding:16px;width:33%;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:${EMAIL_BRAND.ink};">${opts.leadCount}</p>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.faint};">Leads</p>
        </td>
        <td style="padding:16px;width:33%;text-align:center;border-left:1px solid ${EMAIL_BRAND.border};">
          <p style="margin:0;font-size:22px;font-weight:800;color:${EMAIL_BRAND.primary};">${opts.hotCount ?? "—"}</p>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.faint};">Hot</p>
        </td>
        <td style="padding:16px;width:33%;text-align:center;border-left:1px solid ${EMAIL_BRAND.border};">
          <p style="margin:0;font-size:22px;font-weight:800;color:${EMAIL_BRAND.secondary};">${opts.warmCount ?? "—"}</p>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.faint};">Warm</p>
        </td>
      </tr>
    </table>
    ${
      samples.length
        ? `<p style="margin:0;font-size:13px;font-weight:600;color:${EMAIL_BRAND.ink};">Sample businesses</p>${sampleHtml}`
        : ""
    }
    <div style="margin:28px 0 8px;text-align:center;">
      ${ctaButton("Review leads", searchUrl)}
    </div>`;

  return renderEmailShell({
    preheader: `${opts.leadCount} new ${opts.industry} leads ready in ${opts.locationLabel}.`,
    heroTitle: "Fresh leads just landed",
    heroSubtitle:
      "AI-scored contractor businesses from your latest search — verified fields only, never fabricated.",
    bodyHtml,
    secondaryHtml: `
      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;">Next steps</p>
      <p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
        Save winners to pipeline, export CSV/Excel, or push status changes to Slack &amp; GoHighLevel.
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
    features.push(["①", fill(t.feature1Title), fill(t.feature1Body)]);
  if (t.feature2Title.trim())
    features.push(["②", fill(t.feature2Title), fill(t.feature2Body)]);
  if (t.feature3Title.trim())
    features.push(["③", fill(t.feature3Title), fill(t.feature3Body)]);

  const statsHtml =
    opts.scrapeStats != null
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border-collapse:separate;border-radius:14px;background:${EMAIL_BRAND.softBg};">
      <tr>
        <td style="padding:16px;width:33%;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:${EMAIL_BRAND.ink};">${opts.scrapeStats.leadCount}</p>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.faint};">Leads</p>
        </td>
        <td style="padding:16px;width:33%;text-align:center;border-left:1px solid ${EMAIL_BRAND.border};">
          <p style="margin:0;font-size:22px;font-weight:800;color:${EMAIL_BRAND.primary};">${opts.scrapeStats.hotCount ?? "—"}</p>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.faint};">Hot</p>
        </td>
        <td style="padding:16px;width:33%;text-align:center;border-left:1px solid ${EMAIL_BRAND.border};">
          <p style="margin:0;font-size:22px;font-weight:800;color:${EMAIL_BRAND.secondary};">${opts.scrapeStats.warmCount ?? "—"}</p>
          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.faint};">Warm</p>
        </td>
      </tr>
    </table>`
      : "";

  const samples = (opts.sampleNames || []).slice(0, 5);
  const sampleHtml = samples.length
    ? `<p style="margin:0;font-size:13px;font-weight:600;color:${EMAIL_BRAND.ink};">Sample businesses</p>
       <ul style="margin:12px 0 0;padding-left:18px;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.muted};">
        ${samples.map((n) => `<li>${esc(n)}</li>`).join("")}
      </ul>`
    : "";

  const featureTable = features.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${features.map(([icon, title, body]) => featureRow(icon, title, body)).join("")}
      </table>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${EMAIL_BRAND.ink};">
      ${esc(fill(t.headline))}
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      ${esc(fill(t.body))}
    </p>
    ${statsHtml}
    ${sampleHtml}
    ${featureTable}
    <div style="margin:28px 0 8px;text-align:center;">
      ${ctaButton(fill(t.ctaLabel), ctaHref)}
    </div>`;

  let secondaryHtml: string | undefined;
  if (t.secondaryTitle.trim() || t.secondaryBody.trim()) {
    const secCta =
      t.secondaryCtaLabel.trim() && t.secondaryCtaPath.trim()
        ? `<div style="margin-top:14px;">${ctaButton(
            fill(t.secondaryCtaLabel),
            `${base}${t.secondaryCtaPath.startsWith("/") ? t.secondaryCtaPath : `/${t.secondaryCtaPath}`}`,
          )}</div>`
        : "";
    secondaryHtml = `
      ${t.secondaryTitle.trim() ? `<p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;">${esc(fill(t.secondaryTitle))}</p>` : ""}
      ${t.secondaryBody.trim() ? `<p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">${esc(fill(t.secondaryBody))}</p>` : ""}
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
