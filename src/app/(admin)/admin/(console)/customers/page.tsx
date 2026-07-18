"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ADMIN_PLANS } from "@/lib/admin";

type Customer = {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  plan: string;
  subscriptionStatus: string;
  creditsRemaining: number;
  createdAt: string;
  _count: { searches: number; savedLeads: number };
};

export default function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (plan) params.set("plan", plan);
    const res = await fetch(`/api/admin/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Each registered account is an agency. Manage profiles, plans, and credits."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="saas-input max-w-xs"
          placeholder="Search email, name, company…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select
          className="saas-input max-w-[160px]"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        >
          <option value="">All plans</option>
          {ADMIN_PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-brand-600 px-4 py-2 text-[12px] font-semibold text-white"
        >
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-semibold">Agency</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Credits</th>
              <th className="px-4 py-3 font-semibold">Usage</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-ink-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-ink-muted">
                  No customers found.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">
                    {c.companyName || c.name || "—"}
                  </p>
                  <p className="text-[12px] text-ink-muted">{c.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">
                  {c.plan}
                  <span className="mt-0.5 block text-[11px] text-ink-faint">
                    {c.subscriptionStatus}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{c.creditsRemaining}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {c._count.searches} searches · {c._count.savedLeads} saved
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
            ))}
          </tbody>
        </table>
        <p className="border-t border-border/60 px-4 py-2 text-[12px] text-ink-faint">
          {total} customer{total === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
