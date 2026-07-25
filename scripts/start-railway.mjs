/**
 * Railway start: sync schema if needed, then boot Next immediately after.
 *
 * Primary schema sync is `preDeployCommand` (scripts/pre-deploy-railway.mjs).
 * This start script still runs a quick db push as a safety net when pre-deploy
 * is skipped by the platform, then boots the standalone server.
 *
 * Healthcheck is disabled in railway.toml so a slow db push cannot fail the
 * deploy while Postgres is still reachable.
 */
import { spawn, spawnSync } from "child_process";
import { cpSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const port = process.env.PORT || "3000";
process.env.PORT = port;
process.env.HOSTNAME = "0.0.0.0";

if (process.env.DATABASE_URL) {
  console.log("[start] Ensuring DB schema (prisma db push)...");
  const push = spawnSync(
    "npx",
    ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
    { stdio: "inherit", env: process.env, timeout: 120_000 },
  );
  if (push.error) {
    console.error("[start] prisma db push error:", push.error.message);
  } else if (push.status !== 0) {
    console.error("[start] prisma db push failed with status", push.status);
    // Continue — pre-deploy may already have synced; don't brick the site
  } else {
    console.log("[start] DB schema ok");
  }
} else {
  console.warn("[start] DATABASE_URL missing — skipping prisma db push");
}

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const standaloneServer = join(standaloneDir, "server.js");

console.log(`[start] cwd=${root} PORT=${port}`);
console.log(`[start] standalone exists=${existsSync(standaloneServer)}`);
try {
  const nextDir = join(root, ".next");
  if (existsSync(nextDir)) {
    console.log(`[start] .next entries: ${readdirSync(nextDir).join(", ")}`);
  } else {
    console.error("[start] .next directory missing from image");
  }
} catch (err) {
  console.error("[start] could not list .next", err);
}

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
  console.log(`[start] Starting standalone server on 0.0.0.0:${port}`);
  child = spawn("node", ["server.js"], {
    cwd: standaloneDir,
    stdio: "inherit",
    env: process.env,
  });
} else {
  console.warn(
    "[start] Standalone server missing — falling back to next start",
  );
  child = spawn(
    "npx",
    ["next", "start", "-H", "0.0.0.0", "-p", port],
    { stdio: "inherit", env: process.env },
  );
}

child.on("exit", (code, signal) => {
  console.error(`[start] Next.js exited code=${code} signal=${signal}`);
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

child.on("error", (err) => {
  console.error("[start] failed to spawn Next.js", err);
  process.exit(1);
});

for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => child.kill(sig));
}
