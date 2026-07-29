"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineChartBar,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineWallet,
} from "react-icons/hi2";
import { formatCredits, formatNumber } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-user";
import { QuickLeadSearch } from "@/components/leads/quick-lead-search";
import { HudPanel } from "@/components/dashboard/hud-panel";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import {
  DashboardCrmIntegrations,
  type DashboardIntegrations,
  type DashboardPipeline,
} from "@/components/dashboard/dashboard-crm-integrations";
import { LeadGeoMap, type GeoLead } from "@/components/leads/lead-geo-map";
import {
  CREDITS_CHANGED_EVENT,
  type CreditsChangedDetail,
} from "@/lib/client/credits-sync";

type DashboardData = {
  stats: {
    totalLeads: number;
    weekLeads: number;
    savedCount: number;
    closedCount: number;
    searchCount: number;
    exportCount: number;
    creditsRemaining: number;
  };
  pipeline?: DashboardPipeline;
  integrations?: DashboardIntegrations;
  dailyLeads: { day: string; count: number }[];
  activities: {
    id: string;
    message: string;
    createdAt: string;
    type: string;
    metadata?: Record<string, unknown> | null;
  }[];
  recentSearches: {
    id: string;
    industry: string;
    country: string;
    locationScope: string;
    state: string | null;
    city: string | null;
    radius: number | null;
    resultCount: number;
    createdAt: string;
  }[];
  recentExports: {
    id: string;
    format: string;
    leadCount: number;
    createdAt: string;
  }[];
  topIndustries: { industry: string | null; count: number }[];
  qualitySplit: {
    hot: number;
    warm: number;
    nurture: number;
    hotCount: number;
    warmCount: number;
    nurtureCount: number;
  };
  qualityHealth?: {
    sampleSize: number;
    avgLeadScore: number;
    completeProfileRate: number;
    hotRate: number;
    hotCount: number;
  };
  map?: {
    allowed: boolean;
    leads: GeoLead[];
    lockedCount: number;
  };
};

function useCountUp(target: number, ready: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!ready) {
      setValue(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ready, duration]);
  return value;
}

function HudStat({
  label,
  value,
  hint,
  icon: Icon,
  href,
  spark,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  spark?: number[];
}) {
  const bars = spark ?? [4, 7, 5, 9, 6, 8, 10];
  const max = Math.max(...bars, 1);
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
            {label}
          </p>
          <p className="hud-stat-value mt-1.5">{value}</p>
          <p className="mt-1 text-[11px] text-brand-400/90">{hint}</p>
        </div>
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
      </div>
      <div className="mt-3 flex h-8 items-end gap-0.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm bg-brand-500/80"
            style={{
              height: `${Math.max(18, (h / max) * 100)}%`,
              opacity: 0.35 + (i / bars.length) * 0.65,
            }}
          />
        ))}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:brightness-110">
        <HudPanel className="h-full">{inner}</HudPanel>
      </Link>
    );
  }
  return <HudPanel className="h-full">{inner}</HudPanel>;
}

export function DashboardView({ user }: { user: SessionUser }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        const d = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(d.error || "Could not load dashboard stats");
          setReady(true);
          return;
        }
        setData(d);
        setLoadError("");
        setReady(true);
      } catch {
        if (!cancelled) {
          setLoadError("Could not load dashboard stats");
          setReady(true);
        }
      }
    }
    void load();
    function onCreditsChanged(event: Event) {
      const detail = (event as CustomEvent<CreditsChangedDetail>).detail;
      if (typeof detail?.creditsRemaining === "number") {
        setData((prev) =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  creditsRemaining: detail.creditsRemaining!,
                },
              }
            : prev,
        );
      }
      void load();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") void load();
    }
    window.addEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const maxDaily = Math.max(
    ...(data?.dailyLeads.map((d) => d.count) ?? [0]),
    1
  );
  const firstName = user.name?.split(" ")[0] || "there";
  const credits = data?.stats.creditsRemaining ?? user.creditsRemaining;
  const qs = data?.qualitySplit;
  const qh = data?.qualityHealth;

  const totalLeads = useCountUp(data?.stats.totalLeads ?? 0, ready);
  const creditsAnim = useCountUp(Math.round(credits), ready);
  const savedAnim = useCountUp(data?.stats.savedCount ?? 0, ready);
  const closedAnim = useCountUp(data?.stats.closedCount ?? 0, ready);
  const searchAnim = useCountUp(data?.stats.searchCount ?? 0, ready);
  const exportAnim = useCountUp(data?.stats.exportCount ?? 0, ready);

  const weekLeads = data?.stats.weekLeads ?? 0;
  const hotPct = qs?.hot ?? 0;
  const warmPct = qs?.warm ?? 0;
  const nurturePct = qs?.nurture ?? 0;
  const scoredTotal =
    (qs?.hotCount ?? 0) + (qs?.warmCount ?? 0) + (qs?.nurtureCount ?? 0);

  return (
    <div className="hud-dashboard">
      <div className="hud-dashboard-bg" aria-hidden />
      <div className="hud-dashboard-inner page-pad page-enter">
        {!user.onboardingComplete && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-brand-500/30 bg-brand-500/10 px-4 py-3">
            <p className="text-sm text-[#c8f7ff]">
              Finish setting up your profile to unlock better AI personalization.
            </p>
            <Link href="/onboarding" className="hud-btn-primary">
              Complete setup
            </Link>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-500">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-[#a855f7] shadow-[0_0_8px_var(--brand-500)]" />
              Live workspace · {firstName}
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] text-ink-muted sm:text-sm">
              Your leads, scores, and pipeline at a glance.
            </p>
          </div>
          <Link href="/leads/search" className="hud-btn-primary">
            <HiOutlineMagnifyingGlass className="h-4 w-4" />
            Generate leads
          </Link>
        </div>

        {!ready && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-[var(--panel-solid)] px-4 py-6 text-[13px] text-ink-muted shadow-[var(--shadow-card)]">
            <HiOutlineArrowPath className="h-4 w-4 animate-spin text-brand-500" />
            Syncing metrics…
          </div>
        )}

        {loadError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {loadError}
          </div>
        )}

        {/* Top KPI row — HUD Admin style */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HudStat
            label="Total leads"
            value={formatNumber(totalLeads)}
            hint={`+${weekLeads} this week`}
            icon={HiOutlineChartBar}
            href="/leads"
            spark={data?.dailyLeads.map((d) => d.count + 1)}
          />
          <HudStat
            label="Credits left"
            value={formatCredits(creditsAnim)}
            hint="Live balance"
            icon={HiOutlineWallet}
            href="/billing"
            spark={[3, 5, 4, 7, 6, 8, 9]}
          />
          <HudStat
            label="Saved / closed"
            value={`${formatNumber(savedAnim)} / ${formatNumber(closedAnim)}`}
            hint="Saved · won deals"
            icon={HiOutlineUserGroup}
            href="/leads/saved"
            spark={[2, 4, 3, 6, 5, 7, 8]}
          />
          <HudStat
            label="Searches / exports"
            value={`${formatNumber(searchAnim)} / ${formatNumber(exportAnim)}`}
            hint="All time"
            icon={HiOutlineArrowDownTray}
            href="/leads/search"
            spark={[5, 4, 6, 5, 8, 7, 9]}
          />
        </div>

        <div className="mb-5">
          <HudPanel
            title="Quick lead search"
            subtitle="Type a service + city, or use the filters"
          >
            <QuickLeadSearch embedded />
          </HudPanel>
        </div>

        <div className="mb-5">
          <HudPanel
            title="Lead map"
            subtitle={
              data?.map?.leads?.length
                ? `${data.map.leads.length} pin${data.map.leads.length === 1 ? "" : "s"}`
                : "Leads with coordinates appear here"
            }
            actions={
              <Link href="/leads/map" className="hud-btn-ghost text-[12px]">
                Full map
              </Link>
            }
          >
            <LeadGeoMap
              leads={data?.map?.leads ?? []}
              compact
              title="Territory"
              subtitle="Lead pins"
              leadDetailBase="/leads"
              leadFrom="dashboard"
            />
          </HudPanel>
        </div>

        <div className="mb-5">
          <DashboardCrmIntegrations
            pipeline={data?.pipeline}
            integrations={data?.integrations}
            plan={user.plan}
            subscriptionStatus={user.subscriptionStatus}
            role={user.role}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <HudPanel
            title="Leads this week"
            subtitle={`${weekLeads} new · Sun–Sat`}
          >
            <div className="relative flex h-[180px] items-end gap-2 sm:gap-3">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-40">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full border-t border-dashed border-brand-500/15"
                  />
                ))}
              </div>
              {(
                data?.dailyLeads ??
                ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => ({ day, count: 0 }),
                )
              ).map((d, idx) => {
                const h =
                  d.count > 0 ? Math.max((d.count / maxDaily) * 100, 12) : 6;
                return (
                  <div
                    key={d.day}
                    className="relative z-10 flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="text-[11px] font-semibold tabular-nums text-ink">
                      {d.count}
                    </span>
                    <div
                      className="animate-bar-grow w-full max-w-[36px] rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${idx * 0.06}s`,
                        background:
                          d.count > 0
                            ? "linear-gradient(180deg, #ec4899 0%, #7c3aed 100%)"
                            : "rgba(168,85,247,0.12)",
                      }}
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </HudPanel>

          <HudPanel
            title="Lead quality"
            subtitle={
              scoredTotal > 0
                ? `${scoredTotal} scored lead${scoredTotal === 1 ? "" : "s"}`
                : "Scores appear after you generate leads"
            }
          >
            {scoredTotal > 0 ? (
              <div className="space-y-4">
                {qh ? (
                  <div className="flex items-baseline justify-between gap-3 rounded-xl border border-border bg-[var(--input-bg)]/40 px-3.5 py-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">
                        Average score
                      </p>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">
                        {qh.avgLeadScore}
                      </p>
                    </div>
                    <Link
                      href="/leads?sort=score"
                      className="text-[12px] font-semibold text-brand-600 hover:underline"
                    >
                      View by score →
                    </Link>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {[
                    {
                      label: "Hot",
                      pct: hotPct,
                      count: qs?.hotCount ?? 0,
                      color: "#a855f7",
                      icon: HiOutlineFire,
                      href: "/leads/hot",
                    },
                    {
                      label: "Warm",
                      pct: warmPct,
                      count: qs?.warmCount ?? 0,
                      color: "#0f766e",
                      icon: HiOutlineArrowTrendingUp,
                      href: "/leads",
                    },
                    {
                      label: "Nurture",
                      pct: nurturePct,
                      count: qs?.nurtureCount ?? 0,
                      color: "#64748b",
                      icon: HiOutlineArrowTrendingDown,
                      href: "/leads",
                    },
                  ].map((q) => {
                    const Icon = q.icon;
                    return (
                      <Link key={q.label} href={q.href} className="block">
                        <div className="mb-1 flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 text-ink">
                            <Icon
                              className="h-4 w-4"
                              style={{ color: q.color }}
                            />
                            {q.label}
                            <span className="text-ink-faint">({q.count})</span>
                          </span>
                          <span
                            className="font-bold tabular-nums"
                            style={{ color: q.color }}
                          >
                            {q.pct}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--input-bg)]">
                          <div
                            className="animate-progress-fill h-full rounded-full"
                            style={{
                              width: `${q.pct}%`,
                              backgroundColor: q.color,
                            }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <p className="text-[13px] text-ink-muted">
                  Generate leads to see Hot / Warm / Nurture mix.
                </p>
                <Link
                  href="/leads/search"
                  className="mt-3 inline-flex hud-btn-primary text-[12px]"
                >
                  Open Lead Finder
                </Link>
              </div>
            )}
          </HudPanel>
        </div>

        <DashboardInsights
          topIndustries={data?.topIndustries ?? []}
          recentSearches={data?.recentSearches ?? []}
          activities={data?.activities ?? []}
          recentExports={data?.recentExports ?? []}
        />
      </div>
    </div>
  );
}
