import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchFacebookAdsLibrary } from "@/lib/services/facebook";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { resolveMetaAccessTokenForUser } from "@/lib/facebook-oauth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const accessToken = await resolveMetaAccessTokenForUser(user.id);
  const adsResult = await searchFacebookAdsLibrary(lead.businessName, "US", {
    accessToken,
  });

  try {
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
  } catch (err) {
    console.error("[facebook-ads]", err);
    return NextResponse.json(
      { error: "Could not save ads result", ads: adsResult },
      { status: 500 },
    );
  }
}
