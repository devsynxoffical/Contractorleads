"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { HudPanel } from "@/components/dashboard/hud-panel";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

type PlanRow = {
  id: string;
  label: string;
  priceMonthly: number;
  customers: number;
  creditsOutstanding: number;
  monthlyCredits: number | null;
  monthlyLeads: number | null;
  apiMonthlyLimit: number;
  teamSeats: number;
  features: Record<string, boolean>;
};

type CreditCosts = {
  lead: number;
  assistant: number;
  outreach: number;
  starterFreeCredits: number;
};

const FEATURE_LABELS: Record<string, string> = {
  api: "REST API",
  mcp: "MCP tools",
  sso: "SSO",
  teams: "Users & teams",
  map: "Lead map",
  crm: "CRM webhooks",
  reports: "Client reports",
  workspaces: "Workspaces",
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [creditCosts, setCreditCosts] = useState<CreditCosts | null>(null);
  const [featureKeys, setFeatureKeys] = useState<string[]>([]);
  const [legacy, setLegacy] = useState<
    Array<{ plan: string; label: string; count: number }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const d = await fetch("/api/admin/plans").then((r) => r.json());
    setPlans(d.plans ?? []);
    setPrices(d.prices ?? {});
    setCreditCosts(d.creditCosts ?? null);
    setFeatureKeys(d.featureKeys ?? []);
    setLegacy(d.legacy ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function savePrices() {
    setBusy(true);
    startNavigationProgress();
    setMessage(null);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setPrices(json.prices ?? prices);
      setMessage("Plan prices saved. Referral commissions use these amounts.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
      stopNavigationProgress();
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Plans & Entitlements"
        description="Monthly prices, credit allotments (1 credit = 1 lead), and feature entitlements. Same numbers power Billing for customers."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={savePrices} loading={busy} disabled={busy}>
              Save prices
            </Button>
            <Link
              href="/admin/referrals"
              className="inline-flex h-9 items-center rounded-xl border border-border bg-[var(--surface)] px-3 text-[12px] font-semibold text-ink"
            >
              Commission % →
            </Link>
            <Link
              href="/admin/customers"
              className="inline-flex h-9 items-center rounded-xl border border-border bg-[var(--surface)] px-3 text-[12px] font-semibold text-ink"
            >
              Assign on customers →
            </Link>
          </div>
        }
      />

      {message ? (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      ) : null}

      {creditCosts ? (
        <HudPanel
          title="Credit costs"
          subtitle="Shared with Lead Finder, Billing, and marketing pages"
          className="mb-6"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-[var(--surface)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Per lead
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                {creditCosts.lead}
              </p>
              <p className="text-[11px] text-ink-muted">credit = 1 lead</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-[var(--surface)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Ask Expert
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                {creditCosts.assistant}
              </p>
              <p className="text-[11px] text-ink-muted">credits / message</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-[var(--surface)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Outreach Studio
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                {creditCosts.outreach}
              </p>
              <p className="text-[11px] text-ink-muted">credits / generation</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-[var(--surface)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Free trial
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                {creditCosts.starterFreeCredits}
              </p>
              <p className="text-[11px] text-ink-muted">credits on signup</p>
            </div>
          </div>
        </HudPanel>
      ) : null}

      <HudPanel
        title="Monthly pricing"
        subtitle="These prices are the base for referral cash commissions"
        className="mb-6"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {plans.map((p) => (
            <label key={p.id} className="block text-[12px]">
              <span className="font-semibold text-ink">{p.label}</span>
              <span className="mt-0.5 block text-[11px] text-ink-faint">
                {p.customers} customers
              </span>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="saas-input !pl-7"
                  value={prices[p.id] ?? p.priceMonthly}
                  onChange={(e) =>
                    setPrices((prev) => ({
                      ...prev,
                      [p.id]: Number(e.target.value) || 0,
                    }))
                  }
                  disabled={busy}
                />
              </div>
            </label>
          ))}
        </div>
      </HudPanel>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        {plans.map((p) => {
          const price = prices[p.id] ?? p.priceMonthly;
          return (
            <div key={p.id} className="hud-panel !p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {p.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {price > 0
                  ? `$${price}`
                  : p.id === "enterprise"
                    ? "Custom"
                    : "Free"}
              </p>
              <p className="mt-2 text-[12px] text-ink-muted">
                {p.monthlyCredits != null
                  ? `${p.monthlyCredits.toLocaleString()} credits / mo`
                  : "Custom credits"}
                {" · "}
                {p.customers} customers
              </p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {p.monthlyLeads != null
                  ? `${p.monthlyLeads.toLocaleString()} leads · `
                  : ""}
                API {p.apiMonthlyLimit}/mo · {p.teamSeats} seats
              </p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {Math.round(p.creditsOutstanding).toLocaleString()} credits in
                customer balances
              </p>
            </div>
          );
        })}
      </div>

      <HudPanel
        title="Feature matrix"
        subtitle="What each plan unlocks in the product (and what Super Admin can override per customer)"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-brand-500/15 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-3 py-2 font-semibold">Feature</th>
                {plans.map((p) => (
                  <th key={p.id} className="px-3 py-2 font-semibold">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureKeys.map((key) => (
                <tr key={key} className="border-b border-border/70">
                  <td className="px-3 py-2.5 font-medium text-ink">
                    {FEATURE_LABELS[key] ?? key}
                  </td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 tabular-nums">
                      {p.features[key] ? (
                        <span className="font-semibold text-emerald-600">
                          Yes
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-border/70">
                <td className="px-3 py-2.5 font-medium text-ink">
                  Monthly credits (leads)
                </td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className="px-3 py-2.5 tabular-nums text-ink-muted"
                  >
                    {p.monthlyCredits != null
                      ? p.monthlyCredits.toLocaleString()
                      : "Custom"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/70">
                <td className="px-3 py-2.5 font-medium text-ink">
                  API monthly calls
                </td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className="px-3 py-2.5 tabular-nums text-ink-muted"
                  >
                    {p.apiMonthlyLimit}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-medium text-ink">Team seats</td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className="px-3 py-2.5 tabular-nums text-ink-muted"
                  >
                    {p.teamSeats}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </HudPanel>

      {legacy.length > 0 ? (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-900 dark:text-amber-100">
          <p className="font-semibold">Legacy plan values still on accounts</p>
          <ul className="mt-1 list-disc pl-5">
            {legacy.map((l) => (
              <li key={l.plan}>
                {l.plan} ({l.label}) — {l.count} accounts. Prefer remapping to
                Growth / Agency on the customer page.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
