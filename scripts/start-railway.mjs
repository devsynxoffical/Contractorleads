/**
 * Production start for Railway.
 *
 * 1) Sync schema + seed (needs private network / DATABASE_URL)
 * 2) Boot the Next.js standalone server (required when next.config has
 *    `output: "standalone"` — `next start` is unsupported and can leave
 *    /api/health returning 503 forever).
 */
import { spawn, spawnSync } from "child_process";
import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Link Postgres and set DATABASE_URL=${{Postgres.DATABASE_URL}}.",
  );
  process.exit(1);
}

console.log("Running prisma db push...");
const push = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate"],
  { stdio: "inherit", env: process.env },
);

if (push.status !== 0) {
  console.error(
    "prisma db push failed — check DATABASE_URL and that Postgres is running.",
  );
  process.exit(push.status ?? 1);
}

console.log("Applying baseline config (role templates, referral rewards)...");
const seed = spawnSync("node", ["prisma/seed.mjs"], {
  stdio: "inherit",
  env: process.env,
});
if (seed.status !== 0) {
  console.error("Seed failed — login may not work until seed succeeds.");
  process.exit(seed.status ?? 1);
}

const port = process.env.PORT || "3000";
process.env.PORT = port;
process.env.HOSTNAME = "0.0.0.0";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const standaloneServer = join(standaloneDir, "server.js");

function ensureStandaloneAssets() {
  const staticSrc = join(root, ".next", "static");
  const staticDest = join(standaloneDir, ".next", "static");
  if (existsSync(staticSrc)) {
    mkdirSync(join(standaloneDir, ".next"), { recursive: true });
    cpSync(staticSrc, staticDest, { recursive: true });
  }
  const publicSrc = join(root, "public");
  const publicDest = join(standaloneDir, "public");
  if (existsSync(publicSrc)) {
    cpSync(publicSrc, publicDest, { recursive: true });
  }
}

let child;
if (existsSync(standaloneServer)) {
  ensureStandaloneAssets();
  console.log(`Starting Next.js standalone on 0.0.0.0:${port}`);
  child = spawn("node", ["server.js"], {
    cwd: standaloneDir,
    stdio: "inherit",
    env: process.env,
  });
} else {
  console.warn(
    "Standalone server missing — falling back to `next start` (may fail with output: standalone).",
  );
  console.log(`Starting Next.js on 0.0.0.0:${port}`);
  child = spawn(
    "npx",
    ["next", "start", "-H", "0.0.0.0", "-p", port],
    { stdio: "inherit", env: process.env },
  );
}

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
