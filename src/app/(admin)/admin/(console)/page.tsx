"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";
import { HudPanel } from "@/components/dashboard/hud-panel";
import { LeadGeoMap, type GeoLead } from "@/components/leads/lead-geo-map";

type StatsPayload = {
  stats: {
    customerCount: number;
    newCustomersWeek: number;
    leadCount: number;
    leadsToday: number;
    searchesToday: number;
    searchesWeek: number;
    creditsOutstanding: number;
    creditsSpentWeek: number;
    planMix: Array<{ plan: string; count: number }>;
    statusMix: Array<{ status: string; count: number }>;
    suspendedCount: number;
    savedLeadCount: number;
    savedThisWeek: number;
    hotLeadCount: number;
    qualityMix: { hot: number; warm: number; nurture: number };
    industryMix: Array<{ industry: string; count: number }>;
    countryMix: Array<{ country: string; count: number }>;
    last7Days: Array<{
      date: string;
      searches: number;
      leads: number;
      saves: number;
    }>;
    estimatedMrr: number;
    exportsWeek: number;
    saveRate: number;
    mappedLeadCount: number;
  };
  geoLeads: GeoLead[];
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

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  UK: "United Kingdom",
  AU: "Australia",
  MX: "Mexico",
};

function countryLabel(code: string) {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

function DualBarChart({
  days,
}: {
  days: StatsPayload["stats"]["last7Days"];
}) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.searches, d.leads, d.saves)));

  return (
    <div className="space-y-3">
      <div className="flex h-[160px] items-end gap-2 sm:gap-3">
        {days.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-[140px] w-full items-end justify-center gap-0.5">
              <div
                className="w-[28%] rounded-t-sm bg-[#00e5ff]/85"
                style={{ height: `${Math.max(4, (d.searches / max) * 100)}%` }}
                title={`${d.searches} searches`}
              />
              <div
                className="w-[28%] rounded-t-sm bg-[#7dffb3]/75"
                style={{ height: `${Math.max(4, (d.leads / max) * 100)}%` }}
                title={`${d.leads} leads`}
              />
              <div
                className="w-[28%] rounded-t-sm bg-[#ff4d6d]/70"
                style={{ height: `${Math.max(4, (d.saves / max) * 100)}%` }}
                title={`${d.saves} saves`}
              />
            </div>
            <span className="text-[10px] tabular-nums text-[#5c6b7c]">
              {d.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-[#8b9aab]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[#00e5ff]" /> Searches
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[#7dffb3]" /> Leads
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[#ff4d6d]" /> Saves
        </span>
      </div>
    </div>
  );
}

function HorizontalBars({
  rows,
  color = "#00e5ff",
}: {
  rows: Array<{ label: string; count: number }>;
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) {
    return <p className="text-sm text-[#5c6b7c]">No data yet.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
            <span className="truncate text-[#c5d0dc]">{row.label}</span>
            <span className="shrink-0 tabular-nums text-[#8b9aab]">
              {row.count}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, (row.count / max) * 100)}%`,
                background: color,
                boxShadow: `0 0 10px ${color}55`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function QualityDonut({
  mix,
}: {
  mix: StatsPayload["stats"]["qualityMix"];
}) {
  const total = Math.max(1, mix.hot + mix.warm + mix.nurture);
  const hotDeg = (mix.hot / total) * 360;
  const warmDeg = (mix.warm / total) * 360;

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-[100px] w-[100px] shrink-0 rounded-full"
        style={{
          background: `conic-gradient(#ff4d6d 0deg ${hotDeg}deg, #7dffb3 ${hotDeg}deg ${hotDeg + warmDeg}deg, #00e5ff ${hotDeg + warmDeg}deg 360deg)`,
        }}
      >
        <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-[#0b1220]">
          <span className="text-lg font-bold tabular-nums text-white">
            {mix.hot + mix.warm + mix.nurture}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#5c6b7c]">
            leads
          </span>
        </div>
      </div>
      <ul className="space-y-2 text-[12px]">
        <li className="flex items-center gap-2 text-[#ff4d6d]">
          <span className="h-2 w-2 rounded-full bg-[#ff4d6d]" /> Hot {mix.hot}
        </li>
        <li className="flex items-center gap-2 text-[#7dffb3]">
          <span className="h-2 w-2 rounded-full bg-[#7dffb3]" /> Warm {mix.warm}
        </li>
        <li className="flex items-center gap-2 text-[#00e5ff]">
          <span className="h-2 w-2 rounded-full bg-[#00e5ff]" /> Nurture{" "}
          {mix.nurture}
        </li>
      </ul>
    </div>
  );
}

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

  const industryRows = useMemo(
    () =>
      (data?.stats.industryMix ?? []).map((r) => ({
        label: r.industry,
        count: r.count,
      })),
    [data]
  );

  const countryRows = useMemo(
    () =>
      (data?.stats.countryMix ?? []).map((r) => ({
        label: countryLabel(r.country),
        count: r.count,
      })),
    [data]
  );

  if (error) {
    return <p className="text-sm text-[#ff4d6d]">{error}</p>;
  }

  if (!data) {
    return (
      <p className="animate-pulse text-sm text-[#8b9aab]">Loading overview…</p>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Business Overview"
        description="Platform-wide health for customers, leads, revenue, and geo coverage."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/scrape" className="hud-btn-primary text-[12px]">
              Scrape leads
            </Link>
            <Link href="/admin/copy-leads" className="hud-btn-ghost text-[12px]">
              Copy leads
            </Link>
            <Link href="/admin/customers" className="hud-btn-ghost text-[12px]">
              Manage customers
            </Link>
            <Link href="/admin/activity" className="hud-btn-ghost text-[12px]">
              Activity
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Customers"
          value={stats.customerCount}
          hint={`+${stats.newCustomersWeek} this week · ${stats.suspendedCount} suspended`}
        />
        <AdminStatCard
          label="Leads in pool"
          value={stats.leadCount}
          hint={`${stats.leadsToday} today · ${stats.hotLeadCount} hot`}
        />
        <AdminStatCard
          label="Est. MRR"
          value={`$${stats.estimatedMrr.toLocaleString()}`}
          hint={`${stats.saveRate}% save rate · ${stats.exportsWeek} exports/wk`}
        />
        <AdminStatCard
          label="Searches"
          value={stats.searchesToday}
          hint={`${stats.searchesWeek} this week`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Saved in CRMs"
          value={stats.savedLeadCount}
          hint={`+${stats.savedThisWeek} this week`}
        />
        <AdminStatCard
          label="Credits outstanding"
          value={Math.round(stats.creditsOutstanding)}
          hint={`${Math.round(stats.creditsSpentWeek)} spent this week`}
        />
        <AdminStatCard
          label="Mapped leads"
          value={stats.mappedLeadCount}
          hint="Pins on global map"
        />
        <AdminStatCard
          label="Active plans"
          value={stats.planMix.reduce((s, p) => s + p.count, 0)}
          hint={
            stats.statusMix.find((s) => s.status === "active")
              ? `${stats.statusMix.find((s) => s.status === "active")!.count} active status`
              : "Subscription mix"
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <HudPanel
          title="Usage analytics"
          subtitle="Searches, new leads, and CRM saves — last 7 days"
        >
          <DualBarChart days={stats.last7Days} />
        </HudPanel>

        <HudPanel title="Lead quality" subtitle="Hot / warm / nurture split">
          <QualityDonut mix={stats.qualityMix} />
        </HudPanel>
      </div>

      <LeadGeoMap
        leads={data.geoLeads}
        compact
        title="Traffic Analytics"
        subtitle="Global lead pin map · pool-wide"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <HudPanel title="Top industries" subtitle="Lead volume by vertical">
          <HorizontalBars rows={industryRows} color="#00e5ff" />
        </HudPanel>

        <HudPanel title="Countries" subtitle="Where leads are concentrated">
          <HorizontalBars rows={countryRows} color="#7dffb3" />
        </HudPanel>

        <HudPanel title="Plan mix" subtitle="Agency subscription tiers">
          <ul className="space-y-2">
            {stats.planMix.length === 0 && (
              <li className="text-sm text-[#5c6b7c]">No customers yet.</li>
            )}
            {stats.planMix.map((p) => (
              <li
                key={p.plan}
                className="flex items-center justify-between rounded-lg border border-[#00e5ff]/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span className="capitalize text-[#c5d0dc]">{p.plan}</span>
                <span className="font-semibold tabular-nums text-[#00e5ff]">
                  {p.count}
                </span>
              </li>
            ))}
          </ul>
          {stats.statusMix.length > 0 && (
            <div className="mt-4 border-t border-[#00e5ff]/10 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c6b7c]">
                Status
              </p>
              <ul className="space-y-1.5">
                {stats.statusMix.map((s) => (
                  <li
                    key={s.status}
                    className="flex justify-between text-[12px] text-[#8b9aab]"
                  >
                    <span className="capitalize">{s.status}</span>
                    <span className="tabular-nums text-[#c5d0dc]">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </HudPanel>
      </div>

      <HudPanel
        title="Recent activity"
        subtitle="Latest platform events across agencies"
        actions={
          <Link
            href="/admin/activity"
            className="text-[11px] font-semibold text-[#00e5ff] hover:underline"
          >
            View all
          </Link>
        }
      >
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {data.recentActivity.length === 0 && (
            <li className="text-sm text-[#5c6b7c]">No activity yet.</li>
          )}
          {data.recentActivity.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-[#00e5ff]/10 bg-white/[0.03] px-3 py-2.5 text-[12px]"
            >
              <p className="font-medium text-[#e8eef6]">{a.message}</p>
              <p className="mt-0.5 text-[#5c6b7c]">
                {a.user.companyName || a.user.name || a.user.email} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </HudPanel>
    </div>
  );
}
