import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status") || "all";
  const hookId = searchParams.get("hookId");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const campaign = await prisma.campaign.findUnique({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const whereClause: Record<string, unknown> = {
    campaignId: id,
  };

  if (status === "opened") {
    whereClause.openCount = { gt: 0 };
  } else if (status === "clicked") {
    whereClause.clickCount = { gt: 0 };
  } else if (status !== "all") {
    whereClause.status = status;
  }

  if (hookId && hookId !== "all") {
    whereClause.assignedHookId = hookId;
  }

  if (q) {
    whereClause.OR = [
      { businessName: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
    ];
  }

  const [prospects, totalCount] = await Promise.all([
    prisma.campaignProspect.findMany({
      where: whereClause,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        timezone: true,
        status: true,
        assignedHookId: true,
        currentStepIndex: true,
        lastSentAt: true,
        nextSendDueAt: true,
        lastMailboxId: true,
        lastFromEmail: true,
        lastSubject: true,
        openedAt: true,
        openCount: true,
        clickedAt: true,
        clickCount: true,
        repliedAt: true,
        bouncedAt: true,
        unsubscribedAt: true,
        stopReason: true,
        createdAt: true,
      },
    }),
    prisma.campaignProspect.count({
      where: whereClause,
    }),
  ]);

  return NextResponse.json({
    prospects,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
