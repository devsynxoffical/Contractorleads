import type { PlanFeatures } from "@/lib/plans";

export const UPGRADE_PLAN_EVENT = "contractorleads:upgrade-plan";

export type UpgradePlanEventDetail = {
  feature: keyof PlanFeatures;
};

/** Open the in-app upgrade modal (no billing redirect). */
export function openUpgradePlanModal(feature: keyof PlanFeatures) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<UpgradePlanEventDetail>(UPGRADE_PLAN_EVENT, {
      detail: { feature },
    }),
  );
}
