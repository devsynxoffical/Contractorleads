# LeadFlow USA — Product Requirements & Specification

**Tagline:** Find High-Quality Home Service Leads Across America.  
**Document type:** Consolidated Product Requirements Document (PRD)  
**Prepared from:** Client chat threads, feature briefs, and build-agent summaries (through Jul 2026)  
**Purpose:** Single source of truth. Future change requests = versioned amendments here — not scattered chat messages.

**Roles:** Super Admin · Admin · User (Customer)  
**Hard policy:** verified or blank — never fabricate fields or links.

---

## Amendments log

| ID | Date | Change |
|----|------|--------|
| A1 | Jul 2026 | Houzz platform enrichment (verified link + rating/reviews or blank) |
| A2 | Jul 2026 | Marketing site visitor cookie (`cl_mkt_vid`) + Site Leads admin |
| A3 | Jul 2026 | Dashboard CRM & Integrations command center |

---

## 1. Product Overview

### 1.1 What it is
SaaS for digital marketing agencies to search home-service businesses across the USA by industry, location, and radius, receiving AI-qualified, AI-verified records (contact, socials, LinkedIn, ratings, opportunity scores) that can be managed, exported, turned into outreach, and synced toward CRM / Facebook workflows.

### 1.2 Target industries
Roofing · HVAC · Plumbing · Electrical · Solar · Landscaping · Remodeling · Painting · Cleaning · Pest Control · Pool Services · General Contractors

### 1.3 Coverage
All 50 US states — State → City → ZIP → Radius (plus Tier-1 country scope where enabled).

### 1.4 Core value proposition (functional requirement)
LeadFlow USA uses an AI-powered verification engine to remove fake, duplicate, inactive, outdated, and low-quality records before they reach the dashboard. Every lead is verified, quality-scored, and enriched with the most accurate business and LinkedIn information available. If the engine cannot back a claim for a field, **withhold it** — never fabricate.

### 1.5 Primary lead data sources

| Source | Role | Access | Status |
|--------|------|--------|--------|
| Google Business Profile (Places API) | Canonical business record | Places API (default) | **Built** |
| Yelp Fusion | Confirm + rating/reviews/link | Yelp Fusion API | **Built** (needs key) |
| Nextdoor | Local presence link | Best-effort scrape/lookup | **Built** (non-blocking) |
| Houzz (A1) | Profile + rating/reviews | Optional endpoint | **Built** (non-blocking) |

**Pipeline:** Places → Yelp confirm → Nextdoor/Houzz best-effort → AI qualification + LinkedIn ≥95% + other socials. Downstream never fabricates.

### 1.6 Roles

| Role | Who | Access |
|------|-----|--------|
| Super Admin | Platform owner | Full platform, admins, tenants, keys, billing rails |
| Admin | Ops / support staff | Scoped customers, credits, revenue, moderation |
| User | Paying / trial customer | Own workspace only |

---

## 2–8. Spec modules

Full functional requirements for User panel (§2), Admin (§3), Super Admin (§4), permission matrix (§5), data model (§6), third-party keys (§7), and NFRs (§8) remain as provided by the client in Jul 2026. Implementation tracking is below.

Key User modules: Auth & onboarding · Dashboard · Lead Finder · AI Qualification · Lead detail · LinkedIn verification · Lead management / Pipeline CRM · Ask Expert · Outreach Studio · Scripts · Facebook Custom Audience · Exports · Billing · Settings · CRM webhooks · Email automation.

---

## 9. Build status vs this PRD (Jul 2026 — live codebase)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Email/password auth + JWT | **Done** | |
| Google OAuth login | **Missing** | Deferred v1.1 |
| Password reset email flow | **Missing** | Login link is UI stub |
| AI onboarding (6 fields) | **Partial** | Form wizard (not conversational AI interview); resumable banner |
| Dashboard Business Insights | **Done** | Stats, trend, quality split, activity, exports, quick search |
| Dashboard CRM & Integrations hub | **Done** | A3 — pipeline + webhook/SMTP/export/FB/LinkedIn cards |
| Lead Finder geo filters | **Done** | Industry/state/city/ZIP/radius |
| Google Places canonical leads | **Done** | Not AI-placeholder records |
| Yelp / Nextdoor / Houzz enrichment | **Partial** | Schema + services; need API keys / endpoints |
| AI Qualification Engine | **Done** | Hot/Warm/Nurture + opportunity scores |
| Lead detail + social icons | **Done** | Verified or blank |
| LinkedIn ≥95% verification | **Partial** | Resolve gate ≥95%; some UI badges still ≥85% |
| Save / favorite / notes / statuses | **Done** | |
| Hot leads / map / pipeline CRM | **Done** | |
| Ask Expert + Scripts + Outreach | **Done** | |
| CRM webhooks (Zapier/Make/HubSpot URL) | **Done** | Generic outbound webhook (not native OAuth apps) |
| SMTP Day 1–3 email automation | **Done** | User’s own SMTP |
| Facebook Custom Audience sync | **Missing** | Ads Library / env status only — not Custom Audiences API |
| CSV + Excel export | **Done** | |
| PDF export | **Missing** | Deferred |
| Stripe subscriptions / top-ups | **Missing** | Billing UI; checkout deferred |
| Admin console (customers, credits, impersonation) | **Done** | `/admin/*` |
| Site marketing leads (cookie) | **Done** | A2 — `/admin/site-leads` |
| Super Admin keys / team / system | **Done** | `/admin/system`, `/admin/team` |
| Live Stripe revenue | **Partial** | Estimated MRR from plan mix |

---

## 10. Acceptance checklist (release gate)

Use §10 of the client PRD as the QA gate. Items still failing the “done” bar for a full release claim: Google Login, password reset, Stripe live checkout, Facebook Custom Audience sync, PDF export, LinkedIn badge threshold consistency, full enrichment keys in production.

---

## 11. Open questions (client)

1. LinkedIn licensed data provider budget vs manual matching  
2. Google Places + Yelp billing/quota approval; Nextdoor scrape sign-off  
3. Platform-send email/SMS vs draft-only  
4. Admin vs Super Admin boundary on Stripe keys  
5. Meta App Review ownership for Marketing API  

---

## Where to operate CRM & integrations (app)

| Surface | Path |
|---------|------|
| Dashboard hub | `/dashboard` → CRM & Integrations |
| Pipeline CRM | `/leads/pipeline` |
| CRM webhooks | `/crm-webhooks` |
| Email automation | `/settings` (SMTP + sequences) |
| Facebook / Meta status | `/facebook-ads` |
| Exports | Lead list → CSV / Excel |
| Site visitor leads (admin) | `/admin/site-leads` |
