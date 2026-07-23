# APIs & keys required to make Contractor Leads active

**Full step-by-step (screens / clicks):** see [`API-SETUP-GUIDE.md`](./API-SETUP-GUIDE.md)

Put these in `.env` (local) and in **Railway** (or your host) environment variables (production).

Add real keys (not placeholders) to turn Lead Finder, enrichment, and email verification on.

**Out of scope:** There is **no MCP server** for this product. Wire product APIs only.

---

## What data you need to provide (vs built-in)

| You provide | Already in the app |
|-------------|--------------------|
| API keys in `.env` (below) | Industries, US states, radii (incl. 0 miles), scoring tiers |
| Stripe keys later for paid plans | Plan names & credit UI (checkout not live yet); **1.65 credits per Lead Finder search** |
| Optional LinkedIn / Meta / email keys | Features degrade gracefully when missing |
| Your company profile (Settings / onboarding) | Used to personalize Ask Expert |

You do **not** need to upload a business list — Google Places returns live US contractor data when searched.

---

## Required to generate real leads

| Variable | What it does | Where to get it |
|----------|--------------|-----------------|
| `GOOGLE_PLACES_API_KEY` | Lead search + **location autocomplete** (name, phone, address, rating, Maps link) | [Google Cloud Console](https://console.cloud.google.com/) → enable **Places API** / **Places API (New)** + **Places Autocomplete** (+ billing) |
| `JWT_SECRET` | Signs login sessions | Any long random string (32+ chars) |
| `DATABASE_URL` | Postgres connection | Local Docker / Railway Postgres |

Without `GOOGLE_PLACES_API_KEY`, Lead Finder returns an error / empty results. Autocomplete needs Autocomplete (or Places API New) enabled on the same key.

---

## Strongly recommended

| Variable | What it does | Where to get it |
|----------|--------------|-----------------|
| `YELP_FUSION_API_KEY` | Confirm business active + Yelp rating/reviews/URL | [Yelp Developers](https://www.yelp.com/developers) → Fusion API |
| `OPENAI_API_KEY` | Ask Expert, Outreach Studio, AI qualification scores | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL (cookies, **verification email links**) | e.g. `https://yourdomain.com` |
| `RESEND_API_KEY` or `SENDGRID_API_KEY` | Business-email signup verification | [Resend](https://resend.com/) or [SendGrid](https://sendgrid.com/) |
| `EMAIL_FROM` / `RESEND_FROM` | From address for verification mail | Must be allowed by your provider |

Without an email provider, signup still works in **dev**: the API returns a `verifyUrl` and logs the message.

---

## Optional enrichment

| Variable | What it does |
|----------|--------------|
| `NINJAPEAR_API_KEY` | Company enrichment (FB/IG + executives) via NinjaPear. Legacy alias: `LINKEDIN_DATA_API_KEY`. Proxycurl is shut down. |
| `META_ACCESS_TOKEN` | Long-lived Meta token with **Ads Library** / `ads_archive` access. Without it → public Ads Library deep link fallback |
| `META_APP_ID` + `META_APP_SECRET` | App token fallback for Graph calls |
| `HOUZZ_SEARCH_ENDPOINT` + `HOUZZ_API_KEY` | Houzz match via your proxy/search endpoint |
| `NEXTDOOR_SEARCH_ENDPOINT` + `NEXTDOOR_API_KEY` | Nextdoor match (best-effort, non-blocking) |
| `SERPER_API_KEY` | Public web search for LinkedIn + social discovery |

---

## Later (roadmap — not blocking lead search)

| Integration | Needed for |
|-------------|------------|
| Stripe keys | Plans, subscriptions, credit top-ups |
| Google OAuth client ID/secret | Google login |
| Twilio | SMS (if you send, not just draft) |

---

## Railway env checklist

```text
DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_APP_URL
GOOGLE_PLACES_API_KEY          # Places + Autocomplete + billing
YELP_FUSION_API_KEY
OPENAI_API_KEY
META_ACCESS_TOKEN              # long-lived, Ads Library access
NINJAPEAR_API_KEY              # NinjaPear (nubela.co) — not Proxycurl
SERPER_API_KEY                 # LinkedIn / social discovery
RESEND_API_KEY                 # or SENDGRID_API_KEY
EMAIL_FROM / RESEND_FROM
STRIPE_SECRET_KEY              # Stripe Billing (sk_live_… / sk_test_…)
STRIPE_WEBHOOK_SECRET          # whsec_… for /api/billing/webhook
STRIPE_PRICE_STARTER           # price_… monthly Starter
STRIPE_PRICE_GROWTH            # price_… monthly Growth
STRIPE_PRICE_AGENCY            # price_… monthly Agency
```

Admin **Feature Health** (`/admin/health`) shows configured vs missing for these integrations.

---

## Minimal `.env` to go live (leads + AI + signup email)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="paste-a-long-random-secret-here"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

GOOGLE_PLACES_API_KEY="AIza..."
YELP_FUSION_API_KEY="..."
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
```

After saving keys:

```bash
npx prisma generate
npx prisma db push
npm run build
# restart Node app / npm start
```

## Fix: “No leads found” but search should work

We tested Painting / FL against Google Places with your current key. Google returned:

**`REQUEST_DENIED` — Billing is not enabled on the Google Cloud project.**

### Do this now

1. Open [Google Cloud billing enable](https://console.cloud.google.com/project/_/billing/enable)
2. Select the **same project** that owns your Places API key
3. Link a billing account (card required — Google still gives free monthly Maps credit)
4. Confirm **Places API** (and Autocomplete / Places API New if listed) is **Enabled** under APIs & Services → Library
5. Wait 1–2 minutes, restart the app, search again

Until billing is on, Google returns 0 places. The app shows the real billing error instead.

Also set a real `OPENAI_API_KEY` if you want Ask Expert working, and `RESEND_API_KEY` (or SendGrid) for production signup verification.
