import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRewardConfig,
  maskEmail,
  processWithdrawal,
  saveRewardConfig,
  type ReferralMilestone,
} from "@/lib/referrals";

export async function GET() {
  const admin = await requirePermission("referrals");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await getRewardConfig();

  const [recent, leaders, totalReferrals, withdrawals] = await Promise.all([
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
            plan: true,
          },
        },
      },
    }),
    prisma.referral.groupBy({
      by: ["referrerId"],
      where: { status: "rewarded" },
      _count: { _all: true },
      _sum: { commissionUsd: true, milestoneBonusUsd: true },
      orderBy: { _count: { referrerId: "desc" } },
      take: 20,
    }),
    prisma.referral.count({ where: { status: "rewarded" } }),
    prisma.referralWithdrawal.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
            referralCode: true,
            referralBalanceUsd: true,
          },
        },
      },
    }),
  ]);

  const leaderUsers = await prisma.user.findMany({
    where: { id: { in: leaders.map((l) => l.referrerId) } },
    select: {
      id: true,
      email: true,
      companyName: true,
      name: true,
      referralCode: true,
      referralBalanceUsd: true,
    },
  });
  const leaderMap = new Map(leaderUsers.map((u) => [u.id, u]));

  return NextResponse.json({
    config,
    totalReferrals,
    recent: recent.map((r) => ({
      id: r.id,
      status: r.status,
      commissionUsd: r.commissionUsd,
      milestoneBonusUsd: r.milestoneBonusUsd,
      planAtReward: r.planAtReward,
      createdAt: r.createdAt,
      rewardedAt: r.rewardedAt,
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
        plan: r.referredUser.plan,
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
        earnedUsd:
          (l._sum.commissionUsd ?? 0) + (l._sum.milestoneBonusUsd ?? 0),
        balanceUsd: u?.referralBalanceUsd ?? 0,
      };
    }),
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amountUsd: w.amountUsd,
      method: w.method,
      payoutDetails: w.payoutDetails,
      status: w.status,
      adminNote: w.adminNote,
      createdAt: w.createdAt,
      processedAt: w.processedAt,
      user: {
        id: w.user.id,
        label: w.user.companyName || w.user.name || w.user.email,
        email: w.user.email,
        code: w.user.referralCode,
        balanceUsd: w.user.referralBalanceUsd,
      },
    })),
  });
}

export async function PATCH(request: Request) {
  const admin = await requirePermission("referrals");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Process a withdrawal request
  if (body.withdrawalId && (body.status === "paid" || body.status === "rejected")) {
    const result = await processWithdrawal({
      withdrawalId: String(body.withdrawalId),
      status: body.status,
      adminNote: typeof body.adminNote === "string" ? body.adminNote : null,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  const enabled = Boolean(body.enabled);
  const commissionPercent = Number(body.commissionPercent);
  const minWithdrawalUsd = Number(body.minWithdrawalUsd);
  const milestones = Array.isArray(body.milestones)
    ? (body.milestones as ReferralMilestone[])
    : [];

  if (!Number.isFinite(commissionPercent) || commissionPercent < 0) {
    return NextResponse.json(
      { error: "commissionPercent must be a non-negative number" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(minWithdrawalUsd) || minWithdrawalUsd < 0) {
    return NextResponse.json(
      { error: "minWithdrawalUsd must be a non-negative number" },
      { status: 400 },
    );
  }

  const config = await saveRewardConfig({
    enabled,
    commissionPercent,
    minWithdrawalUsd,
    milestones,
  });

  return NextResponse.json({ config });
}
