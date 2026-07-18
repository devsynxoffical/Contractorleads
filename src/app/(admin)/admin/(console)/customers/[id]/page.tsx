"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ADMIN_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/admin";
import { Button } from "@/components/ui/button";

type Customer = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  subscriptionStatus: string;
  creditsRemaining: number;
  onboardingComplete: boolean;
  companyName: string | null;
  businessDescription: string | null;
  services: string | null;
  idealCustomer: string | null;
  serviceAreas: string | null;
  mainGoal: string | null;
  searches: Array<{
    id: string;
    industry: string;
    country: string;
    resultCount: number;
    createdAt: string;
  }>;
  creditLedger: Array<{
    id: string;
    amount: number;
    action: string;
    createdAt: string;
  }>;
  _count: { searches: number; savedLeads: number };
};

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [creditDelta, setCreditDelta] = useState("10");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/customers/${id}`);
    const data = await res.json();
    setCustomer(data.customer ?? null);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Save failed");
      return;
    }
    setCustomer((prev) => (prev ? { ...prev, ...data.customer } : data.customer));
    setMessage("Saved");
    setPassword("");
  }

  async function adjustCredits(amount: number) {
    setMessage(null);
    const res = await fetch(`/api/admin/customers/${id}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason: "admin_adjustment" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Credit update failed");
      return;
    }
    setCustomer((prev) =>
      prev ? { ...prev, creditsRemaining: data.creditsRemaining } : prev,
    );
    setMessage(`Credits updated to ${data.creditsRemaining}`);
    load();
  }

  async function testAsCustomer() {
    const res = await fetch(`/api/admin/customers/${id}/impersonate`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Could not start test session");
      return;
    }
    router.push(data.redirectTo || "/home");
    router.refresh();
  }

  if (!customer) {
    return <p className="text-sm text-ink-muted animate-pulse">Loading customer…</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title={customer.companyName || customer.name || customer.email}
        description={customer.email}
        actions={
          <Button onClick={testAsCustomer}>Test as Customer</Button>
        }
      />

      {message && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Profile</h2>
          {(
            [
              ["name", "Name"],
              ["email", "Email"],
              ["companyName", "Company"],
              ["services", "Services"],
              ["serviceAreas", "Service areas"],
              ["idealCustomer", "Ideal customer"],
              ["mainGoal", "Main goal"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-[12px]">
              <span className="font-medium text-ink-muted">{label}</span>
              <input
                className="saas-input mt-1"
                value={(customer[key] as string) ?? ""}
                onChange={(e) =>
                  setCustomer({ ...customer, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Description</span>
            <textarea
              className="saas-input mt-1 min-h-[80px]"
              value={customer.businessDescription ?? ""}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  businessDescription: e.target.value,
                })
              }
            />
          </label>
          <Button
            disabled={saving}
            onClick={() =>
              save({
                name: customer.name,
                email: customer.email,
                companyName: customer.companyName,
                services: customer.services,
                serviceAreas: customer.serviceAreas,
                idealCustomer: customer.idealCustomer,
                mainGoal: customer.mainGoal,
                businessDescription: customer.businessDescription,
              })
            }
          >
            Save profile
          </Button>
        </section>

        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-ink">
              Plan & subscription
            </h2>
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Plan</span>
              <select
                className="saas-input mt-1"
                value={customer.plan}
                onChange={(e) =>
                  setCustomer({ ...customer, plan: e.target.value })
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
              <span className="font-medium text-ink-muted">Status</span>
              <select
                className="saas-input mt-1"
                value={customer.subscriptionStatus}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    subscriptionStatus: e.target.value,
                  })
                }
              >
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <Button
              disabled={saving}
              onClick={() =>
                save({
                  plan: customer.plan,
                  subscriptionStatus: customer.subscriptionStatus,
                })
              }
            >
              Save plan
            </Button>
          </section>

          <section className="space-y-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-ink">Credits</h2>
            <p className="text-2xl font-semibold tabular-nums text-ink">
              {customer.creditsRemaining}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                className="saas-input max-w-[120px]"
                value={creditDelta}
                onChange={(e) => setCreditDelta(e.target.value)}
              />
              <Button
                onClick={() => adjustCredits(Number(creditDelta) || 0)}
              >
                Add
              </Button>
              <Button
                variant="secondary"
                onClick={() => adjustCredits(-(Number(creditDelta) || 0))}
              >
                Remove
              </Button>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-[12px] text-ink-muted">
              {customer.creditLedger.map((row) => (
                <li key={row.id}>
                  {row.amount > 0 ? "+" : ""}
                  {row.amount} · {row.action} ·{" "}
                  {new Date(row.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-ink">Reset password</h2>
            <input
              type="password"
              className="saas-input"
              placeholder="New password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              disabled={password.length < 8}
              onClick={() => save({ password })}
            >
              Update password
            </Button>
          </section>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">
          Recent searches ({customer._count.searches} total ·{" "}
          {customer._count.savedLeads} saved leads)
        </h2>
        <ul className="mt-3 space-y-2 text-[13px]">
          {customer.searches.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#faf8fc] px-3 py-2"
            >
              <span>
                {s.industry} · {s.country} · {s.resultCount} results
              </span>
              <span className="text-[11px] text-ink-faint">
                {new Date(s.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {customer.searches.length === 0 && (
            <li className="text-ink-muted">No searches yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
