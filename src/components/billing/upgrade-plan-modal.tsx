"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  planLabel,
  upgradeCopyForFeature,
  type PlanFeatures,
} from "@/lib/plans";
import {
  UPGRADE_PLAN_EVENT,
  type UpgradePlanEventDetail,
} from "@/lib/client/upgrade-plan";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

export function UpgradePlanModalHost({
  currentPlan,
}: {
  currentPlan?: string | null;
}) {
  const titleId = useId();
  const [feature, setFeature] = useState<keyof PlanFeatures | null>(null);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<UpgradePlanEventDetail>).detail;
      if (detail?.feature) setFeature(detail.feature);
    }
    window.addEventListener(UPGRADE_PLAN_EVENT, onOpen);

    // Legacy deep-links (?upgrade=api) open the modal instead of dumping on Billing.
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("upgrade");
      if (
        raw &&
        [
          "api",
          "mcp",
          "sso",
          "teams",
          "map",
          "crm",
          "reports",
          "workspaces",
        ].includes(raw)
      ) {
        setFeature(raw as keyof PlanFeatures);
        params.delete("upgrade");
        const next = `${window.location.pathname}${
          params.toString() ? `?${params}` : ""
        }${window.location.hash}`;
        window.history.replaceState({}, "", next);
      }
    } catch {
      /* ignore */
    }

    return () => window.removeEventListener(UPGRADE_PLAN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!feature) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFeature(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [feature]);

  if (!feature) return null;

  const copy = upgradeCopyForFeature(feature, currentPlan);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0f0c14]/55 backdrop-blur-[3px]"
        aria-label="Close"
        onClick={() => setFeature(null)}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-[var(--panel-solid)] shadow-2xl">
        <div
          className="h-1.5 w-full"
          style={{ background: LOGO_GRADIENT }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => setFeature(null)}
          className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-faint transition hover:bg-brand-50 hover:text-ink"
          aria-label="Close"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>

        <div className="px-6 pb-6 pt-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/20">
            <HiOutlineLockClosed className="h-5 w-5" />
          </span>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Plan upgrade needed
          </p>
          <h2
            id={titleId}
            className="mt-1.5 font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight text-ink"
          >
            {copy.featureLabel} isn&apos;t on your plan
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            {copy.description} You’re currently on{" "}
            <span className="font-semibold text-ink">{copy.currentPlanLabel}</span>
            . This feature is available on{" "}
            <span className="font-semibold text-ink">{copy.requiredPlanLabel}</span>
            {copy.requiredPlan !== "enterprise" ? "+" : ""} plans.
          </p>

          <ul className="mt-4 space-y-2 rounded-xl border border-border bg-[var(--canvas)]/50 px-3.5 py-3 text-[13px] text-ink-muted">
            <li className="flex items-start gap-2">
              <HiOutlineSparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              Keep your current credits and leads — upgrading only unlocks more
              tools.
            </li>
            <li className="flex items-start gap-2">
              <HiOutlineSparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              Switch plans anytime from Billing. Cancel or change without losing
              your workspace.
            </li>
          </ul>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setFeature(null)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-[13px] font-semibold text-ink transition hover:bg-brand-50"
            >
              Not now
            </button>
            <Link
              href="/billing"
              onClick={() => setFeature(null)}
              className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95"
              style={{ background: LOGO_GRADIENT }}
            >
              Upgrade to {copy.requiredPlanLabel}
            </Link>
          </div>
          <p className="mt-3 text-center text-[12px] text-ink-muted">
            Current plan: {planLabel(currentPlan)}
          </p>
        </div>
      </div>
    </div>
  );
}
