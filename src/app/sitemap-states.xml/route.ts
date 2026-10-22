import { PRIORITY_TRADE_SLUGS, SEO_REGIONS, seoBaseUrl } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET() {
  const base = seoBaseUrl();
  const now = "2026-10-22";

  // Only the 7 priority trades pass the uniqueness/index threshold (350 pages max)
  const priorityRoutes: Array<{ trade: string; state: string }> = [];
  for (const trade of PRIORITY_TRADE_SLUGS) {
    for (const region of SEO_REGIONS) {
      priorityRoutes.push({ trade, state: region.slug });
    }
  }

  const urls = priorityRoutes
    .map(
      (r) => `  <url>
    <loc>${base}/industries/${r.trade}/${r.state}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
