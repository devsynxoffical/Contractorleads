import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { processCampaignSends } from "@/lib/campaign-runner";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);
    const limit = Math.min(25, Math.max(1, Number(body?.limit) || 25));

    const results = await processCampaignSends({
      campaignId: id,
      userId: user.id,
      limitPerCampaign: limit,
      ignoreTimeWindow: force,
    });

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
