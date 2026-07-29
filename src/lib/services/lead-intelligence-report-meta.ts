export const LEAD_REPORT_TYPES = [
  "full",
  "website",
  "seo",
  "marketing",
  "ads",
] as const;

export type LeadReportType = (typeof LEAD_REPORT_TYPES)[number];

export const LEAD_REPORT_SCRIPT_TYPE = "lead_intelligence_report";

export const LEAD_REPORT_TYPE_META: Record<
  LeadReportType,
  { label: string; description: string; serviceName: string }
> = {
  full: {
    label: "All-services pitch",
    description:
      "Full growth proposal across website, SEO, social, and ads in one document",
    serviceName: "Full digital growth (website, SEO, social & ads)",
  },
  website: {
    label: "Website growth proposal",
    description:
      "Client-ready pitch: site problems found, impact on quotes, and how we fix them",
    serviceName: "Website design & conversion",
  },
  seo: {
    label: "SEO growth proposal",
    description:
      "Client-ready pitch: SEO gaps on their site and our local ranking plan",
    serviceName: "Local SEO",
  },
  marketing: {
    label: "Instagram & social proposal",
    description:
      "Client-ready pitch: social gaps and how we grow booked jobs from Instagram",
    serviceName: "Instagram & social media",
  },
  ads: {
    label: "Google Ads proposal",
    description:
      "Client-ready pitch: paid search readiness and our ads launch plan",
    serviceName: "Google Ads & Local Services Ads",
  },
};

export function isLeadReportType(value: unknown): value is LeadReportType {
  return (
    typeof value === "string" &&
    (LEAD_REPORT_TYPES as readonly string[]).includes(value)
  );
}
