"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineMap,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineUserGroup,
  HiOutlineWallet,
  HiOutlineViewColumns,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { formatCredits, formatNumber } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-user";
import { QuickLeadSearch } from "@/components/leads/quick-lead-search";
import { getTierOneCountry } from "@/lib/constants";
import { HudPanel } from "@/components/dashboard/hud-panel";
import {
  DashboardCrmIntegrations,
  type DashboardIntegrations,
  type DashboardPipeline,
} from "@/components/dashboard/dashboard-crm-integrations";
import { userHasPlanFeature } from "@/lib/plan-access";
import { LeadGeoMap, type GeoLead } from "@/components/leads/lead-geo-map";

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
  activities: { id: string; message: string; createdAt: string; type: string }[];
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
    placesScannedRecent: number;
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

function RingStat({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="hud-ring" style={{ ["--p" as string]: clamped }}>
        <span>{clamped}%</span>
      </div>
      <p className="text-[11px] uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
    </div>
  );
}

export function DashboardView({ user }: { user: SessionUser }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard/stats");
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
    return () => {
      cancelled = true;
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
  const creditPct = Math.min(100, Math.round((credits / 100) * 100));

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
              Verified leads, AI scores, and pipeline signal across your markets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/leads/search" className="hud-btn-primary">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate leads
            </Link>
            <Link href="/ask-expert" className="hud-btn-ghost">
              <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
              Ask AI
            </Link>
            <Link href="/leads/saved" className="hud-btn-ghost">
              <HiOutlineStar className="h-4 w-4" />
              Saved
            </Link>
          </div>
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
            label="Site leads"
            value={formatNumber(totalLeads)}
            hint={`+${weekLeads} this week`}
            icon={HiOutlineChartBar}
            href="/leads"
            spark={data?.dailyLeads.map((d) => d.count + 1)}
          />
          <HudStat
            label="Credits"
            value={formatCredits(creditsAnim)}
            hint="Live balance"
            icon={HiOutlineWallet}
            href="/billing"
            spark={[3, 5, 4, 7, 6, 8, 9]}
          />
          <HudStat
            label="Saved / closed"
            value={`${formatNumber(savedAnim)} / ${formatNumber(closedAnim)}`}
            hint="Workspace · pipeline"
            icon={HiOutlineUserGroup}
            href="/leads/saved"
            spark={[2, 4, 3, 6, 5, 7, 8]}
          />
          <HudStat
            label="Searches / exports"
            value={`${formatNumber(searchAnim)} / ${formatNumber(exportAnim)}`}
            hint="Lifetime ops"
            icon={HiOutlineArrowDownTray}
            href="/leads/search"
            spark={[5, 4, 6, 5, 8, 7, 9]}
          />
        </div>

        {/* Quick actions */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/leads/search",
              label: "Generate leads",
              desc: "Preset or custom area",
              icon: HiOutlineSparkles,
            },
            {
              href: "/leads/hot",
              label: "Hot leads",
              desc: "Highest AI scores",
              icon: HiOutlineFire,
            },
            {
              href: "/leads/map",
              label: "Lead map",
              desc: "Geo plot coverage",
              icon: HiOutlineMap,
            },
            {
              href: "/leads/pipeline",
              label: "Pipeline CRM",
              desc: "New → closed",
              icon: HiOutlineViewColumns,
            },
            ...(userHasPlanFeature(user, "teams")
              ? [
                  {
                    href: "/team",
                    label: "Users & teams",
                    desc: "Invite Agency seats",
                    icon: HiOutlineUserGroup,
                  },
                ]
              : [
                  {
                    href: "/billing",
                    label: "Upgrade for teams",
                    desc: "Agency unlocks seats",
                    icon: HiOutlineUserGroup,
                  },
                ]),
            {
              href: "/setup",
              label: "Workspace setup",
              desc: "Email · API · CRM",
              icon: HiOutlineCog6Tooth,
            },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href} className="block">
                <HudPanel className="flex items-center gap-3 transition hover:brightness-110">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand-500/35 bg-brand-500/10 text-brand-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">
                      {a.label}
                    </p>
                    <p className="text-[11px] text-ink-muted">{a.desc}</p>
                  </div>
                </HudPanel>
              </Link>
            );
          })}
        </div>

        <div className="mb-5">
          <HudPanel title="Quick lead search" subtitle="Run a scoped find without leaving HUD">
            <div className="hud-quick-search [&_.saas-input]:border-brand-500/25 [&_.saas-input]:bg-[var(--panel-solid)] [&_.saas-input]:text-ink [&_label]:text-ink-muted">
              <QuickLeadSearch embedded />
            </div>
          </HudPanel>
        </div>

        <div className="mb-5">
          {userHasPlanFeature(user, "map") ? (
            <HudPanel
              title="Lead map"
              subtitle={
                data?.map?.leads?.length
                  ? `${data.map.leads.length} unlocked pin${data.map.leads.length === 1 ? "" : "s"}${
                      data.map.lockedCount
                        ? ` · ${data.map.lockedCount} locked`
                        : ""
                    }`
                  : "Unlocked leads with coordinates appear here"
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
                subtitle="Unlocked lead pins"
                leadDetailBase="/leads"
              />
            </HudPanel>
          ) : (
            <HudPanel
              title="Lead map"
              subtitle="Growth+ unlocks territory pins on your dashboard"
              actions={
                <Link href="/billing" className="hud-btn-primary text-[12px]">
                  Upgrade
                </Link>
              }
            >
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-[var(--canvas)]/40 px-4 py-8 text-center">
                <HiOutlineMap className="h-8 w-8 text-brand-500" />
                <p className="max-w-sm text-[13px] text-ink-muted">
                  Map your unlocked Hot leads by city once you upgrade to Growth
                  or higher.
                </p>
                <Link href="/billing" className="text-[13px] font-semibold text-brand-600 hover:underline">
                  View plans →
                </Link>
              </div>
            </HudPanel>
          )}
        </div>

        <div className="mb-5">
          <DashboardCrmIntegrations
            pipeline={data?.pipeline}
            integrations={data?.integrations}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          {/* Server-style stats: trend + rings */}
          <HudPanel
            title="Lead generation trend"
            subtitle="Daily volume · this week (Sun–Sat)"
            actions={
              <span className="hud-pill">
                {weekLeads} new
              </span>
            }
          >
            <div className="relative flex h-[200px] items-end gap-2 sm:gap-3">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-40">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full border-t border-dashed border-brand-500/20"
                  />
                ))}
              </div>
              {(
                data?.dailyLeads ??
                ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => ({ day, count: 0 })
                )
              ).map((d, idx) => {
                const h = Math.max((d.count / maxDaily) * 100, 8);
                return (
                  <div
                    key={d.day}
                    className="group relative z-10 flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="animate-bar-grow w-full max-w-[36px]"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${idx * 0.06}s`,
                        background:
                          d.count > 0
                            ? "linear-gradient(180deg, #ec4899 0%, #7c3aed 100%)"
                            : "rgba(168,85,247,0.12)",
                        boxShadow:
                          d.count > 0
                            ? "0 0 12px rgba(168,85,247,0.35)"
                            : "none",
                      }}
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                      {d.day}
                    </span>
                    <div className="pointer-events-none absolute bottom-[calc(100%+6px)] border border-brand-500/40 bg-[var(--panel-solid)] px-2 py-1 text-[11px] text-ink opacity-0 transition group-hover:opacity-100">
                      {d.count} leads
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap justify-around gap-4 border-t border-brand-500/15 pt-5">
              <RingStat label="Hot" pct={hotPct} />
              <RingStat label="Warm" pct={warmPct} />
              <RingStat label="Nurture" pct={nurturePct} />
              <RingStat label="Credits" pct={creditPct} />
            </div>
          </HudPanel>

          {/* Quality + welcome */}
          <div className="space-y-5">
            <HudPanel title="Signal" subtitle={`Welcome back, ${user.name || firstName}`}>
              <p className="text-[13px] leading-relaxed text-ink">
                You generated{" "}
                <strong className="text-ink">{weekLeads} new leads</strong> this
                week. Only AI-verified, quality-scored records surface here —
                verified or blank, never fabricated.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/leads/search" className="hud-btn-primary">
                  Generate
                </Link>
                <Link href="/leads/hot" className="hud-btn-ghost">
                  Hot leads
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("leadflow:open-bot"))
                  }
                  className="hud-btn-ghost"
                >
                  Support
                </button>
              </div>
            </HudPanel>

            <HudPanel title="Quality split" subtitle="Hot / Warm / Nurture">
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
                    color: "#7dffb3",
                    icon: HiOutlineArrowTrendingUp,
                    href: "/leads",
                  },
                  {
                    label: "Nurture",
                    pct: nurturePct,
                    count: qs?.nurtureCount ?? 0,
                    color: "#8b9aab",
                    icon: HiOutlineArrowTrendingDown,
                    href: "/leads",
                  },
                ].map((q) => {
                  const Icon = q.icon;
                  return (
                    <Link key={q.label} href={q.href} className="block">
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-2 text-ink">
                          <Icon className="h-4 w-4" style={{ color: q.color }} />
                          {q.label}
                          <span className="text-ink-faint">({q.count})</span>
                        </span>
                        <span className="font-bold" style={{ color: q.color }}>
                          {q.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden bg-[var(--input-bg)]">
                        <div
                          className="animate-progress-fill h-full"
                          style={{
                            width: `${q.pct}%`,
                            backgroundColor: q.color,
                            boxShadow: `0 0 8px ${q.color}`,
                          }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </HudPanel>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <HudPanel
            title="Lead quality health"
            subtitle={`Last ${qh?.sampleSize ?? 0} leads scanned`}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-brand-500/20 bg-[var(--input-bg)]/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Avg score</p>
                <p className="mt-1 text-xl font-bold text-ink">{qh?.avgLeadScore ?? 0}</p>
              </div>
              <div className="rounded-xl border border-brand-500/20 bg-[var(--input-bg)]/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Hot rate</p>
                <p className="mt-1 text-xl font-bold text-ink">{qh?.hotRate ?? 0}%</p>
              </div>
              <div className="rounded-xl border border-brand-500/20 bg-[var(--input-bg)]/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Full profiles</p>
                <p className="mt-1 text-xl font-bold text-ink">{qh?.completeProfileRate ?? 0}%</p>
              </div>
              <div className="rounded-xl border border-brand-500/20 bg-[var(--input-bg)]/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Recent scanned</p>
                <p className="mt-1 text-xl font-bold text-ink">{qh?.placesScannedRecent ?? 0}</p>
              </div>
            </div>
          </HudPanel>

          <HudPanel title="Top industries" subtitle="Most searched categories">
            <ul className="divide-y divide-brand-500/10">
              {(data?.topIndustries ?? []).map((i, idx) => (
                <li
                  key={i.industry || idx}
                  className="flex items-center justify-between py-2.5"
                >
                  <p className="text-[13px] font-medium text-ink">
                    {i.industry || "Unknown"}
                  </p>
                  <span className="hud-pill">{i.count}</span>
                </li>
              ))}
              {!data?.topIndustries?.length && (
                <li className="py-6 text-center text-[13px] text-ink-faint">
                  Industries appear after your first search.
                </li>
              )}
            </ul>
          </HudPanel>

          <HudPanel title="Search history" subtitle="Recent generation runs">
            <ul className="divide-y divide-brand-500/10">
              {(data?.recentSearches ?? []).slice(0, 5).map((s) => (
                <li key={s.id} className="py-2.5">
                  <Link href="/leads/search" className="block">
                    <p className="text-[13px] font-medium text-ink">
                      {s.industry}
                      <span className="font-normal text-ink-muted">
                        {" "}
                        ·{" "}
                        {s.locationScope === "country"
                          ? getTierOneCountry(s.country).name
                          : [s.city, s.state, getTierOneCountry(s.country).name]
                              .filter(Boolean)
                              .join(", ")}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">
                      {s.resultCount} leads ·{" "}
                      {new Date(s.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
              {!data?.recentSearches?.length && (
                <li className="py-6 text-center text-[13px] text-ink-faint">
                  No searches yet.
                </li>
              )}
            </ul>
          </HudPanel>

          <HudPanel title="Activity log" subtitle="Searches, saves, status">
            <ul className="divide-y divide-brand-500/10">
              {(data?.activities ?? []).slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-2.5">
                  <span
                    className={
                      a.type === "search" || a.type === "lead"
                        ? "hud-pill"
                        : "hud-pill hud-pill-muted"
                    }
                  >
                    {a.type.slice(0, 8)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-snug text-ink">
                      {a.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-faint">
                      {new Date(a.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
              {!data?.activities?.length && (
                <li className="py-6 text-center text-[13px] text-ink-faint">
                  Activity appears after your first search.
                </li>
              )}
            </ul>
          </HudPanel>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <HudPanel title="Export history" subtitle="CSV / Excel downloads">
            <ul className="divide-y divide-brand-500/10">
              {(data?.recentExports ?? []).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="text-[13px] font-semibold uppercase text-ink">
                      {e.format}
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      {e.leadCount} leads ·{" "}
                      {new Date(e.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <HiOutlineArrowDownTray className="h-4 w-4 text-brand-500" />
                </li>
              ))}
              {!data?.recentExports?.length && (
                <li className="py-6 text-center text-[13px] text-ink-faint">
                  No exports yet.
                </li>
              )}
            </ul>
          </HudPanel>

          <HudPanel title="Credits" subtitle="Plan balance">
            <p className="text-[40px] font-bold tabular-nums tracking-tight text-ink">
              {formatCredits(creditsAnim)}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden bg-[var(--input-bg)]">
              <div
                className="h-full bg-[#a855f7] shadow-[0_0_10px_var(--brand-500)]"
                style={{ width: `${creditPct}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/billing" className="hud-btn-primary">
                <HiOutlineTrophy className="h-4 w-4" />
                View plan
              </Link>
              <Link href="/leads/pipeline" className="hud-btn-ghost">
                Pipeline
              </Link>
            </div>
          </HudPanel>
        </div>
      </div>
    </div>
  );
}
