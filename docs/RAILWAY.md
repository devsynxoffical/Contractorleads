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

5. Settings → Networking → Generate Domain
6. Put that URL into NEXT_PUBLIC_APP_URL and redeploy
7. Open URL → Register → test Home search

See railway.toml for build/start commands.
