import { extractWebsitePeople } from "@/lib/services/website-people";

const sites = [
  "https://www.bayareaexteriors.com",
  "https://www.joshuaroofing.com",
  "https://www.windsorrestoration.com",
  "https://www.colonynorthroofing.com",
];

async function main() {
  for (const url of sites) {
    console.log("=== SITE:", url, "===");
    try {
      const r = await extractWebsitePeople(url, { budgetMs: 15000 });
      console.log("pages:", r.pagesChecked.length);
      console.log("owner:", r.owner ? `${r.owner.name} — ${r.owner.role} (${r.owner.confidence}%)` : "(none)");
      console.log("team:");
      r.team.forEach((m) => console.log(`  ${m.confidence}% ${m.name} — ${m.role}`));
    } catch (e) {
      console.log("ERROR:", e instanceof Error ? e.message : String(e));
    }
    console.log();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
