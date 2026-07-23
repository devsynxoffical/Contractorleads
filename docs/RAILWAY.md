# Railway production setup (LeadFlow USA)

Repo: https://github.com/devsynxoffical/Contractorleads

## Deploy steps

1. Open https://railway.app → New Project → Deploy from GitHub repo
2. Select Contractorleads (authorize GitHub if prompted)
3. Add Database → PostgreSQL
4. Open the web/app service → Variables and set:

DATABASE_URL = ${{Postgres.DATABASE_URL}}
JWT_SECRET = long-random-string
NEXT_PUBLIC_APP_URL = https://YOUR-APP.up.railway.app
GOOGLE_PLACES_API_KEY = your-places-key
OPENAI_API_KEY = your-openai-key
YELP_FUSION_API_KEY = optional
STRIPE_SECRET_KEY = sk_live_or_test
STRIPE_WEBHOOK_SECRET = whsec_...
STRIPE_PRICE_STARTER = price_...
STRIPE_PRICE_GROWTH = price_...
STRIPE_PRICE_AGENCY = price_...

5. Settings → Networking → Generate Domain
6. Put that URL into NEXT_PUBLIC_APP_URL and redeploy
7. In Stripe Dashboard → Webhooks, add `https://YOUR-APP/api/billing/webhook` for checkout.session.completed, customer.subscription.*, invoice.paid
8. Open URL → Register → test Home search + Billing subscribe

## Region (required)

If deploys fail with an unrecognized region like `asia-southeast1-eqsg3a`:

1. Service → **Settings** → **Scale** → **Regions**
2. Choose **Southeast Asia (Singapore)** (or another listed region)
3. Redeploy

`railway.toml` pins `asia-southeast1` via `multiRegionConfig` so config-as-code
overrides a stale dashboard region id.

See railway.toml for build/start commands.
