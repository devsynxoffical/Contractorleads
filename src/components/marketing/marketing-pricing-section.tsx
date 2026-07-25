"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineCreditCard,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { normalizePlan, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Reveal } from "./marketing-ui";
import {
  MARKETING_PLANS,
  formatPlanPrice,
  formatPricePerLead,
  pricePerLead,
  type MarketingPlanCard,
} from "./marketing-plans-data";

const PLAN_RANK: Record<PlanId, number> = {
  starter: 0,
  growth: 1,
  agency: 2,
  enterprise: 3,
};

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authed"; plan: PlanId };

function resolveCtas(
  plan: MarketingPlanCard,
  session: SessionState,
): {
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  isCurrent: boolean;
  relation: "guest" | "current" | "upgrade" | "lower" | "sales";
} {
  if (plan.custom || plan.ctaHref.startsWith("mailto:")) {
    return {
      primaryLabel: plan.ctaLabel,
      primaryHref: plan.ctaHref,
      secondaryLabel: plan.secondaryCtaLabel,
      secondaryHref: plan.secondaryCtaHref,
      isCurrent: session.status === "authed" && session.plan === "enterprise",
      relation: session.status === "authed" ? "sales" : "guest",
    };
  }

  if (session.status !== "authed") {
    return {
      primaryLabel: plan.ctaLabel,
      primaryHref: plan.ctaHref,
      secondaryLabel: plan.secondaryCtaLabel,
      secondaryHref: plan.secondaryCtaHref,
      isCurrent: false,
      relation: "guest",
    };
  }

  const current = session.plan;
  const target = plan.id as PlanId;
  const currentRank = PLAN_RANK[current] ?? 0;
  const targetRank = PLAN_RANK[target] ?? 0;

  if (target === current) {
    return {
      primaryLabel: "Current plan",
      primaryHref: "/billing",
      secondaryLabel: "Manage billing",
      secondaryHref: "/billing",
      isCurrent: true,
      relation: "current",
    };
  }

  if (targetRank > currentRank) {
    return {
      primaryLabel: `Upgrade to ${plan.name}`,
      primaryHref: "/billing",
      secondaryLabel: "Compare in billing",
      secondaryHref: "/billing",
      isCurrent: false,
      relation: "upgrade",
    };
  }

  return {
    primaryLabel: "Manage billing",
    primaryHref: "/billing",
    secondaryLabel: undefined,
    secondaryHref: undefined,
    isCurrent: false,
    relation: "lower",
  };
}

export function MarketingPricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setSession({ status: "guest" });
          return;
        }
        const json = await r.json();
        const plan = normalizePlan(json.user?.plan);
        if (!cancelled) setSession({ status: "authed", plan });
      })
      .catch(() => {
        if (!cancelled) setSession({ status: "guest" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlanLabel =
    session.status === "authed"
      ? MARKETING_PLANS.find((p) => p.id === session.plan)?.name ?? session.plan
      : null;

  return (
    <>
      <Reveal delay={0.04} className="mt-10 flex flex-col items-center gap-5">
        <p className="mx-auto max-w-2xl text-center text-[15px] leading-relaxed text-slate-600">
          Transparent seats-and-credits pricing with the effective cost per lead
          shown on every plan. Start free, then scale when you&apos;re closing.
        </p>

        {session.status === "authed" && currentPlanLabel ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-[13px] font-semibold text-fuchsia-900">
            <span className="h-2 w-2 rounded-full bg-fuchsia-500" aria-hidden />
            You&apos;re on {currentPlanLabel}
            <Link
              href="/billing"
              className="ml-1 underline-offset-2 hover:underline"
            >
              Manage billing →
            </Link>
          </p>
        ) : null}

        <div
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm"
          role="group"
          aria-label="Billing period"
        >
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition",
              billing === "monthly"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Pay monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition",
              billing === "annual"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Pay annually
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                billing === "annual"
                  ? "bg-white/15 text-white"
                  : "bg-emerald-50 text-emerald-700",
              )}
            >
              Best value
            </span>
          </button>
        </div>
      </Reveal>

      <div className="mt-12 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-3">
        {MARKETING_PLANS.map((plan, i) => {
          const price =
            plan.priceMonthly == null
              ? null
              : billing === "annual"
                ? plan.priceAnnualMonthly
                : plan.priceMonthly;
          const perLead = pricePerLead(price, plan.leadsIncluded);
          const showStrike =
            billing === "annual" &&
            plan.priceMonthly != null &&
            plan.priceAnnualMonthly != null &&
            plan.priceAnnualMonthly < plan.priceMonthly;

          const ctas = resolveCtas(plan, session);
          const primaryIsMailto = ctas.primaryHref.startsWith("mailto:");
          const secondaryIsMailto = ctas.secondaryHref?.startsWith("mailto:");

          return (
            <Reveal key={plan.id} delay={i * 0.05} className="h-full">
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
                  ctas.isCurrent
                    ? "border-fuchsia-400 ring-2 ring-fuchsia-200"
                    : plan.popular
                      ? "border-slate-900 ring-1 ring-slate-900"
                      : "border-slate-200",
                )}
              >
                {ctas.isCurrent ? (
                  <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-fuchsia-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                    Your plan
                  </span>
                ) : plan.popular ? (
                  <span
                    className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    Most popular
                  </span>
                ) : null}

                <div className="flex min-h-[7.25rem] flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight text-slate-900">
                      {plan.name}
                    </h3>
                    {plan.trialOffer && session.status !== "authed" ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                        10 free leads
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-slate-500">
                    {plan.blurb}
                  </p>
                </div>

                <div className="mt-5 flex min-h-[9.75rem] flex-col border-t border-slate-100 pt-5">
                  {price == null ? (
                    <p className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-none tracking-tight text-slate-900">
                      Custom
                    </p>
                  ) : (
                    <div className="flex items-end gap-2">
                      {showStrike ? (
                        <span className="mb-1 text-[18px] font-semibold text-slate-400 line-through">
                          ${formatPlanPrice(plan.priceMonthly!)}
                        </span>
                      ) : null}
                      <p className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-none tracking-tight text-slate-900">
                        ${formatPlanPrice(price)}
                      </p>
                      <span className="mb-1 text-[14px] font-medium text-slate-500">
                        /mo
                      </span>
                    </div>
                  )}
                  <p className="mt-2 text-[12px] leading-snug text-slate-500">
                    {plan.custom
                      ? "Tailored for your seat count and volume"
                      : billing === "annual"
                        ? "Per month, billed annually"
                        : "Per month, billed monthly"}
                  </p>

                  <div className="mt-3 min-h-[2.75rem]">
                    {perLead != null ? (
                      <div className="inline-flex items-baseline gap-1.5 rounded-full bg-fuchsia-50 px-3 py-1.5 ring-1 ring-fuchsia-100">
                        <span className="font-[family-name:var(--font-display)] text-[18px] font-semibold tabular-nums tracking-tight text-fuchsia-700">
                          {formatPricePerLead(perLead)}
                        </span>
                        <span className="text-[12px] font-semibold text-fuchsia-600/90">
                          / lead
                        </span>
                      </div>
                    ) : plan.custom ? (
                      <div className="inline-flex items-baseline gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                        <span className="text-[13px] font-semibold text-slate-700">
                          Custom / lead
                        </span>
                      </div>
                    ) : null}
                    {perLead != null && plan.leadsIncluded ? (
                      <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
                        Based on {plan.leadsIncluded.toLocaleString()} leads /
                        month included
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex min-h-[4.25rem] items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <HiOutlineCreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 text-[12px] leading-snug">
                    <p className="font-semibold text-slate-800">
                      {plan.creditsLabel}
                    </p>
                    <p className="mt-0.5 text-slate-500">{plan.creditsDetail}</p>
                  </div>
                </div>

                <div className="mt-5 flex min-h-[6.25rem] flex-col gap-2">
                  {(() => {
                    const useGradient =
                      ctas.relation === "upgrade" ||
                      (ctas.relation === "guest" &&
                        !plan.popular &&
                        !plan.trialOffer &&
                        !plan.custom) ||
                      (ctas.relation === "sales" && !plan.popular);
                    const useSlate =
                      ctas.relation === "lower" ||
                      (ctas.relation === "guest" &&
                        (plan.popular || plan.trialOffer)) ||
                      (ctas.relation === "sales" && plan.popular);
                    const btnClass = cn(
                      "inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition",
                      ctas.isCurrent && "bg-fuchsia-600 text-white hover:bg-fuchsia-700",
                      useSlate && "bg-slate-900 text-white hover:bg-slate-800",
                      useGradient && "text-white hover:brightness-105",
                    );
                    const btnStyle = useGradient
                      ? { background: LOGO_GRADIENT }
                      : undefined;
                    const inner = (
                      <>
                        {ctas.primaryLabel}
                        {!ctas.isCurrent ? (
                          <HiOutlineArrowRight className="h-4 w-4" />
                        ) : null}
                      </>
                    );
                    return primaryIsMailto ? (
                      <a href={ctas.primaryHref} className={btnClass} style={btnStyle}>
                        {inner}
                      </a>
                    ) : (
                      <Link href={ctas.primaryHref} className={btnClass} style={btnStyle}>
                        {inner}
                      </Link>
                    );
                  })()}

                  {ctas.secondaryLabel && ctas.secondaryHref ? (
                    secondaryIsMailto ? (
                      <a
                        href={ctas.secondaryHref}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {ctas.secondaryLabel}
                      </a>
                    ) : (
                      <Link
                        href={ctas.secondaryHref}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-transparent px-4 py-2.5 text-[13px] font-semibold text-slate-700 underline-offset-2 transition hover:text-slate-900 hover:underline"
                      >
                        {ctas.secondaryLabel}
                      </Link>
                    )
                  ) : (
                    <div className="h-[2.625rem]" aria-hidden />
                  )}
                </div>

                <div className="mt-6 flex-1 border-t border-slate-100 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Includes
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-700"
                      >
                        {f.toLowerCase().includes("ai") ||
                        f.toLowerCase().includes("meta") ? (
                          <HiOutlineSparkles className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
                        ) : (
                          <HiOutlineCheck
                            className="mt-0.5 h-4 w-4 shrink-0 text-slate-900"
                            strokeWidth={2.5}
                          />
                        )}
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
