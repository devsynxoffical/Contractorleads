import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { buildQualificationBreakdown } from "@/lib/services/qualification-breakdown";
import { auditWebsite } from "@/lib/services/website-audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const audit = lead.website?.trim()
    ? await auditWebsite(lead.website)
    : null;

  const breakdown = buildQualificationBreakdown(
    {
      website: lead.website,
      googleRating: lead.googleRating,
      reviewCount: lead.reviewCount,
      websiteQualityScore: lead.websiteQualityScore,
      seoOpportunityScore: lead.seoOpportunityScore,
      marketingOpportunityScore: lead.marketingOpportunityScore,
      ppcOpportunityScore: lead.ppcOpportunityScore,
    },
    audit,
  );

  return NextResponse.json(breakdown);
}
