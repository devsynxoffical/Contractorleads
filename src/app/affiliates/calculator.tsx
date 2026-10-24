"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineCurrencyDollar,
  HiOutlineSparkles,
  HiOutlineBanknotes,
} from "react-icons/hi2";

const PLANS = [
  { id: "starter", name: "Starter", price: 19, desc: "Solo agencies & contractors" },
  { id: "growth", name: "Growth", price: 49, desc: "Scaling lead agencies (Most Popular)" },
  { id: "agency", name: "Agency", price: 99, desc: "High-volume teams & call centers" },
  { id: "mixed", name: "Mixed Average", price: 56, desc: "Blended average across all tiers" },
];

const PRESETS = [5, 15, 30, 50, 100];

export function AffiliateEarningsCalculator() {
  const [referrals, setReferrals] = useState<number>(25);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("growth");

  const plan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];
  const monthlyRevenue = referrals * plan.price;
  const monthlyCommission = monthlyRevenue * 0.3;
  const annualCommission = monthlyCommission * 12;

  let milestoneBonus = 0;
  if (referrals >= 100) milestoneBonus = 250;
  else if (referrals >= 50) milestoneBonus = 100;
  else if (referrals >= 10) milestoneBonus = 25;

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-fuchsia-900/[0.04] sm:p-10 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Inputs (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Step 1: Select Plan */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-ink-muted">
              1. Choose Referred Plan Tier
            </label>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLANS.map((p) => {
                const active = p.id === selectedPlanId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-fuchsia-500 bg-fuchsia-50/60 shadow-sm dark:bg-fuchsia-500/15"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        active
                          ? "text-fuchsia-700 dark:text-fuchsia-300"
                          : "text-slate-800 dark:text-white"
                      }`}
                    >
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
                      ${p.price}
                      <span className="text-[11px] font-normal text-slate-500 dark:text-ink-muted">
                        /mo
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Referrals Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-ink-muted">
                2. Active Referred Customers
              </label>
              <span className="rounded-full bg-fuchsia-100 px-3 py-1 font-mono text-sm font-extrabold text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-300">
                {referrals} Customers
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={150}
              step={1}
              value={referrals}
              onChange={(e) => setReferrals(Number(e.target.value))}
              className="mt-4 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-fuchsia-600 dark:bg-white/10"
            />

            {/* Quick chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Quick set:</span>
              {PRESETS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setReferrals(count)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    referrals === count
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-ink-muted"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation note */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <span className="font-semibold text-slate-900 dark:text-white">
              Recurring Renewals Guaranteed:
            </span>{" "}
            Unlike programs that only pay on the first transaction, Contractor Leads pays you{" "}
            <strong className="text-fuchsia-700 dark:text-fuchsia-300">
              30% every single month
            </strong>{" "}
            when your customers renew their plan.
          </div>
        </div>

        {/* Right Output Card (5 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-fuchsia-200/80 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/5 to-surface p-6 shadow-inner dark:border-fuchsia-500/30 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-ink-muted">
                Your Estimated Earnings
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                <HiOutlineSparkles className="h-3.5 w-3.5" /> 30% Rate
              </span>
            </div>

            {/* Monthly recurring */}
            <div className="mt-4">
              <p className="text-xs text-slate-500 dark:text-ink-muted">
                Monthly Recurring Passive Income
              </p>
              <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                ${monthlyCommission.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-semibold text-slate-500 dark:text-ink-muted">
                  /mo
                </span>
              </p>
            </div>

            {/* Annual recurring */}
            <div className="mt-4 border-t border-slate-200/60 pt-4 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-ink-muted">
                Annual Passive Earnings
              </p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-fuchsia-700 sm:text-3xl dark:text-fuchsia-400">
                ${annualCommission.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-semibold text-slate-500 dark:text-ink-muted">
                  /year
                </span>
              </p>
            </div>

            {/* Milestone bonus pill */}
            {milestoneBonus > 0 ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                <span>Tier Milestone Cash Bonus:</span>
                <span className="font-bold">+${milestoneBonus}.00</span>
              </div>
            ) : null}

            {/* Payout threshold confirmation */}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-ink-muted">
              <HiOutlineBanknotes className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Exceeds the $500 payout threshold within{" "}
                <strong>
                  {monthlyCommission >= 500
                    ? "your first 30 days"
                    : `${Math.ceil(500 / monthlyCommission)} months`}
                </strong>
                .
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-fuchsia-700 dark:bg-white dark:text-slate-900 dark:hover:bg-fuchsia-100"
            >
              Start Earning Today
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
