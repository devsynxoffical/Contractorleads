import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getOpenAIApiKey } from "@/lib/openai-config";
import { auditWebsite } from "@/lib/services/website-audit";

export const SEO_REPORT_ADDON_NAME = "AI Website + SEO Report";
export const SEO_REPORT_ADDON_PRICE_USD = 15;

export function normalizeWebsiteInput(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname || !url.hostname.includes(".")) return null;
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function generateSeoAnalysisReport(website: string) {
  const audit = await auditWebsite(website);
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    return buildFallbackReport(website, audit);
  }

  const openai = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a senior local SEO and website CRO consultant. Return concise, specific, action-focused advice.",
    prompt: [
      `Analyze this contractor website and generate a practical audit report.`,
      `Website: ${website}`,
      `Live audit signals: ${JSON.stringify(audit)}`,
      "",
      "Output format:",
      "1) Executive summary (2-3 sentences)",
      "2) SEO scorecard (strengths + issues)",
      "3) Top 8 fixes (highest ROI first)",
      "4) 30-day implementation sprint (week-by-week)",
      "5) Suggested outreach pitch an agency can send",
      "",
      "Keep it under 600 words and avoid fluff.",
    ].join("\n"),
  });

  return text.trim() || buildFallbackReport(website, audit);
}

function buildFallbackReport(
  website: string,
  audit: Awaited<ReturnType<typeof auditWebsite>>,
) {
  return [
    `AI Website + SEO Report`,
    `Website: ${website}`,
    "",
    "Executive summary",
    `This site scored ${audit.websiteQualityScore}/100 for website quality with an SEO opportunity score of ${audit.seoOpportunityScore}/100. The highest upside is improving technical SEO basics and conversion-focused page content.`,
    "",
    "SEO scorecard",
    `- HTTPS: ${audit.https ? "Yes" : "No"}`,
    `- Title tag: ${audit.title ? "Present" : "Missing"}`,
    `- Meta description: ${audit.metaDescription ? "Present" : "Missing"}`,
    `- LocalBusiness schema: ${audit.hasLocalBusinessSchema ? "Present" : "Missing"}`,
    `- H1 count: ${audit.h1Count}`,
    `- Content depth (word count): ${audit.wordCount}`,
    `- Images missing alt text: ${audit.imagesMissingAlt}/${audit.imageCount}`,
    "",
    "Top fixes",
    "1) Ensure unique title tags and meta descriptions for home + service pages.",
    "2) Add LocalBusiness schema and service-area schema blocks.",
    "3) Improve homepage/service copy to exceed 300+ words per key page.",
    "4) Fix heading hierarchy (single clear H1 per page).",
    "5) Add stronger quote form CTAs above the fold.",
    "6) Add internal links between service + location pages.",
    "7) Add alt text on all key service imagery.",
    "8) Publish weekly local trust content (projects, FAQs, reviews).",
    "",
    "30-day sprint",
    "Week 1: Technical cleanup (HTTPS/canonical/meta/schema).",
    "Week 2: Rewrite homepage + top service pages for local intent.",
    "Week 3: Build/optimize location pages and conversion sections.",
    "Week 4: Launch content + track leads from organic and branded search.",
    "",
    "Suggested outreach pitch",
    audit.outreachAngle,
  ].join("\n");
}
