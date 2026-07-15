# LeadFlow USA — PRD (canonical)

**Tagline:** Find High-Quality Home Service Leads Across America.  
**Status:** Authoritative client PRD (Jul 2026) — future changes = versioned amendments here.

Roles: **Super Admin** · **Admin** · **User**  
Policy: **verified or blank** — never fabricate.

## Pipeline sources (§1.5)

1. Google Places (canonical)
2. Yelp Fusion (confirm + ratings)
3. Nextdoor (best-effort, non-blocking)
4. **Houzz** (enrichment — amendment A1)
5. Downstream: AI qualification, LinkedIn ≥95%, other socials

## Amendments

### A1 — Houzz Platform
- Fields: `houzzUrl`, `houzzRating`, `houzzReviews`
- Verified Houzz link only; blank if no confident match
- Non-blocking enrichment via optional `HOUZZ_SEARCH_ENDPOINT`

## Build vs PRD (snapshot)

| Area | Status |
|------|--------|
| User auth (email/password), JWT | Done |
| Onboarding + dashboard banner | Done |
| Dashboard Business Insights | Done (Quick Lead Search added) |
| Lead Finder + Places/Yelp/LinkedIn | Partial (needs live API keys) |
| Houzz / Nextdoor enrichment hooks | Done (optional endpoints) |
| Lead detail socials (incl. Houzz) | Done |
| Ask Expert + Scripts + Outreach | Done |
| Exports CSV/XLSX | Partial (PDF deferred) |
| Facebook Ads sync UI | Placeholder / roadmap |
| Stripe billing | Deferred |
| Google OAuth | Deferred |
| Admin panel (Module B) | Not built |
| Super Admin panel (Module C) | Not built |
| Strict LinkedIn 95% provider | Partial (Proxycurl-style key) |
