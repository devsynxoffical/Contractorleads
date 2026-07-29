/**
 * One-off sample PDF so you can preview report formatting + agency branding.
 * Run: npx tsx scripts/generate-sample-lead-report-pdf.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { buildFallbackSampleContent } from "../src/lib/services/lead-report-sample";
import { buildLeadReportPdf } from "../src/lib/services/lead-report-pdf";

async function main() {
  const businessName = "Summit Peak Roofing LLC";
  const title = "Full intelligence — Summit Peak Roofing LLC";
  const content = buildFallbackSampleContent();

  const pdf = await buildLeadReportPdf({
    title,
    businessName,
    content,
    generatedAt: new Date(),
    agencyName: "Northstar Digital Agency",
    subtitle: "Sample report — SEO, ads, marketing & local opportunity",
    branding: {
      companyName: "Northstar Digital Agency",
      companyWebsite: "https://northstardigital.example",
      companyTagline: "Contractor growth reports",
      companyAddress: "Austin, TX",
      reportAccentColor: "#3D1078",
      companyLogoData: null,
      ownerName: "Alex Rivera",
      ownerEmail: "alex@northstardigital.example",
      ownerPhone: "(512) 555-0142",
      name: "Alex Rivera",
      email: "alex@northstardigital.example",
    },
  });

  const outDir = join(process.cwd(), "samples");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "lead-intelligence-report-sample.pdf");
  writeFileSync(outPath, pdf);
  // Count page objects more reliably via PDFKit wasn't available; use Kids array length heuristic
  const latin = pdf.toString("latin1");
  const kids = latin.match(/\/Kids\s*\[([^\]]+)\]/);
  const kidCount = kids
    ? (kids[1].match(/\d+\s+\d+\s+R/g) || []).length
    : (latin.match(/\/Type\s*\/Page\b/g) || []).length;
  console.log(`Wrote ${outPath} (${pdf.length} bytes, pages≈${kidCount})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
