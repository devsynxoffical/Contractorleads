import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isStripeConfigured())) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer yet. Subscribe to a plan first." },
      { status: 400 },
    );
  }

  try {
    const stripe = await getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${appBaseUrl(request)}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/portal]", err);
    const raw =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: string }).message)
        : "Could not open billing portal";
    let message = raw;
    if (/no configuration provided|default configuration/i.test(raw)) {
      message =
        "Stripe Customer Portal is not enabled. Turn it on in the Stripe dashboard: Settings → Billing → Customer portal.";
    } else if (/no such customer/i.test(raw)) {
      message =
        "Your Stripe customer record is out of date (test vs live keys). Subscribe to a plan to recreate it.";
    } else if (/invalid api key/i.test(raw)) {
      message =
        "Stripe API key is invalid. Update it under Admin → System & API Keys.";
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
