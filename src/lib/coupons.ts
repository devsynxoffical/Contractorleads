import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured, type StripeCheckoutPlan } from "@/lib/stripe";
import { PLAN_IDS, type PlanId } from "@/lib/plans";
import type Stripe from "stripe";

export type CouponDiscountType = "percent" | "amount";
export type CouponDuration = "once" | "repeating" | "forever";

export function normalizeCouponCode(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 40);
}

export function parseApplicablePlans(raw: string | null | undefined): PlanId[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((v) => String(v).toLowerCase())
      .filter((v): v is PlanId => (PLAN_IDS as readonly string[]).includes(v));
  } catch {
    return [];
  }
}

export function couponAppliesToPlan(
  applicablePlansJson: string | null | undefined,
  plan: string,
): boolean {
  const plans = parseApplicablePlans(applicablePlansJson);
  if (!plans.length) return true;
  return plans.includes(plan as PlanId);
}

export function formatCouponDiscount(coupon: {
  discountType: string;
  percentOff: number | null;
  amountOffCents: number | null;
}) {
  if (coupon.discountType === "amount" && coupon.amountOffCents != null) {
    return `$${(coupon.amountOffCents / 100).toFixed(
      coupon.amountOffCents % 100 === 0 ? 0 : 2,
    )} off`;
  }
  if (coupon.percentOff != null) {
    return `${coupon.percentOff}% off`;
  }
  return "Discount";
}

export type CouponValidity =
  | {
      ok: true;
      coupon: {
        id: string;
        code: string;
        name: string;
        discountType: string;
        percentOff: number | null;
        amountOffCents: number | null;
        duration: string;
        durationInMonths: number | null;
        stripePromotionCodeId: string | null;
        stripeCouponId: string | null;
        applicablePlansJson: string;
        discountLabel: string;
      };
    }
  | { ok: false; error: string };

/** Look up an active, non-expired coupon and check plan / per-user limits. */
export async function validateCouponForCheckout(opts: {
  code: string;
  userId: string;
  plan?: string;
}): Promise<CouponValidity> {
  const code = normalizeCouponCode(opts.code);
  if (!code) return { ok: false, error: "Enter a coupon code" };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) {
    return { ok: false, error: "This coupon code is not valid" };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This coupon has expired" };
  }
  if (
    coupon.maxRedemptions != null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    return { ok: false, error: "This coupon has reached its redemption limit" };
  }
  if (
    opts.plan &&
    !couponAppliesToPlan(coupon.applicablePlansJson, opts.plan)
  ) {
    return {
      ok: false,
      error: `This coupon does not apply to the ${opts.plan} plan`,
    };
  }
  if (coupon.oncePerCustomer) {
    const prior = await prisma.couponRedemption.findUnique({
      where: {
        couponId_userId: { couponId: coupon.id, userId: opts.userId },
      },
    });
    if (prior) {
      return { ok: false, error: "You have already used this coupon" };
    }
  }

  return {
    ok: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      percentOff: coupon.percentOff,
      amountOffCents: coupon.amountOffCents,
      duration: coupon.duration,
      durationInMonths: coupon.durationInMonths,
      stripePromotionCodeId: coupon.stripePromotionCodeId,
      stripeCouponId: coupon.stripeCouponId,
      applicablePlansJson: coupon.applicablePlansJson,
      discountLabel: formatCouponDiscount(coupon),
    },
  };
}

/**
 * Create (or refresh) the Stripe Coupon + Promotion Code for an admin coupon.
 * Safe to call when Stripe is not configured — returns nulls.
 */
export async function syncCouponToStripe(couponId: string): Promise<{
  stripeCouponId: string | null;
  stripePromotionCodeId: string | null;
}> {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return { stripeCouponId: null, stripePromotionCodeId: null };
  if (!(await isStripeConfigured())) {
    return {
      stripeCouponId: coupon.stripeCouponId,
      stripePromotionCodeId: coupon.stripePromotionCodeId,
    };
  }

  const stripe = await getStripe();

  // Prefer creating a fresh Stripe coupon when none is linked.
  let stripeCouponId = coupon.stripeCouponId;
  if (!stripeCouponId) {
    const params: Stripe.CouponCreateParams = {
      name: coupon.name.slice(0, 40),
      duration: coupon.duration as Stripe.CouponCreateParams.Duration,
      metadata: {
        couponId: coupon.id,
        code: coupon.code,
      },
    };
    if (coupon.duration === "repeating") {
      params.duration_in_months = Math.max(1, coupon.durationInMonths ?? 1);
    }
    if (coupon.discountType === "amount" && coupon.amountOffCents) {
      params.amount_off = coupon.amountOffCents;
      params.currency = "usd";
    } else {
      params.percent_off = Math.min(100, Math.max(1, coupon.percentOff ?? 10));
    }
    if (coupon.maxRedemptions != null) {
      params.max_redemptions = coupon.maxRedemptions;
    }
    if (coupon.expiresAt) {
      params.redeem_by = Math.floor(coupon.expiresAt.getTime() / 1000);
    }
    const created = await stripe.coupons.create(params);
    stripeCouponId = created.id;
  }

  let stripePromotionCodeId = coupon.stripePromotionCodeId;
  if (!stripePromotionCodeId && stripeCouponId) {
    const promo = await stripe.promotionCodes.create({
      // Stripe API: promotion_code uses `coupon` + `code`
      coupon: stripeCouponId,
      code: coupon.code,
      active: coupon.active,
      max_redemptions: coupon.maxRedemptions ?? undefined,
      expires_at: coupon.expiresAt
        ? Math.floor(coupon.expiresAt.getTime() / 1000)
        : undefined,
      restrictions: {
        first_time_transaction: false,
      },
      metadata: {
        couponId: coupon.id,
        code: coupon.code,
      },
    });
    stripePromotionCodeId = promo.id;
  } else if (stripePromotionCodeId) {
    try {
      await stripe.promotionCodes.update(stripePromotionCodeId, {
        active: coupon.active,
      });
    } catch {
      /* promo may already be inactive / deleted in Stripe */
    }
  }

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { stripeCouponId, stripePromotionCodeId },
  });

  return { stripeCouponId, stripePromotionCodeId };
}

export async function recordCouponRedemption(opts: {
  couponId: string;
  userId: string;
  plan?: string | null;
  checkoutSessionId?: string | null;
}) {
  try {
    const existing = await prisma.couponRedemption.findUnique({
      where: {
        couponId_userId: {
          couponId: opts.couponId,
          userId: opts.userId,
        },
      },
    });
    if (existing) {
      await prisma.couponRedemption.update({
        where: { id: existing.id },
        data: {
          plan: opts.plan ?? undefined,
          checkoutSessionId: opts.checkoutSessionId ?? undefined,
        },
      });
      return;
    }
    await prisma.couponRedemption.create({
      data: {
        couponId: opts.couponId,
        userId: opts.userId,
        plan: opts.plan ?? null,
        checkoutSessionId: opts.checkoutSessionId ?? null,
      },
    });
    await prisma.coupon.update({
      where: { id: opts.couponId },
      data: { redemptionCount: { increment: 1 } },
    });
  } catch (err) {
    console.error("[coupon] record redemption failed", err);
  }
}

export type CreateCouponInput = {
  code: string;
  name: string;
  description?: string;
  discountType: CouponDiscountType;
  percentOff?: number;
  amountOffCents?: number;
  duration: CouponDuration;
  durationInMonths?: number;
  maxRedemptions?: number | null;
  oncePerCustomer?: boolean;
  expiresAt?: Date | null;
  applicablePlans?: string[];
  active?: boolean;
  createdByEmail?: string | null;
};

export async function createCoupon(input: CreateCouponInput) {
  const code = normalizeCouponCode(input.code);
  if (code.length < 3) {
    throw new Error("Code must be at least 3 characters");
  }
  if (!input.name.trim()) throw new Error("Name is required");

  const discountType = input.discountType === "amount" ? "amount" : "percent";
  let percentOff: number | null = null;
  let amountOffCents: number | null = null;
  if (discountType === "percent") {
    const p = Number(input.percentOff);
    if (!Number.isFinite(p) || p < 1 || p > 100) {
      throw new Error("Percent off must be between 1 and 100");
    }
    percentOff = Math.round(p * 100) / 100;
  } else {
    const cents = Math.round(Number(input.amountOffCents));
    if (!Number.isFinite(cents) || cents < 50) {
      throw new Error("Amount off must be at least $0.50");
    }
    amountOffCents = cents;
  }

  const duration =
    input.duration === "repeating" || input.duration === "forever"
      ? input.duration
      : "once";
  const durationInMonths =
    duration === "repeating"
      ? Math.max(1, Math.min(36, Math.floor(Number(input.durationInMonths) || 1)))
      : null;

  const plans = (input.applicablePlans ?? [])
    .map((p) => p.toLowerCase())
    .filter((p) => (PLAN_IDS as readonly string[]).includes(p));

  const coupon = await prisma.coupon.create({
    data: {
      code,
      name: input.name.trim().slice(0, 80),
      description: input.description?.trim().slice(0, 280) || null,
      discountType,
      percentOff,
      amountOffCents,
      duration,
      durationInMonths,
      maxRedemptions:
        input.maxRedemptions == null || input.maxRedemptions <= 0
          ? null
          : Math.floor(input.maxRedemptions),
      oncePerCustomer: input.oncePerCustomer !== false,
      expiresAt: input.expiresAt ?? null,
      applicablePlansJson: JSON.stringify(plans),
      active: input.active !== false,
      createdByEmail: input.createdByEmail ?? null,
    },
  });

  try {
    await syncCouponToStripe(coupon.id);
  } catch (err) {
    console.error("[coupon] Stripe sync failed", err);
    // Keep the DB coupon — checkout can still apply via stripe coupon create on demand
  }

  return prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } });
}

export type { StripeCheckoutPlan };
