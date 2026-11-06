import type { MetadataRoute } from "next";
import { seoBaseUrl } from "@/lib/seo";

/**
 * Private app sections. robots.txt rules are prefix matches, so each section is
 * blocked as an exact path ("/home$") plus its children ("/home/"). A bare "/home"
 * would also block public pages such as /homeowner-leads, and "/sms" would block
 * /sms-marketing-for-contractors.
 */
const PRIVATE_SECTIONS = [
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

export default function robots(): MetadataRoute.Robots {
  const base = seoBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_SECTIONS.flatMap((s) => [`/${s}$`, `/${s}/`]),
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
