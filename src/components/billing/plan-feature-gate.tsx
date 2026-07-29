"use client";

import { useEffect } from "react";
import { HiOutlineLockClosed } from "react-icons/hi2";
import {
  upgradeCopyForFeature,
  type PlanFeatures,
} from "@/lib/plans";
import { openUpgradePlanModal } from "@/lib/client/upgrade-plan";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

/** Inline locked state for pages (opens the upgrade modal — no auto-billing redirect). */
export function PlanFeatureGate({
  feature,
  currentPlan,
}: {
  feature: keyof PlanFeatures;
  currentPlan?: string | null;
}) {
  const copy = upgradeCopyForFeature(feature, currentPlan);

  useEffect(() => {
    openUpgradePlanModal(feature);
  }, [feature]);

  return (
    <div className="page-pad page-enter">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-[var(--panel-solid)] px-6 py-10 text-center shadow-[var(--shadow-card)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/20">
          <HiOutlineLockClosed className="h-6 w-6" />
        </span>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
          Upgrade required
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink">
          {copy.featureLabel}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          {copy.description} Available on{" "}
          <strong className="text-ink">{copy.requiredPlanLabel}</strong>
          {copy.requiredPlan !== "enterprise" ? "+" : ""}. You’re on{" "}
          <strong className="text-ink">{copy.currentPlanLabel}</strong>.
        </p>
        <button
          type="button"
          onClick={() => openUpgradePlanModal(feature)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-semibold text-white transition hover:opacity-95"
          style={{ background: LOGO_GRADIENT }}
        >
          Upgrade plan
        </button>
      </div>
    </div>
  );
}
