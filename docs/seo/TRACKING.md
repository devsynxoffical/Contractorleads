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
