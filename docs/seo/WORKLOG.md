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

## 2026-11-12

**Data read:** Search Console now runs to 9 Nov. Daily impressions 16 (7 Nov) and 13 (9 Nov) vs ~5/day
in late October; too early to call a trend. Homepage shows at ~95 for "best contractor lead generation
companies", "best lead generation companies for contractors" and "hvac lead generation companies"
(10 impressions); the matching guide /blog/best-contractor-lead-generation-companies is indexed
(crawled 3 Nov) but was not the page Google chose.
/pricing CSS check: /pricing loads the same two stylesheets as /features, so yesterday's "660 KB" was
a measurement artefact (the files fetched twice with and without the deploy query), not a duplicate.

**Done (verified locally: build, crawl of 510 sitemap URLs, JSON-LD, mobile):**
- /blog/best-contractor-lead-generation-companies 1,028 → 1,515 words: pricing models table (pay per
  lead, pay per call, LSAs, agency retainer), HVAC / roofing / plumbing lead vendor section, questions
  to ask before signing, 2 new FAQs (pay-per-call vendors, shared leads), Google LSA source,
  dateModified 12 Nov, "hvac lead generation companies" and "lead vendors for hvac" as keywords.
- Homepage "Most searched" links the guide ("Best contractor lead generation companies"), so Google
  sees the guide as the site's page for that topic; /alternatives (indexed, linked in the footer) left
  the block to make room.

**Needs the owner:** unchanged (Search Console indexing requests, directory listings, Railway bill).

**Next:** Search Console comparison when data covers 10–11 Nov; homepage LCP (2.6 s); one guide a day.

## 2026-11-12 (owner's Ahrefs/Semrush baseline)

**Data read (owner's export, 12 Nov):** Ahrefs DR 7, Semrush Authority Score 2. 904 referring domains,
893 of them auto-generated spam created June–Sept 2026 (not built by us); 9 real. Semrush US: 10
organic keywords (contract leads #19, contractor leads #55, contractors leads #59); 0 AI citations.
Own sites link sitewide: funnelsthatprint.com (788 links), devsynx.com (76).
Real backlinks still point at 5 old WordPress-era URLs that returned 404.

**Done (verified on a local production build):**
- 308 redirects for the 5 old URLs: HVAC marketing → /blog/hvac-marketing-agency, Facebook ads →
  /blog/facebook-ads-for-contractors, electrician marketing → /blog/electrical-contractor-leads,
  plumbing marketing → /blog/plumbing-contractor-leads, /service-packages → /pricing.
- docs/seo/contractorleads_disavow.txt: 893 domains marked Disavow in the export (real links and own
  sites excluded).
- Best-companies guide H2 now "Best HVAC, roofing and plumbing lead generation companies"
  ("best hvac lead generation companies": 320/mo, KD 8 per the export).

**Needs the owner:** upload the disavow file in Google's Disavow Tool and in Bing Webmaster
(Configure My Site → Disavow Links); change the funnelsthatprint.com and devsynx.com sitewide links to
one contextual link each (those sites are not in this repository).

**Keyword targets from the export (agency fit, low difficulty) for the next sessions:**
"business with no websites" 390 / KD 2 (guide expanded 11 Nov); "best hvac lead generation companies"
320 / KD 8 and "hvac lead generation companies" 260 / KD 12 (guide expanded 12 Nov);
"local lead generation" 1,600 / KD 28 and "local lead generation business" 210 / KD 26 (new guide:
starting a local lead generation business for home-service trades); "how to find b2b leads" 260 / KD 20;
"landscaping lead generation services" 110 / KD 26. Contractor-buying-leads terms ("buy hvac leads",
"plumbing leads for sale") stay out of scope: wrong audience for the product.
- Owner uploaded contractorleads_disavow.txt in Google's Disavow Tool on 12 Nov 2026, 13:55 UTC+5
  (property https://www.contractorleads.us/): "893 domains and 0 URLs are disavowed" (screenshot).
  Future backlink exports: compare against this list; add new spam domains to the same file and
  re-upload with "Replace".

## 2026-11-13

**Data read:** Search Console runs to 10 Nov (10 impressions that day; 7–10 Nov: 16, 5, 13, 10). Same
queries as yesterday, all on the homepage at ~85–99 ("best contractor lead generation companies",
"hvac lead generation companies"); the expanded guide was only crawled before its update.

**Done (verified locally: build, crawl of 511 sitemap URLs, JSON-LD, mobile):**
- New guide /blog/local-lead-generation-business ("local lead generation" 1,600/mo KD 28 and "local
  lead generation business" 210/mo KD 26 in the owner's Semrush export; no existing page covered it):
  business models table, choosing a trade and city, building a lead source (with Google Business Profile
  guideline warning), finding contractor buyers, pricing and terms, TCPA/CAN-SPAM consent (one-to-one
  consent rule vacated Jan 2025), 90-day plan, 4 FAQs, 3 sources. 1,389 words.
- Linked from the /blog "Start here" map; auto-link for "local lead generation", "lead generator(s)"
  and "rank and rent" in other guides.

**Needs the owner:** unchanged (Search Console indexing requests, directory listings, own-site links,
Railway bill).

**Next:** "how to find b2b leads" (260/mo, KD 20) as a section or guide aimed at home-service trades;
check whether Google picks the best-companies guide over the homepage once it is recrawled.

## 2026-11-14

**Data read:** Search Console to 11 Nov (5 impressions that day); no new queries. Live site still on the
12 Nov release (dpl bab47c3): the 13 Nov guide is merged but not deployed (Railway past due).

**Done (verified on a local production build):** /llms-full.txt built from site content (268 KB, 54
sections) and linked from /llms.txt; 6 short meta descriptions rewritten (prompt audit: 0 out of range).
Details in SEO_FIX_REPORT.md.

**Needs the owner:** Railway payment and redeploy; CONFIG facts listed in SEO_FIX_REPORT.md.

**Next:** upgrade the 11 near-duplicate trade hubs (avg similarity 0.445) with trade-specific content.

## 2026-11-15

**Data read:** Search Console to 12 Nov. The 11 non-priority trades' state pages (noindexed since
7 Nov) still show a few impressions at positions 90-210; their hubs are indexable.

**Done (verified on a local production build with scripts/seo-audit.mjs):** trade-specific content for
the 11 non-priority hubs (quick answer, buys, timing, searches, pitch mistakes, FAQs). Industries
near-duplicate average 0.445 → 0.331; sitemap lastmod 15 Nov for those hubs.

**Needs the owner:** CONFIG facts in SEO_FIX_REPORT.md; Search Console indexing requests.

**Next:** location pages (near-duplicate 0.388): add state-specific content to bring them under 0.35.

## 2026-11-16

**Data read:** Search Console to 13 Nov: 17 impressions on 13 Nov (highest day since early October;
one day, not yet a trend), all at positions 60-90.

**Done (verified on a local production build with scripts/seo-audit.mjs):** state location pages get
state-specific pitch angles and city searches for their top 3 trades; identical boilerplate removed.
Locations near-duplicate average 0.388 → 0.285. LOCATIONS_UPDATED set to 16 Nov.

**Needs the owner:** CONFIG facts in SEO_FIX_REPORT.md; Search Console indexing requests.

**Next:** Phase 8 (AEO): short answer blocks and question-led headings on the money pages
(/features, /pricing, /contractor-email-finder, /contractor-lead-generation-software).
- 16 Nov (afternoon): metadata pass on all 511 pages and Speakable/short-answer AEO work; details in
  SEO_FIX_REPORT.md. Search Console 28 days: home page still the page shown for "contractor leads"
  (56 impressions, pos ~89), "exclusive contractor leads" (23), "hvac lead generation companies" (14).
- 16 Nov (evening): deep performance diagnosis, `docs/seo/DIAGNOSIS-2026-11-16.md`. Shipped a temporary
  `sitemap-legacy.xml` (37 old /trades URLs still held by Google since 28 Jul). Baseline recorded for
  15 Dec / 15 Jan comparison.
- 16 Nov (night): GEO. New comparison guide /blog/best-email-finder-for-local-businesses (the page type
  AI answers cite for "best tool to find contractor owner emails"; the site had none). Blog tables now
  render [label](/path) links. Audit script skips sitemap-legacy.xml. All sitemap URLs resubmitted to IndexNow.

## 17 Nov 2026

**Data read (Search Console, to 16 Nov):** impressions up to 17-33/day on 13-16 Nov (5-16/day the week
before), almost all on the homepage at position ~89; 0 clicks. New in the last 7 days: "best contractor
lead generation companies" (21 impr., pos 97, homepage), "best lead service for contractors" (6), "leads
for contractors" (5). No query at positions 5-40 with more than 1 impression.
**URL Inspection:** /blog/best-contractor-lead-generation-companies indexed (crawled 3 Nov) and already
linked from the homepage with that exact anchor, so no change made. /pricing, /contractor-email-finder,
/locations/texas still "Discovered"; /industries/roofing/texas still "Crawled - not indexed" (2 Aug);
/trades/remodeling/georgia not recrawled yet (28 Jul), so the legacy sitemap has not been read yet;
/blog/best-email-finder-for-local-businesses unknown to Google (published yesterday).
**Done and verified:** mobile lab performance (Pixel 7, 4x CPU, ~6 Mbps): homepage LCP 1.6-1.9 s in 4 of
5 runs (one cold run 2.7 s), LCP element = hero image, painted ~30 ms after first paint; /pricing,
/industries/roofing/texas and the new guide ~1.1-1.4 s; CLS ≤ 0.043. The "homepage LCP 2.6 s" backlog
item is closed. No page changes today: the data does not support any, and pages changed 9-16 Nov have
not been recrawled.
**Needs the owner:** Search Console "Request indexing" for the 20 URLs in DIAGNOSIS-2026-11-16.md plus
/blog/best-email-finder-for-local-businesses; resubmit sitemap.xml; Bing Webmaster Tools sitemap;
directory listings.
**Next:** check whether Google has fetched sitemap-legacy.xml (/trades URLs recrawled); keep watching
the "best contractor lead generation" query group for the guide to replace the homepage.
- 17 Nov (full SEO/AEO/GEO cycle): live audit of 512 URLs clean (0 errors in every check). OpenSEO has 2
  credits, so no paid keyword or SERP data; keyword work used Search Console and free SERP reads.
  Implemented: /locations gets a 50-state comparison table (largest cities, demand drivers, trades to pitch
  first, linked to each state and trade + state page) and a methodology note; /industries gets an 18-trade
  table (what owners buy first, when they plan marketing). Both built only from state-profiles.ts and
  trade-hub-content.ts. Word count: /locations 440 → ~1,300, /industries 466 → ~1,200. Tables stack on
  mobile (0 px horizontal overflow). Checked and left unchanged: best-companies guide intent, author/
  Organization schema, redirects, 404s, parameter canonicals, robots.txt.
- 17 Nov (GEO, evening): Bing Webmaster API: site verified; Bing crawled /, /pricing, /contractor-email-finder,
  /locations and /blog/best-email-finder-for-local-businesses (16 Nov). Bing performance: 14 impressions, 0
  clicks; several long, AI-style grounding queries show our pages at positions 1-10. Submitted 98 priority URLs
  with SubmitUrlBatch (daily quota 100 → 2) and resubmitted sitemap.xml + 4 child sitemaps (Bing's feed showed
  84 URLs of 512). Added docs/seo/DIRECTORY-LISTINGS.md: ready-to-paste, fact-checked listing copy for G2,
  Capterra, AlternativeTo, Product Hunt, Crunchbase (owner must create the accounts).

## 18 Nov 2026

**Data read:** Search Console 11-17 Nov: 1 click (17 Nov, first since 5 Nov), impressions 11-33/day. The
"best lead generation companies / services / websites for contractors" group (~60 impr. this week) is shown
on the homepage at positions 87-100; the one time Google showed the guide for it, it ranked 7. GA4 (connected
17 Nov, data to 16 Nov): 74 direct sessions, 1 chatgpt.com session (AI assistant), 0 key events.
URL Inspection: /blog/best-email-finder-for-local-businesses unknown → Discovered; /trades/remodeling/georgia
now lists the sitemap as its source but is not recrawled yet (28 Jul); /pricing, /locations still Discovered;
/industries/roofing/texas still Crawled - not indexed (2 Aug).
**Done and verified (local production build, audit 0 errors):** to steer that query group to the guide:
two contextual links from indexed guides (/blog/how-to-get-contractor-leads, /blog/how-much-do-contractor-
leads-cost) with the searched anchors; new FAQ "What are the best lead generation websites for contractors?"
on the guide (FAQPage now 7 questions; facts match the guide's own marketplace section); guide dateModified
18 Nov.
**Needs the owner:** GA4: mark sign_up and generate_lead as key events (current key events are GA4 defaults
the site never sends). Search Console Request indexing for the priority URLs; directory listings
(docs/seo/DIRECTORY-LISTINGS.md).
**Next:** watch whether the guide replaces the homepage for that query group; re-check /trades recrawl.
- 18 Nov (full cycle, afternoon): 90-day Search Console has only 6 query+page rows in positions 1-20
  (all 1-8 impressions); nothing new to optimise there. Two new findings, both fixed:
  1. The 550 trade + state pages of the 11 non-priority trades (noindex since 22 Oct) are still
     "Submitted and indexed": Google last crawled them 15-21 Oct (URL Inspection on 4 samples) and they
     keep appearing at positions 90-210. Added temporary sitemap-removed.xml (550 URLs, lastmod 22 Oct) so
     they are recrawled and dropped. Remove after 31 Jan 2027.
  2. GA4 measured the logged-in app and admin (/email-accounts, /inbox, /campaigns, /admin/customers/<id>
     were the top pages), so marketing reports were mostly product usage and admin customer IDs went to
     Google. GA4 is now disabled on the private sections from robots.txt (shared list in
     lib/private-sections.ts); /register, /login and /ref stay measured. Verified in Chromium: public and
     funnel pages send page_view, app/admin paths send nothing, including client-side navigations.
- 18 Nov (evening), ROOT CAUSE FOUND (owner's Search Console crawl stats, Aug-Nov): "Other file type" =
  9,580 of 12,600 Google crawl requests (76%), HTML only 12%; the examples are Next.js RSC payloads
  (e.g. /locations/california?_rsc=..., /industries/hvac/california?_rsc=...). Google spent three of
  every four crawls on these instead of pages, which is why money pages stayed "Discovered, not crawled"
  and state pages were not recrawled since August. Fix: robots.txt now disallows /*?_rsc= and /*&_rsc=
  for every group (tested with Google matching rules: _rsc URLs blocked; pages, UTM URLs, sitemaps,
  llms.txt allowed). Also: no manual action; host status "robots.txt fetch: high fail rate in the past"
  (likely the late-September drop; owner to expand the row for dates).
- 18 Nov 17:24 UTC (first 12-hour run): baseline recorded in docs/seo/TRACKING.md. No page changes: all
  18 Nov fixes are waiting for Google to recrawl.
- 19 Nov 05:24 UTC run: tracking row added; 100 more URLs to Bing; noindex removal confirmed on 2 samples.
