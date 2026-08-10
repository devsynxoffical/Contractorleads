import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findAccessibleLead } from "@/lib/lead-ownership";
import { resolveMetaAccessTokenForUser } from "@/lib/facebook-oauth";
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
  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const accessToken = await resolveMetaAccessTokenForUser(user.id);
    const result = await searchFacebookAdsLibrary(
      lead.businessName,
      lead.country ?? "US",
      { accessToken },
    );

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        facebookAdsData: result.ads.length
          ? JSON.stringify(result)
          : null,
        facebookAdsCheckedAt: new Date(),
      },
    });

    return NextResponse.json({ lead: updated, result });
  } catch (e) {
    console.error("[facebook-ads]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Could not check Meta Ads Library. Please try again.",
      },
      { status: 500 },
    );
  }
}
