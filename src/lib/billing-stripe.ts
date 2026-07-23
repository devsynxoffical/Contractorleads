import { prisma } from "@/lib/prisma";
import { integrationFlagsForPlan } from "@/lib/api-access";
import { applyReferralCommissionOnPurchase } from "@/lib/referrals";
import { logActivity } from "@/lib/credits";
import { normalizePlan, type PlanId } from "@/lib/plans";
import {
  PLAN_MONTHLY_CREDITS,
  planFromPriceId,
  type StripeCheckoutPlan,
} from "@/lib/stripe";

function mapStripeStatus(status: string | null | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "active") return "active";
  if (s === "trialing") return "trialing";
  if (s === "past_due") return "past_due";
  if (s === "unpaid") return "unpaid";
  if (s === "canceled" || s === "cancelled") return "canceled";
  if (s === "incomplete" || s === "incomplete_expired") return "incomplete";
  if (s === "paused") return "paused";
  return s || "active";
}

export async function syncUserSubscription(opts: {
  userId: string;
  plan: PlanId | StripeCheckoutPlan;
  subscriptionStatus: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  /** When true, reset creditsRemaining to the plan monthly allotment */
  grantMonthlyCredits?: boolean;
  invoiceId?: string | null;
}) {
  const previous = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      creditsRemaining: true,
    },
  });
  if (!previous) return null;

  const plan = normalizePlan(opts.plan);
  const flags = integrationFlagsForPlan(plan);
  const status = mapStripeStatus(opts.subscriptionStatus);

  const data: {
    plan: string;
    subscriptionStatus: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    apiEnabled: boolean;
    mcpEnabled: boolean;
    ssoEnabled: boolean;
    apiMonthlyLimit: number;
    creditsRemaining?: number;
  } = {
    plan,
    subscriptionStatus: status,
    apiEnabled: flags.apiEnabled,
    mcpEnabled: flags.mcpEnabled,
    ssoEnabled: flags.ssoEnabled,
    apiMonthlyLimit: flags.apiMonthlyLimit,
  };

  if (opts.stripeCustomerId !== undefined) {
    data.stripeCustomerId = opts.stripeCustomerId;
  }
  if (opts.stripeSubscriptionId !== undefined) {
    data.stripeSubscriptionId = opts.stripeSubscriptionId;
  }
  if (opts.stripePriceId !== undefined) {
    data.stripePriceId = opts.stripePriceId;
  }

  let creditGrant: number | null = null;
  if (opts.grantMonthlyCredits) {
    const allotment =
      PLAN_MONTHLY_CREDITS[plan as StripeCheckoutPlan] ?? null;
    const reference =
      opts.invoiceId || opts.stripeSubscriptionId || `plan:${plan}`;
    if (allotment != null) {
      const already = await prisma.creditLedger.findFirst({
        where: {
          userId: opts.userId,
          action: "stripe_plan_credits",
          reference,
        },
        select: { id: true },
      });
      if (!already) {
        data.creditsRemaining = allotment;
        creditGrant = allotment;
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: opts.userId },
      data,
    });

    if (creditGrant != null) {
      await tx.creditLedger.create({
        data: {
          userId: opts.userId,
          amount: creditGrant,
          action: "stripe_plan_credits",
          reference: opts.invoiceId || opts.stripeSubscriptionId || plan,
        },
      });
    }

    return user;
  });

  await applyReferralCommissionOnPurchase({
    userId: opts.userId,
    plan,
    previousPlan: previous.plan,
    subscriptionStatus: status,
  });

  await logActivity(
    opts.userId,
    "stripe_subscription_sync",
    `Subscription synced to ${plan} (${status})`,
    {
      plan,
      status,
      previousPlan: previous.plan,
      creditsGranted: creditGrant,
    },
  );

  return updated;
}

export async function resolveUserIdFromStripeCustomer(
  customerId: string | null | undefined,
) {
  if (!customerId) return null;
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export function extractSubscriptionPriceId(subscription: {
  items?: { data?: Array<{ price?: { id?: string } | string | null }> };
}): string | null {
  const item = subscription.items?.data?.[0];
  if (!item?.price) return null;
  if (typeof item.price === "string") return item.price;
  return item.price.id ?? null;
}

export async function planFromSubscription(subscription: {
  items?: { data?: Array<{ price?: { id?: string } | string | null }> };
  metadata?: Record<string, string> | null;
}): Promise<PlanId | null> {
  const fromMeta = subscription.metadata?.plan;
  if (fromMeta) {
    const n = normalizePlan(fromMeta);
    if (n === "starter" || n === "growth" || n === "agency") return n;
  }
  return planFromPriceId(extractSubscriptionPriceId(subscription));
}
