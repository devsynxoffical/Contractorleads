/**
 * Railway pre-deploy: sync Prisma schema + seed baseline config.
 * Runs BEFORE the new container starts serving traffic / healthchecks.
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Skipping schema sync.",
  );
  process.exit(0);
}

console.log("Pre-deploy: prisma db push...");
const prismaBin = existsSync("./node_modules/.bin/prisma")
  ? "./node_modules/.bin/prisma"
  : "npx";
const prismaArgs = prismaBin === "npx"
  ? ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]
  : ["db", "push", "--skip-generate", "--accept-data-loss"];

const push = spawnSync(prismaBin, prismaArgs, {
  stdio: "inherit",
  env: process.env,
  timeout: 120_000,
});

if (push.error) {
  console.warn("prisma db push warning:", push.error.message);
} else if (push.status !== 0) {
  console.warn("prisma db push status:", push.status);
}

console.log("Pre-deploy: seed baseline config...");
try {
  const seed = spawnSync("node", ["prisma/seed.mjs"], {
    stdio: "inherit",
    env: process.env,
    timeout: 60_000,
  });
  if (seed.error) {
    console.warn("seed warning:", seed.error.message);
  }
} catch (err) {
  console.warn("seed caught error:", err);
}

console.log("Pre-deploy complete.");

