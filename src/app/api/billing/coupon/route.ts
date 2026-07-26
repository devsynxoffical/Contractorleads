import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isStripeCheckoutPlan } from "@/lib/stripe";
import { validateCouponForCheckout } from "@/lib/coupons";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? "");
  const planRaw = String(body.plan ?? "").toLowerCase().trim();
  const plan = isStripeCheckoutPlan(planRaw) ? planRaw : undefined;

  const result = await validateCouponForCheckout({
    code,
    userId: user.id,
    plan,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    coupon: {
      code: result.coupon.code,
      name: result.coupon.name,
      discountLabel: result.coupon.discountLabel,
      duration: result.coupon.duration,
    },
  });
}
