# SEO tracking log: www.contractorleads.us

One row per 12-hour monitoring run (05:23 and 17:23 UTC). Search Console data lags 2-3 days, so
consecutive runs can show the same numbers. Sources: Search Console (GSC), Google Analytics 4 (GA4,
marketing pages only from 18 Nov), URL Inspection, Bing Webmaster Tools.

## Snapshot table

| Run (UTC) | GSC 7d clicks / impr. | GSC 28d clicks / impr. | Queries top 10 / top 20 | Money pages indexed* | GA4 7d organic / AI sessions / key events | Bing impr. / pages indexed | Changes shipped |
|---|---|---|---|---|---|---|---|
| 18 Nov 17:24 (baseline) | 1 / 129 (12-18 Nov) | 7 / 275 (21 Oct-18 Nov) | 1 / 1 | 0 of 5 | 1 / 1 (chatgpt.com) / 0 | 14 / 128 | none (see notes) |
| 19 Nov 05:24 | 1 / 137 (13-19 Nov) | 7 / ~281 (22 Oct-18 Nov) | 1 / 1 | 0 of 5 | 1 / 1 (chatgpt.com) / 0 | 14 / 128 | none; 100 URLs to Bing |
| 19 Nov 17:24 | 1 / 148 (13-19 Nov) | 7 / ~285 | 1 / 1 | 1 of 6 (/contractor-list indexed) | 1 / 1 (chatgpt.com) / 0 | 14 / 135 | none (Bing quota used this morning) |
| 20 Nov 05:24 | 1 / 169 (13-19 Nov) | 7 / ~290 | 0 / 0 (pos 7 guide not seen this week) | 1 of 6 | 1 / 2 (chatgpt.com) / 0 | 14 / 135 | /contractor-list + 99 URLs to Bing |

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

### 19 Nov 2026, 17:24 UTC
- **First win:** /contractor-list (published 19 Nov) is "Submitted and indexed", crawled 19 Nov 10:03 UTC,
  hours after launch. First new page indexed this fast; consistent with the 18 Nov crawl fix.
- **GSC:** 7-day impressions 137 → 148 (18 Nov: 24). Homepage positions improved for the "lead
  services" group: contractor lead services 54, contractor leads services 51, contractor lead
  generation service 57, contractors leads service 57, contractor lead generation company 60 (most were
  85-95 last week); "construction lead services" 48. Still homepage only, still 0 clicks this week.
- **Not indexed yet:** /pricing and /contractor-email-finder "unknown"; /email-lists and the email-finder
  guide "Discovered"; /industries/roofing/texas "Crawled - not indexed" (2 Aug).
- **Removal/legacy checks:** /industries/concrete/alabama still indexed (crawled 15 Oct);
  /industries/landscaping/maryland "Crawled - not indexed"; /trades/remodeling/connecticut not recrawled.
- **Bing:** 135 pages indexed (128 → 135); 14 query impressions. Daily URL quota already used this morning.
- **Work:** none on pages; the new page and 18 Nov fixes are being picked up. Indexing API best-100 run is
  scheduled for 20 Nov 08:01 UTC.

### 20 Nov 2026, 05:24 UTC
- **GSC:** 7-day impressions 148 → 169 (19 Nov: 24). Homepage only. "construction lead services" 48,
  "contractor leads services" 51, "contractor lead services" 54, "contractor lead generation companies" 56.
- **GA4 (13-18 Nov):** chatgpt.com 2 sessions (was 1), google organic 1, direct 23, key events 0.
- **Indexing:** /contractor-list still indexed; /contractor-email-finder now "Discovered" (was "unknown");
  /pricing "Discovered"; /industries/garage-doors/virginia (noindex) still indexed, last crawl 15 Oct.
- **Bing:** 135 pages indexed; submitted /contractor-list and 99 more trade + state pages (total ~398).
- **Work:** keyword map PDF for all 513 pages (owner request). No page changes.

### 20 Nov 08:02 UTC: Google Indexing API run + keyword map shipped

- **Shipped (PR #62):** homepage repositioned to "lead generation for marketing agencies"; /contractor-list
  retargeted (directory, database, list of contractors); new /contractor-email-list, /businesses-without-websites,
  /local-business-email-list; /email-lists and 5 homeowner-intent pages 308 redirected. IndexNow: 12 URLs.
- **Google Indexing API (URL_UPDATED), quota reset 00:01 PT:** best100.txt 102/102 accepted (money pages, 3 new
  pages, email lists, tools, alternatives, trade hubs, big-state pages, guides); then 98/98 accepted from day1.txt
  (40 /locations, 27 /industries, 15 /blog, 12 /help, 4 utility). 200 of 200 daily quota used, 0 failures.
  Accepted = notice received, not indexed. Validate with URL Inspection on 22-23 Nov.
