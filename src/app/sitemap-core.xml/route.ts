import { seoBaseUrl } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET() {
  const base = seoBaseUrl();
  const now = "2026-10-22";

  const coreRoutes = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/features", priority: "0.9", changefreq: "monthly" },
    { path: "/pricing", priority: "0.9", changefreq: "weekly" },
    { path: "/google-maps-scraper", priority: "0.9", changefreq: "monthly" },
    { path: "/apollo-alternative", priority: "0.9", changefreq: "monthly" },
    { path: "/industries", priority: "0.85", changefreq: "weekly" },
    { path: "/blog", priority: "0.85", changefreq: "weekly" },
    { path: "/help", priority: "0.85", changefreq: "weekly" },
    { path: "/about", priority: "0.7", changefreq: "monthly" },
    { path: "/enterprise/book", priority: "0.7", changefreq: "monthly" },
  ];

  const urls = coreRoutes
    .map(
      (r) => `  <url>
    <loc>${base}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
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
