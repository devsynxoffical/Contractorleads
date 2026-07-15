import { prisma } from "@/lib/prisma";

export async function deductCredits(
  userId: string,
  amount: number,
  action: string,
  reference?: string
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.creditsRemaining < amount) throw new Error("INSUFFICIENT_CREDITS");

    const updated = await tx.user.update({
      where: { id: userId },
      data: { creditsRemaining: { decrement: amount } },
    });

    await tx.creditLedger.create({
      data: {
        userId,
        amount: -amount,
        action,
        reference,
      },
    });

    return updated.creditsRemaining;
  });
}

export async function logActivity(
  userId: string,
  type: string,
  message: string,
  metadata?: Record<string, unknown>
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
