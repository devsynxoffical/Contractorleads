"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

type Milestone = { minReferrals: number; bonusUsd: number };

type Payload = {
  config: {
    enabled: boolean;
    commissionPercent: number;
    minWithdrawalUsd: number;
    milestones: Milestone[];
  };
  totalReferrals: number;
  recent: Array<{
    id: string;
    status: string;
    commissionUsd: number;
    milestoneBonusUsd: number;
    planAtReward: string | null;
    createdAt: string;
    referrer: { label: string; email: string; code: string | null };
    referred: { label: string; email: string; plan: string };
  }>;
  leaderboard: Array<{
    userId: string;
    label: string;
    email: string;
    code: string | null;
    referrals: number;
    earnedUsd: number;
    balanceUsd: number;
  }>;
  withdrawals: Array<{
    id: string;
    amountUsd: number;
    method: string;
    payoutDetails: string;
    status: string;
    adminNote: string | null;
    createdAt: string;
    user: {
      id: string;
      label: string;
      email: string;
      code: string | null;
      balanceUsd: number;
    };
  }>;
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [commissionPercent, setCommissionPercent] = useState(20);
  const [minWithdrawalUsd, setMinWithdrawalUsd] = useState(25);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    startNavigationProgress();
    try {
      const res = await fetch("/api/admin/referrals");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
      setEnabled(json.config.enabled);
      setCommissionPercent(json.config.commissionPercent);
      setMinWithdrawalUsd(json.config.minWithdrawalUsd);
      setMilestones(json.config.milestones ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setBusy(false);
      stopNavigationProgress();
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setBusy(true);
    startNavigationProgress();
    setMessage(null);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          commissionPercent,
          minWithdrawalUsd,
          milestones,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setMessage("Referral commission settings saved.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
      stopNavigationProgress();
    }
  }

  async function processWithdrawal(
    withdrawalId: string,
    status: "paid" | "rejected",
  ) {
    setBusy(true);
    startNavigationProgress();
    setMessage(null);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setMessage(
        status === "paid"
          ? "Withdrawal marked as paid."
          : "Withdrawal rejected — balance restored.",
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
      stopNavigationProgress();
    }
  }

  function updateMilestone(index: number, patch: Partial<Milestone>) {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  if (!data && busy) {
    return <p className="animate-pulse text-sm text-ink-muted">Loading…</p>;
  }

  const pendingWithdrawals =
    data?.withdrawals.filter((w) => w.status === "pending") ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Referrals & Affiliates"
        description="Pay cash commission when a referred agency buys a plan. Set commission % here; edit plan list prices under Plans & Entitlements."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} loading={busy} disabled={busy}>
              Save settings
            </Button>
            <a
              href="/admin/plans"
              className="inline-flex h-9 items-center rounded-xl border border-border bg-[var(--surface)] px-3 text-[12px] font-semibold text-ink"
            >
              Edit plan prices →
            </a>
          </div>
        }
      />

      {message ? (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Paid conversions
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
            {data?.totalReferrals ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Program status
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {enabled ? "On" : "Off"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Commission
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
            {commissionPercent}%
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Commission settings</h2>
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={busy}
          />
          Referral program enabled
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">
              Commission % of first paid plan
            </span>
            <input
              type="number"
              min={0}
              step={0.5}
              className="saas-input mt-1"
              value={commissionPercent}
              onChange={(e) =>
                setCommissionPercent(Number(e.target.value) || 0)
              }
              disabled={busy}
            />
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">
              Minimum withdrawal (USD)
            </span>
            <input
              type="number"
              min={0}
              step={1}
              className="saas-input mt-1"
              value={minWithdrawalUsd}
              onChange={(e) =>
                setMinWithdrawalUsd(Number(e.target.value) || 0)
              }
              disabled={busy}
            />
          </label>
        </div>

        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-ink">
              Milestone cash bonuses
            </h3>
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() =>
                setMilestones((prev) => [
                  ...prev,
                  { minReferrals: 100, bonusUsd: 250 },
                ])
              }
            >
              Add tier
            </button>
          </div>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div
                key={`${m.minReferrals}-${i}`}
                className="flex flex-wrap items-end gap-2"
              >
                <label className="block text-[11px] text-ink-muted">
                  Min paid referrals
                  <input
                    type="number"
                    min={1}
                    className="saas-input mt-1 w-28"
                    value={m.minReferrals}
                    onChange={(e) =>
                      updateMilestone(i, {
                        minReferrals: Number(e.target.value) || 1,
                      })
                    }
                  />
                </label>
                <label className="block text-[11px] text-ink-muted">
                  Bonus USD
                  <input
                    type="number"
                    min={0}
                    className="saas-input mt-1 w-28"
                    value={m.bonusUsd}
                    onChange={(e) =>
                      updateMilestone(i, {
                        bonusUsd: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="mb-1 text-[12px] text-red-600 hover:underline"
                  onClick={() =>
                    setMilestones((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            {!milestones.length ? (
              <p className="text-[12px] text-ink-muted">
                No milestones yet. Add tiers like 10 / 50 / 100+ paid referrals.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">
          Withdrawal queue
          {pendingWithdrawals.length ? (
            <span className="ml-2 text-brand-600">
              ({pendingWithdrawals.length} pending)
            </span>
          ) : null}
        </h2>
        <ul className="mt-3 space-y-2">
          {(data?.withdrawals ?? []).slice(0, 20).map((w) => (
            <li
              key={w.id}
              className="rounded-xl border border-border bg-[var(--input-bg)] px-3 py-3 text-[13px]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {money(w.amountUsd)} · {w.user.label}
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    {w.user.email}
                    {w.user.code ? ` · ${w.user.code}` : ""} · {w.method}
                  </p>
                  <p className="mt-1 text-[12px] text-ink">
                    {w.payoutDetails}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {new Date(w.createdAt).toLocaleString()} · {w.status}
                  </p>
                </div>
                {w.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => processWithdrawal(w.id, "paid")}
                    >
                      Mark paid
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => processWithdrawal(w.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
          {!data?.withdrawals?.length ? (
            <p className="text-[13px] text-ink-muted">No withdrawal requests yet.</p>
          ) : null}
        </ul>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Leaderboard</h2>
          <ul className="mt-3 space-y-2">
            {(data?.leaderboard ?? []).map((row) => (
              <li
                key={row.userId}
                className="flex items-center justify-between rounded-xl bg-[var(--input-bg)] px-3 py-2 text-[13px]"
              >
                <div>
                  <p className="font-semibold text-ink">{row.label}</p>
                  <p className="text-[11px] text-ink-muted">
                    {row.email}
                    {row.code ? ` · ${row.code}` : ""}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-semibold text-ink">
                    {row.referrals} paid
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {money(row.earnedUsd)} earned · {money(row.balanceUsd)} bal
                  </p>
                </div>
              </li>
            ))}
            {!data?.leaderboard?.length ? (
              <p className="text-[13px] text-ink-muted">No conversions yet.</p>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Recent referrals</h2>
          <ul className="mt-3 space-y-2">
            {(data?.recent ?? []).map((row) => (
              <li
                key={row.id}
                className="rounded-xl bg-[var(--input-bg)] px-3 py-2 text-[13px]"
              >
                <p className="font-semibold text-ink">
                  {row.referrer.label} → {row.referred.label}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {row.status === "rewarded"
                    ? `${money(row.commissionUsd + row.milestoneBonusUsd)}${row.planAtReward ? ` · ${row.planAtReward}` : ""}`
                    : row.status === "pending"
                      ? "Awaiting plan purchase"
                      : row.status}{" "}
                  · {new Date(row.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {!data?.recent?.length ? (
              <p className="text-[13px] text-ink-muted">No activity yet.</p>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
