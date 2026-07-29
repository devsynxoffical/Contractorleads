"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { ADMIN_PLANS } from "@/lib/plans";

type CouponRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: string;
  percentOff: number | null;
  amountOffCents: number | null;
  duration: string;
  durationInMonths: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  oncePerCustomer: boolean;
  expiresAt: string | null;
  applicablePlans: string[];
  active: boolean;
  stripeCouponId: string | null;
  stripePromotionCodeId: string | null;
  discountLabel: string;
  createdAt: string;
};

const emptyForm = () => ({
  code: "",
  name: "",
  description: "",
  discountType: "percent" as "percent" | "amount",
  percentOff: "20",
  amountOffUsd: "10",
  duration: "once" as "once" | "repeating" | "forever",
  durationInMonths: "3",
  maxRedemptions: "",
  oncePerCustomer: true,
  expiresAt: "",
  applicablePlans: [] as string[],
  active: true,
});

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load coupons");
      return;
    }
    setCoupons(data.coupons ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function togglePlan(plan: string) {
    setForm((f) => ({
      ...f,
      applicablePlans: f.applicablePlans.includes(plan)
        ? f.applicablePlans.filter((p) => p !== plan)
        : [...f.applicablePlans, plan],
    }));
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          percentOff: Number(form.percentOff),
          amountOffUsd: Number(form.amountOffUsd),
          durationInMonths: Number(form.durationInMonths),
          maxRedemptions: form.maxRedemptions
            ? Number(form.maxRedemptions)
            : null,
          expiresAt: form.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setForm(emptyForm());
      setMessage(
        `Created ${data.coupon.code} (${data.coupon.discountLabel})${
          data.coupon.stripePromotionCodeId
            ? " · synced to Stripe"
            : " · saved locally (sync Stripe keys if checkout should discount)"
        }`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(null);
    }
  }

  async function setActive(id: string, active: boolean) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessage(`${data.coupon.code} is now ${active ? "active" : "paused"}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, code: string) {
    if (!confirm(`Delete coupon ${code}? Existing redemptions will be removed.`)) {
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMessage(`Deleted ${code}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Create discount codes for plan checkout. Codes sync to Stripe Promotion Codes when billing keys are configured."
      />

      {message ? (
        <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Create coupon</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Customers enter the code on Billing before checkout, or in the Stripe
          checkout promo field.
        </p>

        <form
          onSubmit={createCoupon}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Code</span>
            <input
              required
              className="saas-input mt-1 uppercase"
              placeholder="SAVE20"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Name</span>
            <input
              required
              className="saas-input mt-1"
              placeholder="Spring launch 20%"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block text-[12px] sm:col-span-2 lg:col-span-1">
            <span className="font-medium text-ink-muted">Description</span>
            <input
              className="saas-input mt-1"
              placeholder="Optional note for admins"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>

          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Discount type</span>
            <select
              className="saas-input mt-1"
              value={form.discountType}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountType: e.target.value as "percent" | "amount",
                })
              }
            >
              <option value="percent">Percent off</option>
              <option value="amount">Fixed $ off</option>
            </select>
          </label>

          {form.discountType === "percent" ? (
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Percent off</span>
              <input
                type="number"
                min={1}
                max={100}
                step={0.5}
                required
                className="saas-input mt-1"
                value={form.percentOff}
                onChange={(e) =>
                  setForm({ ...form, percentOff: e.target.value })
                }
              />
            </label>
          ) : (
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Amount off (USD)</span>
              <input
                type="number"
                min={0.5}
                step={0.5}
                required
                className="saas-input mt-1"
                value={form.amountOffUsd}
                onChange={(e) =>
                  setForm({ ...form, amountOffUsd: e.target.value })
                }
              />
            </label>
          )}

          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Duration</span>
            <select
              className="saas-input mt-1"
              value={form.duration}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration: e.target.value as "once" | "repeating" | "forever",
                })
              }
            >
              <option value="once">First invoice only</option>
              <option value="repeating">Repeating (N months)</option>
              <option value="forever">Forever</option>
            </select>
          </label>

          {form.duration === "repeating" ? (
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Months</span>
              <input
                type="number"
                min={1}
                max={36}
                className="saas-input mt-1"
                value={form.durationInMonths}
                onChange={(e) =>
                  setForm({ ...form, durationInMonths: e.target.value })
                }
              />
            </label>
          ) : null}

          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">
              Max redemptions (blank = unlimited)
            </span>
            <input
              type="number"
              min={1}
              className="saas-input mt-1"
              value={form.maxRedemptions}
              onChange={(e) =>
                setForm({ ...form, maxRedemptions: e.target.value })
              }
            />
          </label>

          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Expires</span>
            <input
              type="date"
              className="saas-input mt-1"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </label>

          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-[12px] font-medium text-ink-muted">
              Applies to plans (leave empty = all checkout plans)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ADMIN_PLANS.filter((p) => p.value !== "enterprise").map((p) => {
                const on = form.applicablePlans.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlan(p.value)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                      on
                        ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                        : "bg-[#faf8fc] text-ink-muted"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-ink-muted sm:col-span-2 lg:col-span-3">
            <input
              type="checkbox"
              checked={form.oncePerCustomer}
              onChange={(e) =>
                setForm({ ...form, oncePerCustomer: e.target.checked })
              }
            />
            One use per customer account
          </label>

          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" loading={busy === "create"}>
              {busy === "create" ? "Creating…" : "Create coupon"}
            </Button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border/80 bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <p className="font-semibold tabular-nums text-ink">{c.code}</p>
                  <p className="text-[12px] text-ink-muted">{c.name}</p>
                  {c.applicablePlans.length ? (
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      Plans: {c.applicablePlans.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[12px] text-ink-muted">All plans</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{c.discountLabel}</p>
                  <p className="text-[11px] capitalize text-ink-faint">
                    {c.duration}
                    {c.duration === "repeating" && c.durationInMonths
                      ? ` · ${c.durationInMonths} mo`
                      : ""}
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-muted">
                  {c.redemptionCount}
                  {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      c.active ? "text-emerald-700" : "text-ink-faint"
                    }
                  >
                    {c.active ? "Active" : "Paused"}
                  </span>
                  {c.expiresAt ? (
                    <p className="text-[12px] text-ink-muted">
                      Exp {new Date(c.expiresAt).toLocaleDateString()}
                    </p>
                  ) : null}
                  {c.stripePromotionCodeId ? (
                    <p className="text-[10px] text-emerald-700">Stripe linked</p>
                  ) : (
                    <p className="text-[10px] text-amber-700">No Stripe link</p>
                  )}
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy === c.id}
                    onClick={() => void setActive(c.id, !c.active)}
                  >
                    {c.active ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy === c.id}
                    onClick={() => void remove(c.id, c.code)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No coupons yet — create your first code above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
