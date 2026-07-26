import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncCouponToStripe } from "@/lib/coupons";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requirePermission("revenue");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft-disable in Stripe, then delete our row (redemptions cascade).
  if (existing.stripePromotionCodeId) {
    try {
      const { getStripe, isStripeConfigured } = await import("@/lib/stripe");
      if (await isStripeConfigured()) {
        const stripe = await getStripe();
        await stripe.promotionCodes.update(existing.stripePromotionCodeId, {
          active: false,
        });
      }
    } catch {
      /* ignore */
    }
  }

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: Params) {
  const admin = await requirePermission("revenue");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.action !== "resync") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const synced = await syncCouponToStripe(id);
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    return NextResponse.json({ coupon, synced });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Stripe sync failed",
      },
      { status: 502 },
    );
  }
}
