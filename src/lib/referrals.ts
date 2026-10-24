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
      commissionPercent: 30,
      minWithdrawalUsd: 500,
      milestonesJson: JSON.stringify(DEFAULT_MILESTONES),
    },
  });

  return {
    enabled: row.enabled,
    commissionPercent: Math.max(30, Number(row.commissionPercent) || 30),
    minWithdrawalUsd: Math.max(500, Number(row.minWithdrawalUsd) || 500),
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
 * Pay cash commission when a referred user purchases a plan or renews.
 * Commission Rate: 30% on every eligible sale based on package price.
 * Tracks individual sales and renewals in ReferralSale.
 */
export async function applyReferralCommissionOnPurchase(opts: {
  userId: string;
  plan: string;
  previousPlan?: string | null;
  subscriptionStatus?: string | null;
  amountUsd?: number | null;
  isRenewal?: boolean;
  invoiceId?: string | null;
  paymentProvider?: string | null;
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
  if (referral.status === "blocked") {
    return { paid: false as const, reason: "blocked" as const };
  }

  // Idempotency check on invoice/payment ID if provided
  if (opts.invoiceId) {
    const existingSale = await prisma.referralSale.findUnique({
      where: { invoiceId: opts.invoiceId },
    });
    if (existingSale) {
      return {
        paid: false as const,
        reason: "already_rewarded_invoice" as const,
      };
    }
  }

  const purchaseAmountUsd =
    typeof opts.amountUsd === "number" && opts.amountUsd > 0
      ? roundUsd(opts.amountUsd)
      : await getPlanMonthlyPrice(opts.plan);

  const commissionRate = config.commissionPercent || 30;
  const commissionUsd = roundUsd(purchaseAmountUsd * (commissionRate / 100));

  const isFirstPurchase = referral.status !== "rewarded";
  let milestoneBonusUsd = 0;
  let nextCount = 0;

  if (isFirstPurchase) {
    const previousRewarded = await prisma.referral.count({
      where: { referrerId: referral.referrerId, status: "rewarded" },
    });
    nextCount = previousRewarded + 1;
    milestoneBonusUsd = milestoneBonusForCount(
      nextCount,
      config.milestones,
      previousRewarded,
    );
  }

  const totalUsd = roundUsd(commissionUsd + milestoneBonusUsd);
  const saleType = opts.isRenewal
    ? "renewal"
    : isFirstPurchase
      ? "initial"
      : "upgrade";

  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: "rewarded",
        totalRevenueUsd: { increment: purchaseAmountUsd },
        totalCommissionUsd: { increment: commissionUsd },
        totalSalesCount: { increment: 1 },
        ...(isFirstPurchase
          ? {
              commissionUsd: { increment: commissionUsd },
              milestoneBonusUsd,
              planAtReward: opts.plan,
              purchaseAmountUsd,
              rewardedAt: new Date(),
            }
          : {}),
      },
    });

    if (totalUsd > 0) {
      await tx.user.update({
        where: { id: referral.referrerId },
        data: { referralBalanceUsd: { increment: totalUsd } },
      });
    }

    await tx.referralSale.create({
      data: {
        referralId: referral.id,
        referrerId: referral.referrerId,
        referredUserId: opts.userId,
        amountUsd: purchaseAmountUsd,
        commissionUsd,
        commissionRate,
        plan: opts.plan,
        type: saleType,
        paymentProvider: opts.paymentProvider || "stripe",
        invoiceId: opts.invoiceId || null,
        status: "completed",
      },
    });

    if (commissionUsd > 0) {
      await tx.referralEarningLedger.create({
        data: {
          userId: referral.referrerId,
          amountUsd: commissionUsd,
          action: opts.isRenewal ? "renewal_commission" : "commission",
          reference: opts.invoiceId || referral.id,
          metaJson: JSON.stringify({
            referredUserId: opts.userId,
            plan: opts.plan,
            purchaseAmountUsd,
            commissionPercent: commissionRate,
            isRenewal: Boolean(opts.isRenewal),
            paymentProvider: opts.paymentProvider || "stripe",
            invoiceId: opts.invoiceId || null,
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
    `Earned $${commissionUsd.toFixed(2)} (${commissionRate}% commission) when a referred client ${opts.isRenewal ? "renewed" : "purchased"} ${opts.plan}`,
    {
      referralId: referral.id,
      referredUserId: opts.userId,
      commissionUsd,
      milestoneBonusUsd,
      plan: opts.plan,
      purchaseAmountUsd,
      commissionRate,
      saleType,
    },
  );

  return {
    paid: true as const,
    referrerId: referral.referrerId,
    commissionUsd,
    milestoneBonusUsd,
    totalUsd,
    saleType,
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
    return { ok: false as const, error: "Affiliate program is currently paused" };
  }

  const amount = roundUsd(opts.amountUsd);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, error: "Enter a valid payout amount" };
  }
  if (amount < config.minWithdrawalUsd) {
    return {
      ok: false as const,
      error: `Minimum payout threshold is $${config.minWithdrawalUsd.toFixed(2)}. Affiliates become eligible once their payable commission balance reaches $${config.minWithdrawalUsd.toFixed(2)}.`,
    };
  }

  const details = opts.payoutDetails.trim();
  if (details.length < 3) {
    return {
      ok: false as const,
      error: "Add payout details (PayPal email, Wire routing, or Bank details)",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { referralBalanceUsd: true },
  });
  if (!user) return { ok: false as const, error: "User not found" };
  if (user.referralBalanceUsd < amount) {
    return {
      ok: false as const,
      error: `Insufficient payable commission balance (available: $${user.referralBalanceUsd.toFixed(2)})`,
    };
  }

  const pending = await prisma.referralWithdrawal.findFirst({
    where: { userId: opts.userId, status: "pending" },
    select: { id: true },
  });
  if (pending) {
    return {
      ok: false as const,
      error: "You already have a pending payout request in review",
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
      throw new Error("Insufficient payable commission balance");
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
    `Requested $${amount.toFixed(2)} affiliate payout via ${opts.method}`,
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
      `Affiliate payout of $${row.amountUsd.toFixed(2)} marked paid`,
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
    `Affiliate payout of $${row.amountUsd.toFixed(2)} was rejected — balance restored`,
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

  const [user, referrals, withdrawals, sales, earned] = await Promise.all([
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
    prisma.referralSale.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        referral: {
          select: {
            referredUser: {
              select: {
                email: true,
                name: true,
                companyName: true,
              },
            },
          },
        },
      },
    }),
    prisma.referralEarningLedger.aggregate({
      where: {
        userId,
        action: { in: ["commission", "renewal_commission", "milestone"] },
      },
      _sum: { amountUsd: true },
    }),
  ]);

  const totalSignups = referrals.length;
  const payingCustomers = referrals.filter((r) => r.status === "rewarded").length;
  const pendingReferrals = referrals.filter((r) => r.status === "pending").length;

  const totalSales = sales.length;
  const totalRevenueUsd = roundUsd(
    sales.reduce((sum, s) => sum + (s.amountUsd || 0), 0),
  );
  const totalEarnedUsd = roundUsd(earned._sum.amountUsd ?? 0);

  const payableBalanceUsd = roundUsd(user?.referralBalanceUsd ?? 0);
  const pendingPayoutsUsd = roundUsd(
    withdrawals
      .filter((w) => w.status === "pending")
      .reduce((sum, w) => sum + (w.amountUsd || 0), 0),
  );
  const completedPayoutsUsd = roundUsd(
    withdrawals
      .filter((w) => w.status === "paid")
      .reduce((sum, w) => sum + (w.amountUsd || 0), 0),
  );

  const payoutThresholdUsd = config.minWithdrawalUsd; // $500
  const isEligibleForPayout = payableBalanceUsd >= payoutThresholdUsd;
  const remainingForPayoutUsd = Math.max(
    0,
    roundUsd(payoutThresholdUsd - payableBalanceUsd),
  );
  const payoutProgressPercent = Math.min(
    100,
    Math.round((payableBalanceUsd / payoutThresholdUsd) * 100),
  );

  const nextMilestone =
    config.milestones.find((m) => m.minReferrals > payingCustomers) ?? null;

  return {
    code,
    enabled: config.enabled,
    commissionPercent: config.commissionPercent, // 30%
    minWithdrawalUsd: config.minWithdrawalUsd, // $500
    milestones: config.milestones,
    // 5 Core Affiliate KPIs required by user:
    totalSignups,
    totalSales,
    totalRevenueUsd,
    totalEarnedUsd, // Affiliate commission earned
    payableBalanceUsd,
    pendingPayoutsUsd,
    completedPayoutsUsd,
    payoutThresholdUsd,
    isEligibleForPayout,
    remainingForPayoutUsd,
    payoutProgressPercent,
    successfulReferrals: payingCustomers,
    pendingReferrals,
    balanceUsd: payableBalanceUsd,
    nextMilestone,
    progressToNext: nextMilestone
      ? {
          current: payingCustomers,
          target: nextMilestone.minReferrals,
          remaining: Math.max(0, nextMilestone.minReferrals - payingCustomers),
          bonusUsd: nextMilestone.bonusUsd,
        }
      : null,
    // Referred Contacts:
    referrals: referrals.map((r) => ({
      id: r.id,
      status: r.status,
      commissionUsd: r.commissionUsd,
      milestoneBonusUsd: r.milestoneBonusUsd,
      totalRevenueUsd: r.totalRevenueUsd,
      totalCommissionUsd: r.totalCommissionUsd,
      totalSalesCount: r.totalSalesCount,
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
    // Sales & Renewals Ledger:
    sales: sales.map((s) => ({
      id: s.id,
      amountUsd: s.amountUsd,
      commissionUsd: s.commissionUsd,
      commissionRate: s.commissionRate,
      plan: s.plan,
      type: s.type,
      paymentProvider: s.paymentProvider,
      status: s.status,
      createdAt: s.createdAt,
      customerEmail: s.referral?.referredUser?.email
        ? maskEmail(s.referral.referredUser.email)
        : "Referred Customer",
      customerName:
        s.referral?.referredUser?.name ||
        s.referral?.referredUser?.companyName ||
        null,
    })),
    // Payouts History:
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
