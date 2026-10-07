import { prisma } from "@/lib/prisma";
import { integrationFlagsForPlan } from "@/lib/api-access";
import { applyReferralCommissionOnPurchase } from "@/lib/referrals";
import { logActivity } from "@/lib/credits";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { normalizePlan, planLabel, type PlanId, PLAN_MONTHLY_CREDITS } from "@/lib/plans";
import { CREDIT_COSTS } from "@/lib/constants";

export async function activateUserPlanWithRazorpay(opts: {
  userId: string;
  plan: PlanId | string;
  billingPeriod?: "monthly" | "annual";
  orderId?: string | null;
  paymentId?: string | null;
  amountPaidCents?: number;
  couponCode?: string | null;
}) {
  const previous = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: {
      id: true,
      plan: true,
      subscriptionStatus: true,
      creditsRemaining: true,
      email: true,
      name: true,
    },
  });
  if (!previous) return null;

  const plan = normalizePlan(opts.plan);
  const flags = integrationFlagsForPlan(plan);
  const allotment = PLAN_MONTHLY_CREDITS[plan as Exclude<PlanId, "enterprise">] ?? 500;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: opts.userId },
      data: {
        plan,
        subscriptionStatus: "active",
        razorpayPaymentId: opts.paymentId ?? undefined,
        razorpayOrderId: opts.orderId ?? undefined,
        apiEnabled: flags.apiEnabled,
        mcpEnabled: flags.mcpEnabled,
        ssoEnabled: flags.ssoEnabled,
        apiMonthlyLimit: flags.apiMonthlyLimit,
        creditsRemaining: allotment,
      },
    });

    await tx.creditLedger.create({
      data: {
        userId: opts.userId,
        amount: allotment,
        action: "razorpay_plan_credits",
        reference: opts.paymentId || opts.orderId || `plan:${plan}`,
      },
    });

    return user;
  });

  // Commission & referral
  await applyReferralCommissionOnPurchase({
    userId: opts.userId,
    plan,
    previousPlan: previous.plan,
    subscriptionStatus: "active",
  });

  // Send confirmation email
  if (previous.email) {
    const monthlyLeads = Math.round(allotment / CREDIT_COSTS.lead);
    try {
      await sendPurchaseConfirmationEmail({
        userId: opts.userId,
        to: previous.email,
        name: previous.name,
        planName: planLabel(plan),
        monthlyCredits: allotment,
        monthlyLeads,
        isUpgrade: previous.plan !== "starter" && previous.plan !== plan,
      });
    } catch (err) {
      console.error("purchase confirmation email failed", err);
    }
  }

  await logActivity(
    opts.userId,
    "razorpay_plan_purchase",
    `Plan activated: ${planLabel(plan)} via Razorpay`,
    {
      plan,
      orderId: opts.orderId,
      paymentId: opts.paymentId,
      creditsGranted: allotment,
    },
  );

  return updated;
}

export async function activateMessagingAddonWithRazorpay(opts: {
  userId: string;
  orderId?: string | null;
  paymentId?: string | null;
}) {
  const updated = await prisma.user.update({
    where: { id: opts.userId },
    data: {
      messagingAddonStatus: "active",
      messagingAddonManual: true,
      razorpayPaymentId: opts.paymentId ?? undefined,
    },
  });

  await logActivity(
    opts.userId,
    "messaging_addon_purchase",
    "Messaging add-on activated ($30/mo)",
    { orderId: opts.orderId, paymentId: opts.paymentId },
  );

  return updated;
}
