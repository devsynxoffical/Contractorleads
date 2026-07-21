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

/** Placeholders admins can use in subject/body: {{name}} {{industry}} {{location}} {{leadCount}} {{hotCount}} {{warmCount}} {{verifyUrl}} {{resetUrl}} */
export const EMAIL_TEMPLATE_DEFAULTS: Record<EmailTemplateKey, EmailTemplateFields> = {
  verify: {
    key: "verify",
    label: "Verify email (signup)",
    enabled: true,
    subject: "Verify your Contractor Leads business email",
    preheader: "Verify your Contractor Leads business email to finish signup.",
    heroTitle: "Your workspace is almost ready",
    heroSubtitle:
      "Confirm your email, set a password, and unlock live lead search with AI scoring.",
    headline: "Confirm your business email",
    body: "Hi {{name}}, You're one step from your Contractor Leads workspace. Verify this email, set a password, and start finding scored contractor leads.",
    ctaLabel: "Verify email",
    ctaPath: "/verify-email",
    feature1Title: "Business-only signup",
    feature1Body: "We verify real agency emails so your pipeline stays clean.",
    feature2Title: "20 starter credits",
    feature2Body: "Run live Google Places searches with AI Hot / Warm / Nurture scores.",
    feature3Title: "Pipeline CRM ready",
    feature3Body: "Save leads, move stages, and push to Slack or GoHighLevel.",
    secondaryTitle: "Need help?",
    secondaryBody: "Reply to this email or write support@contractorleads.us — we're happy to help.",
    secondaryCtaLabel: "Log in",
    secondaryCtaPath: "/login",
  },
  welcome: {
    key: "welcome",
    label: "Welcome (account created)",
    enabled: true,
    subject: "Welcome to Contractor Leads — your workspace is ready",
    preheader: "Your Contractor Leads account is ready — start generating leads.",
    heroTitle: "You're in. Let's find your next clients.",
    heroSubtitle:
      "Credits are loaded. Run your first search and watch Hot / Warm / Nurture scores fill your dashboard.",
    headline: "Welcome, {{name}}",
    body: "Your Contractor Leads account is live. Generate verified contractor leads, score them with AI, save to pipeline CRM, and export when you're ready.",
    ctaLabel: "Open dashboard",
    ctaPath: "/dashboard",
    feature1Title: "Lead Finder",
    feature1Body: "Search by trade, city, ZIP, and radius — Places-backed, not placeholders.",
    feature2Title: "Hot leads",
    feature2Body: "Jump straight to highest-scoring opportunities.",
    feature3Title: "Pipeline CRM",
    feature3Body: "Move New → Contacted → Qualified → Closed and sync Slack / GHL.",
    secondaryTitle: "Want more volume?",
    secondaryBody: "Upgrade anytime under Plans & Billing for higher monthly capacity and integrations.",
    secondaryCtaLabel: "View plans",
    secondaryCtaPath: "/billing",
  },
  reset: {
    key: "reset",
    label: "Forgot password",
    enabled: true,
    subject: "Reset your Contractor Leads password",
    preheader: "Reset your Contractor Leads password (link expires in 1 hour).",
    heroTitle: "Password reset request",
    heroSubtitle: "Secure link inside — use it only if you asked to reset your password.",
    headline: "Reset your password",
    body: "Hi {{name}}, We received a request to reset your Contractor Leads password. Click below to choose a new one. This link expires in 1 hour.",
    ctaLabel: "Reset password",
    ctaPath: "/reset-password",
    feature1Title: "",
    feature1Body: "",
    feature2Title: "",
    feature2Body: "",
    feature3Title: "",
    feature3Body: "",
    secondaryTitle: "",
    secondaryBody: "If you didn't request this, you can safely ignore this email — your password won't change.",
    secondaryCtaLabel: "",
    secondaryCtaPath: "",
  },
  scrape: {
    key: "scrape",
    label: "Lead scrape complete",
    enabled: true,
    subject: "{{leadCount}} new {{industry}} leads ready — {{location}}",
    preheader: "{{leadCount}} new {{industry}} leads ready in {{location}}.",
    heroTitle: "Fresh leads just landed",
    heroSubtitle:
      "AI-scored contractor businesses from your latest search — verified fields only, never fabricated.",
    headline: "Your lead scrape is ready",
    body: "Hi {{name}}, We finished generating {{leadCount}} leads for {{industry}} in {{location}}.",
    ctaLabel: "Review leads",
    ctaPath: "/leads/search",
    feature1Title: "",
    feature1Body: "",
    feature2Title: "",
    feature2Body: "",
    feature3Title: "",
    feature3Body: "",
    secondaryTitle: "Next steps",
    secondaryBody:
      "Save winners to pipeline, export CSV/Excel, or push status changes to Slack & GoHighLevel.",
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
