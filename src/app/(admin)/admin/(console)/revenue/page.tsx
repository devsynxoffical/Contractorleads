"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";

type RevenuePayload = {
  estimatedMrr: number | null;
  planMix: Array<{ plan: string; count: number; credits: number }>;
  statusMix: Array<{ status: string; count: number }>;
  customers: Array<{
    id: string;
    email: string;
    companyName: string | null;
    name: string | null;
    plan: string;
    subscriptionStatus: string;
    creditsRemaining: number;
  }>;
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenuePayload | null>(null);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-ink-muted animate-pulse">Loading…</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title="Revenue & Subscriptions"
        description="Stripe Checkout syncs plan and subscription status via webhooks. Estimated MRR uses active paid subscribers when billing data is present."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Estimated MRR"
          value={
            data.estimatedMrr == null
              ? "—"
              : `$${data.estimatedMrr.toLocaleString()}`
          }
          hint={
            data.estimatedMrr == null
              ? "Unavailable until billing is connected"
              : "From active paid subscriptions"
          }
        />
        <AdminStatCard
          label="Paying-ready plans"
          value={data.planMix
            .filter((p) => p.plan !== "trial")
            .reduce((s, p) => s + p.count, 0)}
        />
        <AdminStatCard
          label="Trialing"
          value={
            data.statusMix.find((s) => s.status === "trialing")?.count ?? 0
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Plan mix</h2>
          <ul className="mt-3 space-y-2">
            {data.planMix.map((p) => (
              <li
                key={p.plan}
                className="flex justify-between rounded-xl bg-[#faf8fc] px-3 py-2 text-sm"
              >
                <span className="capitalize">{p.plan}</span>
                <span className="tabular-nums font-semibold">
                  {p.count} · {Math.round(p.credits)} credits
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Subscription status</h2>
          <ul className="mt-3 space-y-2">
            {data.statusMix.map((s) => (
              <li
                key={s.status}
                className="flex justify-between rounded-xl bg-[#faf8fc] px-3 py-2 text-sm"
              >
                <span className="capitalize">{s.status}</span>
                <span className="tabular-nums font-semibold">{s.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.customers.map((c) => (
              <tr key={c.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    {c.companyName || c.name || "—"}
                  </p>
                  <p className="text-[12px] text-ink-muted">{c.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">{c.plan}</td>
                <td className="px-4 py-3 capitalize">{c.subscriptionStatus}</td>
                <td className="px-4 py-3 tabular-nums">{c.creditsRemaining}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
