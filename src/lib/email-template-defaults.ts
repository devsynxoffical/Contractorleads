export const EMAIL_TEMPLATE_KEYS = [
  "verify",
  "welcome",
  "reset",
  "scrape",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type EmailTemplateFields = {
  key: EmailTemplateKey;
  label: string;
  enabled: boolean;
  subject: string;
  preheader: string;
  heroTitle: string;
  heroSubtitle: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  feature3Title: string;
  feature3Body: string;
  secondaryTitle: string;
  secondaryBody: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
};

/** Placeholders: {{name}} {{industry}} {{location}} {{leadCount}} {{hotCount}} {{warmCount}} */
export const EMAIL_TEMPLATE_DEFAULTS: Record<EmailTemplateKey, EmailTemplateFields> = {
  verify: {
    key: "verify",
    label: "Verify email (signup)",
    enabled: true,
    subject: "Verify your Contractor Leads email",
    preheader: "Confirm your email to finish signup.",
    heroTitle: "Verify your email",
    heroSubtitle: "One step left before you can sign in.",
    headline: "",
    body: "Hi {{name}}, Confirm this email to finish creating your account and set your password.",
    ctaLabel: "Verify email",
    ctaPath: "/verify-email",
    feature1Title: "Business email verification",
    feature1Body: "We only accept work emails so your workspace stays professional.",
    feature2Title: "Starter credits included",
    feature2Body: "Run live Google Places searches with Hot / Warm / Nurture scoring.",
    feature3Title: "Pipeline ready",
    feature3Body: "Save leads and sync status changes to Slack or GoHighLevel.",
    secondaryTitle: "Need help?",
    secondaryBody: "Contact support@contractorleads.us.",
    secondaryCtaLabel: "Log in",
    secondaryCtaPath: "/login",
  },
  welcome: {
    key: "welcome",
    label: "Welcome (account created)",
    enabled: true,
    subject: "Welcome to Contractor Leads",
    preheader: "Your account is ready.",
    heroTitle: "Welcome, {{name}}",
    heroSubtitle: "You’re set up and ready to run your first search.",
    headline: "",
    body: "Your account is ready. Search for contractors by trade and location, review scored results, and save the best leads to your pipeline.",
    ctaLabel: "Open dashboard",
    ctaPath: "/dashboard",
    feature1Title: "Lead Finder",
    feature1Body: "Search by trade, city, ZIP, and radius.",
    feature2Title: "Hot leads",
    feature2Body: "Filter to the highest-scoring opportunities.",
    feature3Title: "Pipeline",
    feature3Body: "Track stages and sync Slack or GoHighLevel.",
    secondaryTitle: "Need more capacity?",
    secondaryBody: "Upgrade under Plans & Billing for higher monthly limits and integrations.",
    secondaryCtaLabel: "View plans",
    secondaryCtaPath: "/billing",
  },
  reset: {
    key: "reset",
    label: "Forgot password",
    enabled: true,
    subject: "Reset your Contractor Leads password",
    preheader: "Reset your password — link expires in 1 hour.",
    heroTitle: "Reset your password",
    heroSubtitle: "This link is only valid for one hour.",
    headline: "",
    body: "Hi {{name}}, We received a request to reset your password. Use the button below to choose a new one. This link expires in 1 hour.",
    ctaLabel: "Reset password",
    ctaPath: "/reset-password",
    feature1Title: "",
    feature1Body: "",
    feature2Title: "",
    feature2Body: "",
    feature3Title: "",
    feature3Body: "",
    secondaryTitle: "",
    secondaryBody:
      "If you didn’t request this, you can ignore this email. Your password will stay the same.",
    secondaryCtaLabel: "",
    secondaryCtaPath: "",
  },
  scrape: {
    key: "scrape",
    label: "Lead scrape complete",
    enabled: true,
    subject: "{{leadCount}} {{industry}} leads ready — {{location}}",
    preheader: "{{leadCount}} {{industry}} leads ready {{location}}.",
    heroTitle: "Your search results are ready",
    heroSubtitle: "{{leadCount}} {{industry}} leads {{location}}.",
    headline: "",
    body: "Hi {{name}}, Your {{industry}} search {{location}} returned {{leadCount}} leads.",
    ctaLabel: "Review leads",
    ctaPath: "/leads/search",
    feature1Title: "",
    feature1Body: "",
    feature2Title: "",
    feature2Body: "",
    feature3Title: "",
    feature3Body: "",
    secondaryTitle: "Next",
    secondaryBody:
      "Save leads to your pipeline, export CSV, or sync status updates to Slack and GoHighLevel.",
    secondaryCtaLabel: "Open pipeline",
    secondaryCtaPath: "/leads/pipeline",
  },
};

export function applyEmailPlaceholders(
  input: string,
  vars: Record<string, string | number | null | undefined>,
) {
  return input.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key];
    if (v === null || v === undefined) return "";
    return String(v);
  });
}
