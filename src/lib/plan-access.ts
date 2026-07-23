import {
  featuresForPlan,
  normalizePlan,
  planHasFeature,
  type PlanFeatures,
} from "@/lib/plans";
import { ADMIN_STAFF_ROLES } from "@/lib/roles";

/**
 * Paid-plan features require an entitled subscription status.
 * Trial users keep trial entitlements. Staff bypass gates.
 * Client-safe — do not import next/headers or next/server here.
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

function isStaffRole(role?: string | null) {
  return Boolean(
    role && (ADMIN_STAFF_ROLES as readonly string[]).includes(role),
  );
}

export function userHasPlanFeature(
  user: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    role?: string;
  },
  feature: keyof PlanFeatures,
) {
  if (isStaffRole(user.role)) return true;
  if (!isSubscriptionEntitled(user.subscriptionStatus, user.plan)) {
    // Canceled / past_due / unpaid: only trial-level features
    return Boolean(featuresForPlan("trial")[feature]);
  }
  return planHasFeature(user.plan, feature);
}
