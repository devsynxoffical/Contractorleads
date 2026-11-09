# Enrichment Phase 0 inventory

Prepared 6 November 2026 from the source code, per the Multi-provider Enrichment blueprint (phase 0).
No paid provider call was made. Vendor facts below were checked against each vendor's official
documentation on this date.

## Where enrichment lives today

| Piece | File | Notes |
| --- | --- | --- |
| Waterfall engine | `src/lib/services/waterfall-enrichment.ts` | One function, `runWaterfallEnrichment`, runs all stages inline. |
| Bulk / datasheet route | `src/app/api/leads/waterfall-enrich/route.ts` | Upload rows or lead items; runs rows sequentially inside the HTTP request (SSE stream, `maxDuration` 300 s). |
| Single-lead route | `src/app/api/leads/[id]/enrich-waterfall/route.ts` | Same engine for one lead. |
| UI entry point | `src/components/leads/bulk-email-finder-view.tsx` | "datasheet" mode: upload CSV/XLSX and waterfall-enrich. |
| Provider keys | `src/lib/platform-keys.ts` | Platform-managed only. Admin sets keys (DB `PlatformKeyConfig`), env vars as fallback. No BYOK. |
| Email verification | `src/lib/email-verifier.ts` | Full verifier exists (ZeroBounce, NeverBounce, MillionVerifier, Bouncer, Hunter, EmailListVerify, SMTP) but the waterfall does **not** use it. |
| Credits | `src/lib/credits.ts` (`deductCredits`) | Admin-configured fee per row (`getWaterfallEnrichCreditCost`). |

## The four existing providers

The owner reported three (Apollo, Hunter.io, Prospeo); the fourth is **NinjaPear** (`src/lib/services/ninjapear.ts`,
`https://nubela.co/api/v1/company/details`), used for owner name and social profiles from a company website.

| Provider | Endpoint used | Problems found (vs current official docs) |
| --- | --- | --- |
| Apollo | `POST /v1/people/match` (legacy path), then `/v1/mixed_people/search` | Current path is `/api/v1/people/match`. Sends the key in the body and header. Forces `reveal_personal_emails: true`, which returns personal (non-work) emails the product does not want. Ignores `email_status`. |
| Hunter | `GET /v2/email-finder`, fallback `/v2/domain-search` | Key sent in the URL query (ends up in logs); docs support the `X-API-KEY` header. Ignores `verification.status`, `accept_all`, `provenance` and `sources[]`. Domain-search fallback can pick a generic address (info@) as the "owner" email. |
| Prospeo | `POST /enrich-person` | Always sends `enrich_mobile: true`, which costs 10 credits instead of 1 on every lookup even when only an email is wanted. `only_verified_email: false`. Errors come back as HTTP 400 with `error_code` (`INSUFFICIENT_CREDITS`, `INVALID_API_KEY`, ...) but the code treats every non-200 as "no match", so an empty balance or bad key fails silently. |
| NinjaPear | `GET nubela.co/api/v1/company/details` | Works as an owner/social fallback; no cost or attempt record. |

## Behaviour problems (vs the blueprint)

1. **Stop rule.** The run is "complete" only when email + phone + owner are all present, so Apollo is still called after an
   email is found if the phone is missing. The blueprint requires field-specific tracks: never buy more emails because
   another field is incomplete.
2. **False verification.** "Verified" means syntax + MX lookup only, and a 2-second MX **timeout counts as valid**. Every
   found address is saved as `verificationStatus: "verified"`. Catch-all, unknown, role and free-mail are not
   distinguished.
3. **Cross-customer data.** Stage 1 reads any lead in the shared database (including other customers' paid results) and
   the run writes found emails/phones back to shared lead rows, or creates new orphan lead rows. Decision (6 Nov 2026):
   paid lookups become per-workspace.
4. **Billing.** `newlyFoundFields` always includes `"linkedin"` when any LinkedIn URL exists (even one already on the
   lead), so a row can be charged when nothing new was found. A discovered website alone is also billable.
5. **No ledger.** No record of which provider was called, what it returned or what it cost; no idempotency; no budget cap.
6. **Not durable.** Rows run inside the HTTP request; a deploy or crash mid-run loses progress and there is no resume.

## Workspace definition

Leads, credits and searches belong to the individual `User`; `TeamMember` is an invite record only. The new engine uses
the user ID as the workspace ID.

## Phase 1-3 plan (decided 6 Nov 2026)

- Common engine: provider registry, normalized result envelope, durable DB job queue, attempt + cost ledger, per-field
  tracks with stop rules, acceptance policy using the real verifier, per-workspace cache, budget reservation.
- Move the four existing providers onto it with the fixes above.
- Add Findymail, LeadMagic and Icypeas adapters (disabled until keys are configured).
- Extend the datasheet upload flow: field choice, preset, budget estimate, background progress, provider history, export.
