import { BLOG_POSTS } from "@/lib/blog-content";
import { seoBaseUrl } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET() {
  const base = seoBaseUrl();

  const urls = BLOG_POSTS.map(
    (p) => `  <url>
    <loc>${base}/blog/${p.slug}</loc>
    <lastmod>${p.updatedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.type === "pillar" ? "0.9" : "0.8"}</priority>
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
