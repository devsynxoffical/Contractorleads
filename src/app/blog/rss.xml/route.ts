import { BLOG_POSTS } from "@/lib/blog-content";
import { SEO, absoluteUrl, seoBaseUrl } from "@/lib/seo";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 feed of the public blog so aggregators and crawlers discover new posts quickly. */
export async function GET() {
  const base = seoBaseUrl();
  const posts = [...BLOG_POSTS].sort((a, b) =>
    b.publishedDate.localeCompare(a.publishedDate),
  );

  const items = posts
    .map((p) => {
      const url = `${base}/blog/${p.slug}`;
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${p.publishedDate}T09:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(p.metaDescription)}</description>
      <category>${escapeXml(p.cluster)}</category>
    </item>`;
    })
    .join("\n");

  const lastBuild = posts[0]
    ? new Date(`${posts[0].updatedDate}T09:00:00Z`).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SEO.siteName)} Blog</title>
    <link>${base}/blog</link>
    <atom:link href="${absoluteUrl("/blog/rss.xml")}" rel="self" type="application/rss+xml" />
    <description>Playbooks for marketing agencies, media buyers and sales teams that sell to home-service contractors.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
