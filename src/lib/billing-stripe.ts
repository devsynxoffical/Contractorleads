import { prisma } from "@/lib/prisma";
import { integrationFlagsForPlan } from "@/lib/api-access";
import { applyReferralCommissionOnPurchase } from "@/lib/referrals";
import { logActivity } from "@/lib/credits";
import { sendCheckoutAbandonedEmail, sendPurchaseConfirmationEmail } from "@/lib/email";
import { normalizePlan, planLabel, type PlanId } from "@/lib/plans";
import { normalizeAddonStatus } from "@/lib/messaging-addon";
import {
  getStripe,
  messagingAddonPriceId,
  PLAN_MONTHLY_CREDITS,
  planFromPriceId,
  type StripeCheckoutPlan,
} from "@/lib/stripe";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const ABANDONED_EMAIL_TYPE = "checkout_abandoned_email";

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
      email: true,
      name: true,
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

  // Thank-you / confirmation email on a NEW paid activation or a plan change.
  // Not sent on monthly renewals (same plan, already active).
  const wasActive = ACTIVE_STATUSES.has(
    mapStripeStatus(previous.subscriptionStatus),
  );
  const isNowActive = ACTIVE_STATUSES.has(status);
  const isNewActivation = isNowActive && !wasActive;
  const isPlanChange =
    isNowActive && normalizePlan(previous.plan) !== plan;

  if (previous.email && (isNewActivation || isPlanChange)) {
    const monthlyCredits =
      PLAN_MONTHLY_CREDITS[plan as StripeCheckoutPlan] ?? null;
    const monthlyLeads =
      monthlyCredits != null ? Math.round(monthlyCredits / 1.33) : null;
    try {
      await sendPurchaseConfirmationEmail({
        userId: opts.userId,
        to: previous.email,
        name: previous.name,
        planName: planLabel(plan),
        monthlyCredits,
        monthlyLeads,
        isUpgrade: isPlanChange && !isNewActivation,
      });
    } catch (err) {
      console.error("purchase confirmation email failed", err);
    }
  }

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

/* ------------------------------------------------------------------ */
/* Messaging add-on ($15.50/mo) — separate subscription, gates bulk email + SMS */
/* ------------------------------------------------------------------ */

type AddonSubscription = {
  id: string;
  status: string;
  metadata?: Record<string, string> | null;
  customer?: string | { id?: string } | null;
  cancel_at_period_end?: boolean;
  items?: { data?: Array<{ price?: { id?: string } | string | null }> };
};

/** True when a Stripe subscription is the Messaging add-on (by metadata or price). */
export async function isMessagingAddonSubscription(
  sub: AddonSubscription,
): Promise<boolean> {
  if (sub.metadata?.addon === "messaging") return true;
  const priceId = extractSubscriptionPriceId(sub);
  const addonPrice = await messagingAddonPriceId();
  return Boolean(priceId && addonPrice && priceId === addonPrice);
}

/** Apply a Messaging add-on subscription's status to the user record. */
export async function syncMessagingAddonSubscription(opts: {
  userId: string;
  subscriptionId: string | null;
  status: string;
  canceled?: boolean;
}) {
  const status = opts.canceled ? "canceled" : normalizeAddonStatus(opts.status);
  await prisma.user.update({
    where: { id: opts.userId },
    data: {
      messagingAddonStatus: status,
      messagingAddonSubId: opts.canceled ? null : opts.subscriptionId,
    },
  });
  await logActivity(
    opts.userId,
    "messaging_addon_sync",
    `Messaging add-on ${status}`,
    { status, subscriptionId: opts.subscriptionId },
  );
  return status;
}

/**
 * Fulfill a Messaging add-on Checkout session on the success redirect
 * (so it activates even when webhooks are delayed).
 */
export async function fulfillMessagingAddonSession(opts: {
  sessionId: string;
  userId: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const sessionId = opts.sessionId.trim();
  if (!sessionId) return { ok: false, reason: "missing_session" };
  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionUserId =
      session.metadata?.userId || session.client_reference_id || null;
    if (!sessionUserId || sessionUserId !== opts.userId) {
      return { ok: false, reason: "user_mismatch" };
    }
    if (session.metadata?.addon !== "messaging") {
      return { ok: false, reason: "not_messaging_addon" };
    }

    const subRaw = session.subscription;
    const subscription =
      typeof subRaw === "string"
        ? await stripe.subscriptions.retrieve(subRaw)
        : subRaw && typeof subRaw === "object"
          ? subRaw
          : null;

    const paid =
      session.status === "complete" ||
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    if (!paid && !subscription) return { ok: false, reason: "not_paid" };

    await syncMessagingAddonSubscription({
      userId: opts.userId,
      subscriptionId: subscription?.id ?? null,
      status: subscription?.status || "active",
    });
    return { ok: true };
  } catch (err) {
    console.error("fulfillMessagingAddonSession", err);
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "fulfill_failed",
    };
  }
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

/**
 * Apply a completed Stripe Checkout session to the user immediately
 * (plan + features + monthly credits). Used on the billing success redirect
 * so upgrades work even when webhooks are delayed or not configured yet.
 */
export async function fulfillCheckoutSession(opts: {
  sessionId: string;
  userId: string;
}): Promise<{
  ok: boolean;
  plan?: PlanId;
  reason?: string;
}> {
  const sessionId = opts.sessionId.trim();
  if (!sessionId) return { ok: false, reason: "missing_session" };

  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "subscription.latest_invoice", "invoice"],
    });

    const sessionUserId =
      session.metadata?.userId || session.client_reference_id || null;
    if (!sessionUserId || sessionUserId !== opts.userId) {
      return { ok: false, reason: "user_mismatch" };
    }

    const paid =
      session.status === "complete" ||
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    if (!paid) return { ok: false, reason: "not_paid" };

    let plan: PlanId | null = session.metadata?.plan
      ? normalizePlan(session.metadata.plan)
      : null;
    if (plan === "enterprise") plan = null;

    const subRaw = session.subscription;
    const subscription =
      typeof subRaw === "string"
        ? await stripe.subscriptions.retrieve(subRaw)
        : subRaw && typeof subRaw === "object"
          ? subRaw
          : null;

    let priceId: string | null = null;
    let status = "active";
    let invoiceId: string | null =
      typeof session.invoice === "string"
        ? session.invoice
        : session.invoice && typeof session.invoice === "object"
          ? session.invoice.id ?? null
          : null;

    if (subscription) {
      status = subscription.status;
      priceId = extractSubscriptionPriceId(subscription);
      plan = (await planFromSubscription(subscription)) || plan;

      const latest = (
        subscription as {
          latest_invoice?: string | { id?: string } | null;
        }
      ).latest_invoice;
      if (!invoiceId && latest) {
        invoiceId = typeof latest === "string" ? latest : latest.id ?? null;
      }
    }

    if (!plan || (plan !== "starter" && plan !== "growth" && plan !== "agency")) {
      return { ok: false, reason: "unknown_plan" };
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    await syncUserSubscription({
      userId: opts.userId,
      plan,
      subscriptionStatus: status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription?.id ?? null,
      stripePriceId: priceId,
      // Grant plan credits now — webhook invoice.paid uses the same invoice id
      // so the ledger dedupes and will not double-grant.
      grantMonthlyCredits: true,
      invoiceId: invoiceId || `checkout:${session.id}`,
    });

    const couponId = session.metadata?.couponId?.trim();
    if (couponId) {
      const { recordCouponRedemption } = await import("@/lib/coupons");
      await recordCouponRedemption({
        couponId,
        userId: opts.userId,
        plan,
        checkoutSessionId: session.id,
      });
    }

    return { ok: true, plan };
  } catch (err) {
    console.error("fulfillCheckoutSession", err);
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "fulfill_failed",
    };
  }
}

/**
 * Email when a user starts Stripe Checkout but leaves / lets it expire.
 * Deduped per Checkout session so cancel + expired don't double-send.
 */
export async function notifyCheckoutAbandoned(opts: {
  userId: string;
  sessionId: string;
  plan?: string | null;
  reason?: "canceled" | "expired";
}) {
  const sessionId = opts.sessionId.trim();
  if (!sessionId || !opts.userId) return { sent: false as const, reason: "missing" };

  const already = await prisma.activityLog.findFirst({
    where: {
      userId: opts.userId,
      type: ABANDONED_EMAIL_TYPE,
      message: { contains: sessionId },
    },
    select: { id: true },
  });
  if (already) return { sent: false as const, reason: "already_sent" };

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { email: true, name: true, plan: true, subscriptionStatus: true },
  });
  if (!user?.email) return { sent: false as const, reason: "no_email" };

  // Skip if they already completed a paid subscription somehow.
  if (ACTIVE_STATUSES.has(mapStripeStatus(user.subscriptionStatus))) {
    const current = normalizePlan(user.plan);
    const attempted = opts.plan ? normalizePlan(opts.plan) : null;
    if (attempted && current === attempted) {
      return { sent: false as const, reason: "already_subscribed" };
    }
  }

  const planName = planLabel(opts.plan || "growth");

  try {
    const result = await sendCheckoutAbandonedEmail({
      userId: opts.userId,
      to: user.email,
      name: user.name,
      planName,
    });
    await logActivity(
      opts.userId,
      ABANDONED_EMAIL_TYPE,
      `Abandoned checkout email for session ${sessionId}`,
      {
        sessionId,
        plan: opts.plan ?? null,
        reason: opts.reason ?? "canceled",
        emailOk: result.ok,
        mocked: result.mocked ?? false,
      },
    );
    return { sent: result.ok, reason: result.ok ? "sent" : "email_failed" };
  } catch (err) {
    console.error("checkout abandoned email failed", err);
    return { sent: false as const, reason: "error" };
  }
}
