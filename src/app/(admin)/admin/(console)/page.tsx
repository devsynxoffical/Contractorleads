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
    estimatedMrr: number | null;
    exportsWeek: number;
    saveRate: number;
    mappedLeadCount: number;
    visitors: number;
    visitorsToday: number;
    sales: number;
    newMembers: number;
    grossSales: number | null;
    revenue: number | null;
    churnRate: number;
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
  const max = Math.max(
    1,
    ...days.map((d) => Math.max(d.searches, d.leads, d.saves)),
  );

  return (
    <div className="space-y-4">
      <div className="flex h-[168px] items-end gap-2 sm:gap-3">
        {days.map((d) => (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex h-[148px] w-full items-end justify-center gap-0.5">
              <div
                className="w-[28%] rounded-t-sm bg-brand-500/90"
                style={{
                  height: `${Math.max(4, (d.searches / max) * 100)}%`,
                }}
                title={`${d.searches} searches`}
              />
              <div
                className="w-[28%] rounded-t-sm bg-emerald-400/85"
                style={{ height: `${Math.max(4, (d.leads / max) * 100)}%` }}
                title={`${d.leads} leads`}
              />
              <div
                className="w-[28%] rounded-t-sm bg-rose-400/80"
                style={{ height: `${Math.max(4, (d.saves / max) * 100)}%` }}
                title={`${d.saves} saves`}
              />
            </div>
            <span className="text-[10px] tabular-nums text-ink-faint">
              {d.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-brand-500" /> Searches
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Leads
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-rose-400" /> Saves
        </span>
      </div>
    </div>
  );
}

function HorizontalBars({
  rows,
  color = "var(--brand-500)",
}: {
  rows: Array<{ label: string; count: number }>;
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-ink-faint">No data yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.slice(0, 6).map((row) => (
        <li key={row.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-ink">{row.label}</span>
            <span className="shrink-0 tabular-nums font-semibold text-ink">
              {row.count.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--input-bg)]">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${Math.max(6, (row.count / max) * 100)}%`,
                background: color,
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
  const totalCount = mix.hot + mix.warm + mix.nurture;
  const total = Math.max(1, totalCount);
  const hotDeg = (mix.hot / total) * 360;
  const warmDeg = (mix.warm / total) * 360;

  const rows = [
    { label: "Hot", count: mix.hot, color: "#e11d48" },
    { label: "Warm", count: mix.warm, color: "#34d399" },
    { label: "Nurture", count: mix.nurture, color: "var(--brand-500)" },
  ];

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div
        className="relative h-[112px] w-[112px] shrink-0 rounded-full"
        style={{
          background: `conic-gradient(#e11d48 0deg ${hotDeg}deg, #34d399 ${hotDeg}deg ${hotDeg + warmDeg}deg, var(--brand-500) ${hotDeg + warmDeg}deg 360deg)`,
        }}
      >
        <div className="absolute inset-[12px] flex flex-col items-center justify-center rounded-full bg-[var(--surface)] ring-1 ring-border">
          <span className="text-xl font-bold tabular-nums text-ink">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
            leads
          </span>
        </div>
      </div>
      <ul className="w-full space-y-2.5 sm:flex-1">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: row.color }}
              />
              {row.label}
            </span>
            <span className="tabular-nums font-semibold text-ink">
              {row.count.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return `$${value.toLocaleString()}`;
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
    [data],
  );

  const countryRows = useMemo(
    () =>
      (data?.stats.countryMix ?? []).map((r) => ({
        label: countryLabel(r.country),
        count: r.count,
      })),
    [data],
  );

  if (error) {
    return (
      <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-[var(--input-bg)]" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[88px] animate-pulse rounded-xl bg-[var(--input-bg)]"
            />
          ))}
        </div>
        <div className="h-[220px] animate-pulse rounded-xl bg-[var(--input-bg)]" />
      </div>
    );
  }

  const { stats } = data;
  const mrr = stats.revenue ?? stats.estimatedMrr;
  const activePlans = stats.planMix.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Business Overview"
        description="Platform health across customers, lead pool, and revenue."
        actions={
          <>
            <Link href="/admin/customers" className="hud-btn-primary text-[12px]">
              Customers
            </Link>
            <Link href="/admin/platform" className="hud-btn-ghost text-[12px]">
              Platform
            </Link>
            <Link href="/admin/scrape" className="hud-btn-ghost text-[12px]">
              Scrape
            </Link>
          </>
        }
      />

      {/* Primary KPIs — one clean row */}
      <section>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          This week
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <AdminStatCard
            label="Visitors"
            value={stats.visitors.toLocaleString()}
            hint={`${stats.visitorsToday} active today`}
          />
          <AdminStatCard
            label="New sales"
            value={stats.sales.toLocaleString()}
            hint="Paid plan signups"
          />
          <AdminStatCard
            label="New members"
            value={stats.newMembers.toLocaleString()}
            hint="Agency accounts created"
          />
          <AdminStatCard
            label="MRR"
            value={formatMoney(mrr)}
            hint={
              mrr == null
                ? "Connect billing to unlock"
                : `${stats.churnRate}% churn`
            }
          />
          <AdminStatCard
            label="Customers"
            value={stats.customerCount.toLocaleString()}
            hint={`+${stats.newCustomersWeek} · ${stats.suspendedCount} suspended`}
          />
          <AdminStatCard
            label="Searches"
            value={stats.searchesToday.toLocaleString()}
            hint={`${stats.searchesWeek.toLocaleString()} this week`}
          />
        </div>
      </section>

      {/* Ops strip — compact secondary metrics */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          compact
          label="Leads in pool"
          value={stats.leadCount.toLocaleString()}
          hint={`${stats.leadsToday} today · ${stats.hotLeadCount} hot`}
        />
        <AdminStatCard
          compact
          label="Saved in CRMs"
          value={stats.savedLeadCount.toLocaleString()}
          hint={`+${stats.savedThisWeek} this week`}
        />
        <AdminStatCard
          compact
          label="Credits out"
          value={Math.round(stats.creditsOutstanding).toLocaleString()}
          hint={`${Math.round(stats.creditsSpentWeek)} spent this week`}
        />
        <AdminStatCard
          compact
          label="Mapped / plans"
          value={`${stats.mappedLeadCount.toLocaleString()} · ${activePlans}`}
          hint={`${stats.saveRate}% save rate · ${stats.exportsWeek} exports`}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
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
        title="Lead map"
        subtitle="Global pool coverage"
        leadDetailBase="/admin/leads"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel title="Top industries" subtitle="Lead volume by vertical">
          <HorizontalBars rows={industryRows} color="var(--brand-500)" />
        </HudPanel>

        <HudPanel title="Countries" subtitle="Where leads concentrate">
          <HorizontalBars rows={countryRows} color="#34d399" />
        </HudPanel>

        <HudPanel title="Plan mix" subtitle="Agency subscription tiers">
          {stats.planMix.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              No customers yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.planMix.map((p) => (
                <li
                  key={p.plan}
                  className="flex items-center justify-between py-2.5 text-[13px]"
                >
                  <span className="capitalize font-medium text-ink">
                    {p.plan}
                  </span>
                  <span className="tabular-nums font-semibold text-ink">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {stats.statusMix.length > 0 ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Status
              </p>
              <ul className="space-y-2">
                {stats.statusMix.map((s) => (
                  <li
                    key={s.status}
                    className="flex justify-between text-[13px] text-ink-muted"
                  >
                    <span className="capitalize">{s.status}</span>
                    <span className="tabular-nums font-medium text-ink">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </HudPanel>
      </div>

      <HudPanel
        title="Recent activity"
        subtitle="Latest platform events across agencies"
        actions={
          <Link
            href="/admin/activity"
            className="text-[12px] font-semibold text-brand-500 hover:underline"
          >
            View all
          </Link>
        }
      >
        {data.recentActivity.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">
            No activity yet.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-[13px] font-medium leading-snug text-ink">
                  {a.message}
                </p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {a.user.companyName || a.user.name || a.user.email}
                  <span className="text-ink-faint">
                    {" "}
                    ·{" "}
                    {new Date(a.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </HudPanel>
    </div>
  );
}
