import type { MetadataRoute } from "next";
import { PRIVATE_SECTIONS } from "@/lib/private-sections";
import { seoBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = seoBaseUrl();
  const disallow = PRIVATE_SECTIONS.flatMap((s) => [`/${s}$`, `/${s}/`]);
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Search and AI crawlers are explicitly welcome on public pages (and /llms.txt).
      {
        userAgent: ["Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Google-Extended", "Applebot"],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
