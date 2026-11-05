import { seoBaseUrl } from "@/lib/seo";
import { pageUpdated } from "@/lib/page-dates";

export const dynamic = "force-static";

export async function GET() {
  const base = seoBaseUrl();

  const coreRoutes = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/features", priority: "0.9", changefreq: "monthly" },
    { path: "/pricing", priority: "0.9", changefreq: "weekly" },
    { path: "/contractor-lead-generation-software", priority: "0.9", changefreq: "monthly" },
    { path: "/google-maps-scraper", priority: "0.9", changefreq: "monthly" },
    { path: "/apollo-alternative", priority: "0.9", changefreq: "monthly" },
    { path: "/alternatives", priority: "0.85", changefreq: "monthly" },
    { path: "/industries", priority: "0.85", changefreq: "weekly" },
    { path: "/blog", priority: "0.85", changefreq: "weekly" },
    { path: "/help", priority: "0.85", changefreq: "weekly" },
    { path: "/faq", priority: "0.8", changefreq: "monthly" },
    { path: "/about", priority: "0.7", changefreq: "monthly" },
    { path: "/affiliates", priority: "0.8", changefreq: "weekly" },
    { path: "/enterprise/book", priority: "0.7", changefreq: "monthly" },
    { path: "/privacy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms", priority: "0.3", changefreq: "yearly" },
    { path: "/exclusive-contractor-leads", priority: "0.85", changefreq: "monthly" },
    { path: "/contractor-lead-tracking", priority: "0.8", changefreq: "monthly" },
    { path: "/contractor-lead-management", priority: "0.8", changefreq: "monthly" },
    { path: "/contractor-crm", priority: "0.8", changefreq: "monthly" },
    { path: "/sms-marketing-for-contractors", priority: "0.8", changefreq: "monthly" },
    { path: "/contractor-email-finder", priority: "0.85", changefreq: "monthly" },
    { path: "/homeowner-leads", priority: "0.8", changefreq: "monthly" },
    { path: "/commercial-contractor-leads", priority: "0.8", changefreq: "monthly" },
    { path: "/storm-damage-leads", priority: "0.8", changefreq: "monthly" },
    { path: "/new-construction-leads", priority: "0.8", changefreq: "monthly" },
  ];

  const urls = coreRoutes
    .map(
      (r) => `  <url>
    <loc>${base}${r.path}</loc>
    <lastmod>${pageUpdated(r.path)}</lastmod>
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
