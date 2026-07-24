import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { getPlanMonthlyPrice, isPaidPlanEffective } from "@/lib/plans";

export const REFERRAL_COOKIE = "referral_code";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type ReferralMilestone = {
  minReferrals: number;
  bonusUsd: number;
};

export type ReferralRewardSettings = {
  enabled: boolean;
  commissionPercent: number;
  minWithdrawalUsd: number;
  milestones: ReferralMilestone[];
};

const DEFAULT_MILESTONES: ReferralMilestone[] = [
  { minReferrals: 10, bonusUsd: 25 },
  { minReferrals: 50, bonusUsd: 100 },
  { minReferrals: 100, bonusUsd: 250 },
];

function roundUsd(n: number) {
  return Math.round(n * 100) / 100;
}

function parseMilestones(raw: string | null | undefined): ReferralMilestone[] {
  if (!raw) return DEFAULT_MILESTONES;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_MILESTONES;
    return parsed
      .map((row) => {
        const r = row as {
          minReferrals?: number;
          bonusUsd?: number;
          bonusCredits?: number;
        };
        return {
          minReferrals: Math.max(1, Math.floor(Number(r.minReferrals) || 0)),
          bonusUsd: Math.max(
            0,
            Number(r.bonusUsd ?? r.bonusCredits ?? 0) || 0,
          ),
        };
      })
      .filter((row) => row.minReferrals > 0)
      .sort((a, b) => a.minReferrals - b.minReferrals);
  } catch {
    return DEFAULT_MILESTONES;
  }
}

export async function getRewardConfig(): Promise<ReferralRewardSettings> {
  const row = await prisma.referralRewardConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: true,
      commissionPercent: 20,
      minWithdrawalUsd: 25,
      milestonesJson: JSON.stringify(DEFAULT_MILESTONES),
    },
  });

  return {
    enabled: row.enabled,
    commissionPercent: row.commissionPercent,
    minWithdrawalUsd: row.minWithdrawalUsd,
    milestones: parseMilestones(row.milestonesJson),
  };
}

export async function saveRewardConfig(input: {
  enabled: boolean;
  commissionPercent: number;
  minWithdrawalUsd: number;
  milestones: ReferralMilestone[];
}): Promise<ReferralRewardSettings> {
  const milestones = [...input.milestones]
    .map((m) => ({
      minReferrals: Math.max(1, Math.floor(m.minReferrals)),
      bonusUsd: Math.max(0, Number(m.bonusUsd) || 0),
    }))
    .sort((a, b) => a.minReferrals - b.minReferrals);

  const row = await prisma.referralRewardConfig.upsert({
    where: { id: "default" },
    update: {
      enabled: input.enabled,
      commissionPercent: Math.max(0, Number(input.commissionPercent) || 0),
      minWithdrawalUsd: Math.max(0, Number(input.minWithdrawalUsd) || 0),
      milestonesJson: JSON.stringify(milestones),
    },
    create: {
      id: "default",
      enabled: input.enabled,
      commissionPercent: Math.max(0, Number(input.commissionPercent) || 0),
      minWithdrawalUsd: Math.max(0, Number(input.minWithdrawalUsd) || 0),
      milestonesJson: JSON.stringify(milestones),
    },
  });

  return {
    enabled: row.enabled,
    commissionPercent: row.commissionPercent,
    minWithdrawalUsd: row.minWithdrawalUsd,
    milestones: parseMilestones(row.milestonesJson),
  };
}

/** Old random hex codes (e.g. 015EB0E2) — migrate to name-based. */
function isLegacyReferralCode(code: string) {
  return /^[0-9a-f]{8}$/i.test(code.trim());
}

/** "Vishali Sharma" / "vishali@x.com" → "vishali" */
export function slugifyReferralBase(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  return slug || "user";
}

async function allocateNameReferralCode(opts: {
  userId: string;
  name: string | null;
  email: string;
}): Promise<string> {
  const base = slugifyReferralBase(
    opts.name?.trim() || opts.email.split("@")[0] || "user",
  );

  for (let n = 1; n <= 999; n++) {
    const code = `${base}${String(n).padStart(3, "0")}`;
    const taken = await prisma.user.findFirst({
      where: {
        referralCode: { equals: code, mode: "insensitive" },
        NOT: { id: opts.userId },
      },
      select: { id: true },
    });
    if (!taken) return code;
  }

  // Extremely unlikely: base001–base999 all taken
  return `${base}${randomBytes(2).toString("hex")}`;
}

/**
 * Ensure the user has a unique referral code (e.g. vishali001).
 * Migrates legacy 8-char hex codes to the name-based format.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, name: true, email: true },
  });
  if (!existing) {
    throw new Error("User not found");
  }

  if (existing.referralCode && !isLegacyReferralCode(existing.referralCode)) {
    return existing.referralCode;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = await allocateNameReferralCode({
      userId,
      name: existing.name,
      email: existing.email,
    });
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      if (updated.referralCode) return updated.referralCode;
    } catch {
      /* unique collision — retry */
    }
  }

  const fallback = `${slugifyReferralBase(existing.name || existing.email)}${randomBytes(3).toString("hex")}`;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { referralCode: fallback },
    select: { referralCode: true },
  });
  return updated.referralCode!;
}

export async function findReferrerByCode(code: string) {
  const normalized = code.trim();
  if (!normalized) return null;
  return prisma.user.findFirst({
    where: {
      referralCode: { equals: normalized, mode: "insensitive" },
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      referralCode: true,
    },
  });
}

function milestoneBonusForCount(
  count: number,
  milestones: ReferralMilestone[],
  previousCount: number,
): number {
  let bonus = 0;
  for (const tier of milestones) {
    if (previousCount < tier.minReferrals && count >= tier.minReferrals) {
      bonus += tier.bonusUsd;
    }
  }
  return roundUsd(bonus);
}

/**
 * Attribute a new signup to a referrer. Commission pays later on plan purchase.
 */
export async function applyReferralOnSignup(opts: {
  newUserId: string;
  referralCode?: string | null;
}) {
  const code = opts.referralCode?.trim();
  if (!code) return { applied: false as const };

  const config = await getRewardConfig();
  if (!config.enabled) {
    return { applied: false as const, reason: "disabled" as const };
  }

  const referrer = await findReferrerByCode(code);
  if (!referrer) {
    return { applied: false as const, reason: "invalid_code" as const };
  }
  if (referrer.id === opts.newUserId) {
    return { applied: false as const, reason: "self_referral" as const };
  }

  const already = await prisma.referral.findUnique({
    where: { referredUserId: opts.newUserId },
  });
  if (already) {
    return { applied: false as const, reason: "already_attributed" as const };
  }

  await prisma.user.update({
    where: { id: opts.newUserId },
    data: { referredByUserId: referrer.id },
  });

  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredUserId: opts.newUserId,
      status: "pending",
    },
  });

  await logActivity(
    referrer.id,
    "referral_pending",
    "New signup attributed to your referral link — commission pays when they purchase a plan",
    {
      referralId: referral.id,
      referredUserId: opts.newUserId,
    },
  );

  return {
    applied: true as const,
    referrerId: referrer.id,
    referralId: referral.id,
    status: "pending" as const,
  };
}

/**
 * Pay cash commission when a referred user first converts to a paid plan.
 * Idempotent — one commission per referred user.
 */
export async function applyReferralCommissionOnPurchase(opts: {
  userId: string;
  plan: string;
  previousPlan?: string | null;
  subscriptionStatus?: string | null;
}) {
  const config = await getRewardConfig();
  if (!config.enabled) {
    return { paid: false as const, reason: "disabled" as const };
  }

  if (!(await isPaidPlanEffective(opts.plan))) {
    return { paid: false as const, reason: "not_paid_plan" as const };
  }

  const status = (opts.subscriptionStatus || "").toLowerCase();
  if (status === "canceled" || status === "unpaid") {
    return { paid: false as const, reason: "inactive_subscription" as const };
  }

  const referral = await prisma.referral.findUnique({
    where: { referredUserId: opts.userId },
  });
  if (!referral) {
    return { paid: false as const, reason: "no_referral" as const };
  }
  if (referral.status === "rewarded") {
    return { paid: false as const, reason: "already_rewarded" as const };
  }
  if (referral.status === "blocked") {
    return { paid: false as const, reason: "blocked" as const };
  }

  const purchaseAmountUsd = await getPlanMonthlyPrice(opts.plan);
  const commissionUsd = roundUsd(
    purchaseAmountUsd * (config.commissionPercent / 100),
  );

  const previousRewarded = await prisma.referral.count({
    where: { referrerId: referral.referrerId, status: "rewarded" },
  });
  const nextCount = previousRewarded + 1;
  const milestoneBonusUsd = milestoneBonusForCount(
    nextCount,
    config.milestones,
    previousRewarded,
  );
  const totalUsd = roundUsd(commissionUsd + milestoneBonusUsd);

  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: "rewarded",
        commissionUsd,
        milestoneBonusUsd,
        planAtReward: opts.plan,
        purchaseAmountUsd,
        rewardedAt: new Date(),
      },
    });

    if (totalUsd > 0) {
      await tx.user.update({
        where: { id: referral.referrerId },
        data: { referralBalanceUsd: { increment: totalUsd } },
      });
    }

    if (commissionUsd > 0) {
      await tx.referralEarningLedger.create({
        data: {
          userId: referral.referrerId,
          amountUsd: commissionUsd,
          action: "commission",
          reference: referral.id,
          metaJson: JSON.stringify({
            referredUserId: opts.userId,
            plan: opts.plan,
            purchaseAmountUsd,
            commissionPercent: config.commissionPercent,
          }),
        },
      });
    }

    if (milestoneBonusUsd > 0) {
      await tx.referralEarningLedger.create({
        data: {
          userId: referral.referrerId,
          amountUsd: milestoneBonusUsd,
          action: "milestone",
          reference: referral.id,
          metaJson: JSON.stringify({
            totalRewardedReferrals: nextCount,
          }),
        },
      });
    }
  });

  await logActivity(
    referral.referrerId,
    "referral_commission",
    `Earned $${totalUsd.toFixed(2)} commission when a referral purchased ${opts.plan}`,
    {
      referralId: referral.id,
      referredUserId: opts.userId,
      commissionUsd,
      milestoneBonusUsd,
      plan: opts.plan,
      purchaseAmountUsd,
      totalReferrals: nextCount,
    },
  );

  return {
    paid: true as const,
    referrerId: referral.referrerId,
    commissionUsd,
    milestoneBonusUsd,
    totalUsd,
    totalReferrals: nextCount,
  };
}

export async function requestWithdrawal(opts: {
  userId: string;
  amountUsd: number;
  method: "paypal" | "bank" | "other";
  payoutDetails: string;
}) {
  const config = await getRewardConfig();
  if (!config.enabled) {
    return { ok: false as const, error: "Referral program is paused" };
  }

  const amount = roundUsd(opts.amountUsd);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, error: "Enter a valid withdrawal amount" };
  }
  if (amount < config.minWithdrawalUsd) {
    return {
      ok: false as const,
      error: `Minimum withdrawal is $${config.minWithdrawalUsd.toFixed(2)}`,
    };
  }

  const details = opts.payoutDetails.trim();
  if (details.length < 3) {
    return {
      ok: false as const,
      error: "Add payout details (PayPal email or bank info)",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { referralBalanceUsd: true },
  });
  if (!user) return { ok: false as const, error: "User not found" };
  if (user.referralBalanceUsd < amount) {
    return { ok: false as const, error: "Insufficient referral balance" };
  }

  const pending = await prisma.referralWithdrawal.findFirst({
    where: { userId: opts.userId, status: "pending" },
    select: { id: true },
  });
  if (pending) {
    return {
      ok: false as const,
      error: "You already have a pending withdrawal request",
    };
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: opts.userId,
        referralBalanceUsd: { gte: amount },
      },
      data: { referralBalanceUsd: { decrement: amount } },
    });
    if (updated.count === 0) {
      throw new Error("Insufficient referral balance");
    }

    const row = await tx.referralWithdrawal.create({
      data: {
        userId: opts.userId,
        amountUsd: amount,
        method: opts.method,
        payoutDetails: details,
        status: "pending",
      },
    });

    await tx.referralEarningLedger.create({
      data: {
        userId: opts.userId,
        amountUsd: -amount,
        action: "withdrawal",
        reference: row.id,
        metaJson: JSON.stringify({ method: opts.method }),
      },
    });

    return row;
  });

  await logActivity(
    opts.userId,
    "referral_withdrawal_request",
    `Requested $${amount.toFixed(2)} referral withdrawal via ${opts.method}`,
    { withdrawalId: withdrawal.id, amountUsd: amount },
  );

  return { ok: true as const, withdrawal };
}

export async function processWithdrawal(opts: {
  withdrawalId: string;
  status: "paid" | "rejected";
  adminNote?: string | null;
}) {
  const row = await prisma.referralWithdrawal.findUnique({
    where: { id: opts.withdrawalId },
  });
  if (!row) return { ok: false as const, error: "Withdrawal not found" };
  if (row.status !== "pending") {
    return { ok: false as const, error: "Withdrawal already processed" };
  }

  if (opts.status === "paid") {
    await prisma.referralWithdrawal.update({
      where: { id: row.id },
      data: {
        status: "paid",
        adminNote: opts.adminNote?.trim() || null,
        processedAt: new Date(),
      },
    });
    await logActivity(
      row.userId,
      "referral_withdrawal_paid",
      `Referral withdrawal of $${row.amountUsd.toFixed(2)} marked paid`,
      { withdrawalId: row.id },
    );
    return { ok: true as const, status: "paid" as const };
  }

  // Reject — restore balance
  await prisma.$transaction(async (tx) => {
    await tx.referralWithdrawal.update({
      where: { id: row.id },
      data: {
        status: "rejected",
        adminNote: opts.adminNote?.trim() || null,
        processedAt: new Date(),
      },
    });
    await tx.user.update({
      where: { id: row.userId },
      data: { referralBalanceUsd: { increment: row.amountUsd } },
    });
    await tx.referralEarningLedger.create({
      data: {
        userId: row.userId,
        amountUsd: row.amountUsd,
        action: "withdrawal_reversal",
        reference: row.id,
      },
    });
  });

  await logActivity(
    row.userId,
    "referral_withdrawal_rejected",
    `Referral withdrawal of $${row.amountUsd.toFixed(2)} was rejected — balance restored`,
    { withdrawalId: row.id },
  );

  return { ok: true as const, status: "rejected" as const };
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function getReferralStats(userId: string) {
  const code = await ensureReferralCode(userId);
  const config = await getRewardConfig();

  const [user, referrals, withdrawals, earned] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralBalanceUsd: true },
    }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        referredUser: {
          select: {
            email: true,
            name: true,
            companyName: true,
            createdAt: true,
            plan: true,
          },
        },
      },
    }),
    prisma.referralWithdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.referralEarningLedger.aggregate({
      where: {
        userId,
        action: { in: ["commission", "milestone"] },
      },
      _sum: { amountUsd: true },
    }),
  ]);

  const successful = referrals.filter((r) => r.status === "rewarded").length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const nextMilestone =
    config.milestones.find((m) => m.minReferrals > successful) ?? null;

  return {
    code,
    enabled: config.enabled,
    commissionPercent: config.commissionPercent,
    minWithdrawalUsd: config.minWithdrawalUsd,
    milestones: config.milestones,
    balanceUsd: roundUsd(user?.referralBalanceUsd ?? 0),
    totalEarnedUsd: roundUsd(earned._sum.amountUsd ?? 0),
    successfulReferrals: successful,
    pendingReferrals: pending,
    nextMilestone,
    progressToNext: nextMilestone
      ? {
          current: successful,
          target: nextMilestone.minReferrals,
          remaining: Math.max(0, nextMilestone.minReferrals - successful),
          bonusUsd: nextMilestone.bonusUsd,
        }
      : null,
    referrals: referrals.map((r) => ({
      id: r.id,
      status: r.status,
      commissionUsd: r.commissionUsd,
      milestoneBonusUsd: r.milestoneBonusUsd,
      planAtReward: r.planAtReward,
      createdAt: r.createdAt,
      rewardedAt: r.rewardedAt,
      referred: {
        email: maskEmail(r.referredUser.email),
        name: r.referredUser.name,
        companyName: r.referredUser.companyName,
        createdAt: r.referredUser.createdAt,
        plan: r.referredUser.plan,
      },
    })),
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amountUsd: w.amountUsd,
      method: w.method,
      payoutDetails: w.payoutDetails,
      status: w.status,
      adminNote: w.adminNote,
      createdAt: w.createdAt,
      processedAt: w.processedAt,
    })),
  };
}
