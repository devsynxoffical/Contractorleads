import type { MetadataRoute } from "next";
import { PRIVATE_SECTIONS } from "@/lib/private-sections";
import { seoBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = seoBaseUrl();
  // Next.js prefetches every linked page's React Server Component payload as "<url>?_rsc=<hash>".
  // Google crawled these as separate URLs: 9,580 of 12,600 crawl requests (76%) in Search Console's
  // crawl stats (Aug-Nov 2026), leaving few for real pages. Every page is fully server-rendered,
  // so blocking the payloads costs search engines nothing.
  const disallow = [...PRIVATE_SECTIONS.flatMap((s) => [`/${s}$`, `/${s}/`]), "/*?_rsc=", "/*&_rsc="];
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
