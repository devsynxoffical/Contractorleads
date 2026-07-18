"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ADMIN_PLANS } from "@/lib/admin";
import { Button } from "@/components/ui/button";

type Customer = {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  plan: string;
  subscriptionStatus: string;
  creditsRemaining: number;
  createdAt: string;
  isActive?: boolean;
  _count: { searches: number; savedLeads: number };
};

export default function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    name: "",
    companyName: "",
    plan: "trial",
    creditsRemaining: 20,
  });
  const [message, setMessage] = useState<string | null>(null);

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

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Create failed");
      return;
    }
    setShowCreate(false);
    setCreateForm({
      email: "",
      password: "",
      name: "",
      companyName: "",
      plan: "trial",
      creditsRemaining: 20,
    });
    setMessage(`Created ${data.customer.email}`);
    load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Create, edit, export, and manage every agency account."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? "Close form" : "Create agency"}
            </Button>
            <a
              href="/api/admin/customers/export"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-ink-muted"
            >
              Export CSV
            </a>
          </div>
        }
      />

      {message && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      )}

      {showCreate && (
        <form
          onSubmit={createCustomer}
          className="mb-5 grid gap-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-sm font-semibold text-ink">
            New agency account
          </h2>
          {(
            [
              ["email", "Email", "email"],
              ["password", "Password (min 8)", "password"],
              ["name", "Contact name", "text"],
              ["companyName", "Company", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block text-[12px]">
              <span className="font-medium text-ink-muted">{label}</span>
              <input
                required={key === "email" || key === "password"}
                type={type}
                className="saas-input mt-1"
                value={createForm[key]}
                onChange={(e) =>
                  setCreateForm({ ...createForm, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Plan</span>
            <select
              className="saas-input mt-1"
              value={createForm.plan}
              onChange={(e) =>
                setCreateForm({ ...createForm, plan: e.target.value })
              }
            >
              {ADMIN_PLANS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Starting credits</span>
            <input
              type="number"
              className="saas-input mt-1"
              value={createForm.creditsRemaining}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  creditsRemaining: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Create agency</Button>
          </div>
        </form>
      )}

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
                  {c.isActive === false && (
                    <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Suspended
                    </span>
                  )}
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
