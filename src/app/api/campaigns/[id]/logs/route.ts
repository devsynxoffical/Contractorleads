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
  const prospectId = searchParams.get("prospectId");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const campaign = await prisma.campaign.findUnique({
    where: { id, userId: user.id },
    select: { id: true, name: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const whereClause: Record<string, unknown> = {
    campaignId: id,
  };

  if (status === "opened") {
    whereClause.OR = [{ status: "opened" }, { openedAt: { not: null } }];
  } else if (status === "replied") {
    whereClause.OR = [{ status: "replied" }, { repliedAt: { not: null } }];
  } else if (status === "clicked") {
    whereClause.OR = [{ status: "clicked" }, { clickedAt: { not: null } }];
  } else if (status === "bounced") {
    whereClause.OR = [{ status: "bounced" }, { bouncedAt: { not: null } }];
  } else if (status === "failed") {
    whereClause.status = "failed";
  } else if (status === "sent") {
    whereClause.status = { not: "failed" };
  }

  if (prospectId) {
    whereClause.prospectId = prospectId;
  }

  if (q) {
    whereClause.OR = [
      { toEmail: { contains: q, mode: "insensitive" } },
      { fromEmail: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { prospect: { businessName: { contains: q, mode: "insensitive" } } },
      { prospect: { ownerName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [logs, totalCount] = await Promise.all([
    prisma.campaignLog.findMany({
      where: whereClause,
      take: limit,
      skip,
      orderBy: { sentAt: "desc" },
      include: {
        prospect: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            email: true,
            phone: true,
            city: true,
            state: true,
            status: true,
            assignedHookId: true,
            openCount: true,
            clickCount: true,
            repliedAt: true,
          },
        },
      },
    }),
    prisma.campaignLog.count({
      where: whereClause,
    }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
