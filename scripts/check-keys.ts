import { resolvePlatformKey } from "../src/lib/platform-keys";

async function check(label: string, fn: () => Promise<boolean>) {
  const t0 = Date.now();
  try {
    const ok = await fn();
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${label.padEnd(38)} ${Date.now() - t0}ms`,
    );
  } catch (e) {
    console.log(
      `FAIL  ${label.padEnd(38)} ${Date.now() - t0}ms — ${e instanceof Error ? e.message.slice(0, 90) : String(e)}`,
    );
  }
}

async function main() {
  const [places, openai, yelp, meta, serper, ninjapear] = await Promise.all([
    resolvePlatformKey("googlePlacesApiKey"),
    resolvePlatformKey("openaiApiKey"),
    resolvePlatformKey("yelpFusionApiKey"),
    resolvePlatformKey("metaAccessToken"),
    resolvePlatformKey("serperApiKey"),
    resolvePlatformKey("ninjapearApiKey"),
  ]);

  const run = [
    ["Google Places", places],
    ["OpenAI", openai],
    ["Yelp Fusion", yelp],
    ["Meta", meta],
    ["Serper", serper],
    ["NinjaPear", ninjapear],
  ] as const;

  const tasks: Array<[string, string]> = [];
  for (const [label, key] of run) {
    if (!key) {
      console.log(`SKIP  ${label.padEnd(38)} not configured`);
      continue;
    }
    tasks.push([label, key]);
  }

  await Promise.all(
    tasks.map(([label, key]) => {
      switch (label) {
        case "Google Places":
          return check("Google Places (searchText)", async () => {
            const r = await fetch(
              "https://places.googleapis.com/v1/places:searchText",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Goog-Api-Key": key,
                  "X-Goog-FieldMask":
                    "places.id,places.displayName,places.rating",
                },
                body: JSON.stringify({
                  textQuery: "roofing contractors in San Antonio, TX",
                  pageSize: 1,
                }),
                signal: AbortSignal.timeout(10000),
              },
            );
            const j = (await r.json()) as { places?: unknown[]; error?: { message?: string } };
            if (!r.ok) throw new Error(j.error?.message || `HTTP ${r.status}`);
            return (j.places?.length ?? 0) > 0;
          });
        case "OpenAI":
          return check("OpenAI (GET /models)", async () => {
            const r = await fetch("https://api.openai.com/v1/models", {
              headers: { Authorization: `Bearer ${key}` },
              signal: AbortSignal.timeout(10000),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return true;
          });
        case "Yelp Fusion":
          return check("Yelp Fusion (businesses/search)", async () => {
            const r = await fetch(
              "https://api.yelp.com/v3/businesses/search?term=roofing&location=San+Antonio,+TX&limit=1",
              { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) },
            );
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return true;
          });
        case "Meta":
          return check("Meta (graph pages/search)", async () => {
            const r = await fetch(
              `https://graph.facebook.com/v21.0/pages/search?q=roofing&fields=id,name&access_token=${encodeURIComponent(key)}`,
              { signal: AbortSignal.timeout(10000) },
            );
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return true;
          });
        case "Serper":
          return check("Serper (google search)", async () => {
            const r = await fetch("https://google.serper.dev/search", {
              method: "POST",
              headers: { "X-API-KEY": key, "Content-Type": "application/json" },
              body: JSON.stringify({ q: "roofing contractors san antonio", num: 1 }),
              signal: AbortSignal.timeout(10000),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return true;
          });
        case "NinjaPear":
          return check("NinjaPear (company details)", async () => {
            const r = await fetch(
              "https://nubela.co/api/v1/company/details?website=example.com",
              { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) },
            );
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return true;
          });
        default:
          return Promise.resolve();
      }
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
