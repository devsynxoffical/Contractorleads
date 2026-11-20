#!/usr/bin/env node
/**
 * Notify Google's Indexing API that URLs were updated (URL_UPDATED).
 *
 * WARNING: Google documents this API only for pages with JobPosting or BroadcastEvent
 * (livestream) markup. For other pages Google may ignore the notification or revoke access.
 * It does not guarantee indexing. Run it only if you accept that.
 *
 * Setup (once):
 *  1. Google Cloud Console: create a project, enable "Web Search Indexing API".
 *  2. IAM -> Service accounts -> create one -> Keys -> Add key -> JSON. Keep the file private.
 *  3. Search Console (https://www.contractorleads.us/) -> Settings -> Users and permissions ->
 *     add the service account email as an OWNER.
 *
 * Run (on your own computer; the key never leaves it):
 *   node scripts/google-indexing-api.mjs /path/to/service-account.json            # default URLs
 *   node scripts/google-indexing-api.mjs /path/to/service-account.json urls.txt   # one URL per line
 *
 * Quota: 200 publish requests per day per project (default).
 */
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const DEFAULT_URLS = [
  "/contractor-list",
  "/pricing",
  "/contractor-email-finder",
  "/contractor-email-list",
  "/businesses-without-websites",
  "/local-business-email-list",
  "/locations",
  "/google-maps-scraper",
  "/apollo-alternative",
  "/faq",
  "/tools",
  "/tools/contractor-lead-cost-calculator",
  "/tools/email-deliverability-checker",
  "/tools/cold-email-subject-line-tester",
  "/contractor-lead-generation-software",
  "/industries/solar",
  "/industries/roofing/texas",
  "/industries/hvac/florida",
  "/blog/best-email-finder-for-local-businesses",
  "/blog/local-lead-generation-business",
  "/email-lists/roofing",
  "/email-lists/hvac",
].map((p) => `https://www.contractorleads.us${p}`);

const [keyPath, listPath] = process.argv.slice(2);
if (!keyPath) {
  console.error("Usage: node scripts/google-indexing-api.mjs <service-account.json> [urls.txt]");
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, "utf8"));
const urls = listPath
  ? readFileSync(listPath, "utf8").split(/\r?\n/).map((s) => s.trim()).filter((s) => s.startsWith("http"))
  : DEFAULT_URLS;

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token request failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

const token = await accessToken();
let ok = 0;
for (const url of urls) {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) ok++;
  console.log(`${res.ok ? "OK  " : "FAIL"} ${res.status} ${url}${res.ok ? "" : ` ${data?.error?.message ?? ""}`}`);
}
console.log(`\nDone: ${ok}/${urls.length} accepted. "Accepted" means Google received the notice, not that the page is indexed.`);
