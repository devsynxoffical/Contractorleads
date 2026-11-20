# Why www.contractorleads.us is not performing: honest investigation (19 Nov 2026)

Data: Google Search Console (GSC), Google Analytics 4 (GA4, installed 10 Nov), Bing Webmaster Tools, URL
Inspection, code history, local tests. Search Console data starts 26 Jul 2026. Nothing below is estimated
unless marked **ASSUMPTION**.

## 1. Baseline

| Window | Clicks | Impressions | Avg position |
|---|---|---|---|
| Last 28 days (22 Oct - 18 Nov) | **7** | **285** | ~75 |
| Previous 28 days (24 Sep - 21 Oct) | 4 | 197 | ~74 |
| Last 3 months (21 Aug - 18 Nov) | **25** | **978** | ~67 |
| Previous 3 months (data only from 26 Jul) | 6 | 912 | ~69 |

Last 28 days vs previous: impressions +45%, clicks +3. Last 3 months vs previous: clicks 6 → 25, but
impressions per day fell from ~35 (launch spike) to ~11. **In absolute terms the site gets about 2 clicks a
week from Google.** GA4 (12-17 Nov): 1 Google organic session, 1 ChatGPT session.

## 2. Where the impressions actually come from (last 3 months, page-level)

| Page group | Pages built | Impressions | Clicks | Verdict |
|---|---|---|---|---|
| Homepage | 1 | 624 | 11 | Shown for broad "contractor leads" queries at position ~72; wrong searcher (see 4.2) |
| /blog index | 1 | 104 | 0 | Shown for "contractor lead management" (CRM intent) |
| Brand / utility (about, features, help, privacy, terms, industries, alternatives) | ~10 | ~116 | 3 | Rank 2-8 for brand and navigational queries only |
| **44 new guides (Oct-Nov)** | 44 | **~25** | **0** | **Not earning.** Most are not indexed or rank 1-impression long tail |
| Priority trade + state pages | 350 | ~140 | 4 | Long tail of 1-3 impressions each; best: GC/Ohio position 14, 21 impressions |
| Non-priority trade + state pages (noindexed 22 Oct) | 550 | ~120 | 5 | Earned as much as the priority pages before noindex |
| Old /trades duplicates | - | ~57 | 2 | Legacy, being retired |
| **Money pages** (pricing, email finder, email lists, Google Maps scraper, lead-gen software, locations, tools, FAQ, Apollo alternative) | ~30 | **~8** | **0** | **Never indexed in Google** |

## 3. Was the previous SEO work effective? Mostly no, and here is why

1. **We built far more pages than Google would crawl.** About 135 indexable pages were added in one month
   (44 guides, 51 location pages, 11 comparisons, 8 email-list pages, tools, help) on a 4-month-old domain
   with Domain Rating 7. The money pages Google needs most have sat at "Discovered, not crawled" for weeks.
   More pages did not mean more traffic; the 44 guides produced about 25 impressions in total.
2. **A technical fault hid all of it.** 76% of Google's crawl requests (9,580 of 12,600) went to Next.js
   `?_rsc=` payload URLs instead of pages, from launch until 18 Nov. Our checks only imitated Googlebot's
   user agent and missed this for weeks; the owner's crawl-stats screenshot found it. Fixed 18 Nov.
3. **We re-edited pages Google had not read.** Titles and descriptions of the same 500+ pages were rewritten
   on 3, 9 and 16 Nov. Google had not recrawled them in between, so the work could not be measured and
   gave nothing back. Lesson: one change, then wait for a recrawl, then measure.
4. **robots.txt failed to load for Google at some point** (Search Console host status: "high fail rate in
   the past"), which pauses crawling of the whole site; the most likely cause of the 25 Sep drop.
   **ASSUMPTION:** linked to hosting downtime (Railway billing lapsed in mid-November; dates not confirmed).

## 4. Did we target the wrong keywords? Partly yes

1. **No keyword volumes were ever verified.** The OpenSEO account has had too few credits for volume data,
   so pages were built on assumed demand. That is the main weakness of the content plan.
2. **The head terms bring the wrong searcher.** "contractor leads", "exclusive contractor leads", "best
   contractor lead generation companies", "lead generation websites for contractors", "construction lead
   services": the result pages are Angi, Thumbtack, ServiceTitan, Houzz and agency roundups. These people
   are contractors buying homeowner jobs, not agencies buying prospect data. Even at position 1 they would
   rarely become customers. This is 80%+ of current impressions.
3. **Right audience, little proven demand:** "[trade] email list", "list of [trade] companies in [state]",
   "find businesses without a website", "Apollo / Outscraper alternative". These match the buyer but we
   have no proof of volume, and competitors with Domain Rating 70-90 own them.

## 5. Unnecessary pages

| Pages | Count | Why unnecessary |
|---|---|---|
| Landing pages built then hidden (commercial, CRM, lead management, lead tracking, exclusive, homeowner, new construction, SMS, storm damage) | 9 | Homeowner-lead intent; built and then set to noindex |
| Non-priority trade + state pages | 550 | Thin; now noindexed and leaving Google |
| Guides for trades with little agency demand (cleaning, pool, pest control, garage doors, fencing, flooring, concrete) | ~8 | No impressions; low business value |
| Priority trade + state pages | 350 | **Judgement call:** ~140 impressions in 3 months; they absorb crawl the money pages need |

## 6. Is the content competitive? Not yet

Competitors for agency-intent searches (Apollo, Salesgenie, Outscraper, Orbital, ZoomInfo) win on things
content alone does not fix: domain authority (Domain Rating 70-90 vs 7), review profiles (G2, Capterra),
mentions in third-party roundups, and **original data** (e.g. Salesgenie publishes counts of roofing
businesses). Our guides are well structured but say what others already say, with no proprietary data.

## 7. Why organic visitors do not convert

1. **There are almost no organic visitors to convert:** 25 Google clicks in 3 months; 1 Google organic
   session in GA4's first week. Conversion is not the bottleneck yet; traffic is.
2. **Sign-up rejects free email addresses** (Gmail, Yahoo, Outlook, iCloud and 17 more, `lib/business-email.ts`).
   Many freelancers and small agencies, the core audience, use Gmail. Every rejection was invisible.
   **Now measured** (see change C1).
3. **No conversion was being measured:** sign_up and generate_lead are not marked as key events in GA4.

## 8. Ranked opportunities (business impact first)

| # | Opportunity | Impact | Who |
|---|---|---|---|
| 1 | Get the money pages indexed (Request indexing, sitemap resubmit) now that crawl is fixed | High: these pages convert | Owner (10 min) |
| 2 | Measure the funnel (CTA clicks, sign-up errors, key events) | High: every later decision depends on it | Done in code; owner marks key events |
| 3 | Decide the free-email rule (allow Gmail with stricter limits, or keep) | High: directly gates leads | Owner decision |
| 4 | Authority: G2, AlternativeTo, Capterra, Product Hunt listings; roundup outreach | High, slow | Owner |
| 5 | Original data page from the product (e.g. share of contractors without a website, by trade and state) | High for GEO and links | Needs owner approval and production data |
| 6 | Stop adding pages; let the crawl fix work 2-3 weeks; then prune low-value programmatic pages if crawl stats confirm | Medium | Code, after measurement |

## 9. Page-by-page recovery plan

| URL | Status now | Problem | Action | Validation |
|---|---|---|---|---|
| /pricing | Discovered, not crawled | Never indexed | Owner: Request indexing | URL Inspection "Indexed"; GA4 cta_click from /pricing |
| /contractor-email-finder | Unknown / Discovered | Never indexed | Owner: Request indexing | URL Inspection; GSC impressions for "contractor email finder" |
| /email-lists and 7 trade pages | Discovered | Never indexed | Request indexing (hub first) | URL Inspection; impressions for "[trade] email list" |
| /google-maps-scraper, /apollo-alternative, /alternatives/* | Discovered (/alternatives indexed, pos 2) | Comparison pages not crawled | Request indexing for /apollo-alternative | Impressions for "apollo alternative" |
| / (homepage) | Indexed, 624 impressions at ~72 | Wrong-intent head terms | No rewrite; measure CTA clicks first | GA4 cta_click rate on / |
| /blog/best-contractor-lead-generation-companies | Indexed, pos 7 when shown | Google shows homepage instead | Links + FAQ shipped 18 Nov; wait for recrawl | Guide replaces homepage in GSC for that query group |
| /industries/general-contractors/ohio | Indexed, pos 14 (21 impressions) | Only striking-distance page | Hold until recrawl; then strengthen | Position for "contractor leads ohio" |
| /industries/roofing/texas | Crawled - not indexed (2 Aug) | Old version judged | Request indexing | URL Inspection |
| /register | Live | Free-email rule; errors not measured | C1 shipped; owner decision on rule | GA4 sign_up_error count by reason vs sign_up |
| 44 guides | Mostly not indexed | Volume of new pages | No new guides until money pages index | Indexed share of guides |

## 10. Changes made in this cycle (reason, URL, validation)

| ID | Change | URL | Reason | Validation | Before | After |
|---|---|---|---|---|---|---|
| C1 | GA4 `sign_up_error` event with reason (free_email / other) | /register | Rejected sign-ups were invisible | Local browser test: event sent with reason=free_email | Not measurable | Measured from deploy |
| C2 | GA4 `cta_click` event on every link to /register (button text + page) | All public pages | No funnel step between page view and sign-up | Local browser test: "Get started" click on /pricing sent | Not measurable | Measured from deploy |
| C3 | New interactive lead page: free contractor list builder (trade, state, city → live preview → sign-up with the chosen list shown on /register) | /contractor-list (+ /register banner) | Owner asked for new pages built for leads; one page aimed at "contractor list" searches with a direct path to sign-up, instead of many thin pages | Local browser test: preview and CTA update per choice, banner on /register, mobile 0 px overflow, audit 0 errors; live: GA4 cta_click from /contractor-list, URL Inspection | New URL | Track impressions, cta_click, sign_up from 19 Nov |
| C4 | Homepage repositioned: title "Lead Generation for Marketing Agencies", new meta, H1 and quick answer; homeowner-lead links removed | / | Keyword map 20 Nov: "lead generation for marketing agencies" (260/mo, KD 13); stop chasing contractor-buyer head terms (section 4.2) | Live title check; GSC queries for / shift from "contractor leads" to agency terms | Title "Find Contractor Leads for Your Agency" | Live 20 Nov |
| C5 | /contractor-list retargeted: contractor directory (170, KD 3), contractor database (30, KD 7), list of contractors (170, KD 20), list of roofing companies; 2 new FAQs | /contractor-list | Keyword map P1 targets on an already indexed page | Impressions for those queries | Title "Free Contractor List Builder" | Live 20 Nov |
| C6 | 3 new lead pages (builder, quick answer, steps, product screenshot, comparison, FAQ schema): /contractor-email-list (contractors email list 390, KD 8), /businesses-without-websites (590, KD 15; find... 70, KD 1), /local-business-email-list (110, KD 4). /email-lists hub 308 to /contractor-email-list | 3 new URLs | Keyword map P1 pages with measured volume and low difficulty | URL Inspection indexed; impressions per target query; GA4 cta_click per page | New URLs | Track from 20 Nov |
| C7 | 5 homeowner-intent guides (already noindex) 308 to /contractor-list; routes removed | /homeowner-leads, /exclusive-contractor-leads, /storm-damage-leads, /new-construction-leads, /commercial-contractor-leads | Wrong intent (section 5); keyword map says remove and redirect | curl shows 308; pages leave Google index | noindex pages | 308 live 20 Nov |

Re-measure on 2 Dec: crawl stats HTML share (was 12%), money pages indexed (was 0 of 5 tracked), GSC
28-day clicks and impressions (7 / 285), GA4 cta_click, sign_up_error and sign_up counts.
