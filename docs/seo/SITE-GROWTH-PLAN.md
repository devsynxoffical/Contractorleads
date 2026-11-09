# Contractor Leads: Site Growth Plan

Prepared 9 November 2026 from the "Site Growth Playbook" prompt, applied to contractorleads.us.
Status key: **Built** = in the codebase on branch `claude/quirky-thompson-65u09b` (live after merge to `master`); **Planned** = not built yet.

## Inputs used

| Input | Value |
|---|---|
| Business | Contractor Leads (Vaishali Media Productions LLC), www.contractorleads.us |
| Type | SaaS (B2B lead-finding software) |
| Sells | Software to find contractor leads: live Google business data, owner names, verified emails, AI marketing-gap scores and outreach |
| Buyer | Marketing agencies, media buyers, B2B suppliers and sales teams that sell to home-service contractors |
| Countries | US (primary), Canada, UK, Australia, New Zealand |
| Core features | Lead Finder, owner enrichment, email finder and verification, email lists, Google Maps data, AI scoring, Meta ads status, outreach (email/SMS), Unibox, CRM, integrations |
| Industries | 18 trades; 7 priority (roofing, HVAC, plumbing, electrical, solar, general contractors, remodeling) |
| Regions | All 50 US states (data coverage; **no physical offices**; registered address in Sheridan, WY only) |
| Proof | [fill in] see list at the end |
| Stack | Next.js 16 App Router, Prisma/Postgres, Railway |
| Search Console | Not connected to the SEO tooling used here; owner has access |

Rule applied: only real coverage. No location page claims an office, and no page states counts, results or reviews we cannot source.

## 1. Audit (STEP 1)

Full table, one row per URL: [`docs/seo/audit-2026-11-09.csv`](./audit-2026-11-09.csv) (URL, page type, title, main-content word count, problems, action).

| Page type | Indexable URLs | Notes |
|---|---|---|
| Location: state hub pages (`/locations/[state]`) | 51 (hub + 50) | **Built today** |
| Location: trade + state (`/industries/[trade]/[state]`) | 350 | 7 priority trades x 50 states; 11 other trades x 50 states are noindex |
| Industry (`/industries/[trade]`, `/email-lists/[trade]`) | 26 | 18 trade hubs + email-list hub and 7 trade lists |
| Core (features, pricing, software, email finder, Maps scraper, alternatives) | 18 | |
| Free tools (`/tools`) | 4 | **Built today** (hub + 3 tools) |
| Blog | 43 | 42 posts + index |
| Help / docs | 19 | |
| Company / legal | 6 | |
| **Total in sitemaps** | **517** | |

Problems found across all 517 URLs: no duplicate titles, no titles of 60+ characters, no missing or over-length descriptions, no pages with zero or multiple H1s, no wrong canonicals, no orphan pages and no broken internal links. All main text is in the server HTML. The only flags are 8 short pages:

| URL | Problem | Action |
|---|---|---|
| /help/five-mistakes-that-waste-credits, /help/api-mcp-sso-crm-webhooks, /help/referral-cash-commission, /help/ask-expert-vs-support, /help/ask-expert-playbook | Under 300 words of main content | Improve (week 2) |
| /privacy, /terms, /enterprise/book | Short by nature | Keep |

Earlier fixes (already on the branch): the robots.txt prefix bug that blocked `/homeowner-leads` and `/sms-marketing-for-contractors`; 9 homeowner-intent guides set to noindex and removed from the sitemap so the site is not classified as "homeowner leads"; all commercial titles and descriptions moved to the B2B "Find … leads" pattern competitors use.

## 2. Page plan (STEP 2 and STEP 6)

Primary keywords are unique per page. Title pattern: keyword first, brand last only where it fits under 60 characters.

### Location pages (built)

| URL | H1 | Title tag | Primary keyword | Hub | Week |
|---|---|---|---|---|---|
| /locations | Find contractor leads by state | Find Contractor Leads by State: All 50 US States | find contractor leads by state | / | 1 (built) |
| /locations/[state] (50) | Find contractor leads in [State] | Find Contractor Leads in [State]: Owners & Emails | find contractor leads in [state] | /locations | 1 (built) |
| /industries/[trade]/[state] (350) | Find [trade] leads in [State] | Find [Trade] Leads in [State]: Company List | find [trade] leads in [state] | /industries/[trade] | existing |

Meta description pattern: "Find contractor leads in [State]: roofers, HVAC, plumbers and 15 more trades with owner names and verified emails, from live Google data. 10 free leads."

**Planned, only if location pages win (STEP 7 rule):** city pages for the 20 largest metros, `/locations/[state]/[city]` ("Find contractor leads in Houston"). Do not build until each can carry city-specific content (local trades mix, licensing body, season), or they become doorway pages.

### Industry pages

| URL | H1 | Title tag | Primary keyword | Week |
|---|---|---|---|---|
| /industries/[trade] (18) | Find [trade] leads for your agency | Find [Trade] Leads: [Trade] Companies for Agencies | find [trade] leads | existing |
| /email-lists/[trade] (7) | [Trade] contractor email list, built fresh and verified | [Trade] Contractor Email List: Find Verified Contacts | [trade] contractor email list | existing |
| /email-lists/landscaping, /painting, /pest-control, /concrete, /flooring, /fencing, /garage-doors, /cleaning-services, /pool-services, /home-improvement, /windows-and-doors | Same template | [Trade] Email List: Find Verified Contacts | [trade] email list | Planned, weeks 4 and 5 |

### Core pages (existing; keep improving)

/features, /pricing, /contractor-lead-generation-software, /contractor-email-finder, /email-lists, /google-maps-scraper, /apollo-alternative, /alternatives and 9 `/alternatives/[tool]-alternative` pages.
**Planned:** `/hunter-vs-contractor-leads`-style head-to-head pages only where a competitor is searched by name with "vs" (check Search Console queries first); a `/integrations` page listing GoHighLevel, HubSpot, Zapier, Make, Slack (week 2).

### Free tools

| URL | H1 | Title tag | Primary keyword | Week |
|---|---|---|---|---|
| /tools | Free tools for prospecting contractors | Free Cold Email & Lead Generation Tools for Agencies | free cold email tools | 1 (built) |
| /tools/email-deliverability-checker | Free SPF, DKIM and DMARC checker | Free SPF, DKIM & DMARC Checker for Cold Email | spf dkim dmarc checker | 1 (built) |
| /tools/cold-email-subject-line-tester | Free cold email subject line tester | Free Cold Email Subject Line Tester | cold email subject line tester | 1 (built) |
| /tools/contractor-lead-cost-calculator | Free contractor lead cost and ROI calculator | Contractor Lead Cost & ROI Calculator (Free) | contractor lead cost calculator | 1 (built) |
| /tools/email-format-finder | Free email format finder | Free Email Format Finder by Company Domain | email format finder | Planned week 4 |
| /tools/google-business-profile-checker | Free Google Business Profile checker | Free Google Business Profile Checker for Contractors | google business profile checker | Planned week 6 |
| /tools/marketing-budget-calculator | Contractor marketing budget calculator | Contractor Marketing Budget Calculator (Free) | contractor marketing budget calculator | Planned week 6 |
| /tools/email-verifier | Free email verifier | Free Email Verifier: Check an Email Address | free email verifier | Planned, needs a cost decision ([fill in]) |

### Blog (rule: every post supports another page type)

Planned topics, each linking to the pages it supports: "How to find roofing companies in [state]" style posts only where Search Console shows demand; "SPF vs DKIM vs DMARC explained" (supports the DNS checker); "Cold email benchmarks for agencies" (needs our own data: [fill in]); "How to price SEO for contractors" (supports the lead cost calculator and industry hubs).

## 3. Page templates (STEP 3)

Each template is implemented in code. Example pages are live in the build and can be opened after merge:

| Type | Template file | Example |
|---|---|---|
| Location | `src/app/locations/[state]/page.tsx`, content from `src/lib/locations.ts` | /locations/texas |
| Location (trade + state) | `src/app/industries/[slug]/[region]/page.tsx`, `src/lib/state-profiles.ts` | /industries/roofing/texas |
| Industry | `src/app/industries/[slug]/page.tsx`, `src/lib/trade-hub-content.ts`; `src/lib/email-list-pages.ts` | /industries/roofing, /email-lists/roofing |
| Core | `src/components/marketing/landing-page.tsx`, `src/lib/landing-pages.ts` | /contractor-email-finder |
| Free tool | `src/app/tools/[tool]/page.tsx`, `src/lib/tools.ts`, widgets in `src/components/tools/` | /tools/email-deliverability-checker |
| Blog | `src/app/blog/[slug]/page.tsx`, `src/lib/blog-*.ts` | /blog/can-spam-cold-email-contractors |

Location page structure (as built): quick answer (40 to 60 words) → intro with price → market at a glance (Census division, weather, solar, growth, housing) → **best trades to prospect, ranked by that state's facts** with reasons → largest markets → when to contact → how it works and pricing → FAQ (5) → nearby states → trades, tools and guides → CTA. Schema: Service with `areaServed` State, FAQPage, BreadcrumbList. No LocalBusiness (no offices).

Uniqueness check (5-word shingle overlap between sibling state pages): 34% to 57% shared, so 43% to 66% unique, above the 40% rule. Re-check before adding city pages.

Tool page structure: working tool at the top (no sign-up) → how to use → what the results mean → how to fix common issues (links to services and guides) → FAQ → other tools, services, guides → CTA. Schema: WebApplication (price 0), FAQPage, BreadcrumbList.

## 4. Related-links rules (STEP 4)

| Page type | Links shown (built) |
|---|---|
| Location (/locations/[state]) | 4 to 6 nearby states (borders, then same Census division), 7 trade + state pages, 4 trade hubs, 3 core services, 2 guides |
| Trade + state | Neighbouring states for the trade, other trades in the state, /locations/[state], the trade email list |
| Industry hub | All 50 states for the trade, the trade email list, related guides |
| Core | 6 related pages and guides per page |
| Tool | Other tools, tools hub, 2 services, 2 guides |
| Blog post | 3 related posts by topic, related trades, free tools block, auto-links to core/industry pages on first mention |

Inbound links measured after the change: every state location page has 11 to 13 internal links in; each tool page 45; hubs (/locations, /tools) are linked from every page via the footer. Every page is within 3 clicks of the home page.

## 5. Sitemap, robots.txt, llms.txt (STEP 5): built

- `/sitemap.xml` index → `sitemap-core.xml`, `sitemap-industries.xml`, `sitemap-states.xml` (trade + state), **`sitemap-locations.xml`** (new), **`sitemap-tools.xml`** (new), `sitemap-help.xml`, `sitemap-blog.xml`, `sitemap-compare.xml`.
- Real per-page `lastmod` from `src/lib/page-dates.ts` (never the build date). Only indexable 200 pages with self-canonicals; noindex guides excluded.
- `robots.txt`: allows all public pages; explicit groups for Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended, Applebot; private app sections blocked with anchored rules; assets and `.txt` not blocked; points to the sitemap.
- `/llms.txt` (`public/llms.txt`): B2B description, who it serves, pricing, core pages, trades, email lists, locations, free tools, key guides, contact. 851 words. Update when page types are added.

## 6. Rollout (STEP 6)

| Week | Build | Status |
|---|---|---|
| 1 | Audit fixes, /locations hub + 50 state pages, /tools hub + 3 tools, sitemap split, robots AI crawlers, llms.txt, related links | **Done in code (merge to deploy)** |
| 2 | Expand the 5 thin help articles; /integrations page; refresh /features and /pricing copy to the B2B pattern | Planned |
| 3 | Review week-1 indexing; 5 new email-list trades (landscaping, painting, pest control, concrete, flooring) | Planned |
| 4 | Remaining 6 email-list trades; email format finder tool | Planned |
| 5 | City pages for the top 10 metros **only if** location pages win (STEP 7) | Conditional |
| 6+ | 2 to 3 tools per month, 2 blog posts per week, expand the winning page type | Planned |

Daily routine after each release: view source to confirm the text renders without JavaScript; request indexing in Search Console for hubs and core pages first (daily limit); submit changed URLs to IndexNow; add the new pages to hubs and related links the same day; log URLs.

## 7. Weekly measurement (STEP 7)

1. Search Console → Performance → Pages, filter by `/locations/`, `/industries/`, `/email-lists/`, `/tools/`, `/blog/`: record impressions, clicks, average position per type.
2. Indexing → Pages, per sitemap file: if more than 20% of a group is "Crawled – currently not indexed", stop adding that type and add unique content first.
3. Expansion rule: the type with the highest impressions **per page** gets the next batch.
4. Queries in positions 8 to 20: add them as H2s or FAQ questions on the ranking page.
5. Track branded searches ("contractor leads", "contractorleads.us") separately: they measure entity recognition.

## 8. Facts the business still has to provide ([fill in])

- Case studies or client results (agency name or anonymised, trade, area, leads found, replies, deals). Needed for "Results" sections; none are published because none were provided.
- Customer reviews on a third-party site (G2, Capterra, Trustpilot). Required before any AggregateRating schema.
- Confirm the social profiles in the company schema exist and belong to the business: linkedin.com/company/contractorleads, youtube.com/@contractorleads, facebook.com/contractorleads.
- Founder bio details and a LinkedIn URL for author pages.
- Whether a free public email verifier is acceptable given verification costs per check.
- Real usage data the business owns (for example average reply rates across campaigns), if it can be published.
- Decision on the homepage purchase pop-ups (they use invented purchases).
- Search Console connection to the SEO tooling, so weekly measurement can be automated.
