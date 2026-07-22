"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

type Milestone = { minReferrals: number; bonusCredits: number };

type Payload = {
  config: {
    enabled: boolean;
    creditsPerReferral: number;
    milestones: Milestone[];
  };
  totalReferrals: number;
  recent: Array<{
    id: string;
    status: string;
    rewardCredits: number;
    milestoneBonus: number;
    createdAt: string;
    referrer: { label: string; email: string; code: string | null };
    referred: { label: string; email: string };
  }>;
  leaderboard: Array<{
    userId: string;
    label: string;
    email: string;
    code: string | null;
    referrals: number;
    credits: number;
  }>;
};

export default function AdminReferralsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [creditsPerReferral, setCreditsPerReferral] = useState(10);
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
      setCreditsPerReferral(json.config.creditsPerReferral);
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
          creditsPerReferral,
          milestones,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setMessage("Referral rewards saved.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
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

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Referrals & Affiliates"
        description="Configure credit rewards per signup and milestone bonuses for high-volume affiliates (10, 50, 100+)."
        actions={
          <Button onClick={save} loading={busy} disabled={busy}>
            Save rewards
          </Button>
        }
      />

      {message && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Total rewarded referrals
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {data?.totalReferrals ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Program status
          </p>
          <p className="mt-1 text-2xl font-bold">
            {enabled ? "On" : "Off"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Credits / referral
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {creditsPerReferral}
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Reward settings</h2>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={busy}
          />
          Referral program enabled
        </label>
        <label className="block max-w-xs text-[12px]">
          <span className="font-medium text-ink-muted">
            Credits per successful signup
          </span>
          <input
            type="number"
            min={0}
            step={0.5}
            className="saas-input mt-1"
            value={creditsPerReferral}
            onChange={(e) => setCreditsPerReferral(Number(e.target.value) || 0)}
            disabled={busy}
          />
        </label>

        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-ink">
              Milestone bonuses
            </h3>
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() =>
                setMilestones((prev) => [
                  ...prev,
                  { minReferrals: 100, bonusCredits: 500 },
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
                  Min referrals
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
                  Bonus credits
                  <input
                    type="number"
                    min={0}
                    className="saas-input mt-1 w-28"
                    value={m.bonusCredits}
                    onChange={(e) =>
                      updateMilestone(i, {
                        bonusCredits: Number(e.target.value) || 0,
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
            {!milestones.length && (
              <p className="text-[12px] text-ink-muted">
                No milestones yet. Add tiers like 10 / 50 / 100+ referrals.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Leaderboard</h2>
          <ul className="mt-3 space-y-2">
            {(data?.leaderboard ?? []).map((row) => (
              <li
                key={row.userId}
                className="flex items-center justify-between rounded-xl bg-[#faf8fc] px-3 py-2 text-[13px]"
              >
                <div>
                  <p className="font-semibold">{row.label}</p>
                  <p className="text-[11px] text-ink-muted">
                    {row.email}
                    {row.code ? ` · ${row.code}` : ""}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-semibold">{row.referrals} refs</p>
                  <p className="text-[11px] text-ink-muted">
                    {Math.round(row.credits * 10) / 10} credits
                  </p>
                </div>
              </li>
            ))}
            {!data?.leaderboard?.length && (
              <p className="text-[13px] text-ink-muted">No referrals yet.</p>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-ink">Recent referrals</h2>
          <ul className="mt-3 space-y-2">
            {(data?.recent ?? []).map((row) => (
              <li
                key={row.id}
                className="rounded-xl bg-[#faf8fc] px-3 py-2 text-[13px]"
              >
                <p className="font-semibold">
                  {row.referrer.label} → {row.referred.label}
                </p>
                <p className="text-[11px] text-ink-muted">
                  +{row.rewardCredits + row.milestoneBonus} credits ·{" "}
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {!data?.recent?.length && (
              <p className="text-[13px] text-ink-muted">No activity yet.</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
