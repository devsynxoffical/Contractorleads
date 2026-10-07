import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlan, getPlanMonthlyPrice, type PlanId } from "@/lib/plans";
import { validateCouponForCheckout } from "@/lib/coupons";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isRazorpayConfigured())) {
    return NextResponse.json(
      {
        error:
          "Razorpay is not configured. Ask an admin to add keys under Admin → System & API Keys.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawPlan = String(body.plan || "").toLowerCase().trim();
  const plan = normalizePlan(rawPlan);
  const billingPeriod = body.billingPeriod === "annual" ? "annual" : "monthly";
  const couponCode = String(body.couponCode || "").trim();

  if (plan === "enterprise") {
    return NextResponse.json(
      { error: "Contact sales for Enterprise plans." },
      { status: 400 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      companyName: true,
      plan: true,
      subscriptionStatus: true,
    },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate base price in USD
  const monthlyPrice = await getPlanMonthlyPrice(plan);
  let basePriceUsd = billingPeriod === "annual" ? monthlyPrice * 10 : monthlyPrice; // 2 months free on annual

  let appliedCoupon: Awaited<
    ReturnType<typeof validateCouponForCheckout>
  > | null = null;

  if (couponCode) {
    appliedCoupon = await validateCouponForCheckout({
      code: couponCode,
      userId: user.id,
      plan,
    });
    if (!appliedCoupon.ok) {
      return NextResponse.json(
        { error: appliedCoupon.error },
        { status: 400 },
      );
    }

    if (appliedCoupon.coupon.percentOff) {
      basePriceUsd = Math.max(0, basePriceUsd * (1 - appliedCoupon.coupon.percentOff / 100));
    } else if (appliedCoupon.coupon.amountOffCents) {
      basePriceUsd = Math.max(0, basePriceUsd - appliedCoupon.coupon.amountOffCents / 100);
    }
  }

  const amountCents = Math.max(100, Math.round(basePriceUsd * 100)); // Minimum 100 cents ($1)

  try {
    const { client, keyId } = await getRazorpayClient();
    const receipt = `rcpt_${user.id.slice(-6)}_${Date.now()}`;

    const order = await client.orders.create({
      amount: amountCents,
      currency: "USD",
      receipt,
      notes: {
        userId: user.id,
        plan,
        billingPeriod,
        couponCode: appliedCoupon?.ok ? appliedCoupon.coupon.code : "",
        userEmail: dbUser.email,
      },
    });

    return NextResponse.json({
      provider: "razorpay",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan,
      billingPeriod,
      user: {
        name: dbUser.name || dbUser.companyName || "Customer",
        email: dbUser.email,
        phone: dbUser.phone || "",
      },
      coupon: appliedCoupon?.ok ? appliedCoupon.coupon.discountLabel : undefined,
    });
  } catch (err) {
    console.error("[billing/checkout/razorpay]", err);
    const msg = err instanceof Error ? err.message : "Razorpay order creation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
