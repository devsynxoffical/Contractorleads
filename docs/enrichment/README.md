# Multi-provider enrichment: how it works

This is the build of the "Multi-provider enrichment for Contractor Leads" blueprint, phases 1 to 3.
Phase 0 findings are in `PHASE-0-INVENTORY.md`.

## Flow

1. A job is created (`POST /api/enrichment/jobs`, or inline by the single-lead and legacy bulk routes).
   It stores the requested fields, the provider order snapshot, the budget and one row per input record.
2. The worker (`/api/cron/enrichment`, called every 10 s by `scripts/start-railway.mjs`) claims due rows with
   `FOR UPDATE SKIP LOCKED`. A row lock older than 5 minutes is treated as stale and the row is re-claimed.
3. Each row runs one track per field (`owner`, `work_email`, `phone`, `mobile`). Each track walks its
   provider order and stops at its own first accepted result. Email and mobile tracks need an owner, so the
   owner track always runs first. No track buys more data to fill a different field.
4. Accepted results are saved on the row with provider, status, verification source, check time, source URL
   and evidence. Paid person data (owner, email, mobile) is also saved to `WorkspaceLeadContact` for the
   workspace that paid, never onto the shared `Lead` record.

## Acceptance (`src/lib/enrichment/acceptance.ts`)

- The address must be on the company's domain. A free-mail address counts only when the business itself
  publishes it on its website.
- Role addresses (info@, office@ ...) are never accepted as the owner's email.
- Valid means accepted. Catch-all and unknown are kept as "email to review" and the track keeps looking.
  Invalid is rejected.
- A provider's own documented verified status is reused (Hunter `valid`, Apollo `verified`, Prospeo
  `VERIFIED`, LeadMagic `valid`, Icypeas `ultra_sure`/`very_sure`). Anything else goes to the platform
  verifier, cached per workspace for 7 days.

## Money

- Before the first paid call on a row, the row fee is reserved against the job budget with one conditional
  `UPDATE`, so concurrent workers cannot overshoot the budget.
- A row is charged once, only when a requested field is newly accepted. The charge, the balance update, the
  ledger entry and the job counters are one transaction, keyed by the unique `EnrichmentCharge.rowId`.
- Every provider call is a `ProviderAttempt` with a unique key (`row:field:provider`). A retry or restart
  reuses the stored outcome. An attempt left in `submitting` after a crash becomes `unknown` and is never
  resubmitted, because the vendor may already have charged.
- A provider that answers "out of credits" or "bad key" is skipped for the rest of that row's run.

## Providers (`src/lib/enrichment/adapters`)

| Provider | Fields | Notes |
| --- | --- | --- |
| Company website | owner, work email | free |
| Public web search | owner, business phone | free (Serper) |
| Apollo | owner, work email | owner via the free people search, then match by id; no personal-email reveal |
| Hunter | owner, work email | key in header; catch-all mapped; owner only with an owner-type title |
| Prospeo | work email, mobile | mobile only when the job opts in (10 vendor credits) |
| NinjaPear | owner | company executives |
| Findymail | work email | new; off until a key is saved |
| LeadMagic | work email | new; off until a key is saved |
| Icypeas | work email | new, async (submit, then read results); off until a key is saved |

Admins switch providers on or off and reorder them per field in Admin → System → "Enrichment providers".
Keys are entered in "Platform API keys" on the same page. A provider without a key is never called.

## Routes

- `GET /api/enrichment/providers`: fields, available providers, fee per row, balance
- `POST /api/enrichment/jobs`: create (send an `Idempotency-Key` header); returns 202 with the job id
- `GET /api/enrichment/jobs/:id?rows=1`: progress, rows, per-field provider history, vendor usage
- `POST /api/enrichment/jobs/:id/cancel`
- `GET /api/enrichment/jobs/:id/export`: CSV with the original columns, accepted fields, sources and statuses
- `GET|PUT /api/admin/enrichment`: provider switches and order
- `POST /api/leads/:id/enrich-waterfall` and `POST /api/leads/waterfall-enrich`: same responses as before,
  now running on this engine

## Tests

`npm test` runs the adapter fixtures (found, no match, invalid input, quota, timeout, malformed body,
pending) and the engine acceptance tests against Postgres (`DATABASE_URL` must be set): early stop, no double
billing across retries and restarts, no resubmit after an interrupted call, catch-all kept for review, budget
under concurrency, async resume, tenant isolation, idempotent create, row claiming, cancel, and CSV
formula neutralization.

## Not done yet

- Live calls with real keys for Findymail, LeadMagic and Icypeas. The adapters follow the vendors' published
  docs and are covered by fixtures, but have not been run against the live APIs.
- Icypeas webhooks. Results are read by polling for now (6 s or more apart, within the 30 reads/minute limit).
- The old `src/lib/services/waterfall-enrichment.ts` is no longer used by any route and can be deleted after
  the pilot.
