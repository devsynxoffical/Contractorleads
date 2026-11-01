import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";
import { getStripeBillingSecrets } from "@/lib/stripe-config";
import {
  fulfillCheckoutSession,
  fulfillMessagingAddonSession,
  fulfillSeoReportSession,
  isMessagingAddonSubscription,
  planFromSubscription,
  extractSubscriptionPriceId,
  resolveUserIdFromStripeCustomer,
  syncMessagingAddonSubscription,
  syncUserSubscription,
} from "@/lib/billing-stripe";
import { refundReferralSale } from "@/lib/referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_LOG_TYPE = "stripe_event";

function idOf(
  ref: string | { id?: string | null } | null | undefined,
): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id ?? null;
}

async function alreadyProcessed(eventId: string) {
  const row = await prisma.activityLog.findFirst({
    where: { type: EVENT_LOG_TYPE, metadata: { contains: eventId } },
    select: { id: true },
  });
  return Boolean(row);
}

async function markProcessed(
  userId: string | null,
  event: Stripe.Event,
  outcome: Record<string, unknown>,
) {
  // ActivityLog requires a user; events we could not attribute are only logged.
  if (!userId) {
    console.info("[stripe webhook] processed (no user)", event.type, event.id);
    return;
  }
  await logActivity(userId, EVENT_LOG_TYPE, `Stripe ${event.type}`, {
    eventId: event.id,
    type: event.type,
    ...outcome,
  });
}

/** userId for an invoice: customer mapping first, then metadata. */
async function userIdForInvoice(invoice: Stripe.Invoice) {
  const fromCustomer = await resolveUserIdFromStripeCustomer(
    idOf(invoice.customer),
  );
  if (fromCustomer) return fromCustomer;
  const subMeta = invoice.parent?.subscription_details?.metadata ?? null;
  return (
    subMeta?.userId?.trim() || invoice.metadata?.userId?.trim() || null
  );
}

async function userIdForSubscription(sub: Stripe.Subscription) {
  const fromCustomer = await resolveUserIdFromStripeCustomer(idOf(sub.customer));
  if (fromCustomer) return fromCustomer;
  const fromMeta = sub.metadata?.userId?.trim();
  if (fromMeta) return fromMeta;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: sub.id }, { messagingAddonSubId: sub.id }],
    },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.userId?.trim() || session.client_reference_id || null;
  if (!userId) return { userId: null, result: "no_user" };

  const addon = session.metadata?.addon;
  if (addon === "messaging") {
    const r = await fulfillMessagingAddonSession({ sessionId: session.id, userId });
    return { userId, result: r.ok ? "messaging_fulfilled" : r.reason ?? "failed" };
  }
  if (addon === "seo_report") {
    const r = await fulfillSeoReportSession({ sessionId: session.id, userId });
    return { userId, result: r.ok ? "seo_report_fulfilled" : r.reason ?? "failed" };
  }
  // Plan checkout — dedupes credits by invoice id and commission by invoiceId.
  const r = await fulfillCheckoutSession({ sessionId: session.id, userId });
  return { userId, result: r.ok ? `plan_${r.plan}` : r.reason ?? "failed" };
}

async function handleInvoicePaid(invoice: Stripe.Invoice, stripe: Stripe) {
  const userId = await userIdForInvoice(invoice);
  if (!userId) return { userId: null, result: "no_user" };

  const amountPaidCents = invoice.amount_paid ?? 0;
  if (amountPaidCents <= 0) {
    // Trial start / $0 invoice — nothing was paid, no commission, no credits.
    return { userId, result: "zero_amount" };
  }

  const subId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subId) return { userId, result: "no_subscription" };

  const subscription = await stripe.subscriptions.retrieve(subId);
  if (await isMessagingAddonSubscription(subscription)) {
    await syncMessagingAddonSubscription({
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    return { userId, result: "messaging_addon_synced" };
  }

  const plan = await planFromSubscription(subscription);
  if (!plan || plan === "enterprise") return { userId, result: "unknown_plan" };

  const isInitial = invoice.billing_reason === "subscription_create";
  await syncUserSubscription({
    userId,
    plan,
    subscriptionStatus: subscription.status,
    stripeCustomerId: idOf(invoice.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId: extractSubscriptionPriceId(subscription),
    grantMonthlyCredits: true,
    invoiceId: invoice.id,
    amountUsd: amountPaidCents / 100,
    isRenewal: !isInitial,
  });
  return {
    userId,
    result: isInitial ? "initial_paid" : "renewal_paid",
    amountUsd: amountPaidCents / 100,
  };
}

async function handleSubscriptionChange(
  sub: Stripe.Subscription,
  deleted: boolean,
) {
  const userId = await userIdForSubscription(sub);
  if (!userId) return { userId: null, result: "no_user" };

  const status = deleted ? "canceled" : sub.status;

  if (await isMessagingAddonSubscription(sub)) {
    await syncMessagingAddonSubscription({
      userId,
      subscriptionId: sub.id,
      status,
      canceled: deleted,
    });
    return { userId, result: `messaging_${status}` };
  }

  const plan = await planFromSubscription(sub);
  if (!plan || plan === "enterprise") return { userId, result: "unknown_plan" };

  // Status-only sync: no invoiceId so no credits and no commission.
  await syncUserSubscription({
    userId,
    plan,
    subscriptionStatus: status,
    stripeCustomerId: idOf(sub.customer),
    stripeSubscriptionId: deleted ? null : sub.id,
    stripePriceId: extractSubscriptionPriceId(sub),
  });
  return { userId, result: `subscription_${status}` };
}

async function invoiceIdForCharge(charge: Stripe.Charge, stripe: Stripe) {
  // Older API versions expose charge.invoice directly.
  const direct = idOf(
    (charge as unknown as { invoice?: string | { id?: string } | null }).invoice,
  );
  if (direct) return direct;
  const paymentIntent = idOf(charge.payment_intent);
  if (!paymentIntent) return null;
  const payments = await stripe.invoicePayments.list({
    payment: { type: "payment_intent", payment_intent: paymentIntent },
    limit: 1,
  });
  return idOf(payments.data[0]?.invoice as string | { id?: string } | undefined);
}

async function handleChargeRefunded(charge: Stripe.Charge, stripe: Stripe) {
  const userId = await resolveUserIdFromStripeCustomer(idOf(charge.customer));
  const invoiceId = await invoiceIdForCharge(charge, stripe);
  if (!invoiceId) return { userId, result: "no_invoice" };

  const r = await refundReferralSale({
    invoiceId,
    reason: charge.refunded ? "charge_refunded" : "charge_partially_refunded",
  });
  return {
    userId,
    result: r.reversed ? "commission_reversed" : r.reason,
    invoiceId,
    debitedUsd: r.reversed ? r.debitedUsd : 0,
  };
}

export async function POST(request: Request) {
  const { webhookSecret } = await getStripeBillingSecrets();
  if (!webhookSecret) {
    console.warn(
      "[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured — event ignored",
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const raw = await request.text();
  let stripe: Stripe;
  let event: Stripe.Event;
  try {
    stripe = await getStripe();
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch (err) {
    console.warn("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (await alreadyProcessed(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    let outcome: { userId: string | null; result: string } & Record<
      string,
      unknown
    >;

    switch (event.type) {
      case "checkout.session.completed":
        outcome = await handleCheckoutCompleted(event.data.object);
        break;
      case "invoice.paid":
        outcome = await handleInvoicePaid(event.data.object, stripe);
        break;
      case "customer.subscription.updated":
        outcome = await handleSubscriptionChange(event.data.object, false);
        break;
      case "customer.subscription.deleted":
        outcome = await handleSubscriptionChange(event.data.object, true);
        break;
      case "charge.refunded":
        outcome = await handleChargeRefunded(event.data.object, stripe);
        break;
      default:
        return NextResponse.json({ received: true, ignored: event.type });
    }

    const { userId, ...rest } = outcome;
    await markProcessed(userId, event, rest);
    return NextResponse.json({ received: true, ...rest });
  } catch (err) {
    console.error("[stripe webhook error]", event.type, event.id, err);
    // 500 makes Stripe retry; the event-id check keeps retries idempotent.
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 },
    );
  }
}
