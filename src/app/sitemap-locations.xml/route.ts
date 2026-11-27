import { seoBaseUrl } from "@/lib/seo";
import { LOCATIONS_UPDATED } from "@/lib/page-dates";

export const dynamic = "force-static";

/** Location pages: the /locations hub only (state pages are noindex, see city page plan). */
export async function GET() {
  const base = seoBaseUrl();
  const paths = ["/locations"];
  const urls = paths
    .map(
      (p) => `  <url>
    <loc>${base}${p}</loc>
    <lastmod>${LOCATIONS_UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
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
