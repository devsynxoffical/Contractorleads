import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadOwnershipWhere } from "@/lib/lead-ownership";
import { getFacebookConnection } from "@/lib/facebook-oauth";
import {
  classifyAdPlacements,
  type FacebookAdsResult,
} from "@/lib/services/facebook";

function parseAds(raw: string | null): FacebookAdsResult | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FacebookAdsResult;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connection = await getFacebookConnection(user.id);

    const leads = await prisma.lead.findMany({
      where: {
        AND: [
          leadOwnershipWhere(user.id),
          {
            OR: [
              { facebook: { not: null } },
              { facebookAdsData: { not: null } },
              { facebookAdsCheckedAt: { not: null } },
            ],
          },
        ],
      },
      select: {
        id: true,
        businessName: true,
        city: true,
        state: true,
        industry: true,
        facebook: true,
        facebookAdsData: true,
        facebookAdsCheckedAt: true,
        leadScore: true,
        qualityTier: true,
      },
      orderBy: [{ facebookAdsCheckedAt: "desc" }, { createdAt: "desc" }],
      take: 80,
    });

    const items = leads
      .filter((lead) => {
        const hasPage = Boolean(lead.facebook?.trim());
        const hasAds = Boolean(lead.facebookAdsData || lead.facebookAdsCheckedAt);
        return hasPage || hasAds;
      })
      .map((lead) => {
        const ads = parseAds(lead.facebookAdsData);
        const rawAds = Array.isArray(ads?.ads) ? ads!.ads : [];
        const enrichedAds = rawAds.map((ad) => {
          const placements = classifyAdPlacements(ad?.publisherPlatforms);
          return {
            id: ad?.id ?? "",
            pageName: ad?.pageName ?? "Unknown",
            pageId: ad?.pageId ?? "",
            adSnapshotUrl: ad?.adSnapshotUrl ?? "",
            adCreativeBodies: Array.isArray(ad?.adCreativeBodies)
              ? ad.adCreativeBodies
              : [],
            adDeliveryStartTime: ad?.adDeliveryStartTime,
            publisherPlatforms: placements.labels,
            hasStory: placements.hasStory,
            placementLabels: placements.labels,
          };
        });

        const storyCount = enrichedAds.filter((a) => a.hasStory).length;

        return {
          id: lead.id,
          businessName: lead.businessName,
          city: lead.city,
          state: lead.state,
          industry: lead.industry,
          facebook: lead.facebook?.trim() || null,
          leadScore: lead.leadScore,
          qualityTier: lead.qualityTier,
          facebookAdsCheckedAt: lead.facebookAdsCheckedAt?.toISOString() ?? null,
          adsChecked: Boolean(lead.facebookAdsData),
          totalAds: enrichedAds.length,
          storyAds: storyCount,
          searchUrl: ads?.searchUrl ?? null,
          message: ads?.message ?? null,
          ads: enrichedAds,
        };
      });

    return NextResponse.json({
      connection,
      leads: items,
      counts: {
        withFacebook: items.filter((l) => Boolean(l.facebook)).length,
        withAds: items.filter((l) => l.totalAds > 0).length,
        withStories: items.filter((l) => l.storyAds > 0).length,
      },
    });
  } catch (err) {
    console.error("[facebook/hub]", err);
    return NextResponse.json(
      {
        error: "Could not load Facebook hub",
        connection: {
          connected: false,
          oauthConfigured: false,
        },
        leads: [],
        counts: { withFacebook: 0, withAds: 0, withStories: 0 },
      },
      { status: 500 },
    );
  }
}
