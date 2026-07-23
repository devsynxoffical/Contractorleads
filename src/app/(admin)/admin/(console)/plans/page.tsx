"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { HudPanel } from "@/components/dashboard/hud-panel";

type PlanRow = {
  id: string;
  label: string;
  priceMonthly: number;
  customers: number;
  creditsOutstanding: number;
  apiMonthlyLimit: number;
  teamSeats: number;
  features: Record<string, boolean>;
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
  const [featureKeys, setFeatureKeys] = useState<string[]>([]);
  const [legacy, setLegacy] = useState<Array<{ plan: string; label: string; count: number }>>(
    [],
  );

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans ?? []);
        setFeatureKeys(d.featureKeys ?? []);
        setLegacy(d.legacy ?? []);
      });
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Plans & Entitlements"
        description="Canonical Starter → Growth → Agency → Enterprise gates. Assign plans on each customer; API/MCP/SSO flags sync automatically when the plan changes."
        actions={
          <Link
            href="/admin/customers"
            className="rounded-xl border border-border bg-white px-3 py-2 text-[12px] font-semibold text-ink"
          >
            Assign on customers →
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        {plans.map((p) => (
          <div key={p.id} className="hud-panel !p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {p.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {p.priceMonthly > 0 ? `$${p.priceMonthly}` : p.id === "enterprise" ? "Custom" : "Free"}
            </p>
            <p className="mt-2 text-[12px] text-ink-muted">
              {p.customers} customers · {Math.round(p.creditsOutstanding)} credits
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              API {p.apiMonthlyLimit}/mo · {p.teamSeats} seats
            </p>
          </div>
        ))}
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
                <tr key={key} className="border-b border-white/[0.04]">
                  <td className="px-3 py-2.5 font-medium text-ink">
                    {FEATURE_LABELS[key] ?? key}
                  </td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 tabular-nums">
                      {p.features[key] ? (
                        <span className="font-semibold text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-white/[0.04]">
                <td className="px-3 py-2.5 font-medium text-ink">API monthly calls</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-3 py-2.5 tabular-nums text-ink-muted">
                    {p.apiMonthlyLimit}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-medium text-ink">Team seats</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-3 py-2.5 tabular-nums text-ink-muted">
                    {p.teamSeats}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </HudPanel>

      {legacy.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100">
          <p className="font-semibold">Legacy plan values still on accounts</p>
          <ul className="mt-1 list-disc pl-5 text-amber-100/90">
            {legacy.map((l) => (
              <li key={l.plan}>
                {l.plan} ({l.label}) — {l.count} accounts. Prefer remapping to Growth /
                Agency on the customer page.
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
