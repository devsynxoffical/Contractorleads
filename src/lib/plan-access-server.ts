import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  userHasPlanFeature,
} from "@/lib/plan-access";
import type { PlanFeatures } from "@/lib/plans";

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
