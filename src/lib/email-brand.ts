/** Shared brand tokens for HTML email — mirrors site light theme + marketing footer. */

/** Canonical production site (emails always need absolute URLs). */
export const SITE_URL = "https://www.contractorleads.us";

export const EMAIL_BRAND = {
  name: "Contractor Leads",
  tagline: "Contractor demand, mapped, scored, and ready to dial.",
  /** Light-theme logo gradient stops (globals.css) */
  pink: "#db2777",
  magenta: "#c026d3",
  purple: "#9333ea",
  violet: "#7c3aed",
  primary: "#c026d3",
  secondary: "#9333ea",
  ink: "#1a1424",
  muted: "#5a5168",
  faint: "#8b8499",
  border: "#ebe6f2",
  softBg: "#f6f4f9",
  pageBg: "#eeeaf4",
  cardBg: "#ffffff",
  /** Soft hero panel (brand tint, not loud) */
  heroBg:
    "linear-gradient(135deg,#fdf2f8 0%,#fae8ff 42%,#f3e8ff 72%,#ede9fe 100%)",
  /** Solid fallback for Outlook; gradient applied where supported */
  buttonBg: "#c026d3",
  buttonGradient:
    "linear-gradient(135deg,#db2777 0%,#c026d3 45%,#9333ea 75%,#7c3aed 100%)",
  buttonText: "#ffffff",
  link: "#86198f",
  /** Marketing dark footer */
  footerBg: "#0c0820",
  footerBgTop: "#07060f",
  footerText: "#ffffff",
  footerMuted: "rgba(255,255,255,0.55)",
  footerFaint: "rgba(255,255,255,0.40)",
  footerBorder: "rgba(255,255,255,0.10)",
  /** Physical address for CAN-SPAM / deliverability */
  address:
    process.env.EMAIL_COMPANY_ADDRESS ||
    "Contractor Leads · United States",
  supportEmail: process.env.EMAIL_SUPPORT || "support@contractorleads.us",
  contactEmail: "hello@contractorleads.us",
  /** Absolute logo URL for email clients */
  logoUrl: `${SITE_URL}/logo.png`,
  siteUrl: SITE_URL,
} as const;

/** System UI stack — matches Apple / Google product mail */
export const EMAIL_FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function isLocalAppUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * Canonical public app URL for share links, emails, and redirects.
 * Ignores localhost NEXT_PUBLIC_APP_URL in production so mis-set Railway
 * vars cannot leak into live referral / verification links.
 */
export function appBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (raw && !(process.env.NODE_ENV === "production" && isLocalAppUrl(raw))) {
    return raw;
  }
  return SITE_URL;
}

/** Prefer live app URL for logo when set; always absolute for inboxes. */
export function emailLogoUrl() {
  const base = appBaseUrl();
  if (base.includes("localhost") || base.includes("127.0.0.1")) {
    return EMAIL_BRAND.logoUrl;
  }
  return `${base}/logo.png`;
}
