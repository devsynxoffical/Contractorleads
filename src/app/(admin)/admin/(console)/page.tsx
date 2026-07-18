"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";

type StatsPayload = {
  stats: {
    customerCount: number;
    newCustomersWeek: number;
    leadCount: number;
    leadsToday: number;
    searchesToday: number;
    searchesWeek: number;
    creditsOutstanding: number;
    planMix: Array<{ plan: string; count: number }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    user: {
      email: string;
      companyName: string | null;
      name: string | null;
    };
  }>;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return (
      <p className="text-sm text-ink-muted animate-pulse">Loading overview…</p>
    );
  }

  const { stats } = data;

  return (
    <div>
      <AdminPageHeader
        title="Business Overview"
        description="Platform-wide health for customers, leads, and usage."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/scrape"
              className="rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white"
            >
              Scrape leads
            </Link>
            <Link
              href="/admin/copy-leads"
              className="rounded-xl border border-border bg-white px-3 py-2 text-[12px] font-semibold text-ink-muted"
            >
              Copy leads
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Customers"
          value={stats.customerCount}
          hint={`+${stats.newCustomersWeek} this week`}
        />
        <AdminStatCard
          label="Leads in pool"
          value={stats.leadCount}
          hint={`${stats.leadsToday} created today`}
        />
        <AdminStatCard
          label="Searches"
          value={stats.searchesToday}
          hint={`${stats.searchesWeek} this week`}
        />
        <AdminStatCard
          label="Credits outstanding"
          value={Math.round(stats.creditsOutstanding)}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Plan mix</h2>
          <ul className="mt-3 space-y-2">
            {stats.planMix.length === 0 && (
              <li className="text-sm text-ink-muted">No customers yet.</li>
            )}
            {stats.planMix.map((p) => (
              <li
                key={p.plan}
                className="flex items-center justify-between rounded-xl bg-[#faf8fc] px-3 py-2 text-sm"
              >
                <span className="capitalize text-ink-muted">{p.plan}</span>
                <span className="font-semibold tabular-nums text-ink">
                  {p.count}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {data.recentActivity.length === 0 && (
              <li className="text-sm text-ink-muted">No activity yet.</li>
            )}
            {data.recentActivity.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border/60 px-3 py-2 text-[12px]"
              >
                <p className="font-medium text-ink">{a.message}</p>
                <p className="mt-0.5 text-ink-faint">
                  {a.user.companyName || a.user.name || a.user.email} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
