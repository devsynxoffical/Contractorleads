import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const OUT = join(ROOT, "cpanel-public_html");
const STANDALONE = join(ROOT, ".next", "standalone");

if (!existsSync(STANDALONE)) {
  console.error("Missing .next/standalone. Run `npm run build` first.");
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

cpSync(STANDALONE, OUT, { recursive: true });
cpSync(join(ROOT, "public"), join(OUT, "public"), { recursive: true });
mkdirSync(join(OUT, ".next"), { recursive: true });
cpSync(join(ROOT, ".next", "static"), join(OUT, ".next", "static"), {
  recursive: true,
});
cpSync(join(ROOT, "prisma"), join(OUT, "prisma"), { recursive: true });

// Never ship local secrets into the upload package
if (existsSync(join(OUT, ".env"))) {
  unlinkSync(join(OUT, ".env"));
}

// Prefer a production sqlite path relative to the deployed app
const envExample = `# Production env for cPanel Node.js app
# Application startup file: server.js
# Application URL: your domain (e.g. https://yourdomain.com)

DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="replace-with-a-long-random-string"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
PORT=3000

# Optional integrations
OPENAI_API_KEY=""
GOOGLE_PLACES_API_KEY=""
YELP_FUSION_API_KEY=""
LINKEDIN_DATA_API_KEY=""
`;

writeFileSync(join(OUT, ".env.example"), envExample);

const readme = `Contractor Leads — cPanel (public_html) deploy
==============================================

This folder is a Next.js STANDALONE build. It requires cPanel Node.js App
(not plain PHP static hosting).

1) Upload contents of this folder into:
      public_html
   OR a subdomain folder / Node app root.

2) In cPanel → Setup Node.js App:
   - Node.js version: 20+ (recommended)
   - Application root: public_html (or the folder you uploaded to)
   - Application URL: your domain / subdomain
   - Application startup file: server.js
   - Environment variables: copy from .env.example
     • DATABASE_URL=file:./prisma/prod.db
     • JWT_SECRET=<long random string>
     • NEXT_PUBLIC_APP_URL=https://yourdomain.com
     • PORT=<port cPanel assigns, if shown>

3) In the Node.js app terminal / SSH (from app root):
      npx prisma generate
      npx prisma db push
   (Install prisma as a dependency on the server if needed:
      npm install prisma@6 --save)

4) Start / Restart the Node.js application in cPanel.

5) Open your domain and test /login.

Notes
-----
• SQLite file will be created at prisma/prod.db — keep that path writable.
• For MySQL later, change prisma/schema.prisma provider and DATABASE_URL.
• Do NOT delete the .next or node_modules folders inside this build.
`;

writeFileSync(join(OUT, "CPANEL-README.txt"), readme);

// Ensure package.json in standalone has a clear start script
const pkgPath = join(OUT, "package.json");
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.scripts = {
    ...(pkg.scripts || {}),
    start: "NODE_ENV=production node server.js",
  };
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log(`\nPacked for cPanel → ${OUT}`);
console.log("Upload that folder’s contents to public_html, then follow CPANEL-README.txt\n");
