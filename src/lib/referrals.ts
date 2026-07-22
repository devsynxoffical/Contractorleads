import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { addCredits, logActivity } from "@/lib/credits";

export const REFERRAL_COOKIE = "referral_code";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type ReferralMilestone = {
  minReferrals: number;
  bonusCredits: number;
};

export type ReferralRewardSettings = {
  enabled: boolean;
  creditsPerReferral: number;
  milestones: ReferralMilestone[];
};

const DEFAULT_MILESTONES: ReferralMilestone[] = [
  { minReferrals: 10, bonusCredits: 50 },
  { minReferrals: 50, bonusCredits: 200 },
  { minReferrals: 100, bonusCredits: 500 },
];

function parseMilestones(raw: string | null | undefined): ReferralMilestone[] {
  if (!raw) return DEFAULT_MILESTONES;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_MILESTONES;
    return parsed
      .map((row) => ({
        minReferrals: Math.max(1, Math.floor(Number((row as ReferralMilestone).minReferrals) || 0)),
        bonusCredits: Math.max(0, Number((row as ReferralMilestone).bonusCredits) || 0),
      }))
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
      creditsPerReferral: 10,
      milestonesJson: JSON.stringify(DEFAULT_MILESTONES),
    },
  });

  return {
    enabled: row.enabled,
    creditsPerReferral: row.creditsPerReferral,
    milestones: parseMilestones(row.milestonesJson),
  };
}

export async function saveRewardConfig(input: {
  enabled: boolean;
  creditsPerReferral: number;
  milestones: ReferralMilestone[];
}): Promise<ReferralRewardSettings> {
  const milestones = [...input.milestones]
    .map((m) => ({
      minReferrals: Math.max(1, Math.floor(m.minReferrals)),
      bonusCredits: Math.max(0, Number(m.bonusCredits) || 0),
    }))
    .sort((a, b) => a.minReferrals - b.minReferrals);

  const row = await prisma.referralRewardConfig.upsert({
    where: { id: "default" },
    update: {
      enabled: input.enabled,
      creditsPerReferral: Math.max(0, Number(input.creditsPerReferral) || 0),
      milestonesJson: JSON.stringify(milestones),
    },
    create: {
      id: "default",
      enabled: input.enabled,
      creditsPerReferral: Math.max(0, Number(input.creditsPerReferral) || 0),
      milestonesJson: JSON.stringify(milestones),
    },
  });

  return {
    enabled: row.enabled,
    creditsPerReferral: row.creditsPerReferral,
    milestones: parseMilestones(row.milestonesJson),
  };
}

function makeCodeCandidate() {
  return randomBytes(4).toString("hex").toUpperCase();
}

/** Ensure the user has a unique referral code; create one if missing. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let i = 0; i < 8; i++) {
    const code = makeCodeCandidate();
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

  const fallback = `${userId.slice(-6).toUpperCase()}${makeCodeCandidate().slice(0, 2)}`;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { referralCode: fallback },
    select: { referralCode: true },
  });
  return updated.referralCode!;
}

export async function findReferrerByCode(code: string) {
  const normalized = code.trim().toUpperCase();
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
      bonus += tier.bonusCredits;
    }
  }
  return bonus;
}

/**
 * Attribute a new signup to a referrer and pay credits (idempotent).
 */
export async function applyReferralOnSignup(opts: {
  newUserId: string;
  referralCode?: string | null;
}) {
  const code = opts.referralCode?.trim();
  if (!code) return { applied: false as const };

  const config = await getRewardConfig();
  if (!config.enabled) return { applied: false as const, reason: "disabled" as const };

  const referrer = await findReferrerByCode(code);
  if (!referrer) return { applied: false as const, reason: "invalid_code" as const };
  if (referrer.id === opts.newUserId) {
    return { applied: false as const, reason: "self_referral" as const };
  }

  const already = await prisma.referral.findUnique({
    where: { referredUserId: opts.newUserId },
  });
  if (already) return { applied: false as const, reason: "already_attributed" as const };

  const previousCount = await prisma.referral.count({
    where: { referrerId: referrer.id, status: "rewarded" },
  });

  const base = Math.max(0, config.creditsPerReferral);
  const nextCount = previousCount + 1;
  const milestoneBonus = milestoneBonusForCount(
    nextCount,
    config.milestones,
    previousCount,
  );

  await prisma.user.update({
    where: { id: opts.newUserId },
    data: { referredByUserId: referrer.id },
  });

  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredUserId: opts.newUserId,
      status: "rewarded",
      rewardCredits: base,
      milestoneBonus,
      rewardedAt: new Date(),
    },
  });

  if (base > 0) {
    await addCredits(
      referrer.id,
      base,
      "referral_reward",
      referral.id,
    );
  }
  if (milestoneBonus > 0) {
    await addCredits(
      referrer.id,
      milestoneBonus,
      "referral_milestone",
      referral.id,
    );
  }

  await logActivity(
    referrer.id,
    "referral_reward",
    `Earned ${base + milestoneBonus} credits for referring a new user`,
    {
      referralId: referral.id,
      referredUserId: opts.newUserId,
      base,
      milestoneBonus,
      totalReferrals: nextCount,
    },
  );

  return {
    applied: true as const,
    referrerId: referrer.id,
    rewardCredits: base,
    milestoneBonus,
    totalReferrals: nextCount,
  };
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

  const [referrals, ledger] = await Promise.all([
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
          },
        },
      },
    }),
    prisma.creditLedger.aggregate({
      where: {
        userId,
        action: { in: ["referral_reward", "referral_milestone"] },
      },
      _sum: { amount: true },
    }),
  ]);

  const successful = referrals.filter((r) => r.status === "rewarded").length;
  const nextMilestone =
    config.milestones.find((m) => m.minReferrals > successful) ?? null;

  return {
    code,
    enabled: config.enabled,
    creditsPerReferral: config.creditsPerReferral,
    milestones: config.milestones,
    successfulReferrals: successful,
    creditsEarned: ledger._sum.amount ?? 0,
    nextMilestone,
    progressToNext: nextMilestone
      ? {
          current: successful,
          target: nextMilestone.minReferrals,
          remaining: Math.max(0, nextMilestone.minReferrals - successful),
          bonusCredits: nextMilestone.bonusCredits,
        }
      : null,
    referrals: referrals.map((r) => ({
      id: r.id,
      status: r.status,
      rewardCredits: r.rewardCredits,
      milestoneBonus: r.milestoneBonus,
      createdAt: r.createdAt,
      rewardedAt: r.rewardedAt,
      referred: {
        email: maskEmail(r.referredUser.email),
        name: r.referredUser.name,
        companyName: r.referredUser.companyName,
        createdAt: r.referredUser.createdAt,
      },
    })),
  };
}
