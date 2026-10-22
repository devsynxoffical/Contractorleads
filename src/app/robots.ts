import type { MetadataRoute } from "next";
import { seoBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = seoBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/home",
          "/dashboard",
          "/leads",
          "/inbox",
          "/sms",
          "/billing",
          "/settings",
          "/setup",
          "/onboarding",
          "/academy",
          "/ask-expert",
          "/scripts",
          "/team",
          "/analytics",
          "/reports",
          "/ai-tools",
          "/crm-webhooks",
          "/referrals",
          "/email",
          "/auth",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
