export const LEAD_REPORT_TYPES = [
  "full",
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
  full: {
    label: "Full intelligence",
    description: "Website, SEO, ads, marketing, local presence, and pitch",
  },
  seo: {
    label: "SEO & website",
    description: "Technical SEO, content, schema, and conversion gaps",
  },
  marketing: {
    label: "Marketing",
    description: "Brand, content, social, and demand-gen opportunity",
  },
  ads: {
    label: "Ads & PPC",
    description: "Paid search, local services ads, and creative angles",
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

