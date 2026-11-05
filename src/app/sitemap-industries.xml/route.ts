import { TRADE_PAGES, seoBaseUrl } from "@/lib/seo";
import { TRADE_HUB_DEFAULT_UPDATED, TRADE_HUB_UPDATED } from "@/lib/page-dates";

export const dynamic = "force-static";

export async function GET() {
  const base = seoBaseUrl();

  const urls = TRADE_PAGES.map(
    (t) => `  <url>
    <loc>${base}/industries/${t.slug}</loc>
    <lastmod>${TRADE_HUB_UPDATED[t.slug] ?? TRADE_HUB_DEFAULT_UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
  ).join("\n");

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
