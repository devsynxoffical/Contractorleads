# SEO tracking log: www.contractorleads.us

One row per 12-hour monitoring run (05:23 and 17:23 UTC). Search Console data lags 2-3 days, so
consecutive runs can show the same numbers. Sources: Search Console (GSC), Google Analytics 4 (GA4,
marketing pages only from 18 Nov), URL Inspection, Bing Webmaster Tools.

## Snapshot table

| Run (UTC) | GSC 7d clicks / impr. | GSC 28d clicks / impr. | Queries top 10 / top 20 | Money pages indexed* | GA4 7d organic / AI sessions / key events | Bing impr. / pages indexed | Changes shipped |
|---|---|---|---|---|---|---|---|
| 18 Nov 17:24 (baseline) | 1 / 129 (12-18 Nov) | 7 / 275 (21 Oct-18 Nov) | 1 / 1 | 0 of 5 | 1 / 1 (chatgpt.com) / 0 | 14 / 128 | none (see notes) |
| 19 Nov 05:24 | 1 / 137 (13-19 Nov) | 7 / ~281 (22 Oct-18 Nov) | 1 / 1 | 0 of 5 | 1 / 1 (chatgpt.com) / 0 | 14 / 128 | none; 100 URLs to Bing |

*Tracked money pages: /pricing, /contractor-email-finder, /locations, /email-lists, /industries/roofing/texas.

## Run notes

### 18 Nov 2026, 17:24 UTC (baseline)
- **GSC daily impressions:** 17 (13 Nov), 33, 27, 29, 15 (17 Nov); 18 Nov partial. Homepage carries almost
  all of them at positions 75-97 (best contractor lead generation companies 23, contractor leads 10,
  contractor lead generation services 8, best lead service for contractors 7).
- **Top 20:** only "best lead generation companies for contractors" → guide at position 7 (1 impression).
  No query at positions 21-40 with more than 1 impression ("get more roofing leads", 38).
- **Cannibalization:** the "best ... lead generation companies / services" group still shows the homepage;
  the guide fix (links + FAQ) shipped 18 Nov and has not been recrawled yet.
- **URL Inspection:** /pricing and /email-lists "Discovered"; /contractor-email-finder, /locations,
  /blog/best-email-finder-for-local-businesses, /blog/local-lead-generation-business "unknown"
  (the API flips between these two states for the same URLs); /industries/roofing/texas "Crawled - not
  indexed" (2 Aug). Removal check: /industries/windows-and-doors/texas and /garage-doors/kentucky still
  indexed (last crawled 15-21 Oct). Legacy check: /trades/remodeling/georgia still not recrawled (28 Jul).
- **GA4 (12-17 Nov):** direct 35 sessions (80% engaged), chatgpt.com 1, google organic 1, key events 0.
- **Bing:** 14 query impressions, 0 clicks; 128 pages indexed (16 Nov); daily URL quota used (0 left today).
- **robots.txt:** _rsc rules live (4 lines).
- **Work:** none. Every fix from 18 Nov (robots _rsc block, sitemap dates, removal sitemap, guide links)
  is waiting for Google to recrawl; changing pages now would muddy the measurement.
- **Needs the owner:** Search Console sitemap resubmit and Request indexing (not confirmed done yet);
  GA4 key events.

### 19 Nov 2026, 05:24 UTC
- **GSC:** 7-day impressions 129 → 137 (18 Nov: 16, up from a partial 1). Still almost all on the homepage.
- **Movers:** "contractor lead generation companies" position 91 → 73.5; "construction lead services" 3 → 5
  impressions at ~48; new "construction lead generation companies" (2, position 59.5) and "home improvement
  leads online" (1, 64). "hvac lead generation companies" 5 → 2 impressions. No query entered the top 20.
- **Removal working:** /industries/painting/ohio and /trades/pool-services/pennsylvania now "Excluded by
  'noindex' tag" (crawled 9 Nov and 4 Nov). /industries/pool-services/wyoming shows "unknown".
- **Money pages:** /pricing, /tools, /google-maps-scraper, /industries/solar "Discovered"; /locations, /faq
  "unknown". The "best lead generation companies" guide is indexed (last crawled 3 Nov).
- **GA4 (12-17 Nov):** unchanged (direct 35, chatgpt.com 1, google organic 1, key events 0); GA4 data to 17 Nov.
- **Bing:** 128 pages indexed (17 Nov), 14 impressions. Submitted 100 more trade + state pages (total 298).
- **Work:** none on pages. The "construction lead services" queries reach ~48-60, but they come from
  contractors buying project leads, not from agencies; the matching page is deliberately noindexed.
- **Needs the owner:** sitemap resubmit and Request indexing; GA4 key events.
