import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "fs";
import { join } from "path";

const ROOT = process.cwd();
const OUT = join(ROOT, "cpanel-upload");

const SKIP = new Set([
  "node_modules",
  ".next",
  ".git",
  "cpanel-public_html",
  "cpanel-upload",
  "dev.db",
  "prisma/dev.db",
]);

function shouldSkip(name) {
  if (SKIP.has(name)) return true;
  if (name.endsWith(".tar") || name.endsWith(".tar.gz") || name.endsWith(".zip"))
    return true;
  if (name === ".env") return true; // never ship secrets
  return false;
}

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (shouldSkip(entry)) continue;
    const from = join(src, entry);
    const to = join(dest, entry);
    const st = statSync(from);
    if (st.isDirectory()) {
      if (entry === "prisma") {
        // copy prisma but skip local sqlite dbs
        mkdirSync(to, { recursive: true });
        for (const p of readdirSync(from)) {
          if (p.endsWith(".db") || p.endsWith(".db-journal")) continue;
          const pf = join(from, p);
          const pt = join(to, p);
          if (statSync(pf).isDirectory()) copyTree(pf, pt);
          else cpSync(pf, pt);
        }
      } else {
        copyTree(from, to);
      }
    } else {
      cpSync(from, to);
    }
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
copyTree(ROOT, OUT);

writeFileSync(
  join(OUT, ".env.example"),
  `NODE_ENV=production
PORT=3000
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="CHANGE-ME-to-a-long-random-string"
NEXT_PUBLIC_APP_URL="https://YOUR-DOMAIN.com"

OPENAI_API_KEY=
GOOGLE_PLACES_API_KEY=
YELP_FUSION_API_KEY=
NINJAPEAR_API_KEY=
SERPER_API_KEY=
`
);

writeFileSync(
  join(OUT, "START-HERE.txt"),
  `Contractor Leads — Fix 404 on cPanel (IMPORTANT)
================================================

Why you got 404:
- Plain public_html hosting looks for index.html.
- This app needs cPanel "Setup Node.js App".
- Builds made on Windows will not run on Linux cPanel.
  You must npm install + npm run build ON the server.

STEP-BY-STEP
------------
1) cPanel → Setup Node.js App → CREATE
   - Node.js version: 20 (or 18+)
   - Application root: public_html   (or a folder under it)
   - Application URL: your domain
   - Application startup file: app.js
   - Click CREATE

2) Upload contractor-leads-cpanel.tar.gz into that Application root.

3) File Manager → Extract the archive INTO the application root
   (files like package.json, app.js, src/ must be directly in the root,
    NOT inside a nested folder)

4) In Node.js App → open Terminal / SSH, cd to application root, run:

   npm install
   cp .env.example .env
   # edit .env — set JWT_SECRET and NEXT_PUBLIC_APP_URL

   npx prisma generate
   npx prisma db push
   npm run build

5) Node.js App → ensure startup file is: app.js
   Add environment variables (same as .env).
   Click RESTART.

6) Visit https://your-domain.com

If still 404:
- Confirm Application root is where package.json lives
- Confirm startup file is exactly: app.js
- Check Node.js App "Error log" / stderr
- Make sure npm run build finished without errors
`
);

console.log(`\nSource package ready → ${OUT}`);
console.log("Next: create contractor-leads-cpanel.tar.gz from this folder\n");
