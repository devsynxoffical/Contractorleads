import { seoBaseUrl } from "@/lib/seo";
import { TOOLS_UPDATED } from "@/lib/page-dates";
import { FREE_TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

/** Free tools: /tools hub and each tool page. */
export async function GET() {
  const base = seoBaseUrl();
  const paths = ["/tools", ...FREE_TOOLS.map((t) => `/tools/${t.slug}`)];
  const urls = paths
    .map(
      (p) => `  <url>
    <loc>${base}${p}</loc>
    <lastmod>${TOOLS_UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
