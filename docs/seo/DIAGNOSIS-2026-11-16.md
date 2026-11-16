# SEO performance diagnosis: www.contractorleads.us (16 Nov 2026)

Sources, all first-party unless marked:
- **[GSC]** Google Search Console via OpenSEO (property `https://www.contractorleads.us/`), web search, all countries.
- **[URL-I]** Search Console URL Inspection API, run 16 Nov 2026.
- **[LIVE]** HTTP checks of the live site from this environment, 16 Nov 2026.
- **[AHREFS]** The owner's Ahrefs export (12 Nov 2026).
- **[SERP]** Web search result lists, 16 Nov 2026 (not location-pinned, so a rough check, not a rank tracker).

Anything not backed by one of these is marked **ASSUMPTION**. No backlink or competitor metrics were
bought or estimated; where they would be needed, the gap is stated.

---

## 1. The comparison you asked for, and why it misleads

Search Console data for this property starts on **26 Jul 2026** (launch). "The previous 3 months"
therefore holds only 20 days, which is the launch spike.

| Window | Days | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|---|
| Previous (26 Jul - 14 Aug) [GSC] | 20 | 4 | 807 | 0.5% | ~70 |
| Last 3 months (15 Aug - 13 Nov) [GSC] | 91 | **26** | 960 | 2.7% | ~63 (desktop 64.1, mobile 60.5) |
| Last 28 days (17 Oct - 13 Nov) [GSC] | 28 | 6 | 225 | 2.7% | ~74 |

Impressions per day fell from ~40 to ~10, but **clicks rose 6.5x**. Where the lost impressions went:

- **305 of the 807 launch impressions (38%) were on `/trades/*` URLs** [GSC]: a full duplicate copy of
  the trade + state pages that was in the sitemap at launch next to `/industries/*`. They had position
  65-95 and **0 clicks**. `/trades/*` has 308-redirected to `/industries/*` since 7 Oct; it has had **0
  impressions in the last 30 days** [GSC].
- **~190 more** were on state pages of the 11 non-priority trades (pool services, painting, cleaning,
  landscaping...), noindexed since 22 Oct, also at position 70-95 with 0 clicks [GSC].

**Verified conclusion:** no traffic was lost. The "drop" is Google discarding duplicate and low-value
URLs that never produced a click. The real problem is that the site has almost no rankings in the top
20 for any query with demand.

## 2. Where the site stands (verified)

**What ranks in the top 10** [GSC, 26 Jul - 13 Nov]: brand and utility pages only (/features 3.1,
/help 3.8, /about 9.2 lifetime / 4.3 last 30 days, /alternatives 2, /industries 5.8 last 30 days,
/privacy, /terms), plus single-impression long-tail state pages.

**What gets the impressions:** the homepage, 696 impressions at **position 63.8**, mostly for:

| Query [GSC, homepage] | Impr. | Pos. | Who is searching (from the SERP) |
|---|---|---|---|
| contractor leads | 265 | 70.9 (88.8 in the last 28 days) | Contractors who want customers |
| exclusive contractor leads | 52 | 76.3 | Contractors buying homeowner leads |
| contractors leads / contractors leads service | 63 | 74-78 | Contractors |
| contractor lead (service, companies, management) | ~75 | 72-95 | Contractors / CRM buyers |
| contractor leads usa | 20 | 38 | Mixed |

**Best striking-distance pages** [GSC]: /industries/general-contractors/ohio (24 impr., pos 16.8;
"contractor leads ohio" pos 20.6, "local contractor leads" pos 10); a handful of state pages at 10-20
with 1-3 impressions each. No page has a query with 50+ impressions in positions 5-20.

**Index coverage, 48 URLs inspected** [URL-I] (the homepage and /blog, also inspected, are indexed):

| Group (sample) | Indexed | Crawled, not indexed | Discovered, not indexed | Unknown to Google |
|---|---|---|---|---|
| Trade + state pages (15) | 8 | **7 (all last crawled 1-8 Aug)** | 0 | 0 |
| Trade hubs (2) | 2 | 0 | 0 | 0 |
| State location pages (2) + /locations | 0 | 0 | 3 | 0 |
| Guides (9 real URLs) | 7 | 0 | 1 | 2 |
| Money / commercial pages (14) | 2 (/features, /alternatives) | 0 | 8 | 4 |
| Old /trades URLs (3) | n/a | 3 (last crawled 28 Jul, redirect never seen) | | |

Money pages not indexed: /pricing, /tools, /locations (+ every state location page sampled),
/email-lists (+ /email-lists/hvac), /contractor-lead-generation-software, /industries/solar,
/apollo-alternative, /alternatives/outscraper-alternative (Discovered); /contractor-email-finder,
/google-maps-scraper, /faq, /tools/contractor-lead-cost-calculator (Unknown).
None has a technical block: 200, `index, follow`, self-canonical, in the sitemap, linked from every
page's header/footer, and identical for Googlebot and Chrome [LIVE].

## 3. Root causes vs symptoms, ranked by impact

| # | Root cause | Evidence | Symptoms it explains | Impact | Fixable in code? |
|---|---|---|---|---|---|
| 1 | **Very low authority on a 4-month-old domain.** DR 7, 9 real referring domains (+893 spam, disavowed 12 Nov) | [AHREFS]; GSC history starts 26 Jul | Positions 60-90 on every competitive query; Google rarely recrawls (state pages not recrawled since early Aug); new money pages stay "Discovered" for weeks | **Highest** | No: links, listings, PR |
| 2 | **Head-term intent mismatch.** "contractor leads" and its variants are searched by contractors who want customers; the site sells prospect data to agencies | [SERP] "contractor leads" top results: LocalIQ, Angi, ServiceTitan, Houzz, Marketing360, Phonexa, Hook Agency (contractor-side); only Apollo and Salesgenie are B2B-data pages. [GSC] the queries above | About two-thirds of homepage impressions are on queries the product can't satisfy; even with authority the homepage would struggle to rank there, and a click would not convert | High | Partly: target agency-intent queries instead (see plan); don't rewrite the homepage for "contractor leads" |
| 3 | **Launch quality debt on the programmatic pages.** 700+ near-identical trade/state URLs at launch (two URL trees, 18 trades x 50 states, near-duplicate score up to 0.63) | [GSC] /trades impressions; [URL-I] 7/15 state pages "Crawled - not indexed" since early Aug; earlier audit scores | Google judged the template thin in August and has not come back. The fixes since (single URL tree, noindex on 11 trades, unique state content, near-duplicate avg 0.300) are **not yet seen by Google** | High | Partly done; this release adds a recrawl nudge for the duplicate set |
| 4 | **Crawl priority goes to the template, not the money pages.** Of 511 sitemap URLs, 401 are programmatic | Sitemap counts [LIVE]; money pages "Discovered" despite sitewide links [URL-I] | /pricing, /email-lists, /locations, calculators not crawled | Medium | Mostly an authority issue (crawl demand); request indexing manually meanwhile |
| 5 | **New content not discovered.** Two guides and the calculator are "Unknown to Google" although in sitemap-blog/-tools | [URL-I] | No impressions for new guides | Medium | No: resubmit sitemap in Search Console |

**Ruled out (verified, not causes):**
- Rendering / bot access: 12 user agents x 20 URLs get the same 200 content as Chrome [LIVE, 13 Nov audit].
- Technical blocks: no noindex/canonical/robots problems on any indexable sitemap URL; 0 redirect chains.
- Metadata: all titles 30-60, descriptions 140-158, 0 duplicates (16 Nov pass). CTR is not the problem:
  positions are.
- Internal linking: every money page is linked from the header/footer of every page; the homepage links
  the best state pages (GC/Ohio, HVAC/Georgia, Electrical/Louisiana).
- Keyword cannibalization: minor only. "contractor leads" splits between the homepage (pos 70.9) and
  /blog (pos 49.2, 43 impr.), and the 28 /trades vs /industries pairs above (resolving). Neither is a
  real ranking blocker at positions 50-90.

**Not verified (data not available here):**
- Core Web Vitals field data: the site has too little Chrome traffic for CrUX. Lab: homepage LCP 2.6 s
  from this environment. **ASSUMPTION:** not a ranking factor that matters at positions 60-90.
- Competitor backlink profiles: not measured (would need paid backlink data). The SERP for
  "contractor leads" is held by national brands (Angi, ServiceTitan, Apollo, Houzz); **ASSUMPTION**
  their authority is orders of magnitude above DR 7.
- Exact search volumes for agency-intent terms: not pulled (OpenSEO has 4 credits left).

## 4. Recovery plan (prioritised)

Do not create new templated pages, rewrite metadata again, or chase "contractor leads" with the
homepage. Every item below is tied to a finding above.

| Pri | Action | Owner | URLs / keywords | KPI and target |
|---|---|---|---|---|
| P0 | Request indexing (10/day) in Search Console, in this order: /pricing, /contractor-email-finder, /email-lists, /locations, /google-maps-scraper, /industries/roofing/texas, /industries/hvac/florida, /tools/contractor-lead-cost-calculator, /faq, /contractor-lead-generation-software; next day: /locations/texas, /locations/florida, /email-lists/hvac, /email-lists/roofing, /blog/can-spam-cold-email-contractors, /blog/pool-service-leads, /apollo-alternative, /industries/solar, /blog/local-lead-generation-business, /industries/roofing/washington | Owner | as listed | 15 of these 20 indexed by 15 Dec (URL Inspection) |
| P0 | Search Console > Sitemaps: resubmit `sitemap.xml` (now also lists `sitemap-legacy.xml`) | Owner | | Sitemap read date after 16 Nov; legacy URLs show "Page with redirect" by 31 Dec |
| P0 | Authority: list the product on G2, Capterra, Product Hunt, AlternativeTo, Crunchbase, Clutch (real, editorial profiles, not paid link schemes); replace the sitewide footer links on funnelsthatprint.com and devsynx.com with one contextual link each | Owner | homepage, /features, /pricing | Real referring domains 9 → 25 by 15 Jan 2027 [AHREFS] |
| P1 | Target agency-intent queries the site can win: "list of [trade] companies in [state]", "[trade] companies email list", "find businesses without websites", "hvac lead generation companies" (an agency-side list), "local lead generation business". Pages already exist; improve them only where GSC shows impressions | Claude (daily) | /industries/[trade]/[state], /email-lists/[trade], /blog/how-to-find-businesses-without-websites, /blog/local-lead-generation-business | Top-20 queries with ≥10 impressions: 0 → 10 by 15 Jan |
| P1 | Striking distance: GC/Ohio for "contractor leads ohio"; review weekly and strengthen only pages that hold position 8-20 with ≥10 impressions | Claude (daily) | /industries/general-contractors/ohio | Position ≤10 for "contractor leads ohio" |
| P2 | Homepage: keep brand/agency focus; accept that "contractor leads" is contractor-side. Measure the homepage on clicks and branded queries, not on that head term | | / | Clicks to homepage per 28 days: 5 → 20 |
| P2 | Remove `sitemap-legacy.xml` after 31 Jan 2027 or when URL Inspection shows the URLs as redirects | Claude | /sitemap-legacy.xml | |
| P3 | Re-evaluate the 350 trade + state pages on 15 Jan: if the "Crawled - not indexed" share in a 20-URL sample is still ≥40% after Google has recrawled them, noindex the states with no impressions in 90 days | Claude | /industries/[trade]/[state] | Indexed share of a 20-URL sample: 53% → 75% |

## 5. Implemented in this release

**Temporary legacy-redirect sitemap** (`src/app/sitemap-legacy.xml/route.ts`, listed in
`sitemap.xml`): the 37 old `/trades/*` URLs that Search Console has shown in results, plus `/trades`.
Google last crawled them on 28 Jul and still treats them as separate pages; listing old URLs in a
sitemap after a move is Google's own recommendation for getting redirects processed. Following each
redirect also makes Google fetch the current `/industries/*` page, which it has not crawled since
early August. Verified locally: valid XML, 38 URLs, each resolves with one 308 to a 200.

Nothing else was changed: the evidence does not support more on-page edits right now. Titles,
descriptions, internal links and content templates were all reworked between 9 and 16 Nov, and Google
has not recrawled most of those pages yet. Changing them again would only reset the comparison.

## 6. Baseline for tracking (record on 16 Nov 2026; compare on 15 Dec and 15 Jan)

| Metric | Baseline | Source |
|---|---|---|
| Clicks / impressions, last 28 days (17 Oct - 13 Nov) | 6 / 225, avg pos ~74 | GSC |
| Clicks / impressions, 15 Aug - 13 Nov | 26 / 960 | GSC |
| Homepage, lifetime | 13 clicks, 696 impr., pos 63.8 | GSC |
| "contractor leads" (homepage), last 28 days | 57 impr., pos 88.8 | GSC |
| /industries/general-contractors/ohio | 24 impr., pos 16.8, 1 click | GSC |
| Queries with ≥10 impressions in positions 1-20 | 0 | GSC |
| Indexed share, trade + state pages (15-URL sample) | 8/15 (53%) | URL-I |
| Money pages indexed (14 inspected) | 2/14 | URL-I |
| Guides indexed (9 inspected) | 7/9 | URL-I |
| Old /trades URLs still held by Google | 37 known (all "Crawled - not indexed", 28 Jul) | GSC, URL-I |
| Sitemap URLs | 511 (+38 legacy) | LIVE |
| Near-duplicate avg: industries / states / locations | 0.331 / 0.300 / 0.285 | audit script |
| Metadata outside range / duplicates | 0 / 0 | audit script |
| Real referring domains / DR | 9 / 7 | AHREFS |
