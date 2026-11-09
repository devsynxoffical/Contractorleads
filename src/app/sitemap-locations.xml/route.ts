import { SEO_REGIONS, seoBaseUrl } from "@/lib/seo";
import { LOCATIONS_UPDATED } from "@/lib/page-dates";

export const dynamic = "force-static";

/** Location pages: /locations hub and one page per US state. */
export async function GET() {
  const base = seoBaseUrl();
  const paths = ["/locations", ...SEO_REGIONS.map((r) => `/locations/${r.slug}`)];
  const urls = paths
    .map(
      (p, i) => `  <url>
    <loc>${base}${p}</loc>
    <lastmod>${LOCATIONS_UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${i === 0 ? "0.85" : "0.7"}</priority>
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
