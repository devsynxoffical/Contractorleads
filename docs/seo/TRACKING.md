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

### 20 Nov 17:24 UTC

- **GSC 7d (14-20 Nov, 20 Nov partial):** 1 click, 196 impressions, avg position ~85 (prev run 169). Best day
  19 Nov: 65 impressions, all homepage, old "contractor lead generation" queries at ~88.
- **GSC 28d (24 Oct-20 Nov):** 4 clicks, 327 impressions (baseline 22 Oct-18 Nov: 7 / 285). Queries in top 10: 1,
  top 20: 1 ("best lead generation companies for contractors" -> guide, pos 7, 1 impression).
- **Indexing (URL Inspection):** /contractor-email-list, /businesses-without-websites, /local-business-email-list
  **Submitted and indexed**, crawled 20 Nov 16:12 UTC (same day as launch). Homepage recrawled 16:12 (new title
  now seen by Google). /locations and /apollo-alternative still "unknown to Google"; /industries/roofing/texas
  "Crawled - not indexed" (last crawl 2 Aug). /pricing check timed out.
- **GA4 (14-19 Nov):** chatgpt.com 4 sessions (prev 2), google organic 2, direct 23; key events 0.
- **Bing:** 135 indexed (unchanged), 14 impressions / 0 clicks on 14 queries; daily URL submission quota 0 left.
- **Movers:** up: 3 new pages indexed, ChatGPT sessions 2 -> 4, 7d impressions 169 -> 196. Down: none.
- **Work:** none. Pages indexed today need 1-2 weeks before they can be judged; no other actionable data.

### 21 Nov 05:24 UTC

- **GSC 7d (14-20 Nov):** 1 click, 216 impressions, avg position ~85 (prev run 196). 20 Nov final: 23 impressions.
- **GSC 28d (24 Oct-20 Nov):** 4 clicks, 347 impressions (prev run 327). Queries in top 10 / top 20: 1 / 1.
  All recent impressions still go to the homepage for "contractor lead generation" terms (pos 47-97); best:
  "construction lead services" 47.5, "construction lead service" 50. No impressions yet for the 3 new pages
  (indexed 20 Nov; GSC lags ~2-3 days).
- **Indexing:** /pricing and /contractor-email-finder still "Discovered - currently not indexed" (both linked from
  every indexed money page, 1-4 links each; crawl priority, not linking). New pages indexed (20 Nov run).
- **GA4 (14-19 Nov):** chatgpt.com 4, google organic 2, direct 23; key events 0.
- **Bing:** 142 indexed (prev 135), 18 impressions / 0 clicks; submitted 100 priority URLs (best100.txt).
- **Movers:** up: Bing index 135 -> 142, 7d impressions 196 -> 216. Down: none.
- **Work:** no page changes (new pages need time; no striking-distance queries). Bing batch submitted.

### 21 Nov 17:23 UTC

- **GSC 7d (14-20 Nov):** 1 click, 250 impressions, avg position ~85 (prev run 216; 20 Nov final 57).
  Previous 7d (7-13 Nov): 73. **GSC 28d (25 Oct-21 Nov):** 4 clicks, 375 impressions (prev 347).
  Queries in top 10 / top 20: 0 / 0 in the last 3 days. All impressions still on the homepage (old
  "contractor lead generation" terms, pos 77-100). No data yet for the 3 new pages (GSC lag).
- **Indexing:** /contractor-list recrawled 20 Nov 16:14 (new directory/database title now seen);
  /trades/hvac/texas "Page with redirect" (legacy OK); /industries/pest-control/oregon (removed sitemap) still
  indexed, last crawl 28 Sep (not recrawled yet).
- **GA4 (14-20 Nov):** chatgpt.com 5 (prev 4), google organic 2, direct 23; key events 0.
- **Bing:** 142 indexed, 18 impressions / 0 clicks; daily quota 0 (used this morning), monthly 900 left.
- **Movers:** up: 7d impressions 216 -> 250, ChatGPT 4 -> 5. Down: none.
- **Work:** none; no striking-distance queries and new pages not measurable yet. Google Indexing API on hold
  until 27 Nov (owner request).

### 22 Nov 05:23 UTC

- **GSC 7d (15-21 Nov):** 0 clicks, 256 impressions, avg position ~85 (prev run 250). 21 Nov: 39.
  **GSC 28d (26 Oct-22 Nov):** 4 clicks, 402 impressions (prev 375). Top 10 / top 20 queries: 0 / 0.
- **First impression for a new page:** "companies without websites" -> /businesses-without-websites (pos 97).
  Everything else still homepage, old "contractor lead generation" terms (pos 45-101; best "construction
  leads services" 45).
- **Indexing:** /pricing and /contractor-email-finder now report "URL is unknown to Google" (were "Discovered");
  /google-maps-scraper still "Discovered - currently not indexed".
- **GA4 (15-20 Nov):** chatgpt.com 4, google organic 2, direct 22; key events 0.
- **Bing:** 150 indexed (prev 142), 131 pages crawled on the last day (prev 40), 18 impressions / 0 clicks.
  Daily URL submission not sent this run (blocked by the session's permission check); 100/day, 900/month left.
- **Movers:** up: Bing index 142 -> 150, Bing crawl 40 -> 131 pages/day, first new-page impression. Down: none.
- **Work:** none; nothing in positions 4-40 to improve.

### 22 Nov 17:23 UTC

- **GSC 7d (15-21 Nov):** 0 clicks, 275 impressions, avg position ~86 (prev run 256). 21 Nov final: 58.
  **GSC 28d (26 Oct-22 Nov):** 4 clicks, ~425 impressions (prev 402). Top 10 / top 20 queries: 0 / 0.
  Only non-homepage query: "companies without websites" -> /businesses-without-websites (pos 97).
- **Indexing:** /apollo-alternative and /locations "Discovered - currently not indexed" (were "unknown");
  /industries/painting/ohio "Excluded by noindex" (removal sitemap working).
- **GA4 (15-21 Nov):** chatgpt.com 5, google organic 2, direct 23; key events 0.
- **Bing:** 150 indexed, 18 impressions / 0 clicks (unchanged). No URL batch sent (permission check).
- **Movers:** up: 7d impressions 256 -> 275; /apollo-alternative and /locations now discovered. Down: none.
- **Work:** none. Planned homepage "popular lists" links checked and dropped: the homepage already links
  the 3 new pages, /pricing (4x) and /contractor-email-finder (2x); indexing is a crawl-priority issue.

### 23 Nov 05:23 UTC

- **GSC 7d (16-22 Nov):** 0 clicks, 339 impressions, avg position ~88 (prev run 275). **21 Nov: 97 impressions
  (best day on record)**, 22 Nov: 52. **GSC 28d (26 Oct-22 Nov):** 4 clicks, 512 impressions (prev ~425).
  Queries at position <= 60: 0. Only non-homepage query still "companies without websites" (pos 97).
- **Indexing:** /contractor-email-finder back to "Discovered"; /pricing "unknown to Google";
  /industries/roofing/texas "Crawled - not indexed" (last crawl 2 Aug).
- **GA4 (16-21 Nov):** chatgpt.com 5, google organic 2, direct 19; key events 0.
- **Bing:** 155 indexed (prev 150), 135 pages crawled last day, 18 impressions / 0 clicks.
- **Movers:** up: 7d impressions 275 -> 339, best day 97, Bing index 150 -> 155. Down: none.
- **Work:** none (no query within reach of page 1-4; new pages still collecting data).

### 23 Nov 17:23 UTC

- **GSC 7d (16-22 Nov):** 1 click, 397 impressions, avg position ~87 (prev run 339). **22 Nov: 110 impressions
  and 1 click (new best day)**; 21 Nov: 97. **GSC 28d (27 Oct-23 Nov):** 5 clicks, ~565 impressions (prev 512).
  Queries at position <= 60: 0. The 22 Nov click came from an anonymized query (not listed by GSC).
  22 Nov queries: all homepage, contractor/construction lead generation terms at pos 74-100; best
  "hvac lead generation companies" 74. New pages: still only "companies without websites" (pos 97).
- **GA4 (16-22 Nov):** chatgpt.com 5, google organic 2, direct 23; key events 0.
- **Bing:** 155 indexed, 18 impressions / 0 clicks (unchanged). No URL batch sent (session permission check).
- **Movers:** up: 7d impressions 339 -> 397, best day 110, first click since 17 Nov. Down: none.
- **Work:** none this run. Today's changes (C8-C12: homepage meta/FAQs, HVAC FAQ, guide links, pricing fix,
  content-plan FAQs) went live 23 Nov and need recrawl before they can be measured.

### 24 Nov 05:24 UTC

- **GSC 7d (17-23 Nov):** 1 click, 423 impressions, avg position ~88 (prev run 397). 23 Nov: 55 (partial).
  **GSC 28d (28 Oct-24 Nov):** 5 clicks, 614 impressions (prev ~565). Queries at position <= 60: 0.
  Non-homepage queries: still only "companies without websites" -> /businesses-without-websites (pos 97).
- **Indexing:** homepage last crawled 20 Nov (23 Nov meta/FAQ changes not seen yet); /industries/hvac indexed,
  last crawl 2 Aug (not recrawled since); /pricing still "unknown to Google".
- **GA4 (17-22 Nov):** chatgpt.com 5, google organic 2, direct 22; key events 0.
- **Bing:** 164 indexed (prev 155), 147 pages crawled last day, 18 impressions / 0 clicks.
- **Movers:** up: 7d impressions 397 -> 423, 28d 565 -> 614, Bing index 155 -> 164. Down: none.
- **Work:** none; 23 Nov changes not recrawled yet, no query in reach of page 1-4.

### 24 Nov 17:24 UTC

- **GSC 7d (17-23 Nov):** 1 click, 480 impressions, avg position ~88 (prev run 423). **23 Nov final: 112
  impressions (new best day)**. **GSC 28d (28 Oct-24 Nov):** 5 clicks, ~677 impressions (prev 614).
  Queries at position <= 60: 0. Non-homepage: only "companies without websites" (pos 97).
- **Indexing:** homepage still last crawled 20 Nov (23-24 Nov changes not seen yet); /contractor-email-finder and
  /google-maps-scraper "unknown to Google" (were "Discovered"). New referring URL seen: devsynx.com client page.
- **GA4 (17-23 Nov):** chatgpt.com 7 (prev 5), google organic 4 (prev 2), direct 24; key events 0.
- **Bing:** 164 indexed, 18 impressions / 0 clicks (unchanged).
- **Movers:** up: 7d impressions 423 -> 480, best day 112, ChatGPT 5 -> 7, Google organic 2 -> 4. Down: none.
- **Work:** none; recent changes not recrawled yet and no query in reach of page 1-4.

### 25 Nov 05:23 UTC

- **GSC 7d (18-24 Nov):** 1 click, 512 impressions, avg position ~89 (prev run 480). 24 Nov: 47 (partial).
  **GSC 28d (29 Oct-25 Nov):** 5 clicks, 717 impressions (prev ~677). Queries at position <= 60: 0.
  Non-homepage: only "companies without websites" (pos 97).
- **Indexing:** homepage still last crawled 20 Nov; /pricing back to "Discovered - currently not indexed";
  /industries/pest-control/oregon (removed sitemap) still indexed, last crawl 28 Sep.
- **GA4 (18-23 Nov):** chatgpt.com 7, google organic 3, direct 17; key events 0.
- **Bing:** 170 indexed (prev 164), 145 pages crawled last day, 18 impressions / 0 clicks.
- **Movers:** up: 7d impressions 480 -> 512, 28d 677 -> 717, Bing index 164 -> 170. Down: none.
- **Work:** none; nothing within reach of page 1-4 and recent changes not recrawled.

### 25 Nov 17:23 UTC

- **GSC 7d (18-24 Nov):** 1 click, 553 impressions, avg position ~89 (prev run 512). 24 Nov final: 88.
  **GSC 28d (29 Oct-25 Nov):** 5 clicks, ~762 impressions (prev 717). Queries at position <= 60: 0;
  no non-homepage queries in the last 4 days.
- **Indexing:** homepage and /businesses-without-websites indexed, both last crawled 20 Nov;
  /industries/roofing/texas still "Crawled - not indexed" (noindex since 25 Nov, not recrawled yet).
- **GA4 (18-24 Nov):** chatgpt.com 10 (prev 7), google organic 4, direct 22, l.facebook.com 1; key events 0.
- **Bing:** 170 indexed, 18 impressions / 0 clicks (unchanged).
- **Movers:** up: 7d impressions 512 -> 553, ChatGPT sessions 7 -> 10. Down: none.
- **Work:** none this run (week 1 city-plan noindex and the lead-access security fix shipped earlier today).

### 26 Nov 05:23 UTC

- **GSC 7d (19-25 Nov):** 0 clicks, 586 impressions, avg position ~89 (prev run 553). 25 Nov: 57 (partial).
  **GSC 28d (30 Oct-26 Nov):** 5 clicks, ~814 impressions (prev ~762). Queries at position <= 60: 0.
- **Indexing:** /contractor-email-list indexed (last crawl 20 Nov); /pricing "Discovered - currently not indexed";
  /industries/hvac/florida "Crawled - not indexed" (last crawl 15 Oct; noindex not yet seen).
- **GA4 (19-24 Nov):** chatgpt.com 9, google organic 4, direct 21, l.facebook.com 1; key events 0.
- **Bing:** 176 indexed (prev 170), 125 pages crawled last day, 18 impressions / 0 clicks.
- **Movers:** up: 7d impressions 553 -> 586, 28d 762 -> 814, Bing index 170 -> 176. Down: none.
- **Work:** none; /locations/{state} noindex (city plan week 1) becomes allowed 27 Nov under the 7-day rule.

### 26 Nov 17:23 UTC

- **GSC 7d (20-26 Nov):** 0 clicks, 659 impressions, avg position ~90 (prev run 586). Last 3 days: 88, 98, 97.
  **GSC 28d (30 Oct-26 Nov):** 5 clicks, ~952 impressions (prev ~814). Queries at position <= 60: 0.
- **Indexing:** /features recrawled 24 Nov (indexed); homepage last crawl 20 Nov; /industries/general-contractors/ohio
  still indexed (last crawl 3 Nov, noindex not yet seen).
- **GA4 (19-25 Nov):** chatgpt.com 11 (prev 9), google organic 7 (prev 4), direct 23, l.facebook.com 1; key events 0.
- **Bing:** 176 indexed, 18 impressions / 0 clicks (unchanged).
- **Movers:** up: 7d impressions 586 -> 659, 28d 814 -> 952, ChatGPT 9 -> 11, Google organic 4 -> 7. Down: none.
- **Work:** none this run (day 1 SEO pass shipped today; day 2 scheduled 27 Nov).
