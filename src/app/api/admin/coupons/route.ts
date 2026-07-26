import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCoupon,
  formatCouponDiscount,
  normalizeCouponCode,
  parseApplicablePlans,
  syncCouponToStripe,
} from "@/lib/coupons";

export async function GET() {
  const admin = await requirePermission("revenue");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return NextResponse.json({
    coupons: coupons.map((c) => ({
      ...c,
      discountLabel: formatCouponDiscount(c),
      applicablePlans: parseApplicablePlans(c.applicablePlansJson),
      redemptionCount: Math.max(c.redemptionCount, c._count.redemptions),
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requirePermission("revenue");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const code = normalizeCouponCode(String(body.code ?? ""));
    if (code.length < 3) {
      return NextResponse.json(
        { error: "Code must be at least 3 letters/numbers" },
        { status: 400 },
      );
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 },
      );
    }

    const expiresAt =
      body.expiresAt && String(body.expiresAt).trim()
        ? new Date(String(body.expiresAt))
        : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
    }

    const discountType =
      body.discountType === "amount" ? "amount" : "percent";

    const coupon = await createCoupon({
      code,
      name: String(body.name ?? code),
      description: body.description ? String(body.description) : undefined,
      discountType,
      percentOff:
        discountType === "percent" ? Number(body.percentOff) : undefined,
      amountOffCents:
        discountType === "amount"
          ? Math.round(Number(body.amountOffUsd) * 100)
          : undefined,
      duration:
        body.duration === "repeating" || body.duration === "forever"
          ? body.duration
          : "once",
      durationInMonths: Number(body.durationInMonths) || undefined,
      maxRedemptions:
        body.maxRedemptions === "" || body.maxRedemptions == null
          ? null
          : Number(body.maxRedemptions),
      oncePerCustomer: body.oncePerCustomer !== false,
      expiresAt,
      applicablePlans: Array.isArray(body.applicablePlans)
        ? body.applicablePlans.map(String)
        : [],
      active: body.active !== false,
      createdByEmail: admin.email,
    });

    return NextResponse.json({
      coupon: {
        ...coupon,
        discountLabel: formatCouponDiscount(coupon),
        applicablePlans: parseApplicablePlans(coupon.applicablePlansJson),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create coupon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requirePermission("revenue");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  const data: {
    active?: boolean;
    name?: string;
    description?: string | null;
    maxRedemptions?: number | null;
    expiresAt?: Date | null;
  } = {};

  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim().slice(0, 80);
  }
  if (body.description !== undefined) {
    data.description = String(body.description || "").trim().slice(0, 280) || null;
  }
  if (body.maxRedemptions !== undefined) {
    const n = Number(body.maxRedemptions);
    data.maxRedemptions =
      !Number.isFinite(n) || n <= 0 ? null : Math.floor(n);
  }
  if (body.expiresAt !== undefined) {
    if (!body.expiresAt) data.expiresAt = null;
    else {
      const d = new Date(String(body.expiresAt));
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid expiry" }, { status: 400 });
      }
      data.expiresAt = d;
    }
  }

  const coupon = await prisma.coupon.update({ where: { id }, data });

  if (body.resync || typeof body.active === "boolean") {
    try {
      await syncCouponToStripe(coupon.id);
    } catch (err) {
      console.error("[admin/coupons] Stripe sync", err);
    }
  }

  const fresh = await prisma.coupon.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({
    coupon: {
      ...fresh,
      discountLabel: formatCouponDiscount(fresh),
      applicablePlans: parseApplicablePlans(fresh.applicablePlansJson),
    },
  });
}
