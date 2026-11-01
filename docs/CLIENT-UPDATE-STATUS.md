# Contractor Leads — Development Updates & Fixes: Status Report

Date: 2026-11-01 · Branch: `claude/quirky-thompson-65u09b` (Railway deploys from `master`; merge the branch to go live)

Status key: **Done** = implemented and verified locally · **Done (needs live config)** = code complete, verified as far as possible without the third-party credentials · **Limitation** = depends on an external service

| # | Task | Status |
|---|------|--------|
| 1 | Dashboard UI/UX fixes | Done |
| 2 | Affiliate program (30 %, $500 payout, tracked metrics) | Done (Stripe webhook URL must be added in Stripe) |
| 3 | Email sending, threading, sender names, logging | Done (needs live SMTP/relay to confirm on the wire) |
| 4 | Email verification accuracy | Done |
| 5 | Facebook Ad Library exact page-name search | Done (needs Meta Ad Library API token) |
| 6 | Layout + LLM-friendly FAQ | Done |
| 7 | Pricing, audience filters, 5 countries + Any Country | Done |
| 8 | Email/SMS package lock with backend enforcement | Done |
| 9 | Abandoned-checkout email sequence | Done (needs `CRON_SECRET` on Railway) |
| 10 | End-to-end testing and status report | Done (this document) |

---

## 1. Dashboard UI/UX — Done

Audited every app route at desktop (1440) and mobile (390) with an automated overflow/overlap scan plus screenshots, then fixed:

- App shell: footer moved inside the scroll area so it no longer overlaps page content; compact credits card with an Upgrade pill; bottom block no longer collides with nav items.
- Home KPI grid collapses to 2 columns on small screens.
- AI assistant: chat sidebar becomes an overlay and starts collapsed on phones.
- Email accounts page: page padding restored, toolbar wraps, card text no longer clipped.
- Campaigns toolbar: minimum widths so filters stop overlapping.
- Leads table and Email workspace: correct theme background variables in dark mode.
- Upgrade modal copy spacing fix.
- Email overview card now reflects the Messaging add-on state instead of saying "Free & Unlocked".

Final scan: zero horizontal overflow on all 30 routes; the only flagged "overlaps" were a scrolled sidebar list under its sticky card, a modal over its dimmed backdrop, and the Next.js dev badge.

## 2. Affiliate program — Done

- Unique referral links (`?ref=CODE`), first-click-wins 30-day cookie in middleware.
- Dashboard shows sign-ups, sales, revenue, commission earned, payable balance, payouts; numbers come from database aggregates (no double counting).
- Commission: 30 % on every eligible sale **and renewal**. Payout threshold $500. Both are configuration values (`src/lib/referral-constants.ts`) and drive the UI, FAQ and calculator.
- Trial/free sign-ups never create commission; refunds reverse commission.
- Stripe webhook added at `/api/billing/stripe/webhook` (checkout completed, invoice paid = renewal, subscription updated/deleted, charge refunded). Idempotent per event. Razorpay webhook now rejects unsigned calls.
- Admin "record sale" is explicit and deterministic (no accidental duplicate commissions).

**Action needed:** in the Stripe dashboard add the webhook URL above with the four event types and set `STRIPE_WEBHOOK_SECRET`; set `RAZORPAY_WEBHOOK_SECRET` if Razorpay is used.

## 3. Email sending & deliverability — Done (live wire test pending)

- Replies and follow-ups now send `In-Reply-To` and `References` headers through both direct SMTP and the Hostinger relay, and keep the original subject (`Re: …`), so Gmail/Outlook show one thread.
- Sender name and reply-to come from the connected mailbox.
- Every send attempt is logged with status, provider response and error text (`EmailLog`), including failures with the from-address.
- Campaign runner: retries up to 3 times, stops on hard bounces, no duplicate "Re: Re:" prefixes.
- Tracking pixels disabled on 1:1 replies to protect deliverability.

**Limitation:** actual inbox placement and threading can only be confirmed by sending from the production mailbox/relay. Deliverability also depends on the customer's SPF/DKIM/DMARC records, which the app cannot set.

## 4. Email verification — Done

- Statuses: valid / risky / invalid (unverifiable addresses are reported as risky, never as valid).
- Catch-all domains detected and marked risky.
- Segment verification counts only "valid" as verified; risky and invalid are excluded from campaign sends.

## 5. Facebook Ad Library search — Done (needs API access)

- New search panel on the Facebook page and `/api/facebook/search`.
- A page name in quotes (`"Summit Peak Roofing"`) runs an exact-phrase search; the first exact page match is used, with a country=ALL retry and up to 3 pages of results.
- Zero-result checks are stored so leads are not re-queried endlessly.
- Without a token the UI returns a pre-built Ads Library link so the user can still open the search.

**Limitation:** Meta's Ad Library API requires an approved developer account and a long-lived `META_ACCESS_TOKEN`; without it only the link fallback works.

## 6. Layout & FAQ — Done

- Homepage, pricing and footer redesigned (dark hero with animated object, comparison table, large footer with link grid, newsletter, clock).
- New `/faq` page: 20 plain-language, self-contained answers grouped by topic, with FAQPage structured data; linked from the footer and listed in `llms.txt` and the sitemap for AI search engines.

## 7. Pricing, audiences, countries — Done

- Plan prices are admin-controlled and shown live on the homepage/pricing page; Messaging add-on is $15.50/mo.
- Lead Finder industry list now has Trades and Audiences groups; **Agency Owners** and **E-commerce Brands** map to tuned Google search phrases.
- Country selector: United States, Canada, United Kingdom, Australia, New Zealand plus **Any country**, which searches across all five and detects each lead's country from its address.

## 8. Email/SMS package lock — Done

- All email and SMS endpoints (compose, reply, bulk, campaigns create/launch/process/test-send, automation, SMS) return `402 messaging_addon_required` when the add-on is inactive. Verified by API tests.
- Every related UI surface shows a lock notice with an Upgrade button to Plans & Billing.
- Unlock is automatic when the add-on becomes active (Razorpay payment or Stripe webhook).

## 9. Abandoned-checkout sequence — Done (needs cron secret)

- Each checkout start is recorded (`CheckoutAttempt`). If no payment arrives, emails go out at 1 h, 24 h and 72 h using editable templates (`checkout_recovery_1/2/3`).
- Sequence stops as soon as the order is paid; closing the payment modal is also tracked.
- Scheduler runs inside the Railway start script every 15 minutes (plus email sequences every 10 min and digests hourly).

**Action needed:** set `CRON_SECRET` on Railway; the cron endpoint refuses to run without it.

## 10. Testing — Done

- Type check passes; production build passes.
- API smoke tests against a seeded local database: add-on gating (402), webhook hardening (503 unconfigured / 401 bad signature), cron auth, FB search, Any-country and audience validation, referral config, dismissed-checkout handling.
- Full visual audit of all dashboard routes and marketing pages at two viewports.

## Dependencies and third-party limitations

| Item | Needed from client |
|------|--------------------|
| Stripe | Webhook endpoint + `STRIPE_WEBHOOK_SECRET`, price IDs |
| Razorpay | `RAZORPAY_WEBHOOK_SECRET` |
| Meta | Ad Library API approval + `META_ACCESS_TOKEN` |
| Google | `GOOGLE_PLACES_API_KEY` (scraper fallback is slow and rate-limited) |
| Twilio | SID, token, from-number for SMS |
| Cron | `CRON_SECRET` |
| Deliverability | SPF/DKIM/DMARC on each customer sending domain |

## Security note

`public/mailer.php` was left untouched as instructed. It is publicly downloadable and contains SMTP credentials; those credentials should be rotated and the file moved off the public web root.
