import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; prospectId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, prospectId } = await params;

  try {
    const body = await req.json();
    const { action, status } = body;

    const campaign = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const patchData: Record<string, unknown> = {};

    if (action === "stop") {
      patchData.status = "stopped";
      patchData.stopReason = "manual_stop";
      patchData.nextSendDueAt = null;
    } else if (action === "mark_replied") {
      patchData.status = "replied";
      patchData.stopReason = "replied";
      patchData.repliedAt = new Date();
      patchData.nextSendDueAt = null;
    } else if (status) {
      patchData.status = status;
    }

    const updated = await prisma.campaignProspect.update({
      where: { id: prospectId, campaignId: id },
      data: patchData,
    });

    return NextResponse.json({ ok: true, prospect: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update prospect";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
