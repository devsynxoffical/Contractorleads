import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  extractSubscriptionPriceId,
  notifyCheckoutAbandoned,
  planFromSubscription,
  resolveUserIdFromStripeCustomer,
  syncUserSubscription,
} from "@/lib/billing-stripe";
import { getStripe, getStripeWebhookSecret, planFromPriceId } from "@/lib/stripe";
import { normalizePlan, planLabel } from "@/lib/plans";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { logActivity } from "@/lib/credits";

export const runtime = "nodejs";

function formatMoney(amountCents: number, currency: string) {
  const code = (currency || "usd").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${code}`;
  }
}

async function sendReceiptForInvoice(
  userId: string,
  invoice: Stripe.Invoice,
  plan: string,
) {
  if (!invoice.id || invoice.amount_paid <= 0) return;

  const already = await prisma.activityLog.findFirst({
    where: {
      userId,
      type: "payment_receipt_email",
      message: { contains: invoice.id },
    },
    select: { id: true },
  });
  if (already) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email) return;

  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : invoice.created
      ? new Date(invoice.created * 1000)
      : new Date();

  try {
    const result = await sendPaymentReceiptEmail({
      userId,
      to: user.email,
      name: user.name,
      planName: planLabel(plan),
      amountLabel: formatMoney(invoice.amount_paid, invoice.currency),
      invoiceNumber: invoice.number || invoice.id,
      paidAtLabel: paidAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
    });
    await logActivity(
      userId,
      "payment_receipt_email",
      `Payment receipt emailed for invoice ${invoice.id}`,
      {
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        emailOk: result.ok,
      },
    );
  } catch (err) {
    console.error("payment receipt email failed", err);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.userId ||
    session.client_reference_id ||
    (await resolveUserIdFromStripeCustomer(
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id,
    ));
  if (!userId) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  let plan = session.metadata?.plan
    ? normalizePlan(session.metadata.plan)
    : null;
  let priceId: string | null = null;
  let status = "active";

  if (subscriptionId) {
    const stripe = await getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    status = sub.status;
    priceId = extractSubscriptionPriceId(sub);
    plan = (await planFromSubscription(sub)) || plan;
  }

  if (!plan || plan === "enterprise") {
    plan = normalizePlan(session.metadata?.plan || "starter");
  }

  await syncUserSubscription({
    userId,
    plan,
    subscriptionStatus: status,
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    grantMonthlyCredits: false,
  });
}

/** User started Checkout but never paid (left or session timed out). */
async function handleCheckoutAbandoned(
  session: Stripe.Checkout.Session,
  reason: "canceled" | "expired",
) {
  // Only incomplete / open / expired unpaid sessions.
  if (session.status === "complete" || session.payment_status === "paid") {
    return;
  }

  const userId =
    session.metadata?.userId ||
    session.client_reference_id ||
    (await resolveUserIdFromStripeCustomer(
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id,
    ));
  if (!userId || !session.id) return;

  await notifyCheckoutAbandoned({
    userId,
    sessionId: session.id,
    plan: session.metadata?.plan ?? null,
    reason,
  });
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const userId =
    sub.metadata?.userId ||
    (await resolveUserIdFromStripeCustomer(
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    ));
  if (!userId) return;

  const priceId = extractSubscriptionPriceId(sub);
  let plan = await planFromSubscription(sub);

  if (sub.status === "canceled" || sub.status === "unpaid") {
    await syncUserSubscription({
      userId,
      plan:
        plan ||
        normalizePlan(
          (
            await prisma.user.findUnique({
              where: { id: userId },
              select: { plan: true },
            })
          )?.plan,
        ),
      subscriptionStatus: sub.status === "canceled" ? "canceled" : "unpaid",
      stripeCustomerId:
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      grantMonthlyCredits: false,
    });
    return;
  }

  if (!plan) return;

  await syncUserSubscription({
    userId,
    plan,
    subscriptionStatus: sub.status,
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    grantMonthlyCredits: false,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId =
    sub.metadata?.userId ||
    (await resolveUserIdFromStripeCustomer(
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    ));
  if (!userId) return;

  await syncUserSubscription({
    userId,
    plan: "starter",
    subscriptionStatus: "canceled",
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripeSubscriptionId: null,
    stripePriceId: null,
    grantMonthlyCredits: false,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  const userId = await resolveUserIdFromStripeCustomer(customerId);
  if (!userId) return;

  const parentSub = invoice.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof parentSub === "string" ? parentSub : parentSub?.id ?? null;

  let plan = null as ReturnType<typeof normalizePlan> | null;
  let priceId: string | null = null;
  let status = "active";

  if (subscriptionId) {
    const stripe = await getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    status = sub.status;
    priceId = extractSubscriptionPriceId(sub);
    plan = await planFromSubscription(sub);
  }

  if (!plan) {
    const linePrice = invoice.lines?.data?.[0]?.pricing?.price_details?.price;
    if (typeof linePrice === "string") {
      plan = await planFromPriceId(linePrice);
      priceId = linePrice;
    }
  }

  if (!plan) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    plan = normalizePlan(existing?.plan);
  }

  if (plan === "enterprise") return;

  await syncUserSubscription({
    userId,
    plan,
    subscriptionStatus: status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    grantMonthlyCredits: true,
    invoiceId: invoice.id,
  });

  await sendReceiptForInvoice(userId, invoice, plan);
}

export async function POST(request: Request) {
  const secret = await getStripeWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "checkout.session.expired":
        await handleCheckoutAbandoned(
          event.data.object as Stripe.Checkout.Session,
          "expired",
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
