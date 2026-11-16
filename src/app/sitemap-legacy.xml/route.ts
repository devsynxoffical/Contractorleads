import { seoBaseUrl } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * TEMPORARY (remove after 2027-01-31, or once URL Inspection shows these as "Page with redirect").
 *
 * At launch both /trades/* and /industries/* were in the sitemap: two near-identical copies of
 * every trade + state page. /trades/* has 308-redirected to /industries/* since 7 Oct 2026, but
 * Google last crawled these URLs on 28 Jul 2026 and still holds them as separate pages
 * ("Crawled - currently not indexed"). Listing them here, as Google's site-move guidance
 * suggests, gets them recrawled so the redirects are processed and signals consolidate.
 *
 * Only the old URLs Search Console has shown in results (26 Jul - 13 Nov 2026) are listed, so the
 * crawl this costs stays small.
 */
const LEGACY_PATHS = [
  "/trades",
  "/trades/cleaning-services/arizona",
  "/trades/cleaning-services/delaware",
  "/trades/cleaning-services/idaho",
  "/trades/cleaning-services/illinois",
  "/trades/cleaning-services/kansas",
  "/trades/cleaning-services/wyoming",
  "/trades/electrical/alaska",
  "/trades/general-contractors/connecticut",
  "/trades/general-contractors/georgia",
  "/trades/general-contractors/missouri",
  "/trades/hvac/florida",
  "/trades/hvac/iowa",
  "/trades/hvac/kentucky",
  "/trades/hvac/maryland",
  "/trades/hvac/missouri",
  "/trades/hvac/wisconsin",
  "/trades/painting/alaska",
  "/trades/painting/north-carolina",
  "/trades/painting/tennessee",
  "/trades/painting/virginia",
  "/trades/painting/washington",
  "/trades/pest-control/rhode-island",
  "/trades/pool-services/arkansas",
  "/trades/pool-services/georgia",
  "/trades/pool-services/louisiana",
  "/trades/pool-services/oklahoma",
  "/trades/pool-services/pennsylvania",
  "/trades/pool-services/south-carolina",
  "/trades/pool-services/washington",
  "/trades/pool-services/wyoming",
  "/trades/remodeling/california",
  "/trades/remodeling/connecticut",
  "/trades/remodeling/florida",
  "/trades/remodeling/georgia",
  "/trades/remodeling/washington",
  "/trades/roofing/oklahoma",
  "/trades/roofing/washington",
];

/** Date the redirects went live; tells Google these URLs changed after its last crawl. */
const REDIRECTED_ON = "2026-10-07";

export async function GET() {
  const base = seoBaseUrl();
  const urls = LEGACY_PATHS.map(
    (p) => `  <url>
    <loc>${base}${p}</loc>
    <lastmod>${REDIRECTED_ON}</lastmod>
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
