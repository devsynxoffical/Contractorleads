import type { MetadataRoute } from "next";
import { seoBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = seoBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/enterprise/book",
          "/features",
          "/about",
          "/industries",
          "/blog",
          "/login",
          "/register",
          "/terms",
          "/privacy",
        ],
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
          "/industries",
          "/email",
          "/auth",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
