"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineMinus,
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

const PLAN_TO_COLUMN: Record<string, PlanColumnId> = {
  Starter: "starter",
  Growth: "growth",
  Agency: "agency",
  Enterprise: "enterprise",
};

function rowHasDifference(row: PlanMatrixRow) {
  const vals = PLAN_COLUMNS.map((c) => row[c.id]);
  return new Set(vals).size > 1;
}

function planHeadClass(colId: PlanColumnId, focus: PlanColumnId) {
  return cn(
    "bg-[#14101f] text-white",
    colId === "growth" && "shadow-[inset_0_3px_0_0_#f472b6]",
    colId === focus && "shadow-[inset_0_0_0_2px_rgba(167,139,250,0.45)]",
  );
}

function planBodyClass(colId: PlanColumnId, focus: PlanColumnId, rowMuted: boolean) {
  const base = rowMuted ? "bg-slate-50/80" : "bg-white";
  return cn(
    base,
    colId === focus && "shadow-[inset_0_0_0_2px_rgba(167,139,250,0.2)]",
  );
}

function featureNameCellClass(rowMuted: boolean) {
  return rowMuted ? "bg-slate-50/80" : "bg-white";
}

function planFootClass(colId: PlanColumnId, focus: PlanColumnId) {
  return cn(
    "bg-[#faf9fc]",
    colId === focus && "shadow-[inset_0_0_0_2px_rgba(167,139,250,0.2)]",
  );
}

function MatrixCell({ value }: { value: string }) {
  if (value === "✓") {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
        <HiOutlineCheck className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === "—") {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/80 text-slate-300">
        <HiOutlineMinus className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="inline-block max-w-[108px] rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-semibold leading-snug text-violet-800 ring-1 ring-violet-100 sm:text-[11px]">
      {value}
    </span>
  );
}

function PlanHeaderTag({ colId }: { colId: PlanColumnId }) {
  if (colId === "growth") {
    return (
      <span
        className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/95"
        style={{ background: "linear-gradient(90deg, #ec4899, #a855f7)" }}
      >
        Popular
      </span>
    );
  }
  if (colId === "starter") {
    return (
      <span className="mt-1.5 inline-block rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-100">
        10 free leads
      </span>
    );
  }
  return <span className="mt-1.5 block h-[18px]" aria-hidden />;
}

export function MarketingPricingSection() {
  const [focus, setFocus] = useState<PlanColumnId>("growth");
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
      <Reveal delay={0.04} className="mt-10">
        <p className="mx-auto max-w-2xl text-center text-[15px] font-medium leading-relaxed text-slate-600">
          Starter includes a free trial —{" "}
          <span className="font-semibold text-fuchsia-600">your first 10 leads are on us.</span>{" "}
          Growth is our most popular plan for scaling outreach.
        </p>
      </Reveal>

      <div className="mt-12 grid items-stretch gap-5 overflow-visible px-1 sm:grid-cols-2 xl:grid-cols-4">
        {MARKETING_PLANS.map((plan, i) => {
          const colId = PLAN_TO_COLUMN[plan.name];
          const popular = "popular" in plan && plan.popular;
          const custom = "custom" in plan && plan.custom;
          const trialOffer = "trialOffer" in plan && plan.trialOffer;
          const selected = focus === colId;

          return (
            <Reveal key={plan.name} delay={i * 0.06} className="h-full">
              <motion.div
                role="button"
                tabIndex={0}
                onClick={() => setFocus(colId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFocus(colId);
                  }
                }}
                whileHover={{ y: -5 }}
                className={cn(
                  "flex h-full min-h-[420px] w-full cursor-pointer flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400",
                  selected && "relative z-[1]",
                )}
              >
                <div
                  className={cn(
                    "relative flex h-full min-h-0 flex-1 flex-col rounded-[28px] border bg-white p-7 transition-all duration-300",
                    popular
                      ? "border-fuchsia-200/80 shadow-[0_24px_56px_rgba(217,70,239,0.16)]"
                      : "border-slate-200/90 shadow-[0_14px_44px_rgba(80,40,120,0.07)]",
                    selected && "ring-2 ring-fuchsia-400/70 ring-offset-2 ring-offset-white",
                  )}
                >
                  {(popular || trialOffer) && (
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-[28px]"
                      style={{ background: LOGO_GRADIENT }}
                      aria-hidden
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-slate-900">
                      {plan.name}
                    </h3>
                    {trialOffer ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                        10 free leads
                      </span>
                    ) : null}
                    {popular ? (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase text-white"
                        style={{ background: LOGO_GRADIENT }}
                      >
                        Most popular
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-[13px] font-semibold text-fuchsia-600">{plan.tier}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{plan.blurb}</p>

                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    What&apos;s included
                  </p>
                  <ul className="mt-3 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-700"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                          <HiOutlineCheck className="h-3 w-3" strokeWidth={2.5} />
                        </span>
                        <span className="min-w-0 flex-1 text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 shrink-0 pt-2">
                    {custom ? (
                    <a
                      href="mailto:hello@contractorleads.us"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[13px] font-semibold text-white"
                      style={{ background: LOGO_GRADIENT }}
                    >
                      Talk to us
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </a>
                  ) : trialOffer ? (
                    <Link
                      href="/register"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-3 text-[13px] font-semibold text-white hover:bg-emerald-700"
                    >
                      Claim 10 free leads
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[13px] font-semibold text-white"
                      style={{ background: LOGO_GRADIENT }}
                    >
                      Get {plan.name}
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  </div>
                </div>
              </motion.div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.1} className="mt-16">
        <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fuchsia-600">
              Compare plans
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.8vw,1.75rem)] font-semibold tracking-tight text-slate-900">
              What each tier includes
            </h3>
            <p className="mt-2 text-[14px] text-slate-500">
              {visibleCount} of {totalRows} capabilities · hide rows every plan shares
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDiffOnly((d) => !d)}
            className={cn(
              "rounded-full px-4 py-2.5 text-[13px] font-semibold transition shadow-sm",
              diffOnly
                ? "text-white"
                : "border border-slate-200/90 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-800",
            )}
            style={diffOnly ? { background: LOGO_GRADIENT } : undefined}
          >
            {diffOnly ? "Differences only" : "Show differences only"}
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_60px_rgba(88,28,135,0.1)]">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[720px] border-collapse">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[15.5%]" />
                <col className="w-[15.5%]" />
                <col className="w-[15.5%]" />
                <col className="w-[15.5%]" />
              </colgroup>
              <thead className="relative z-20">
                <tr>
                  <th
                    className="sticky left-0 z-30 px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-white/50"
                    style={{ backgroundColor: "#14101f" }}
                  >
                    Capability
                  </th>
                  {PLAN_COLUMNS.map((col) => (
                    <th
                      key={col.id}
                      className={cn(
                        "min-w-[108px] px-2 py-3.5 text-center",
                        planHeadClass(col.id, focus),
                      )}
                      style={{ backgroundColor: "#14101f" }}
                    >
                      <button
                        type="button"
                        onClick={() => setFocus(col.id)}
                        className="group mx-auto w-full max-w-[120px] rounded-xl px-2 py-1 transition hover:bg-white/10"
                      >
                        <span className="block font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight">
                          {col.label}
                        </span>
                        <PlanHeaderTag colId={col.id} />
                      </button>
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
                        <td colSpan={5} className="bg-slate-50/95 px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: LOGO_GRADIENT }}
                              aria-hidden
                            />
                            <span className="text-[12px] font-semibold text-slate-700">
                              {group.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {group.rows.map((row) => {
                        const rowMuted = rowIndex % 2 === 1;
                        rowIndex += 1;
                        return (
                          <tr
                            key={row.feature}
                            className="group/row border-b border-slate-100/80"
                          >
                            <td
                              className={cn(
                                "sticky left-0 z-10 px-5 py-2.5 text-[13px] font-medium leading-snug text-slate-700 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.06)] sm:text-[14px]",
                                featureNameCellClass(rowMuted),
                              )}
                            >
                              {row.feature}
                            </td>
                            {PLAN_COLUMNS.map((col) => (
                              <td
                                key={col.id}
                                className={cn(
                                  "px-2 py-2.5 text-center align-middle transition-colors",
                                  planBodyClass(col.id, focus, rowMuted),
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
              <tfoot className="relative z-10">
                <tr className="border-t-2 border-slate-200">
                  <td className="sticky left-0 z-20 bg-[#faf9fc] px-5 py-3.5 text-[13px] font-medium text-slate-600">
                    Get started
                  </td>
                  {PLAN_COLUMNS.map((col) => (
                    <td
                      key={col.id}
                      className={cn("px-2 py-4 text-center", planFootClass(col.id, focus))}
                    >
                      {col.id === "starter" ? (
                        <Link
                          href="/register"
                          className="inline-flex min-w-[88px] justify-center rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:text-[12px]"
                        >
                          Free trial
                        </Link>
                      ) : col.id === "agency" || col.id === "enterprise" ? (
                        <a
                          href="mailto:hello@contractorleads.us"
                          className="inline-flex min-w-[88px] justify-center rounded-xl border border-violet-200 bg-white px-3 py-2 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50 sm:text-[12px]"
                        >
                          Contact
                        </a>
                      ) : (
                        <Link
                          href="/register"
                          className="inline-flex min-w-[88px] justify-center rounded-xl px-3 py-2 text-[11px] font-semibold text-white shadow-sm sm:text-[12px]"
                          style={{ background: LOGO_GRADIENT }}
                        >
                          Get Growth
                        </Link>
                      )}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Reveal>
    </>
  );
}
