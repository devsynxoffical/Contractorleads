import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeActivityStats,
  emptyStats,
  getFirstActivityAt,
  getUserDailyEmailSeries,
  parsePeriod,
  periodStart,
} from "@/lib/admin-user-activity";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** One user's activity summary for the period, plus a daily email chart. */
export async function GET(request: Request, { params }: Params) {
  const admin = await requirePermission("activity");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get("period"));

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      role: true,
      plan: true,
      subscriptionStatus: true,
      isActive: true,
      creditsRemaining: true,
      messagingAddonStatus: true,
      createdAt: true,
      _count: { select: { campaigns: true, smtpAccounts: true, savedLeads: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const [stats, series, lastLogin, firstActivityAt] = await Promise.all([
    computeActivityStats(periodStart(period), id),
    getUserDailyEmailSeries(id, days),
    prisma.activityLog.findFirst({
      where: { userId: id, type: "login" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    getFirstActivityAt(id),
  ]);

  return NextResponse.json({
    period,
    user: { ...user, lastLoginAt: lastLogin?.createdAt.toISOString() ?? null, firstActivityAt },
    stats: stats.get(id) ?? emptyStats(),
    series,
  });
}
