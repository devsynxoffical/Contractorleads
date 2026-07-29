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
  const title = "All-services pitch - Summit Peak Roofing LLC";
  const content = buildFallbackSampleContent();

  const pdf = await buildLeadReportPdf({
    title,
    businessName,
    content,
    generatedAt: new Date(),
    agencyName: "Northstar Digital Agency",
    subtitle: "Website, SEO, social & paid ads growth plan",
    branding: {
      companyName: "Northstar Digital Agency",
      companyWebsite: "https://northstardigital.example",
      companyTagline: "Contractor growth proposals",
      companyAddress: "Austin, TX",
      reportAccentColor: "#6d28d9",
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

  const publicDir = join(process.cwd(), "public", "samples");
  mkdirSync(publicDir, { recursive: true });
  const publicPath = join(publicDir, "client-pitch-sample.pdf");
  writeFileSync(publicPath, pdf);
  // Count page objects more reliably via PDFKit wasn't available; use Kids array length heuristic
  const latin = pdf.toString("latin1");
  const kids = latin.match(/\/Kids\s*\[([^\]]+)\]/);
  const kidCount = kids
    ? (kids[1].match(/\d+\s+\d+\s+R/g) || []).length
    : (latin.match(/\/Type\s*\/Page\b/g) || []).length;
  console.log(`Wrote ${outPath} (${pdf.length} bytes, pages≈${kidCount})`);
  console.log(`Browser preview: ${publicPath}`);
  console.log(`Open: http://localhost:3001/samples/client-pitch-sample.pdf`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
