import { SEO_REGIONS, TRADE_PAGES, isPriorityTrade, seoBaseUrl } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * TEMPORARY (remove after 2027-01-31, or once a URL Inspection sample shows these as
 * "Excluded by 'noindex' tag").
 *
 * The trade + state pages of the 11 non-priority trades (550 URLs) have been `noindex, follow`
 * since 22 Oct 2026, but Google last crawled them on 15-21 Oct and still reports them as
 * "Submitted and indexed"; they keep appearing at positions 90-210. Listing them here, with the
 * date the noindex went live, gets them recrawled so the noindex is seen and they leave the index.
 * Search Console will flag them as "Submitted URL marked 'noindex'" while this is up: expected.
 */
const NOINDEX_SINCE = "2026-10-22";

export async function GET() {
  const base = seoBaseUrl();
  const urls = TRADE_PAGES.filter((t) => !isPriorityTrade(t.slug))
    .flatMap((t) => SEO_REGIONS.map((r) => `${base}/industries/${t.slug}/${r.slug}`))
    .map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${NOINDEX_SINCE}</lastmod>\n  </url>`)
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
