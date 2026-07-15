import ExcelJS from "exceljs";

export type ExportLead = {
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  address: string | null;
  googleMapsLink: string | null;
  yearsInBusiness: number | null;
  leadScore: number;
  serviceCategory: string | null;
  revenueRangeEstimate: string | null;
  websiteQualityScore: number | null;
  marketingOpportunityScore: number | null;
  ppcOpportunityScore: number | null;
  seoOpportunityScore: number | null;
  outreachAngle: string | null;
  facebook: string | null;
  instagram: string | null;
  yelpUrl: string | null;
  yelpRating: number | null;
  yelpReviews: number | null;
  nextdoor: string | null;
  houzzUrl: string | null;
  houzzRating: number | null;
  houzzReviews: number | null;
  linkedinUrl: string | null;
  youtube: string | null;
  qualityTier: string | null;
};

const HEADERS = [
  "Business Name",
  "Owner Name",
  "Phone",
  "Email",
  "Website",
  "Google Rating",
  "Review Count",
  "Address",
  "Google Maps Link",
  "Years in Business",
  "Lead Score",
  "Service Category",
  "Revenue Range",
  "Website Quality",
  "Marketing Opportunity",
  "PPC Opportunity",
  "SEO Opportunity",
  "Outreach Angle",
  "Facebook",
  "Instagram",
  "Yelp URL",
  "Yelp Rating",
  "Yelp Reviews",
  "Nextdoor",
  "Houzz URL",
  "Houzz Rating",
  "Houzz Reviews",
  "LinkedIn",
  "YouTube",
  "Quality Tier",
];

function rowFromLead(lead: ExportLead) {
  const linkedin =
    lead.linkedinUrl && lead.linkedinUrl.length > 0 ? lead.linkedinUrl : "";

  return [
    lead.businessName,
    lead.ownerName ?? "",
    lead.phone ?? "",
    lead.email ?? "",
    lead.website ?? "",
    lead.googleRating ?? "",
    lead.reviewCount ?? "",
    lead.address ?? "",
    lead.googleMapsLink ?? "",
    lead.yearsInBusiness ?? "",
    lead.leadScore,
    lead.serviceCategory ?? "",
    lead.revenueRangeEstimate ?? "",
    lead.websiteQualityScore ?? "",
    lead.marketingOpportunityScore ?? "",
    lead.ppcOpportunityScore ?? "",
    lead.seoOpportunityScore ?? "",
    lead.outreachAngle ?? "",
    lead.facebook ?? "",
    lead.instagram ?? "",
    lead.yelpUrl ?? "",
    lead.yelpRating ?? "",
    lead.yelpReviews ?? "",
    lead.nextdoor ?? "",
    lead.houzzUrl ?? "",
    lead.houzzRating ?? "",
    lead.houzzReviews ?? "",
    linkedin,
    lead.youtube ?? "",
    lead.qualityTier ?? "",
  ];
}

export function leadsToCsv(leads: ExportLead[]): string {
  const escape = (val: string | number) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [HEADERS, ...leads.map(rowFromLead)];
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

export async function leadsToExcel(leads: ExportLead[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Leads");

  sheet.addRow(HEADERS);
  leads.forEach((lead) => sheet.addRow(rowFromLead(lead)));

  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((col) => {
    col.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
