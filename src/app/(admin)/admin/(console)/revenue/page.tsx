"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";

type PlanRow = {
  plan: string;
  label: string;
  priceMonthly: number;
  totalUsers: number;
  activePaid: number;
  trialing: number;
  other: number;
  mrr: number;
  sharePct: number;
  credits: number;
};

type CustomerRow = {
  id: string;
  email: string;
  companyName: string | null;
  name: string | null;
  plan: string;
  planNormalized: string;
  planLabel: string;
  subscriptionStatus: string;
  creditsRemaining: number;
  createdAt: string;
  hasStripe: boolean;
  hasSubscription: boolean;
  monthlyPrice: number;
  isPaying: boolean;
  isActive: boolean;
};

type BillingEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  plan: string | null;
  status: string | null;
  previousPlan: string | null;
  user: { id: string; email: string; label: string };
};

type RevenuePayload = {
  summary: {
    estimatedMrr: number;
    pipelineMrr: number;
    totalCustomers: number;
    paidActive: number;
    trialing: number;
    pastDue: number;
    canceled: number;
    withStripe: number;
    newCustomers30d: number;
    purchasedThisMonth: number;
    avgRevenuePerPaid: number;
  };
  planBreakdown: PlanRow[];
  statusMix: Array<{ status: string; count: number }>;
  customers: CustomerRow[];
  recentBilling: BillingEvent[];
};

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatCredits(n: number) {
  return Number.isInteger(n)
    ? String(n)
    : (Math.round(n * 10) / 10).toLocaleString();
}

function statusTone(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/12 text-emerald-800 dark:text-emerald-200";
    case "trialing":
      return "bg-sky-500/12 text-sky-800 dark:text-sky-200";
    case "past_due":
      return "bg-amber-500/15 text-amber-900 dark:text-amber-100";
    case "canceled":
      return "bg-rose-500/12 text-rose-800 dark:text-rose-200";
    default:
      return "bg-[var(--surface-2)] text-ink-muted";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusTone(status)}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PlanBar({ rows }: { rows: PlanRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.totalUsers));
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.plan}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <div className="min-w-0">
              <span className="font-semibold text-ink">{row.label}</span>
              <span className="ml-2 text-ink-faint">
                {money(row.priceMonthly)}/mo
              </span>
            </div>
            <span className="shrink-0 tabular-nums text-ink-muted">
              {row.totalUsers} user{row.totalUsers === 1 ? "" : "s"} ·{" "}
              {row.sharePct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-brand-500/80"
              style={{ width: `${(row.totalUsers / max) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-muted">
            <span>
              <strong className="text-ink">{row.activePaid}</strong> paid
            </span>
            <span>
              <strong className="text-ink">{row.trialing}</strong> trial
            </span>
            {row.other > 0 ? (
              <span>
                <strong className="text-ink">{row.other}</strong> other
              </span>
            ) : null}
            <span>
              MRR <strong className="text-ink">{money(row.mrr)}</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenuePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed to load");
        setData(json);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load"),
      );
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.customers.filter((c) => {
      if (planFilter !== "all" && c.planNormalized !== planFilter) return false;
      if (statusFilter !== "all" && c.subscriptionStatus !== statusFilter) {
        return false;
      }
      if (!needle) return true;
      return (
        c.email.toLowerCase().includes(needle) ||
        (c.companyName || "").toLowerCase().includes(needle) ||
        (c.name || "").toLowerCase().includes(needle)
      );
    });
  }, [data, q, planFilter, statusFilter]);

  if (error) {
    return (
      <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="animate-pulse text-sm text-ink-muted">Loading…</p>;
  }

  const { summary, planBreakdown } = data;
  const maxPlanUsers = Math.max(1, ...planBreakdown.map((p) => p.totalUsers));

  return (
    <div>
      <AdminPageHeader
        title="Revenue & Subscriptions"
        description="Who bought which plan, current MRR from active Stripe subscribers, and every customer’s billing status."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Estimated MRR"
          value={money(summary.estimatedMrr)}
          hint={`${summary.paidActive} active paid · avg ${money(summary.avgRevenuePerPaid)}`}
        />
        <AdminStatCard
          label="Paying customers"
          value={summary.paidActive}
          hint={`${summary.withStripe} linked to Stripe`}
        />
        <AdminStatCard
          label="On trial"
          value={summary.trialing}
          hint={
            summary.pipelineMrr > 0
              ? `${money(summary.pipelineMrr)} potential if they convert`
              : "No trial pipeline value"
          }
        />
        <AdminStatCard
          label="Purchases (30d)"
          value={summary.purchasedThisMonth}
          hint={`${summary.newCustomers30d} new signups · ${summary.pastDue} past due · ${summary.canceled} canceled`}
        />
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Plan purchase breakdown */}
        <section className="rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Plan purchases
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                How many users are on each plan, and how much MRR each plan
                contributes.
              </p>
            </div>
            <p className="text-[12px] tabular-nums text-ink-faint">
              {summary.totalCustomers} total customers
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="pb-2 pr-3 font-semibold">Plan</th>
                  <th className="pb-2 pr-3 font-semibold">Price</th>
                  <th className="pb-2 pr-3 font-semibold">Users</th>
                  <th className="pb-2 pr-3 font-semibold">Paid</th>
                  <th className="pb-2 pr-3 font-semibold">Trial</th>
                  <th className="pb-2 font-semibold">MRR</th>
                </tr>
              </thead>
              <tbody>
                {planBreakdown.map((row) => (
                  <tr key={row.plan} className="border-t border-border/50">
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-ink">{row.label}</p>
                      <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <div
                          className="h-full rounded-full bg-brand-500/75"
                          style={{
                            width: `${(row.totalUsers / maxPlanUsers) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-ink-muted">
                      {row.priceMonthly > 0 ? money(row.priceMonthly) : "Custom"}
                    </td>
                    <td className="py-3 pr-3 tabular-nums font-semibold text-ink">
                      {row.totalUsers}
                      <span className="ml-1 text-[11px] font-normal text-ink-faint">
                        ({row.sharePct}%)
                      </span>
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-emerald-700 dark:text-emerald-300">
                      {row.activePaid}
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-sky-700 dark:text-sky-300">
                      {row.trialing}
                    </td>
                    <td className="py-3 tabular-nums font-semibold text-ink">
                      {money(row.mrr)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td className="pt-3 pr-3 text-[12px] font-semibold text-ink">
                    Totals
                  </td>
                  <td className="pt-3 pr-3" />
                  <td className="pt-3 pr-3 tabular-nums font-semibold">
                    {planBreakdown.reduce((s, r) => s + r.totalUsers, 0)}
                  </td>
                  <td className="pt-3 pr-3 tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
                    {planBreakdown.reduce((s, r) => s + r.activePaid, 0)}
                  </td>
                  <td className="pt-3 pr-3 tabular-nums font-semibold text-sky-700 dark:text-sky-300">
                    {planBreakdown.reduce((s, r) => s + r.trialing, 0)}
                  </td>
                  <td className="pt-3 tabular-nums font-semibold">
                    {money(planBreakdown.reduce((s, r) => s + r.mrr, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-ink">Distribution</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Share of customers by product plan.
            </p>
            <div className="mt-4">
              <PlanBar rows={planBreakdown} />
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-ink">
              Subscription status
            </h2>
            <ul className="mt-3 space-y-2">
              {data.statusMix.map((s) => (
                <li
                  key={s.status}
                  className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-3 py-2.5 text-sm"
                >
                  <StatusBadge status={s.status} />
                  <span className="tabular-nums font-semibold text-ink">
                    {s.count}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Customers */}
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Customers & billing
            </h2>
            <p className="text-[12px] text-ink-muted">
              {filteredCustomers.length} shown
              {filteredCustomers.length !== data.customers.length
                ? ` of ${data.customers.length}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="h-9 w-full rounded-lg border border-border bg-[var(--surface)] px-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-brand-400 sm:w-52"
            />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-[var(--surface)] px-2.5 text-[13px] text-ink outline-none"
            >
              <option value="all">All plans</option>
              {planBreakdown.map((p) => (
                <option key={p.plan} value={p.plan}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-[var(--surface)] px-2.5 text-[13px] text-ink outline-none"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-border bg-[var(--surface-2)] text-[11px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Credits</th>
                <th className="px-4 py-3 font-semibold">Billing</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-ink-muted"
                  >
                    No customers match these filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border/60 hover:bg-[var(--surface-2)]/60"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">
                        {c.companyName || c.name || "—"}
                      </p>
                      <p className="text-[12px] text-ink-muted">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{c.planLabel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.subscriptionStatus} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-muted">
                      {c.isPaying || c.subscriptionStatus === "active"
                        ? money(c.monthlyPrice)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink">
                      {formatCredits(c.creditsRemaining)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-muted">
                      {c.hasSubscription
                        ? "Stripe sub"
                        : c.hasStripe
                          ? "Customer only"
                          : "No Stripe"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[12px] text-ink-muted">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="font-semibold text-brand-600 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent billing activity */}
      <section className="mt-5 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">
          Recent billing activity
        </h2>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          Subscription syncs and abandoned checkouts from Stripe webhooks.
        </p>
        {data.recentBilling.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            No billing events yet. They appear after Checkout or webhook syncs.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/70">
            {data.recentBilling.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    <Link
                      href={`/admin/customers/${ev.user.id}`}
                      className="hover:underline"
                    >
                      {ev.user.label}
                    </Link>
                    <span className="text-ink-faint"> · {ev.user.email}</span>
                  </p>
                  <p className="text-[12px] text-ink-muted">{ev.message}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-[12px]">
                  {ev.plan ? (
                    <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 capitalize text-ink-muted">
                      {ev.previousPlan && ev.previousPlan !== ev.plan
                        ? `${ev.previousPlan} → ${ev.plan}`
                        : ev.plan}
                    </span>
                  ) : null}
                  {ev.status ? <StatusBadge status={ev.status} /> : null}
                  <span className="tabular-nums text-ink-faint">
                    {new Date(ev.createdAt).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
