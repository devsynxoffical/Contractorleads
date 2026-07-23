import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  featuresForPlan,
  normalizePlan,
  planHasFeature,
  type PlanFeatures,
} from "@/lib/plans";
import { isAdminStaff } from "@/lib/auth";

/**
 * Paid-plan features require an entitled subscription status.
 * Trial users keep trial entitlements. Staff bypass gates.
 */
export function isSubscriptionEntitled(
  subscriptionStatus: string | null | undefined,
  plan?: string | null,
) {
  const status = (subscriptionStatus || "").toLowerCase().trim();
  const normalized = normalizePlan(plan);
  if (normalized === "trial") {
    return status === "" || status === "trialing" || status === "active";
  }
  return status === "active" || status === "trialing";
}

export function userHasPlanFeature(
  user: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    role?: string;
  },
  feature: keyof PlanFeatures,
) {
  if (isAdminStaff(user as { role: string })) return true;
  if (!isSubscriptionEntitled(user.subscriptionStatus, user.plan)) {
    // Canceled / past_due / unpaid: only trial-level features
    return Boolean(featuresForPlan("trial")[feature]);
  }
  return planHasFeature(user.plan, feature);
}

/** Server pages — redirect to billing when locked. */
export function requirePlanFeatureOrRedirect(
  user: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    role?: string;
  },
  feature: keyof PlanFeatures,
) {
  if (!userHasPlanFeature(user, feature)) {
    redirect("/billing");
  }
}

/** API routes — 403 JSON when locked. */
export function planFeatureForbiddenResponse(feature: keyof PlanFeatures) {
  return NextResponse.json(
    {
      error: `This feature (${feature}) is not included in your plan. Upgrade on Billing.`,
      locked: true,
      feature,
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
