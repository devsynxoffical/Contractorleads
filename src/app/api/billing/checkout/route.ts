import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractSubscriptionPriceId,
  syncUserSubscription,
} from "@/lib/billing-stripe";
import {
  appBaseUrl,
  getStripe,
  isStripeCheckoutPlan,
  isStripeConfigured,
  priceIdForPlan,
  type StripeCheckoutPlan,
} from "@/lib/stripe";
const ACTIVE_SUB_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "paused",
]);

function stripeErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Stripe request failed";
  const e = err as {
    message?: string;
    raw?: { message?: string };
    type?: string;
  };
  const raw = e.raw?.message || e.message || "Stripe request failed";

  // Translate the most common misconfigurations into actionable messages.
  if (/invalid api key|api_key/i.test(raw) || e.type === "StripeAuthenticationError") {
    return "Stripe API key is invalid. Update it under Admin → System & API Keys.";
  }
  if (/no such price/i.test(raw)) {
    return "A Stripe price ID for this plan is wrong or from a different Stripe mode (test vs live). Fix it under Admin → System & API Keys.";
  }
  if (/similar object exists in (live|test) mode/i.test(raw)) {
    return "Your Stripe keys and price IDs are from different modes (test vs live). Make sure they all come from the same Stripe mode.";
  }
  return raw;
}

function isNoSuchCustomer(err: unknown): boolean {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message)
      : "";
  return /no such customer/i.test(msg);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isStripeConfigured())) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Ask an admin to add keys under Admin → System & API Keys.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const plan = String(body.plan || "").toLowerCase().trim();
  if (!isStripeCheckoutPlan(plan)) {
    return NextResponse.json(
      { error: "Choose starter, growth, or agency." },
      { status: 400 },
    );
  }

  const priceId = await priceIdForPlan(plan as StripeCheckoutPlan);
  if (!priceId) {
    return NextResponse.json(
      { error: `Missing Stripe price for ${plan}. Add it under Admin → System & API Keys.` },
      { status: 503 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
    },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const stripe = await getStripe();

    // Validate the stored customer — a stale ID (e.g. created with test keys,
    // now running live keys) breaks every Stripe call after it.
    let customerId = dbUser.stripeCustomerId;
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ((existing as { deleted?: boolean }).deleted) customerId = null;
      } catch (err) {
        if (isNoSuchCustomer(err)) customerId = null;
        else throw err;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name || dbUser.companyName || undefined,
        metadata: { userId: dbUser.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customerId, stripeSubscriptionId: null },
      });
    }

    // Keep Stripe customer email in sync so invoices / receipts reach the user
    await stripe.customers.update(customerId, {
      email: dbUser.email,
      name: dbUser.name || dbUser.companyName || undefined,
    });

    // Existing paid subscriber → change price on the current subscription
    // (new Checkout would fail or create a second subscription).
    let subscriptionId =
      customerId === dbUser.stripeCustomerId
        ? dbUser.stripeSubscriptionId
        : null;

    // Recover if DB lost the subscription id but Stripe still has one.
    if (!subscriptionId) {
      const listed = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });
      const live = listed.data.find((s) => ACTIVE_SUB_STATUSES.has(s.status));
      if (live) subscriptionId = live.id;
    }

    if (subscriptionId) {
      let existing;
      try {
        existing = await stripe.subscriptions.retrieve(subscriptionId);
      } catch {
        existing = null;
        subscriptionId = null;
      }

      if (existing && ACTIVE_SUB_STATUSES.has(existing.status)) {
        const item = existing.items.data[0];
        if (!item?.id) {
          return NextResponse.json(
            { error: "Could not find your current Stripe subscription item." },
            { status: 500 },
          );
        }

        const currentPriceId = extractSubscriptionPriceId(existing);
        if (currentPriceId === priceId) {
          return NextResponse.json(
            { error: `You are already on the ${plan} plan.` },
            { status: 400 },
          );
        }

        const updated = await stripe.subscriptions.update(existing.id, {
          items: [{ id: item.id, price: priceId }],
          proration_behavior: "create_prorations",
          metadata: {
            ...(existing.metadata || {}),
            userId: dbUser.id,
            plan,
          },
          cancel_at_period_end: false,
        });

        await syncUserSubscription({
          userId: dbUser.id,
          plan,
          subscriptionStatus: updated.status,
          stripeCustomerId: customerId,
          stripeSubscriptionId: updated.id,
          stripePriceId: priceId,
          // Credits refresh on invoice.paid webhook for the prorated invoice.
          grantMonthlyCredits: false,
        });

        return NextResponse.json({
          updated: true,
          plan,
          redirectUrl: `${appBaseUrl(request)}/billing?checkout=success`,
        });
      }
    }

    // No active subscription → Stripe Checkout for a new subscription
    const base = appBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: dbUser.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing?checkout=canceled&session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: true,
      metadata: {
        userId: dbUser.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: dbUser.id,
          plan,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create Checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return NextResponse.json(
      { error: stripeErrorMessage(err) },
      { status: 502 },
    );
  }
}
