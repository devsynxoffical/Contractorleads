/**
 * Private app sections, shared by robots.txt and analytics.
 *
 * robots.txt rules are prefix matches, so each section is blocked as an exact path
 * ("/home$") plus its children ("/home/"). A bare "/home" would also block public
 * pages such as /homeowner-leads, and "/sms" would block /sms-marketing-for-contractors.
 */
export const PRIVATE_SECTIONS = [
  "admin",
  "api",
  "home",
  "dashboard",
  "leads",
  "inbox",
  "sms",
  "billing",
  "settings",
  "setup",
  "onboarding",
  "academy",
  "ask-expert",
  "scripts",
  "team",
  "analytics",
  "reports",
  "ai-tools",
  "crm-webhooks",
  "referrals",
  "email",
  "auth",
  "login",
  "register",
  "campaigns",
  "bulk-email-finder",
  "digest",
  "email-accounts",
  "email-verifier",
  "facebook",
  "segments",
  "invite",
  "ref",
  "forgot-password",
  "reset-password",
  "verify-email",
];

/**
 * Sections GA4 must not measure: the logged-in app and admin. Their page views
 * mixed product usage into marketing reports and sent admin customer IDs to Google.
 * Sign-up, login and affiliate referral pages stay measured: they are the funnel.
 */
const FUNNEL_SECTIONS = new Set(["register", "login", "ref"]);
export const ANALYTICS_EXCLUDED_SECTIONS = PRIVATE_SECTIONS.filter((s) => !FUNNEL_SECTIONS.has(s));
