export const LEAD_REPORT_TYPES = [
  "website",
  "seo",
  "marketing",
  "ads",
  "local",
] as const;

export type LeadReportType = (typeof LEAD_REPORT_TYPES)[number];

export const LEAD_REPORT_SCRIPT_TYPE = "lead_intelligence_report";

export const LEAD_REPORT_TYPE_META: Record<
  LeadReportType,
  { label: string; description: string }
> = {
  website: {
    label: "Website audit",
    description:
      "Speed, hero, content, contact page, and key site pages — justifies the website score",
  },
  seo: {
    label: "SEO report",
    description:
      "On-page SEO, technical readiness, and ranking opportunity from the live crawl",
  },
  marketing: {
    label: "Instagram & social",
    description:
      "Instagram / social presence, content proof, and demand-gen gaps",
  },
  ads: {
    label: "Google Ads / PPC",
    description:
      "Paid search readiness, landing page conversion, and Local Services Ads angles",
  },
  local: {
    label: "Local presence",
    description: "Google Business Profile, reviews, and local SEO",
  },
};

export function isLeadReportType(value: unknown): value is LeadReportType {
  return (
    typeof value === "string" &&
    (LEAD_REPORT_TYPES as readonly string[]).includes(value)
  );
}
