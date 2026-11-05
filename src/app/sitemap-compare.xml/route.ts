import { ALTERNATIVES } from "@/lib/alternatives-content";
import { seoBaseUrl } from "@/lib/seo";
import { ALTERNATIVES_DEFAULT_UPDATED } from "@/lib/page-dates";

export const dynamic = "force-static";

/** Competitor comparison and alternative pages. */
export async function GET() {
  const base = seoBaseUrl();

  const urls = ALTERNATIVES.map(
    (a) => `  <url>
    <loc>${base}/alternatives/${a.slug}</loc>
    <lastmod>${a.updatedDate ?? ALTERNATIVES_DEFAULT_UPDATED}</lastmod>
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
