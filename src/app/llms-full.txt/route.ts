import { readFileSync } from "node:fs";
import path from "node:path";
import { BLOG_POSTS } from "@/lib/blog-content";
import { MARKETING_FAQ, PRIORITY_TRADE_SLUGS, getTradeBySlug, lowerTradeLabel, seoBaseUrl, tradeCompaniesLabel } from "@/lib/seo";
import { getTradeHubContent } from "@/lib/trade-hub-content";
import { FREE_TOOLS } from "@/lib/tools";

/**
 * /llms-full.txt: clean Markdown of the site's most useful pages for AI assistants and answer
 * engines (llmstxt.org convention). Built from the same content the pages render, so it never
 * drifts from the site: brand facts from /llms.txt, the home FAQ, the priority trade hubs,
 * the free tools and every guide. Regenerated at each build.
 */
export const dynamic = "force-static";

const BASE = seoBaseUrl().replace(/\/$/, "");

/** Turn the site's [label](/path) links into absolute Markdown links. */
const abs = (text: string) => text.replace(/\]\((\/[^)]*)\)/g, (_, p: string) => `](${BASE}${p})`);

function table(t: { headers: string[]; rows: string[][] }): string {
  const cell = (c: string) => abs(c).replace(/\|/g, "/");
  return [
    `| ${t.headers.map(cell).join(" | ")} |`,
    `| ${t.headers.map(() => "---").join(" | ")} |`,
    ...t.rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");
}

function faqs(list: Array<{ q: string; a: string }>): string {
  return list.map((f) => `**${f.q}**\n${abs(f.a)}`).join("\n\n");
}

function brandFacts(): string {
  // The hand-written llms.txt summary is the single source for brand facts; keep its intro
  // and "Important facts" block, and point to this file for the full text.
  try {
    const llms = readFileSync(path.join(process.cwd(), "public", "llms.txt"), "utf8");
    const cut = llms.indexOf("\n## ");
    return (cut > 0 ? llms.slice(0, cut) : llms).trim();
  } catch {
    return "# Contractor Leads\n> B2B lead-finding software for agencies and sales teams that sell to home-service contractors.";
  }
}

export async function GET() {
  const parts: string[] = [];
  parts.push(brandFacts());
  parts.push(
    `This file is the full-text companion to ${BASE}/llms.txt: the home page FAQ, the main trade guides, the free tools and every article, as plain Markdown. Each section links to its page.`,
  );

  parts.push(`## Frequently asked questions (${BASE}/)\n\n${faqs(MARKETING_FAQ)}`);

  for (const slug of PRIORITY_TRADE_SLUGS) {
    const trade = getTradeBySlug(slug);
    const hub = getTradeHubContent(slug);
    if (!trade || !hub) continue;
    const companies = lowerTradeLabel(tradeCompaniesLabel(slug, trade.name));
    const s = [`## ${trade.name}: finding ${companies} to sell to (${BASE}/industries/${slug})`];
    s.push(`**${hub.quickAnswer.q}**\n${abs(hub.quickAnswer.a)}`);
    s.push(`What ${lowerTradeLabel(trade.name)} owners buy from agencies:\n${hub.buys.map((b) => `- ${abs(b)}`).join("\n")}`);
    s.push(`When they buy marketing: ${abs(hub.season)}`);
    if (hub.searchTerms?.length) s.push(`Searches these companies want to rank for: ${hub.searchTerms.join(", ")}.`);
    if (hub.mistakes?.length) s.push(`Mistakes agencies make when pitching them:\n${hub.mistakes.map((m) => `- ${abs(m)}`).join("\n")}`);
    s.push(faqs(hub.faqs));
    parts.push(s.join("\n\n"));
  }

  for (const tool of FREE_TOOLS) {
    const s = [`## ${tool.name} (free tool, ${BASE}/tools/${tool.slug})`, abs(tool.intro)];
    s.push(`How to use it:\n${tool.howTo.map((h, i) => `${i + 1}. ${abs(h)}`).join("\n")}`);
    for (const sec of tool.sections) {
      s.push(`### ${sec.heading}\n${abs(sec.body)}${sec.bullets?.length ? `\n${sec.bullets.map((b) => `- ${abs(b)}`).join("\n")}` : ""}`);
    }
    s.push(faqs(tool.faqs));
    parts.push(s.join("\n\n"));
  }

  for (const post of BLOG_POSTS) {
    const s = [`## ${post.title} (${BASE}/blog/${post.slug})`, `Updated ${post.updatedDate}. ${abs(post.directAnswer)}`];
    for (const sec of post.sections) {
      const block = [`${sec.level === 3 ? "####" : "###"} ${sec.heading}`, abs(sec.body)];
      if (sec.bullets?.length) block.push(sec.bullets.map((b) => `- ${abs(b)}`).join("\n"));
      if (sec.table) block.push(table(sec.table));
      if (sec.callout) block.push(`> **${sec.callout.title}:** ${abs(sec.callout.text)}`);
      s.push(block.join("\n\n"));
    }
    if (post.faqs.length) s.push(`### Frequently asked questions\n\n${faqs(post.faqs)}`);
    if (post.sources?.length) s.push(`Sources:\n${post.sources.map((x) => `- [${x.label}](${x.url})`).join("\n")}`);
    parts.push(s.join("\n\n"));
  }

  return new Response(parts.join("\n\n---\n\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
