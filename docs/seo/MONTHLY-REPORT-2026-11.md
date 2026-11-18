# Monthly SEO / AEO / GEO report: www.contractorleads.us

**Period:** 19 Oct - 18 Nov 2026 (Search Console data to 17 Nov). **Compared with:** 19 Sep - 18 Oct 2026.
All numbers come from Google Search Console, Google Analytics 4, Bing Webmaster Tools, URL Inspection or the
code history. Nothing is estimated.

## 1. Results

### Google Search (Search Console)

| Metric | Previous 30 days | This month | Change |
|---|---|---|---|
| Impressions | 201 | **302** | **+50%** |
| Clicks | 6 | **7** | +1 |
| Click-through rate | 3.0% | 2.3% | -0.7 pts |
| Average position | ~68 | ~77 | Lower (more broad queries at positions 80-100) |
| Desktop impressions / clicks | 175 / 4 | 273 / 6 | +56% / +2 |
| Mobile impressions / clicks | 26 / 2 | 29 / 1 | +12% / -1 |
| Pages with impressions (28 days) | n/a | 107 | |
| Visible queries with impressions | n/a | 47 | |

Daily impressions: 1-10 a day from 25 Sep to 5 Nov, then 11-33 a day from 13 Nov (recovery started).

**Top queries this month (impressions, average position):** contractor leads (49, 86), best contractor lead
generation companies (27, 97), exclusive contractor leads (23, 88), hvac lead generation companies (15, 84),
contractor leads service (10, 96), best lead generation companies for contractors (8, 84), contractor lead
generation services (8, 88), contractor lead generation (7, 88), contractors leads (7, 90), best lead service for
contractors (7, 97), find contractor leads (6, 90), contractor lead service (6, 93).

**Best positions:** /about 4.1, /affiliates 4.2, /alternatives 2, /features 3.5, /help 3.8, /industries 5.9,
/blog/best-contractor-lead-generation-companies 7, /blog/plumbing-contractor-leads 2,
/blog/general-contractor-leads 5, /industries/plumbing 8.3.

### Google Analytics (installed 10 Nov; marketing pages only from 18 Nov)

| Source (10-17 Nov) | Sessions |
|---|---|
| Direct | 81 (mostly app users before 18 Nov) |
| **chatgpt.com (AI assistant)** | **1** (first AI-assistant visit) |
| Google organic | 1 |
| Key events (sign_up, generate_lead) | 0, not yet marked as key events in GA4 |

### Bing (Webmaster Tools)

| Metric | Value |
|---|---|
| Pages in Bing's index | **128** on 16 Nov (67 on 30 Oct): **+91%** |
| Search impressions / clicks | 14 / 0 |
| Positions 1-3 | "contractor leads usa" (1), "why would a roofing contractor want a business owners name" (1), a contractor subject-line question (1), "contractorleadspro" (2) |
| URLs submitted for crawling | 198 (17-18 Nov) |

### Indexing (Google URL Inspection samples, 16-18 Nov)

| Group | Indexed |
|---|---|
| Guides | 7 of 9 |
| Trade + state pages | 8 of 15 |
| Money pages (pricing, email finder, locations, email lists, tools, FAQ...) | 2 of 14 |
| /industries hub | Indexed, recrawled 16 Nov |

## 2. Work completed

**55 pull requests merged, 160 commits.**

### Pages created (indexable)

| Type | Pages | Examples |
|---|---|---|
| Guides (blog) | **44** | best-contractor-lead-generation-companies, how-much-do-contractor-leads-cost, best-email-finder-for-local-businesses, 18 trade lead guides |
| State location pages | **51** | /locations and 50 states |
| Contractor email-list pages | **8** | /email-lists + 7 trades |
| Competitor comparison pages | **11** | /alternatives, 9 alternatives (Outscraper, Apify, PhantomBuster, ZoomInfo, Lusha, D7, UpLead, Hunter, Prospeo), /apollo-alternative |
| Free tools | **4** | /tools, email deliverability checker, subject line tester, lead cost calculator |
| Landing pages | **3** | /contractor-email-finder, /google-maps-scraper, /contractor-lead-generation-software |
| Help centre | **12** | /help + 11 articles |
| Other | **2** | /faq, /affiliates |
| **Total indexable pages created** | **135** | |

Also built and kept out of Google on purpose (homeowner-lead intent or thin): 9 landing pages
(commercial, CRM, lead management, lead tracking, exclusive, homeowner, new construction, SMS, storm damage).

### Pages redesigned or rewritten

| Area | Pages | What changed |
|---|---|---|
| Homepage | 1 | Full redesign (3 versions), speed (LCP 3.9 s → 1.6-1.9 s mobile), short answer, FAQ |
| Trade + state pages | 350 | Unique state content, near-duplicate score 0.57 → 0.30, new titles and descriptions |
| Trade hubs | 18 | Trade-specific content for all 18, near-duplicate 0.445 → 0.331 |
| State location pages | 51 | State-specific pitch angles, near-duplicate 0.388 → 0.285 |
| /industries and /locations hubs | 2 | Comparison tables (18 trades, 50 states), 440-466 → ~1,200-1,300 words |
| Titles and descriptions | 511 | Every sitemap page: titles 30-60, descriptions 140-158 characters, 0 duplicates |

### Technical fixes

- **Crawl budget (biggest fix):** Google spent 76% of crawl requests (9,580 of 12,600) on Next.js `?_rsc=` files; robots.txt now blocks them (18 Nov).
- Sitemaps: split into 8 sections with accurate dates; temporary sitemaps to retire 37 old /trades URLs and 550 noindexed pages.
- Redirects: 5 old WordPress URLs with backlinks, the /trades duplicate tree.
- Disavow file: 893 spam domains (12 Nov).
- Structured data on every page (Organization, Person, SoftwareApplication, FAQPage, BlogPosting, Breadcrumb, Speakable): 0 errors.
- Site audit (512 URLs): 0 errors in status codes, redirects, titles, descriptions, H1s, canonicals, JSON-LD, alt text, Open Graph, orphans.
- GA4 installed and limited to marketing pages; Bing Webmaster verified and used.

### AEO / GEO

- llms.txt and llms-full.txt (277 KB, every guide and FAQ) for AI assistants.
- AI crawlers allowed (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, Applebot).
- Short-answer blocks and Speakable markup on money pages; FAQs on all main page types; comparison tables.
- Author (founder) and company identity in schema; sources cited in guides.
- Directory listing kit and AI-citation outreach kit ready (docs/seo).

## 3. Keywords targeted

| Group | Main keywords | Page |
|---|---|---|
| Core | find contractor leads, contractor leads for agencies | / |
| Trade + state | find [trade] leads in [state], list of [trade] companies in [state] | /industries/[trade]/[state] (350) |
| State | contractor leads in [state] | /locations/[state] (51) |
| Email lists | [trade] email list, contractor email list | /email-lists/[trade] |
| Email finder | contractor email finder, email finder for local businesses | /contractor-email-finder, guide |
| Software | contractor lead generation software | /contractor-lead-generation-software |
| Competitors | [Apollo / Hunter / ZoomInfo / Outscraper ...] alternative | /alternatives/... |
| Comparisons | best contractor lead generation companies, hvac lead generation companies | guide |
| Agency growth | how to get clients for a marketing agency, how to sell SEO / websites to contractors | guides |
| Prospecting | businesses without a website, Google Maps lead generation, find business owner name | guides |
| Costs | how much do contractor leads cost, pay per lead | guides |
| Compliance | CAN-SPAM cold email, email warmup | guides |

## 4. Why results are still small

1. **Crawl:** until 18 Nov, Google spent three quarters of its visits on `?_rsc=` files, so most new and
   rewritten pages were never read. Fixed; expect the effect over the next 2-6 weeks.
2. **Authority:** Domain Rating 7, 9 real referring domains. Positions stay at 60-100 until other sites link
   to or mention the brand.
3. **robots.txt failed to load in the past** (Search Console host status), which likely caused the 25 Sep drop.
4. **Search intent:** "contractor leads" is mostly searched by contractors wanting customers, not agencies.

## 5. Next month (targets for 18 Dec)

| KPI | Now | Target |
|---|---|---|
| Google impressions (30 days) | 302 | 600+ |
| Money pages indexed | 2 of 14 | 10 of 14 |
| HTML share of Google crawl | 12% | 50%+ |
| Queries in top 20 with 10+ impressions | 0 | 5 |
| Real referring domains | 9 | 20 |
| AI-assistant visits (GA4) | 1 | 10 |

Owner actions that unlock this: resubmit sitemap.xml and request indexing in Search Console; G2,
AlternativeTo, Capterra, Product Hunt and Crunchbase listings; roundup outreach; mark sign_up and
generate_lead as GA4 key events. The site is monitored and improved every 12 hours (docs/seo/TRACKING.md).
