import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRazorpayBillingSecrets } from "@/lib/razorpay-config";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { activateUserPlanWithRazorpay } from "@/lib/billing-razorpay";
import { recordCouponRedemption, validateCouponForCheckout } from "@/lib/coupons";
import { normalizePlan } from "@/lib/plans";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.razorpay_order_id || "").trim();
  const paymentId = String(body.razorpay_payment_id || "").trim();
  const signature = String(body.razorpay_signature || "").trim();
  const plan = normalizePlan(body.plan);
  const billingPeriod = body.billingPeriod === "annual" ? "annual" : "monthly";
  const couponCode = String(body.couponCode || "").trim();

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "Incomplete payment verification payload from Razorpay." },
      { status: 400 },
    );
  }

  const secrets = await getRazorpayBillingSecrets();
  const isValid = verifyRazorpaySignature({
    orderId,
    paymentId,
    signature,
    keySecret: secrets.keySecret,
  });

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid payment signature. Verification failed." },
      { status: 400 },
    );
  }

  // Activate Plan & Allocate Monthly Credits
  const updatedUser = await activateUserPlanWithRazorpay({
    userId: user.id,
    plan,
    billingPeriod,
    orderId,
    paymentId,
    couponCode,
  });

  if (couponCode) {
    const couponValidation = await validateCouponForCheckout({
      code: couponCode,
      userId: user.id,
      plan,
    });
    if (couponValidation.ok) {
      await recordCouponRedemption({
        couponId: couponValidation.coupon.id,
        userId: user.id,
        plan,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    plan,
    redirectUrl: "/billing?checkout=active",
  });
}
