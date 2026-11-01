export const EMAIL_TEMPLATE_KEYS = [
  "verify",
  "welcome",
  "reset",
  "scrape",
  "checkout_recovery_1",
  "checkout_recovery_2",
  "checkout_recovery_3",
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

/**
 * Placeholders: {{name}} {{industry}} {{location}} {{leadCount}} {{hotCount}} {{warmCount}}
 * Checkout recovery adds: {{planName}} {{planSummary}} {{credits}} {{priceLabel}} {{freeLeads}}
 */
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
  checkout_recovery_1: {
    key: "checkout_recovery_1",
    label: "Checkout recovery · 1 (1 hour)",
    enabled: true,
    subject: "Your {{planName}} checkout is still open",
    preheader: "No charge was made. Pick up where you left off whenever you’re ready.",
    heroTitle: "Finish setting up {{planName}}?",
    heroSubtitle: "Nothing was charged — your spot is saved.",
    headline: "",
    body: "Hi {{name}}, you started checkout for {{planName}} ({{priceLabel}}) a little while ago but didn’t finish. No charge was made. {{planSummary}} You still have your {{freeLeads}} free leads to use in the meantime, and you can cancel anytime.",
    ctaLabel: "Finish checkout",
    ctaPath: "/billing",
    feature1Title: "",
    feature1Body: "",
    feature2Title: "",
    feature2Body: "",
    feature3Title: "",
    feature3Body: "",
    secondaryTitle: "Hit a snag?",
    secondaryBody:
      "If the payment form gave you trouble or you have a question about the plan, just reply to this email — a real person reads it.",
    secondaryCtaLabel: "",
    secondaryCtaPath: "",
  },
  checkout_recovery_2: {
    key: "checkout_recovery_2",
    label: "Checkout recovery · 2 (24 hours)",
    enabled: true,
    subject: "What you get with {{planName}}",
    preheader: "{{planSummary}} Cancel anytime.",
    heroTitle: "Still thinking about {{planName}}?",
    heroSubtitle: "Here’s what it unlocks, in plain terms.",
    headline: "",
    body: "Hi {{name}}, quick follow-up on the {{planName}} checkout you started yesterday. {{planSummary}} 1 credit = 1 lead, and you keep the {{freeLeads}} free leads already in your account. Here’s what customers use most:",
    ctaLabel: "Complete {{planName}} checkout",
    ctaPath: "/billing",
    feature1Title: "Live Google data",
    feature1Body: "Every search pulls fresh Google Places results, scored Hot / Warm / Nurture so you call the right contractors first.",
    feature2Title: "Owner names",
    feature2Body: "We surface the owner or decision-maker where available, so you’re not stuck talking to a front desk.",
    feature3Title: "Outreach scripts",
    feature3Body: "Call, email, and text scripts written for contractor sales — copy, personalize, send.",
    secondaryTitle: "No lock-in",
    secondaryBody:
      "{{priceLabel}}, billed as you go. Cancel anytime from Plans & Billing — no calls, no forms.",
    secondaryCtaLabel: "",
    secondaryCtaPath: "",
  },
  checkout_recovery_3: {
    key: "checkout_recovery_3",
    label: "Checkout recovery · 3 (72 hours, last nudge)",
    enabled: true,
    subject: "Last note about {{planName}}",
    preheader: "We’ll stop here — the link still works whenever you’re ready.",
    heroTitle: "Last one from us",
    heroSubtitle: "Your {{planName}} checkout is still open if you want it.",
    headline: "",
    body: "Hi {{name}}, this is the last reminder about the {{planName}} checkout you started. {{planSummary}} If now isn’t the right time, no problem — your account and {{freeLeads}} free leads stay exactly as they are, and you can upgrade later in one click.",
    ctaLabel: "Finish checkout",
    ctaPath: "/billing",
    feature1Title: "",
    feature1Body: "",
    feature2Title: "",
    feature2Body: "",
    feature3Title: "",
    feature3Body: "",
    secondaryTitle: "",
    secondaryBody:
      "Questions? Reply to this email and we’ll help you pick the right plan.",
    secondaryCtaLabel: "",
    secondaryCtaPath: "",
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
