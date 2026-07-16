import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchFacebookAdsLibrary } from "@/lib/services/facebook";

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

  const adsResult = await searchFacebookAdsLibrary(lead.businessName);

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      facebookAdsData: JSON.stringify(adsResult),
      facebookAdsCheckedAt: new Date(),
    },
  });

  return NextResponse.json({
    lead: updated,
    ads: adsResult,
  });
}
