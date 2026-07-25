import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  appBaseUrl,
  getStripe,
  isMessagingAddonConfigured,
  messagingAddonPriceId,
} from "@/lib/stripe";
import {
  MESSAGING_ADDON_PRICE_USD,
  hasMessagingAddon,
} from "@/lib/messaging-addon";

const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

function isNoSuchCustomer(err: unknown): boolean {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message)
      : "";
  return /no such customer/i.test(msg);
}

function stripeErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Stripe request failed";
  const e = err as { message?: string; raw?: { message?: string }; type?: string };
  const raw = e.raw?.message || e.message || "Stripe request failed";
  if (/no such price/i.test(raw)) {
    return "The Messaging add-on price is not configured correctly. Ask an admin to check Admin → System & API Keys.";
  }
  return raw;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
      messagingAddonSubId: true,
    },
  });

  return NextResponse.json({
    active: dbUser ? hasMessagingAddon(dbUser) : false,
    status: dbUser?.messagingAddonStatus ?? "inactive",
    comped: Boolean(dbUser?.messagingAddonManual),
    priceUsd: MESSAGING_ADDON_PRICE_USD,
    available: await isMessagingAddonConfigured(),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isMessagingAddonConfigured())) {
    return NextResponse.json(
      {
        error:
          "The Messaging add-on is not available yet. Ask an admin to configure its Stripe price.",
      },
      { status: 503 },
    );
  }

  const priceId = await messagingAddonPriceId();
  if (!priceId) {
    return NextResponse.json(
      { error: "Messaging add-on price is not configured." },
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
      role: true,
      stripeCustomerId: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
      messagingAddonSubId: true,
    },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (hasMessagingAddon(dbUser)) {
    return NextResponse.json(
      { error: "You already have the Messaging add-on." },
      { status: 400 },
    );
  }

  try {
    const stripe = await getStripe();

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
        data: { stripeCustomerId: customerId },
      });
    }

    const base = appBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: dbUser.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?addon=active&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing?addon=canceled`,
      allow_promotion_codes: true,
      metadata: { userId: dbUser.id, addon: "messaging" },
      subscription_data: {
        metadata: { userId: dbUser.id, addon: "messaging" },
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
    console.error("[billing/messaging-addon]", err);
    return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 502 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, messagingAddonSubId: true, messagingAddonManual: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (dbUser.messagingAddonManual) {
    return NextResponse.json(
      { error: "Your Messaging add-on was granted by an admin. Contact support to change it." },
      { status: 400 },
    );
  }

  if (!dbUser.messagingAddonSubId) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { messagingAddonStatus: "canceled" },
    });
    return NextResponse.json({ ok: true, status: "canceled" });
  }

  try {
    const stripe = await getStripe();
    await stripe.subscriptions.update(dbUser.messagingAddonSubId, {
      cancel_at_period_end: true,
    });
    return NextResponse.json({ ok: true, status: "canceling" });
  } catch (err) {
    console.error("[billing/messaging-addon DELETE]", err);
    return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 502 });
  }
}
