"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineCreditCard,
  HiOutlineMinus,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { Reveal } from "./marketing-ui";
import {
  MARKETING_PLANS,
  PLAN_COLUMNS,
  PLAN_COMPARISON_ROWS,
  PLAN_MATRIX_GROUPS,
  type PlanColumnId,
  type PlanMatrixRow,
} from "./marketing-plans-data";

function rowHasDifference(row: PlanMatrixRow) {
  const vals = PLAN_COLUMNS.map((c) => row[c.id]);
  return new Set(vals).size > 1;
}

function MatrixCell({ value }: { value: string }) {
  if (value === "✓") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <HiOutlineCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === "—") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-300">
        <HiOutlineMinus className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="inline-block max-w-[100px] rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold leading-snug text-slate-700 sm:text-[11px]">
      {value}
    </span>
  );
}

export function MarketingPricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [diffOnly, setDiffOnly] = useState(false);

  const totalRows = PLAN_COMPARISON_ROWS.length;

  const groups = useMemo(() => {
    return PLAN_MATRIX_GROUPS.map((g) => ({
      ...g,
      rows: diffOnly ? g.rows.filter((r) => rowHasDifference(r)) : g.rows,
    })).filter((g) => g.rows.length > 0);
  }, [diffOnly]);

  const visibleCount = useMemo(
    () => groups.reduce((n, g) => n + g.rows.length, 0),
    [groups],
  );

  return (
    <>
      <Reveal delay={0.04} className="mt-10 flex flex-col items-center gap-5">
        <p className="mx-auto max-w-2xl text-center text-[15px] leading-relaxed text-slate-600">
          Simple seats-and-credits pricing. Start free, then pick the plan that
          matches how many contractors you close each month.
        </p>

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
          const showStrike =
            billing === "annual" &&
            plan.priceMonthly != null &&
            plan.priceAnnualMonthly != null &&
            plan.priceAnnualMonthly < plan.priceMonthly;

          return (
            <Reveal key={plan.id} delay={i * 0.05} className="h-full">
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
                  plan.popular
                    ? "border-slate-900 ring-1 ring-slate-900"
                    : "border-slate-200",
                )}
              >
                {plan.popular ? (
                  <span
                    className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    Most popular
                  </span>
                ) : null}

                <div className="min-h-[4.5rem]">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight text-slate-900">
                      {plan.name}
                    </h3>
                    {plan.trialOffer ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                        Free trial
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                    {plan.blurb}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  {price == null ? (
                    <p className="font-[family-name:var(--font-display)] text-[40px] font-semibold leading-none tracking-tight text-slate-900">
                      Custom
                    </p>
                  ) : (
                    <div className="flex items-end gap-2">
                      {showStrike ? (
                        <span className="mb-1 text-[18px] font-semibold text-slate-400 line-through">
                          ${plan.priceMonthly}
                        </span>
                      ) : null}
                      <p className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-none tracking-tight text-slate-900">
                        ${price}
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
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <HiOutlineCreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 text-[12px] leading-snug">
                    <p className="font-semibold text-slate-800">
                      {plan.creditsLabel}
                    </p>
                    <p className="mt-0.5 text-slate-500">{plan.creditsDetail}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {plan.ctaHref.startsWith("mailto:") ? (
                    <a
                      href={plan.ctaHref}
                      className={cn(
                        "inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition",
                        plan.popular
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "text-white hover:brightness-105",
                      )}
                      style={
                        plan.popular ? undefined : { background: LOGO_GRADIENT }
                      }
                    >
                      {plan.ctaLabel}
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      href={plan.ctaHref}
                      className={cn(
                        "inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition",
                        plan.popular
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : plan.trialOffer
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "text-white hover:brightness-105",
                      )}
                      style={
                        plan.popular || plan.trialOffer
                          ? undefined
                          : { background: LOGO_GRADIENT }
                      }
                    >
                      {plan.ctaLabel}
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                  {plan.secondaryCtaLabel && plan.secondaryCtaHref ? (
                    plan.secondaryCtaHref.startsWith("mailto:") ? (
                      <a
                        href={plan.secondaryCtaHref}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {plan.secondaryCtaLabel}
                      </a>
                    ) : (
                      <Link
                        href={plan.secondaryCtaHref}
                        className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-700 underline-offset-2 transition hover:text-slate-900 hover:underline"
                      >
                        {plan.secondaryCtaLabel}
                      </Link>
                    )
                  ) : null}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
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

      <Reveal delay={0.1} className="mt-16">
        <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Compare plans
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.8vw,1.75rem)] font-semibold tracking-tight text-slate-900">
              What’s included in each tier
            </h3>
            <p className="mt-2 text-[14px] text-slate-500">
              {visibleCount} of {totalRows} capabilities
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDiffOnly((d) => !d)}
            className={cn(
              "rounded-full px-4 py-2.5 text-[13px] font-semibold transition",
              diffOnly
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {diffOnly ? "Differences only" : "Show differences only"}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[720px] border-collapse">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[15.5%]" />
                <col className="w-[15.5%]" />
                <col className="w-[15.5%]" />
                <col className="w-[15.5%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-20 bg-slate-50 px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Capability
                  </th>
                  {PLAN_COLUMNS.map((col) => (
                    <th
                      key={col.id}
                      className="min-w-[108px] px-2 py-4 text-center text-[14px] font-semibold text-slate-900"
                    >
                      {col.label}
                      {col.featured ? (
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-fuchsia-600">
                          Popular
                        </span>
                      ) : (
                        <span className="mt-1 block h-[14px]" aria-hidden />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let rowIndex = 0;
                  return groups.map((group, gi) => (
                    <Fragment key={group.id}>
                      <tr className={cn(gi > 0 && "border-t border-slate-100")}>
                        <td
                          colSpan={5}
                          className="bg-slate-50/90 px-5 py-2.5 text-[12px] font-semibold text-slate-700"
                        >
                          {group.label}
                        </td>
                      </tr>
                      {group.rows.map((row) => {
                        const muted = rowIndex % 2 === 1;
                        rowIndex += 1;
                        return (
                          <tr
                            key={row.feature}
                            className="border-b border-slate-100"
                          >
                            <td
                              className={cn(
                                "sticky left-0 z-10 px-5 py-3 text-[13px] font-medium text-slate-700 shadow-[4px_0_12px_-8px_rgba(15,23,42,0.08)] sm:text-[14px]",
                                muted ? "bg-slate-50/70" : "bg-white",
                              )}
                            >
                              {row.feature}
                            </td>
                            {PLAN_COLUMNS.map((col) => (
                              <td
                                key={col.id}
                                className={cn(
                                  "px-2 py-3 text-center align-middle",
                                  muted ? "bg-slate-50/70" : "bg-white",
                                  col.featured && "bg-fuchsia-50/30",
                                )}
                              >
                                <MatrixCell value={row[col.id]} />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </>
  );
}
