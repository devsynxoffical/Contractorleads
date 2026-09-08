/**
 * Vercel build script — runs in place of the default `npm run build`.
 *
 * Steps:
 *  1. prisma db push   — sync schema to the live database
 *  2. prisma generate  — regenerate the Prisma client
 *  3. next build       — compile the Next.js app
 *
 * Set this as the Vercel Build Command:
 *   node scripts/vercel-build.mjs
 */
import { spawnSync } from "child_process";

function run(cmd, args) {
  console.log(`\n▶ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (result.error) {
    console.error(`Error running ${cmd}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${cmd} exited with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

// 1. Sync schema — safe to re-run, only applies new migrations
if (!process.env.DATABASE_URL) {
  console.error(
    "❌  DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables."
  );
  process.exit(1);
}

console.log("🔄  Syncing Prisma schema...");
run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);

// 2. Generate Prisma client
console.log("⚙️   Generating Prisma client...");
run("npx", ["prisma", "generate"]);

// 3. Build Next.js
console.log("🏗️   Building Next.js...");
run("npx", ["next", "build"]);

console.log("\n✅  Vercel build complete.");
