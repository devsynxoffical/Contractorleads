/**
 * Railway pre-deploy: sync Prisma schema + seed baseline config.
 * Runs BEFORE the new container starts serving traffic / healthchecks,
 * so `start-railway.mjs` can boot Next.js immediately.
 */
import { spawnSync } from "child_process";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Link Postgres and set DATABASE_URL=${{Postgres.DATABASE_URL}}.",
  );
  process.exit(1);
}

console.log("Pre-deploy: prisma db push...");
const push = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
  {
    stdio: "inherit",
    env: process.env,
    // Don't hang healthchecks forever if Postgres is unreachable
    timeout: 120_000,
  },
);

if (push.error) {
  console.error("prisma db push error:", push.error.message);
  process.exit(1);
}
if (push.status !== 0) {
  console.error(
    "prisma db push failed — check DATABASE_URL and that Postgres is running.",
  );
  process.exit(push.status ?? 1);
}

console.log("Pre-deploy: seed baseline config...");
const seed = spawnSync("node", ["prisma/seed.mjs"], {
  stdio: "inherit",
  env: process.env,
  timeout: 60_000,
});

if (seed.error) {
  console.error("seed error:", seed.error.message);
  process.exit(1);
}
if (seed.status !== 0) {
  console.error("Seed failed — login may not work until seed succeeds.");
  process.exit(seed.status ?? 1);
}

console.log("Pre-deploy complete.");
