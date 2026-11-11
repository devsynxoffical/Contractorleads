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

## 2026-11-11

**Data read:** Search Console data runs to 8 Nov, so the 7–10 Nov changes are not in it yet
(last 7 days: 42 impressions, 2 clicks). Only two queries in the top 40 for 28 days.
URL Inspection: /locations and /email-lists moved from "unknown" to "Discovered – currently not
indexed" (found via sitemap.xml). /pricing, /contractor-email-finder still "Discovered"; /tools
still unknown; /industries/general-contractors/texas "Crawled – not indexed" (last crawl 8 Aug).
Pages are discovered but not crawled, which points at crawl priority (few strong internal and
external links), not at a technical block.

**Done (verified locally: build, crawl of 510 sitemap URLs, JSON-LD validation, mobile check):**
- Homepage "Most searched" block (high on the most-crawled page): now links /locations, /email-lists
  and /tools from the page body, uses B2B "find" anchors ("Find roofing leads", "Construction leads in
  Ohio"), and no longer links the noindexed /exclusive-contractor-leads.
- 7 thin product help articles (under 500 words) set to noindex, follow and removed from
  sitemap-help.xml (`NOINDEX_HELP_SLUGS` in academy-content.ts). They stay reachable for customers.

**Needs the owner:** unchanged from 10 Nov (submit sitemaps, request indexing, GA4 key events,
GA4 in OpenSEO, backlinks/listings).

**Next:**
1. Read Search Console once data covers 7–10 Nov (from ~13 Nov).
2. Link /pricing, /contractor-email-finder and /tools from the most relevant blog posts in context.
3. Expand one high-intent guide per day with question-based answers (AEO) and sources (GEO).

## 2026-11-11 (afternoon: growth session)

**Data read (Search Console, 6 months to 8 Nov):** /blog ranks better than the homepage for
"contractor leads" (pos ~49 vs ~71) and for "contract leads" (~30). The only agency-intent page query
with impressions outside the trade pages is "businesses with no website" →
/blog/how-to-find-businesses-without-websites (pos 64–91). "Contractor lead management / lead tracking"
(~75 impressions) is contractors looking for a CRM: wrong audience, not targeted.
Competitors in that SERP: short dev.to / Hashnode posts and Apify scraper listings; for trade lists,
Bytescraper city lists, Orbital and Prospeo "roofing email list" pages (we cover these with /email-lists
and state pages).

**Indexing audit (URL Inspection, 20 URLs):** indexed: /industries, hvac, plumbing, electrical,
general-contractors, remodeling hubs, /features, /blog, /about, the no-website guide, cold email,
owner-name, LSA guide, /alternatives. Discovered, not crawled: /blog/google-maps-lead-generation,
/contractor-lead-generation-software (plus /pricing, /contractor-email-finder, /locations, /email-lists).
Unknown to Google: /industries/solar, /google-maps-scraper, /faq, /blog/can-spam-cold-email-contractors,
/tools. All of these return 200, index/follow, self canonical, are in the sitemaps and allowed by
robots.txt: no technical block, crawl priority only. The LSA guide's VideoObject warning in Search
Console is from the 23 Oct crawl; the live page has no video markup any more.

**Page speed (live, from the container):** LCP 1.2–1.6 s on hubs, state pages, guides and pricing;
home 2.6 s; CLS 0. About 1 MB of JavaScript per page; /pricing loads ~660 KB of CSS (about twice the
other pages) — to investigate.

**Done (verified locally: build, crawl of 510 sitemap URLs, JSON-LD, mobile):**
- /blog/how-to-find-businesses-without-websites expanded 914 → 1,635 words: step-by-step Google Maps
  method, false "no website" checks, weak-website signals table, trades to start with, contact details,
  compliance; 2 new FAQs; FTC source; dateModified 11 Nov; new meta description.
- /blog: "How do agencies find contractor leads?" answer and a topic map linking trade hubs, /locations,
  /email-lists, /contractor-email-finder, /tools, /pricing and key guides.
- Contextual auto-links in all guides: "verified emails" → /contractor-email-finder, "10 free leads" →
  /pricing, "cost per job / break-even close rate" → lead cost calculator, "by state" → /locations.

**Needs the owner:** request indexing in Search Console for /industries/solar, /google-maps-scraper,
/faq, /tools, /pricing, /contractor-email-finder, /locations, /email-lists (about 10 a day).
