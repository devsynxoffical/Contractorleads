# SEO / AEO / GEO work log

One entry per working session: what changed, what was verified, what the data says, what is next.
Only things that were actually done and checked go under "Done". Search Console data lags about 3 days.

## Baseline (Search Console, www.contractorleads.us)

| Window | Impressions | Clicks | Avg. position |
|---|---|---|---|
| 11 Oct – 7 Nov 2026 (28 days) | 215 | 7 | ~72 |
| 7 Aug – 7 Nov 2026 (3 months) | 1,072 | 27 | ~61 |

Daily impressions fell from ~20 in August to ~5 in late October. The intent, metadata,
noindex, location and tool changes went live between 7 and 10 November, so their effect
starts showing in data from about 13 November.

## 2026-11-10

**Data read:** Search Console connected to OpenSEO today (property `https://www.contractorleads.us/`).
- Query "contractor leads" (homeowner intent) is most of the homepage's impressions, at position ~72.
- General contractor state pages are close to page 1 for construction searches: "contractor leads ohio"
  (GC Ohio, pos ~21), "commercial construction leads texas" (pos 19), "construction leads montana" (pos 24),
  "local contractor leads" (pos 10). None of these pages said "construction".
- URL Inspection: home, /industries/roofing, /industries/general-contractors/ohio and
  /blog/how-much-do-contractor-leads-cost are indexed. /pricing and /contractor-email-finder are
  "Discovered – currently not indexed". /industries/roofing/texas is "Crawled – currently not indexed"
  (last crawl 2 Aug, before the rewrite). /locations, /tools and /email-lists are unknown to Google.
- Old /trades/* URLs still collect impressions; verified live they 308-redirect to /industries/*.

**Done (verified locally: build, crawl of 517 sitemap URLs, JSON-LD validation):**
- General contractor hub and all 50 GC state pages now target construction searches:
  title "Find Construction & General Contractor Leads in [State]" (or "Construction Leads in [State]:
  General Contractors" for long names), matching H1, description and keywords.
- Fixed "general contractors companies" wording on the GC hub, the GC state pages' pitch section
  and the state FAQ (also in FAQPage schema): now "general contractors" / "a general contractor".

**Needs the owner (cannot be done from here):**
- Search Console → Sitemaps: submit `sitemap.xml` (index), `sitemap-locations.xml` and `sitemap-tools.xml`.
- Search Console → URL Inspection → Request indexing for /locations, /tools, /email-lists, /pricing,
  /contractor-email-finder (Google allows about 10 a day per property).
- Backlinks and brand mentions need accounts (directories, G2/Capterra, Product Hunt, partner sites).

**Analytics (later on 10 Nov):** the site loads GTM-PCXWCRLQ, but the published container has no
tags (`"tags":[]` in gtm.js), so GA4 was not collecting anything. GA4 G-0GD48CBLXK is now loaded
directly (gtag.js; enhanced measurement covers client-side page changes), with `sign_up` on
registration and `generate_lead` on enterprise bookings. Verified locally: a page view request to
google-analytics.com/g/collect with tid=G-0GD48CBLXK. Owner to do: mark `sign_up` and `generate_lead`
as key events in GA4, and connect the GA4 property in OpenSEO (Integrations) so sessions can read it.

**Next:**
1. Re-read Search Console for the 7–10 Nov changes (first data ~13 Nov); track the GC construction pages.
2. Internal links to /pricing and /contractor-email-finder from indexed, crawled pages (blog, hubs),
   so Google crawls them.
3. Expand the 7 thin help articles or noindex them.
4. Email-list pages for more trades, one at a time, only with trade-specific content.
5. Comparison and "best tool for X" pages for AI answers (GEO), with sources.
