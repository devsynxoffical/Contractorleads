# Technical SEO audit: www.contractorleads.us (23 Nov 2026)

Method: live crawl of all 1,103 sitemap URLs (direct HTTP, Googlebot UA), BFS crawl of HTML links from the
homepage, Playwright render on an emulated mid-range phone (CPU x4 throttle), Search Console URL Inspection
(sample of 29 URLs, 20-23 Nov) and Search Console performance.

| Check | Result | Status |
|---|---|---|
| Google indexing | Indexed: /, /contractor-list, 3 new keyword pages, /features, /industries/roofing, older guides. Discovered-not-indexed: /contractor-email-finder, /google-maps-scraper, /apollo-alternative, /locations, /tools, /email-lists/*, newer guides, most /locations/*. Unknown: /pricing, /faq. Crawled-not-indexed: /industries/roofing/texas, /industries/hvac/texas (last crawl 2 Aug) | Main problem |
| Canonical tags | 515/515 indexable URLs have a correct self-referencing canonical | Pass |
| Robots / noindex | 0 important URLs blocked or noindexed; robots.txt allows all public pages, blocks ?_rsc= | Pass |
| Sitemap | 515 indexable URLs, all 200 + canonical. Plus 2 temporary sitemaps on purpose: legacy (38 /trades 308 redirects), removed (550 noindex pages) | Pass; remove the 2 temporary sitemaps around 15 Dec |
| Internal links | All 515 URLs reachable through HTML links; max click depth 3; key pages 1 click from home and linked from 513 pages | Pass |
| Rendering | Raw HTML and rendered text match (98-99%) on 11 key pages; content is server-rendered | Pass |
| Duplicate content | No duplicate titles or descriptions. Blog, compare and industry pages distinct. Same-trade state pages share ~44% of text (5-word shingles); 13 of 600 sampled pairs >50% | Weak spot (350 templated pages) |
| Page quality | Main pages 800-2,800 words. Thin: /enterprise/book 91, /privacy 179, /terms 170, /tools 330 (utility pages) | OK; trade+state pages are the quality risk |
| Mobile and speed | 0 px overflow everywhere. Subpages LCP ~1.0-1.1 s, CLS 0. **Homepage LCP 4.5-5.1 s**: LCP element is the hero paragraph, hidden (opacity 0) until JavaScript runs its animation | Fix homepage hero |
| Search performance | 7d: 339 impressions, 0 clicks, avg pos ~88; 0 queries in top 60; ~99% of impressions on the homepage | Authority + indexing |
