#!/usr/bin/env node
/**
 * SEO / AEO / GEO baseline audit (Phase 0 of docs/seo prompt). Read-only: it only fetches pages.
 *
 *   NODE_USE_ENV_PROXY=1 node scripts/seo-audit.mjs                 # live site
 *   BASE=http://localhost:3100 node scripts/seo-audit.mjs           # local production build
 *   OUT=audit/after node scripts/seo-audit.mjs                       # write to another folder
 *
 * Per URL (sitemap + nav/footer links): status, redirect chain, response time, title and
 * length, meta description and length, canonical, robots meta, X-Robots-Tag, H1 count, H2s,
 * server-rendered main-content word count, JSON-LD @types and parse errors, images and
 * images without alt, internal links in/out, OG/Twitter tags, hreflang, lang.
 * Site level: robots.txt, sitemaps, llms.txt, llms-full.txt, bot user-agent parity on the
 * top 20 URLs, near-duplicate pairs per sitemap section (5-word shingles, Jaccard > 0.35),
 * orphans, pages under 600 words of main content.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = (process.env.BASE || "https://www.contractorleads.us").replace(/\/$/, "");
const OUT = process.env.OUT || "audit/baseline";
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const BOTS = {
  Googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  "OAI-SearchBot": "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
  "ChatGPT-User": "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)",
  ClaudeBot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "Claude-User": "Mozilla/5.0 (compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  "Perplexity-User": "Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)",
  "Google-Extended": "Mozilla/5.0 (compatible; Google-Extended)",
  "Applebot-Extended": "Mozilla/5.0 (compatible; Applebot-Extended/0.1; +http://www.apple.com/go/applebot)",
  CCBot: "CCBot/2.0 (https://commoncrawl.org/faq/)",
};

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, " ");
const strip = (h) => decode(h.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`, "i")) || [])[1];

async function get(url, ua = CHROME_UA, follow = true) {
  const chain = [];
  let current = url;
  const t0 = Date.now();
  for (let hop = 0; hop < 10; hop++) {
    let res;
    try {
      res = await fetch(current, { redirect: "manual", headers: { "user-agent": ua }, signal: AbortSignal.timeout(30000) });
    } catch (e) {
      return { url, status: 0, error: String(e?.cause?.code || e?.message || e), chain, ms: Date.now() - t0 };
    }
    if (follow && res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      chain.push(`${res.status} ${current}`);
      current = new URL(res.headers.get("location"), current).toString();
      continue;
    }
    const body = res.headers.get("content-type")?.includes("text") || res.headers.get("content-type")?.includes("xml") ? await res.text() : "";
    return { url, finalUrl: current, status: res.status, chain, ms: Date.now() - t0, headers: res.headers, body };
  }
  return { url, status: 0, error: "too many redirects", chain, ms: Date.now() - t0 };
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

function mainText(html) {
  const m = html.match(/<main[\s\S]*?<\/main>/i);
  let b = m ? m[0] : (html.match(/<body[\s\S]*<\/body>/i) || [html])[0];
  b = b.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, " ");
  return strip(b);
}

function analyze(r) {
  const h = r.body || "";
  const head = (h.match(/<head[\s\S]*?<\/head>/i) || [""])[0];
  const metas = head.match(/<meta[^>]+>/gi) || [];
  const meta = (key) => {
    const t = metas.find((m) => new RegExp(`(name|property)="${key}"`, "i").test(m));
    return t ? decode(attr(t, "content") || "") : "";
  };
  const title = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
  const canonical = attr((head.match(/<link[^>]+rel="canonical"[^>]*>/i) || [""])[0], "href") || "";
  const hreflang = (head.match(/<link[^>]+hreflang="[^"]+"[^>]*>/gi) || []).map((t) => attr(t, "hreflang"));
  const ldTypes = [];
  const ldErrors = [];
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const d = JSON.parse(m[1]);
      const walk = (x) => {
        if (Array.isArray(x)) return x.forEach(walk);
        if (x && typeof x === "object") {
          if (x["@type"]) ldTypes.push(...[].concat(x["@type"]));
          if (x["@graph"]) walk(x["@graph"]);
        }
      };
      walk(d);
    } catch (e) {
      ldErrors.push(String(e.message).slice(0, 80));
    }
  }
  const imgs = h.replace(/<noscript[\s\S]*?<\/noscript>/gi, "").match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter((t) => !/\balt=/i.test(t));
  const links = [...h.matchAll(/<a\b[^>]*href="([^"#?]*)[^"]*"/gi)].map((m) => m[1]).filter((u) => u.startsWith("/") || u.startsWith(BASE));
  const internal = [...new Set(links.map((u) => (u.startsWith("/") ? u : u.slice(BASE.length) || "/").replace(/\/$/, "") || "/"))];
  const text = mainText(h);
  return {
    url: r.url,
    status: r.status,
    redirects: r.chain.join(" > "),
    ms: r.ms,
    title,
    titleLen: title.length,
    description: meta("description"),
    descriptionLen: meta("description").length,
    canonical,
    robotsMeta: meta("robots"),
    xRobotsTag: r.headers?.get?.("x-robots-tag") || "",
    h1Count: (h.match(/<h1\b/gi) || []).length,
    h2: (h.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi) || []).map(strip).slice(0, 20),
    words: text.split(/\s+/).filter(Boolean).length,
    jsonLdTypes: [...new Set(ldTypes)],
    jsonLdErrors: ldErrors,
    images: imgs.length,
    imagesWithoutAlt: noAlt.length,
    internalOut: internal,
    ogTitle: meta("og:title"),
    ogImage: meta("og:image"),
    twitterCard: meta("twitter:card"),
    hreflang,
    lang: (h.match(/<html[^>]*\blang="([^"]*)"/i) || [])[1] || "",
    _text: text,
  };
}

function shingles(text, k = 5) {
  const w = text.toLowerCase().match(/[a-z0-9']+/g) || [];
  const s = new Set();
  for (let i = 0; i + k <= w.length; i++) s.add(w.slice(i, i + k).join(" "));
  return s;
}
function jaccard(a, b) {
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const x of small) if (big.has(x)) inter++;
  return inter / Math.max(1, a.size + b.size - inter);
}

async function main() {
  // Site files
  const site = {};
  for (const f of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt"]) {
    const r = await get(BASE + f);
    site[f] = { status: r.status, bytes: (r.body || "").length, sample: (r.body || "").slice(0, 300) };
  }
  // Sitemaps
  const index = (await get(BASE + "/sitemap.xml")).body || "";
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const sections = {};
  const sitemapUrls = [];
  for (const c of children) {
    const name = c.replace(/.*\/sitemap-?/, "").replace(/\.xml$/, "") || "index";
    const body = (await get(c.replace(/^https?:\/\/[^/]+/, BASE))).body || "";
    const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, BASE));
    sections[name] = urls;
    sitemapUrls.push(...urls);
    site[`sitemap:${name}`] = { urls: urls.length };
  }
  // Nav / footer links from the home page
  const home = (await get(BASE + "/")).body || "";
  const navFooter = [...(home.match(/<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi) || []).join(" ").matchAll(/href="(\/[^"#?]*)"/g)].map((m) => BASE + m[1]);
  const all = [...new Set([...sitemapUrls, ...navFooter].map((u) => u.replace(/\/$/, "") || BASE))];

  console.error(`Auditing ${all.length} URLs on ${BASE} ...`);
  const pages = (await pool(all, async (u) => analyze(await get(u)))).filter(Boolean);

  // Inbound internal links
  const inbound = {};
  for (const p of pages) for (const l of p.internalOut) inbound[l] = (inbound[l] || 0) + 1;
  const pathOf = (u) => u.replace(BASE, "").replace(/\/$/, "") || "/";
  for (const p of pages) p.internalIn = inbound[pathOf(p.url)] || 0;

  // Near-duplicates per sitemap section (indexable 200 pages only)
  const byUrl = Object.fromEntries(pages.map((p) => [p.url, p]));
  const dupes = {};
  for (const [name, urls] of Object.entries(sections)) {
    const ps = urls.map((u) => byUrl[u.replace(/\/$/, "")] || byUrl[u]).filter((p) => p && p.status === 200 && !/noindex/i.test(p.robotsMeta));
    const sh = ps.map((p) => shingles(p._text));
    const pairs = [];
    let sum = 0;
    let n = 0;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const s = jaccard(sh[i], sh[j]);
        sum += s;
        n++;
        if (s > 0.35) pairs.push([pathOf(ps[i].url), pathOf(ps[j].url), Number(s.toFixed(2))]);
      }
    dupes[name] = { pages: ps.length, avg: n ? Number((sum / n).toFixed(3)) : 0, pairsOver035: pairs.length, top: pairs.sort((a, b) => b[2] - a[2]).slice(0, 10) };
  }

  // Bot parity on the 20 most-linked indexable URLs
  const top = [...pages].filter((p) => p.status === 200 && !/noindex/i.test(p.robotsMeta)).sort((a, b) => b.internalIn - a.internalIn).slice(0, 20);
  const bots = {};
  for (const [name, ua] of Object.entries(BOTS)) {
    const res = await pool(top, async (p) => {
      const r = await get(p.url, ua);
      const words = r.body ? mainText(r.body).split(/\s+/).filter(Boolean).length : 0;
      return { url: pathOf(p.url), status: r.status, words, sameAsChrome: Math.abs(words - p.words) <= Math.max(20, p.words * 0.05) };
    });
    bots[name] = { ok: res.filter((x) => x.status === 200 && x.sameAsChrome).length, total: res.length, problems: res.filter((x) => x.status !== 200 || !x.sameAsChrome) };
  }

  // Problems
  const titleCount = {};
  const descCount = {};
  for (const p of pages) if (p.status === 200 && !/noindex/i.test(p.robotsMeta)) {
    titleCount[p.title] = (titleCount[p.title] || 0) + 1;
    descCount[p.description] = (descCount[p.description] || 0) + 1;
  }
  const indexable = (p) => p.status === 200 && !/noindex/i.test(p.robotsMeta);
  const sitemapSet = new Set(sitemapUrls.map((u) => u.replace(/\/$/, "")));
  const summary = {
    base: BASE,
    date: new Date().toISOString(),
    urls: pages.length,
    indexable: pages.filter(indexable).length,
    non200: pages.filter((p) => p.status !== 200).map((p) => [pathOf(p.url), p.status]),
    redirectChains: pages.filter((p) => p.redirects).map((p) => [pathOf(p.url), p.redirects]),
    avgMs: Math.round(pages.reduce((a, p) => a + p.ms, 0) / pages.length),
    titleOutOfRange: pages.filter((p) => indexable(p) && (p.titleLen < 30 || p.titleLen > 60)).map((p) => [pathOf(p.url), p.titleLen]),
    descriptionOutOfRange: pages.filter((p) => indexable(p) && (p.descriptionLen < 120 || p.descriptionLen > 158)).map((p) => [pathOf(p.url), p.descriptionLen]),
    duplicateTitles: Object.entries(titleCount).filter(([, n]) => n > 1),
    duplicateDescriptions: Object.entries(descCount).filter(([, n]) => n > 1).map(([d, n]) => [d.slice(0, 80), n]),
    h1NotOne: pages.filter((p) => indexable(p) && p.h1Count !== 1).map((p) => [pathOf(p.url), p.h1Count]),
    canonicalMismatch: pages.filter((p) => indexable(p) && p.canonical && p.canonical.replace(/\/$/, "") !== p.url.replace(BASE, "https://www.contractorleads.us").replace(/\/$/, "")).map((p) => [pathOf(p.url), p.canonical]),
    jsonLdErrors: pages.filter((p) => p.jsonLdErrors.length).map((p) => [pathOf(p.url), p.jsonLdErrors]),
    noJsonLd: pages.filter((p) => indexable(p) && !p.jsonLdTypes.length).map((p) => pathOf(p.url)),
    imagesWithoutAlt: pages.filter((p) => p.imagesWithoutAlt).map((p) => [pathOf(p.url), p.imagesWithoutAlt]),
    missingOg: pages.filter((p) => indexable(p) && (!p.ogTitle || !p.ogImage)).map((p) => pathOf(p.url)),
    under600Words: pages.filter((p) => indexable(p) && p.words < 600).map((p) => [pathOf(p.url), p.words]),
    orphans: pages.filter((p) => sitemapSet.has(p.url) && p.internalIn === 0).map((p) => pathOf(p.url)),
    nearDuplicates: dupes,
    bots,
    site,
  };

  mkdirSync(OUT.replace(/\/[^/]*$/, "") || ".", { recursive: true });
  writeFileSync(`${OUT}.json`, JSON.stringify({ summary, pages: pages.map(({ _text, internalOut, ...p }) => ({ ...p, internalOut: internalOut.length })) }, null, 1));
  const cols = ["url", "status", "redirects", "ms", "titleLen", "title", "descriptionLen", "canonical", "robotsMeta", "h1Count", "words", "jsonLdTypes", "jsonLdErrors", "images", "imagesWithoutAlt", "internalIn", "ogImage", "twitterCard", "lang"];
  const csv = [cols.join(",")].concat(
    pages.map((p) => cols.map((c) => `"${String(Array.isArray(p[c]) ? p[c].join(" ") : p[c] ?? "").replace(/"/g, '""')}"`).join(",")),
  );
  writeFileSync(`${OUT}.csv`, csv.join("\n"));
  console.log(JSON.stringify({ ...summary, nearDuplicates: Object.fromEntries(Object.entries(dupes).map(([k, v]) => [k, { pages: v.pages, avg: v.avg, pairsOver035: v.pairsOver035 }])), bots: Object.fromEntries(Object.entries(bots).map(([k, v]) => [k, `${v.ok}/${v.total}`])) }, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
