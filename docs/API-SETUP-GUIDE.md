# Step-by-step: How to get your API keys

Follow these guides in order. After each key, paste it into your project `.env` file (no spaces around `=`).

When done, restart the app:

```bash
# stop npm run next (Ctrl+C), then:
npm run next
```

---

## 1) Google Places API (REQUIRED for real leads)

**Website:** [https://console.cloud.google.com/](https://console.cloud.google.com/)  
**Env variable:** `GOOGLE_PLACES_API_KEY`

### Steps

1. Open [Google Cloud Console](https://console.cloud.google.com/) and sign in with your Google account.
2. Click the project dropdown (top bar) → **New Project**.
3. Name it e.g. `LeadFlow USA` → **Create**. Wait until the project is selected.
4. Open the left menu → **APIs & Services** → **Library**.
5. Search for **Places API** (and/or **Places API (New)**).
6. Click it → **Enable**.
7. Also enable **Geocoding API** if offered (helps city/ZIP searches) → **Enable**.
8. Go to **APIs & Services** → **Credentials**.
9. Click **+ Create Credentials** → **API key**.
10. Copy the key (starts with `AIza...`).
11. (Recommended) Click **Edit API key**:
    - **Application restrictions:** for local testing leave *None*; for production use HTTP referrers / IP.
    - **API restrictions:** Restrict key → select **Places API** (+ Geocoding if enabled).
    - Save.
12. Open **Billing** in the left menu and link a billing account (Google requires billing for Places; they give free monthly credit).

### Put in `.env`

```env
GOOGLE_PLACES_API_KEY="AIzaYourRealKeyHere"
```

### Test

Home or Lead Finder → Industry + State → Search.  
If key is missing/wrong you get: `Google Places API key not configured` or a search error.

---

## 2) OpenAI API (Ask Expert + AI scoring)

**Website:** [https://platform.openai.com/](https://platform.openai.com/)  
**Env variable:** `OPENAI_API_KEY`

### Steps

1. Go to [https://platform.openai.com/](https://platform.openai.com/) and sign up / log in.
2. Complete any phone / org setup OpenAI asks for.
3. Open [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).
4. Click **Create new secret key**.
5. Name it e.g. `LeadFlow local`.
6. Copy the key immediately (starts with `sk-...`). You cannot view it again later.
7. Add billing / payment method under **Settings → Billing** so the key can call models.
8. (Optional) Set a monthly usage limit under Billing → Limits.

### Put in `.env`

```env
OPENAI_API_KEY="sk-YourRealKeyHere"
```

### Test

Open **Ask Expert** or the Live AI Bot → ask a short question.  
Without a real key you will see an error about the API key.

---

## 3) Yelp Fusion API (recommended — verifies listings)

**Website:** [https://www.yelp.com/developers](https://www.yelp.com/developers)  
**Env variable:** `YELP_FUSION_API_KEY`

### Steps

1. Go to [https://www.yelp.com/developers](https://www.yelp.com/developers).
2. Sign in with a Yelp account (or create one).
3. Click **Manage App** / **Create App** (wording may vary).
4. Fill the form:
   - App name: `LeadFlow USA`
   - Industry / description: lead generation for home services
   - Accept the terms
5. Submit / Create.
6. On the app page, copy the **API Key** (Fusion API).

### Put in `.env`

```env
YELP_FUSION_API_KEY="YourYelpFusionKeyHere"
```

### Note

Without Yelp, Google Places can still return leads. Yelp improves verification and rating cross-checks.

---

## 4) App URL + JWT (required for sessions)

These are **not** from external API websites — you create them yourself.

### `JWT_SECRET`

1. Make a long random string (32+ characters).
2. Example generators:
   - Password manager “generate password”
   - Or PowerShell:  
     `[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`

```env
JWT_SECRET="paste-a-long-random-secret-here"
```

### `NEXT_PUBLIC_APP_URL`

Local:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Production:

```env
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### `DATABASE_URL` (already set locally)

```env
DATABASE_URL="file:./dev.db"
```

---

## 5) Optional: NinjaPear + Serper (enrichment)

**Provider:** [https://nubela.co/](https://nubela.co/) (NinjaPear — Proxycurl is shut down)  
**Env variables:** `NINJAPEAR_API_KEY` (or legacy `LINKEDIN_DATA_API_KEY`), plus `SERPER_API_KEY`

### Steps

1. Sign up at NinjaPear / Nubela and create an API key (buy credits — 0 credits = no enrichment).
2. Add Serper for LinkedIn URL discovery via Google search.
3. Add to `.env`:

```env
NINJAPEAR_API_KEY="your-ninjapear-key"
SERPER_API_KEY="your-serper-key"
```

NinjaPear fills Facebook/Instagram + executives from the company website. LinkedIn URLs come from website scrape + Serper (not from NinjaPear; Proxycurl is discontinued).

---

## 6) Optional later: Stripe (billing)

**Website:** [https://dashboard.stripe.com/](https://dashboard.stripe.com/)

### Steps (when you enable payments)

1. Create a Stripe account.
2. Complete business verification.
3. Dashboard → **Developers** → **API keys**.
4. Copy **Publishable key** and **Secret key** (use Test mode first).
5. Add to `.env` when the billing code is wired (not required for lead search today).

---

## 7) Your finished `.env` example

Open `e:\devsynx\Contractor leads\.env` and make it look like this (real keys, **no** `# comments` on the same line as the value):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

GOOGLE_PLACES_API_KEY="AIza..."
OPENAI_API_KEY="sk-..."
YELP_FUSION_API_KEY="your-yelp-key"
```

### Important

- Do **not** commit `.env` to GitHub.
- Do **not** paste placeholder text like `your-key-here` or `sk-...` — those are fake and will fail.
- After editing `.env`, **restart** `npm run next`.

---

## Quick checklist

| Order | Service | Variable | Must have? |
|------|---------|----------|------------|
| 1 | Google Cloud Places | `GOOGLE_PLACES_API_KEY` | Yes — for leads |
| 2 | OpenAI | `OPENAI_API_KEY` | Yes — for Ask Expert / AI |
| 3 | Yelp Developers | `YELP_FUSION_API_KEY` | Recommended |
| 4 | Yourself | `JWT_SECRET` | Yes |
| 5 | Yourself | `NEXT_PUBLIC_APP_URL` | Yes |
| 6 | NinjaPear + Serper | `NINJAPEAR_API_KEY`, `SERPER_API_KEY` | Optional |
| 7 | Stripe | later | Optional (billing) |

---

## After keys are added — how to verify

1. Restart: Ctrl+C → `npm run next`
2. Login → open **Home**
3. Search: `Roofing in Austin TX` (or use filters)
4. Open **Ask Expert** → ask a short question
5. If search still fails, check the browser Network tab / terminal for the exact error (billing not enabled, wrong key, or API not enabled)
