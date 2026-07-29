import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { userHasPlanFeature } from "@/lib/plan-access";
import type { PlanFeatures } from "@/lib/plans";

/**
 * @deprecated Prefer PlanFeatureGate on pages — do not hard-redirect to billing.
 * Kept for any remaining call sites; now a no-op when entitled, throws when used
 * incorrectly. Use userHasPlanFeature + PlanFeatureGate instead.
 */
export function requirePlanFeatureOrRedirect(
  user: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    role?: string;
  },
  feature: keyof PlanFeatures,
) {
  if (!userHasPlanFeature(user, feature)) {
    // Soft-fail path for legacy callers: send to the feature's home with a
    // query flag rather than dumping users on Billing.
    redirect(`/billing?upgrade=${encodeURIComponent(feature)}`);
  }
}

/** API routes — 403 JSON when locked. */
export function planFeatureForbiddenResponse(feature: keyof PlanFeatures) {
  return NextResponse.json(
    {
      error: `This feature (${feature}) is not included in your plan. Upgrade on Billing.`,
      locked: true,
      feature,
      upgradeRequired: true,
    },
    { status: 403 },
  );
}

export function assertPlanFeatureApi(
  user: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    role?: string;
  },
  feature: keyof PlanFeatures,
) {
  if (userHasPlanFeature(user, feature)) return null;
  return planFeatureForbiddenResponse(feature);
}
