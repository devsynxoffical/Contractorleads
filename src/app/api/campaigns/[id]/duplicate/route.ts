import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const original = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
      include: {
        prospects: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const duplicated = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: `${original.name} (Copy)`,
        status: "draft",
        segmentId: original.segmentId,
        industry: original.industry,
        country: original.country,
        state: original.state,
        city: original.city,
        leadCount: original.leadCount,
        duplicateDetectedCount: original.duplicateDetectedCount,
        uniqueEmailCount: original.uniqueEmailCount,
        hooksJson: original.hooksJson,
        stepsJson: original.stepsJson,
        selectedMailboxIds: original.selectedMailboxIds,
        dailyLimitPerMailbox: original.dailyLimitPerMailbox,
        mailboxLimitsJson: original.mailboxLimitsJson,
        minDelayMinutes: original.minDelayMinutes,
        maxDelayMinutes: original.maxDelayMinutes,
        timezone: original.timezone,
        useRecipientTimezone: original.useRecipientTimezone,
        sendingDaysJson: original.sendingDaysJson,
        sendingWindowStart: original.sendingWindowStart,
        sendingWindowEnd: original.sendingWindowEnd,
      },
    });

    if (original.prospects.length > 0) {
      await prisma.campaignProspect.createMany({
        data: original.prospects.map((p) => ({
          campaignId: duplicated.id,
          leadId: p.leadId,
          businessName: p.businessName,
          ownerName: p.ownerName,
          email: p.email,
          phone: p.phone,
          city: p.city,
          state: p.state,
          country: p.country,
          timezone: p.timezone,
          status: "pending",
          assignedHookId: p.assignedHookId,
          currentStepIndex: 0,
        })),
      });
    }

    return NextResponse.json({ ok: true, campaign: duplicated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to duplicate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
