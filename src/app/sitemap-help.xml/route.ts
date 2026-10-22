import { ACADEMY_ARTICLES } from "@/lib/academy-content";
import { seoBaseUrl } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET() {
  const base = seoBaseUrl();

  const urls = ACADEMY_ARTICLES.map(
    (a) => `  <url>
    <loc>${base}/help/${a.slug}</loc>
    <lastmod>${a.updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
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
