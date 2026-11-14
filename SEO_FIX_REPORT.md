# SEO / AEO / GEO fix report: www.contractorleads.us

Working from the owner's master prompt (`CLAUDE_CODE_SEO_AEO_GEO_PROMPT.md`). Daily work log:
`docs/seo/WORKLOG.md`. This file holds the phase-by-phase record.

## CONFIG (from the codebase; items marked NEEDED must be confirmed by the owner)

| Field | Value | Source / status |
|---|---|---|
| DOMAIN | https://www.contractorleads.us | middleware redirects apex to www |
| BRAND_NAME | Contractor Leads | site |
| LEGAL_ENTITY + ADDRESS | Vaishali Media Productions LLC, 30 N Gould St # 58138, Sheridan, WY, US | json-ld.tsx, footer, About. **NEEDED: confirm it is current and identical on all profiles** |
| FOUNDER / AUTHOR | Vaishali Kapoor, Founder | json-ld.tsx, About. **NEEDED: personal LinkedIn URL** |
| FOUNDED_YEAR | not in the codebase | **NEEDED** |
| NICHE + ICP | B2B lead finder for marketing agencies, media buyers and sales teams that sell to home-service contractors | site copy |
| CORE OFFER + PRICE RANGE | Subscription from $19.99/month (500 credits), 10 free leads | MARKETING_FAQ, /pricing |
| PRIMARY CONVERSION | Free sign-up (/register); enterprise call booking (/enterprise/book) | site |
| STACK + HOST | Next.js 16 on Railway (Node), Postgres | repo |
| SOCIAL / sameAs | linkedin.com/company/contractorleads, youtube.com/@contractorleads, Facebook default | seo.ts defaults. **NEEDED: confirm each profile exists; unreal sameAs links hurt trust** |
| SISTER SITES | funnelsthatprint.com, devsynx.com, vaishalimediaproductionsllc.com, roofingclients.us (mail relay) | owner's Ahrefs export |
| TOP MONEY KEYWORDS | find contractor leads, [trade] leads / companies in [state], contractor email list, business with no websites, best hvac lead generation companies, local lead generation | owner's Semrush export, Search Console |
| TOP BUYER QUESTIONS | How do agencies find contractor leads? What do contractor leads cost? How do I find a business owner's name and email? Is cold email to contractors legal? | site FAQs, blog |

Per the prompt, nothing legal, address, founding, pricing or results-related was guessed.

## Phase 0: Baseline (13 Nov 2026, live site)

Script: `scripts/seo-audit.mjs` (read-only). Output: `audit/baseline.json`, `audit/baseline.csv`.
Run: `NODE_USE_ENV_PROXY=1 node scripts/seo-audit.mjs` (or `BASE=http://localhost:3100 OUT=audit/after node scripts/seo-audit.mjs`).

| Check | Result |
|---|---|
| URLs audited (sitemaps + nav/footer) | 510, all 200, all indexable |
| Redirect chains on sitemap URLs | 0 |
| Average response time (from this environment) | 317 ms |
| Titles outside 30-60 chars / duplicate titles | 0 / 0 |
| Descriptions outside 120-158 chars / duplicates | 6 / 0 |
| Pages without exactly one H1 | 0 |
| Canonical mismatches | 0 |
| JSON-LD parse errors / pages without JSON-LD | 0 / 0 |
| Images without alt | 0 |
| Pages missing OG title or image | 0 |
| Orphan pages | 0 |
| Pages under 600 words of main content | 19 |
| Bot parity (12 user agents x top 20 URLs, 200 + same content as Chrome) | 20/20 for every bot |
| robots.txt / sitemap.xml / llms.txt | 200 / 200 / 200 |
| llms-full.txt | **404** |

Near-duplicate score (5-word shingles, Jaccard) per sitemap section, indexable pages:

| Section | Pages | Average | Pairs > 0.35 |
|---|---|---|---|
| industries (trade hubs) | 18 | **0.445** | 62 (worst: windows-and-doors vs garage-doors 0.70) |
| locations (state hubs) | 51 | **0.388** | 1,111 (worst: alabama vs mississippi 0.63) |
| states (trade + state) | 350 | 0.300 | 9,625 (worst 0.57) |
| compare | 9 | 0.241 | 0 |
| core | 25 | 0.039 | 21 (email-list trade pages, 0.48) |
| blog / help / tools | 42 / 11 / 4 | < 0.08 | 0 |

### Top problems (ordered by impact)

1. **Templated sections above 0.35**: 11 non-priority trade hubs (windows and doors, garage doors, landscaping, painting, cleaning, pool, flooring, home improvement, fencing, concrete, pest control) are near-copies of each other; the 51 location pages average 0.388.
2. **Off-site**: 893 spam referring domains (disavowed in Google 12 Nov), 9 real; sitewide links from own sites (funnelsthatprint.com 788, devsynx.com 76).
3. **Indexing**: key pages "Discovered, not indexed" or unknown to Google (pricing, email finder, tools, locations, email lists, solar hub, FAQ); manual indexing requests needed.
4. **llms-full.txt missing** (Phase 9).
5. **Thin money-adjacent pages under 600 words**: /industries (466), /locations (440), /tools (330), the 3 tool pages (517-585), /about (564).
6. 8 help articles under 600 words (product docs; 7 thinner ones already noindexed on 11 Nov).
7. 6 descriptions under 120 chars (/privacy, /terms, 4 help articles).
8. No Speakable markup, no explicit "Short answer" block on money pages (several have a quick answer section already).
9. Homepage LCP 2.6 s from this environment (target < 2.5 s); ~1 MB JS per page.
10. Deploys: the 13 Nov merge did not deploy (Railway account past due); live site is one release behind.

## MANUAL ACTIONS FOR OWNER (current)

- Railway: pay the past-due balance and redeploy commit `b1f9cc1` or later.
- Google Search Console: request indexing for /pricing, /contractor-email-finder, /tools, /locations, /email-lists, /industries/solar, /google-maps-scraper, /faq.
- GA4: mark `sign_up` and `generate_lead` as key events.
- Own sites: replace sitewide links on funnelsthatprint.com and devsynx.com with one contextual link each.
- Confirm the CONFIG items marked NEEDED.

## UNVERIFIED CLAIMS

- sameAs social profiles (LinkedIn company, YouTube, Facebook): existence not verified from here.
- Founding year: not stated anywhere; nothing published.

## 14 Nov 2026: Phase 9 (llms-full.txt) and Phase 4 (descriptions)

- **llms-full.txt** (`src/app/llms-full.txt/route.ts`, static, rebuilt each deploy): brand facts from
  /llms.txt (single source), the home FAQ, the 7 priority trade hubs (quick answer, what owners buy,
  timing, searches, pitch mistakes, FAQs), the 3 free tools, and all 43 guides (direct answer, sections,
  tables, FAQs, sources). 268 KB, 54 sections, all links absolute. /llms.txt now points to it.
- **Meta descriptions**: the 6 under 120 chars (/privacy, /terms, 4 help articles) rewritten to 147-156
  chars, describing what each page actually covers. Audit on a local production build: 0 descriptions
  outside 120-158 (baseline: 6).
- Not live yet: Railway has not deployed since 12 Nov (account past due).
