import { prisma } from "@/lib/prisma";

/** Round money-like credit amounts to 2 decimal places. */
export function roundCredits(amount: number) {
  return Math.round(amount * 100) / 100;
}

/**
 * Atomically subtract credits. Uses a conditional update so concurrent
 * requests cannot push the balance below zero.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  action: string,
  reference?: string,
) {
  const cost = roundCredits(amount);
  if (!Number.isFinite(cost) || cost <= 0) {
    throw new Error("INVALID_CREDIT_AMOUNT");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        creditsRemaining: { gte: cost },
      },
      data: { creditsRemaining: { decrement: cost } },
    });

    if (updated.count !== 1) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, creditsRemaining: true },
      });
      if (!user) throw new Error("USER_NOT_FOUND");
      throw new Error("INSUFFICIENT_CREDITS");
    }

    await tx.creditLedger.create({
      data: {
        userId,
        amount: -cost,
        action,
        reference,
      },
    });

    const fresh = await tx.user.findUnique({
      where: { id: userId },
      select: { creditsRemaining: true },
    });

    return roundCredits(fresh?.creditsRemaining ?? 0);
  });
}

export async function addCredits(
  userId: string,
  amount: number,
  action: string,
  reference?: string,
) {
  const credit = roundCredits(amount);
  if (!Number.isFinite(credit) || credit <= 0) {
    throw new Error("INVALID_CREDIT_AMOUNT");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");

    const updated = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { increment: credit } },
    });

    await tx.creditLedger.create({
      data: {
        userId,
        amount: credit,
        action,
        reference,
      },
    });

    return roundCredits(updated.creditsRemaining);
  });
}

/**
 * Admin / system adjustment (positive or negative). Never lets balance go below 0.
 * Returns the new balance.
 */
export async function adjustCredits(
  userId: string,
  delta: number,
  action: string,
  reference?: string,
) {
  const amount = roundCredits(delta);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("INVALID_CREDIT_AMOUNT");
  }

  return prisma.$transaction(async (tx) => {
    // Serialize adjustments for this user
    await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditsRemaining: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const next = roundCredits(Math.max(0, user.creditsRemaining + amount));
    const applied = roundCredits(next - user.creditsRemaining);

    const updated = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: next },
    });

    if (applied !== 0) {
      await tx.creditLedger.create({
        data: {
          userId,
          amount: applied,
          action,
          reference,
        },
      });
    }

    return roundCredits(updated.creditsRemaining);
  });
}

export async function logActivity(
  userId: string,
  type: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.activityLog.create({
    data: {
      userId,
      type,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
