import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildLinkedInCompanySearchUrl,
  findLinkedInCompanyUrl,
  normalizeLinkedInCompanyUrl,
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

  const MIN_CONFIDENCE = 85;
  const normalized =
    result.url && result.confidence >= MIN_CONFIDENCE
      ? normalizeLinkedInCompanyUrl(result.url) ?? result.url
      : null;
  const companyUrl = normalized ?? lead.linkedinCompanyUrl;

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
    serper: "Found via Google search (Serper)",
  };

  const missingKey =
    !process.env.SERPER_API_KEY && !result.url
      ? "Add SERPER_API_KEY for stronger LinkedIn discovery. Website scrape did not find a page."
      : null;

  return NextResponse.json({
    lead: updated,
    linkedin: {
      url: companyUrl ?? result.url,
      confidence: result.confidence,
      source: result.source,
      sourceLabel: result.source ? sourceLabel[result.source] : null,
      verified: Boolean(normalized),
      searchUrl: buildLinkedInCompanySearchUrl(lead.businessName),
      message: missingKey,
    },
  });
}
