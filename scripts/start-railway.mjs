/**
 * Production start for Railway (and similar hosts).
 * Uses `next start` (full node_modules) — more reliable than standalone alone on Nixpacks.
 */
import { spawn, spawnSync } from "child_process";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Link Postgres and set DATABASE_URL=${{Postgres.DATABASE_URL}}.");
  process.exit(1);
}

console.log("Running prisma db push...");
const push = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate"],
  { stdio: "inherit", env: process.env },
);

if (push.status !== 0) {
  console.error("prisma db push failed — check DATABASE_URL and that Postgres is running.");
  process.exit(push.status ?? 1);
}

console.log("Seeding demo user (upsert)...");
const seed = spawnSync("node", ["prisma/seed.mjs"], {
  stdio: "inherit",
  env: process.env,
});
if (seed.status !== 0) {
  console.error("Seed failed — login may not work until seed succeeds.");
  process.exit(seed.status ?? 1);
}

const port = process.env.PORT || "3000";
process.env.HOSTNAME = "0.0.0.0";
console.log(`Starting Next.js on 0.0.0.0:${port}`);

const child = spawn(
  "npx",
  ["next", "start", "-H", "0.0.0.0", "-p", port],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 1);
});

for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    child.kill(sig);
  });
}
