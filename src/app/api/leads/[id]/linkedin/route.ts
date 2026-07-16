import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildLinkedInCompanySearchUrl,
  findLinkedInCompanyUrl,
} from "@/lib/services/linkedin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const location = [lead.city, lead.state, lead.zip].filter(Boolean).join(", ");
  const result = await findLinkedInCompanyUrl(
    lead.businessName,
    location,
    lead.industry ?? "Home services",
    lead.website
  );

  const companyUrl =
    result.confidence >= 95 ? result.url : lead.linkedinCompanyUrl;

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      linkedinCompanyUrl: companyUrl,
      linkedinUrl: companyUrl ?? lead.linkedinUrl,
      linkedinConfidenceScore: result.confidence || lead.linkedinConfidenceScore,
      linkedinType: companyUrl ? "company" : lead.linkedinType,
      socialEnrichedAt: new Date(),
    },
  });

  const sourceLabel: Record<string, string> = {
    website: "Found on company website",
    proxycurl_domain: "Matched via company domain (Proxycurl)",
    proxycurl_name: "Matched via company name (Proxycurl)",
    slug_match: "Matched via LinkedIn URL pattern",
  };

  return NextResponse.json({
    lead: updated,
    linkedin: {
      url: result.url,
      confidence: result.confidence,
      source: result.source,
      sourceLabel: result.source ? sourceLabel[result.source] : null,
      verified: result.confidence >= 95,
      searchUrl: buildLinkedInCompanySearchUrl(lead.businessName),
    },
  });
}
