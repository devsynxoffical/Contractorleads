import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  appBaseUrl,
  getStripe,
  isStripeCheckoutPlan,
  isStripeConfigured,
  priceIdForPlan,
} from "@/lib/stripe";

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

  const priceId = await priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: `Missing Stripe price for ${plan}` },
      { status: 503 },
    );
  }

  const stripe = await getStripe();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      stripeCustomerId: true,
    },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let customerId = dbUser.stripeCustomerId;
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

  const base = appBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: dbUser.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing?checkout=success`,
    cancel_url: `${base}/billing?checkout=canceled`,
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
}
