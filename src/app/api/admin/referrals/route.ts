import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRewardConfig,
  maskEmail,
  saveRewardConfig,
  type ReferralMilestone,
} from "@/lib/referrals";

export async function GET() {
  const admin = await requirePermission("referrals");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await getRewardConfig();

  const [recent, leaders, totalReferrals] = await Promise.all([
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
            referralCode: true,
          },
        },
        referredUser: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.referral.groupBy({
      by: ["referrerId"],
      where: { status: "rewarded" },
      _count: { _all: true },
      _sum: { rewardCredits: true, milestoneBonus: true },
      orderBy: { _count: { referrerId: "desc" } },
      take: 20,
    }),
    prisma.referral.count({ where: { status: "rewarded" } }),
  ]);

  const leaderUsers = await prisma.user.findMany({
    where: { id: { in: leaders.map((l) => l.referrerId) } },
    select: {
      id: true,
      email: true,
      companyName: true,
      name: true,
      referralCode: true,
    },
  });
  const leaderMap = new Map(leaderUsers.map((u) => [u.id, u]));

  return NextResponse.json({
    config,
    totalReferrals,
    recent: recent.map((r) => ({
      id: r.id,
      status: r.status,
      rewardCredits: r.rewardCredits,
      milestoneBonus: r.milestoneBonus,
      createdAt: r.createdAt,
      referrer: {
        id: r.referrer.id,
        label: r.referrer.companyName || r.referrer.name || r.referrer.email,
        email: r.referrer.email,
        code: r.referrer.referralCode,
      },
      referred: {
        id: r.referredUser.id,
        label:
          r.referredUser.companyName ||
          r.referredUser.name ||
          maskEmail(r.referredUser.email),
        email: maskEmail(r.referredUser.email),
      },
    })),
    leaderboard: leaders.map((l) => {
      const u = leaderMap.get(l.referrerId);
      return {
        userId: l.referrerId,
        label: u?.companyName || u?.name || u?.email || l.referrerId,
        email: u?.email ?? "",
        code: u?.referralCode,
        referrals: l._count._all,
        credits:
          (l._sum.rewardCredits ?? 0) + (l._sum.milestoneBonus ?? 0),
      };
    }),
  });
}

export async function PATCH(request: Request) {
  const admin = await requirePermission("referrals");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const enabled = Boolean(body.enabled);
  const creditsPerReferral = Number(body.creditsPerReferral);
  const milestones = Array.isArray(body.milestones)
    ? (body.milestones as ReferralMilestone[])
    : [];

  if (!Number.isFinite(creditsPerReferral) || creditsPerReferral < 0) {
    return NextResponse.json(
      { error: "creditsPerReferral must be a non-negative number" },
      { status: 400 },
    );
  }

  const config = await saveRewardConfig({
    enabled,
    creditsPerReferral,
    milestones,
  });

  return NextResponse.json({ config });
}
