# APIs & keys required to make LeadFlow USA active

**Full step-by-step (screens / clicks):** see [`API-SETUP-GUIDE.md`](./API-SETUP-GUIDE.md)

Put these in `.env` (local) and in cPanel Node.js environment variables (production).

Add real keys (not placeholders) to turn Lead Finder and Ask Expert on.

---

## What data you need to provide (vs built-in)

| You provide | Already in the app |
|-------------|--------------------|
| API keys in `.env` (below) | 12 industries, 50 US states, radii, scoring tiers |
| Stripe keys later for paid plans | Plan names & credit UI (checkout not live yet) |
| Optional LinkedIn / Houzz / Nextdoor endpoints | Social fields show “Not Available” if missing |
| Your company profile (Settings / onboarding) | Used to personalize Ask Expert |

You do **not** need to upload a business list — Google Places returns live US contractor data when searched.

---

## Required to generate real leads

| Variable | What it does | Where to get it |
|----------|--------------|-----------------|
| `GOOGLE_PLACES_API_KEY` | Canonical business data (name, phone, address, rating, Maps link) | [Google Cloud Console](https://console.cloud.google.com/) → enable **Places API** (+ billing) |
| `JWT_SECRET` | Signs login sessions | Any long random string (32+ chars) |
| `DATABASE_URL` | SQLite/DB connection | Local: `file:./dev.db` · Prod: `file:./prisma/prod.db` |

Without `GOOGLE_PLACES_API_KEY`, Lead Finder returns an error / empty results.

---

## Strongly recommended

| Variable | What it does | Where to get it |
|----------|--------------|-----------------|
| `YELP_FUSION_API_KEY` | Confirm business active + Yelp rating/reviews/URL | [Yelp Developers](https://www.yelp.com/developers) → Fusion API |
| `OPENAI_API_KEY` | Ask Expert, Outreach Studio, AI qualification scores | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL (cookies, links) | e.g. `https://yourdomain.com` |

---

## Optional enrichment (verified or blank — never invented)

| Variable | What it does |
|----------|--------------|
| `LINKEDIN_DATA_API_KEY` | Licensed LinkedIn resolve (e.g. Proxycurl). Without it → “LinkedIn Not Available” |
| `HOUZZ_SEARCH_ENDPOINT` + `HOUZZ_API_KEY` | Houzz match via your proxy/search endpoint |
| `NEXTDOOR_SEARCH_ENDPOINT` + `NEXTDOOR_API_KEY` | Nextdoor match (best-effort, non-blocking) |

---

## Later (roadmap — not blocking lead search)

| Integration | Needed for |
|-------------|------------|
| Stripe keys | Plans, subscriptions, credit top-ups |
| Facebook App ID + Marketing API | Custom Audience sync |
| Google OAuth client ID/secret | Google login |
| SendGrid / Twilio | Password reset email / sending SMS (if you send, not just draft) |

---

## Minimal `.env` to go live (leads + AI)

```env
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="paste-a-long-random-secret-here"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

GOOGLE_PLACES_API_KEY="AIza..."
YELP_FUSION_API_KEY="..."
OPENAI_API_KEY="sk-..."
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
4. Confirm **Places API** (and Text Search / Places if listed) is **Enabled** under APIs & Services → Library
5. Wait 1–2 minutes, restart `npm run next`, search again

Until billing is on, Google returns 0 places and the app used to say “No leads found.” The app now shows the real billing error instead.

Also set a real `OPENAI_API_KEY` (not `sk-...`) if you want Ask Expert working.
