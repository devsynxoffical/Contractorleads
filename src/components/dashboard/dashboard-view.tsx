"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineChartBar,
  HiOutlineCheckBadge,
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
} from "react-icons/hi2";
import { formatCredits, formatNumber } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { QuickLeadSearch } from "@/components/leads/quick-lead-search";

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
  dailyLeads: { day: string; count: number }[];
  activities: { id: string; message: string; createdAt: string; type: string }[];
  recentSearches: {
    id: string;
    industry: string;
    state: string;
    city: string | null;
    radius: number;
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
};

const LOGO_GRADIENT =
  "linear-gradient(135deg, #e6007e 0%, #8e24aa 55%, #7b1fa2 100%)";

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

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
  delay = 0,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay?: number;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-ink-muted">{label}</p>
        <p className="mt-1 text-[22px] font-bold tracking-tight text-ink tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-[12px] text-ink-faint">{hint}</p>
      </div>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105"
        style={{ backgroundColor: `${color}14`, color }}
      >
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );

  const className =
    "hover-lift animate-fade-up group block rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-card)]";

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        style={{ animationDelay: `${delay}s` }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} style={{ animationDelay: `${delay}s` }}>
      {inner}
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

  const totalLeads = useCountUp(data?.stats.totalLeads ?? 0, ready);
  const creditsAnim = useCountUp(Math.round(credits), ready);
  const savedAnim = useCountUp(data?.stats.savedCount ?? 0, ready);
  const closedAnim = useCountUp(data?.stats.closedCount ?? 0, ready);
  const searchAnim = useCountUp(data?.stats.searchCount ?? 0, ready);
  const exportAnim = useCountUp(data?.stats.exportCount ?? 0, ready);

  return (
    <div className="page-pad page-enter">
      {!user.onboardingComplete && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3d4e8] bg-[#fcf2f8] px-4 py-3 animate-fade-up">
          <p className="text-sm text-[#6a1b9a]/80">
            Finish setting up your profile to unlock better AI personalization.
          </p>
          <Link
            href="/onboarding"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            style={{ background: LOGO_GRADIENT }}
          >
            Complete setup
          </Link>
        </div>
      )}

      <div className="mesh-bg -mx-4 -mt-4 mb-6 rounded-b-2xl px-4 pb-6 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-slide-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold text-brand-600 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-emerald-500" />
              Live workspace · {firstName}
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Business Insights
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] text-ink-muted sm:text-sm">
              Watch your pipeline flow — verified leads, AI scores, and outreach
              ready across America.
            </p>
          </div>
          <div className="animate-slide-right flex flex-wrap gap-2">
            <Link
              href="/leads/search"
              className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Generate New Leads
            </Link>
            <Link
              href="/ask-expert"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[13px] font-medium text-ink-muted shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
              Ask AI Bot
            </Link>
            <Link
              href="/leads/saved"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[13px] font-medium text-ink-muted shadow-sm transition hover:bg-brand-50 hover:text-brand-700"
            >
              <HiOutlineStar className="h-4 w-4" />
              Saved Leads
            </Link>
          </div>
        </div>
      </div>

      {!ready && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-6 text-[13px] text-ink-muted shadow-[var(--shadow-card)]">
          <HiOutlineArrowPath className="h-4 w-4 animate-spin text-brand-500" />
          Loading Business Insights…
        </div>
      )}

      {loadError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {loadError}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Total Leads Generated"
          value={formatNumber(totalLeads)}
          hint={`+${data?.stats.weekLeads ?? 0} this week`}
          icon={HiOutlineChartBar}
          color="#8e24aa"
          delay={0.02}
          href="/leads"
        />
        <StatCard
          label="Credits Remaining"
          value={formatCredits(creditsAnim)}
          hint="View plan & balance"
          icon={HiOutlineWallet}
          color="#e6007e"
          delay={0.07}
          href="/billing"
        />
        <StatCard
          label="Saved Leads"
          value={formatNumber(savedAnim)}
          hint="In your workspace"
          icon={HiOutlineUserGroup}
          color="#c2187a"
          delay={0.12}
          href="/leads/saved"
        />
        <StatCard
          label="Deals Won / Closed"
          value={formatNumber(closedAnim)}
          hint="Pipeline closed"
          icon={HiOutlineTrophy}
          color="#7b1fa2"
          delay={0.17}
          href="/leads/pipeline"
        />
        <StatCard
          label="Search History"
          value={formatNumber(searchAnim)}
          hint="Lifetime searches"
          icon={HiOutlineMagnifyingGlass}
          color="#6b5a8e"
          delay={0.22}
          href="/leads/search"
        />
        <StatCard
          label="Export History"
          value={formatNumber(exportAnim)}
          hint="CSV / Excel exports"
          icon={HiOutlineArrowDownTray}
          color="#9b8fb5"
          delay={0.27}
          href="/leads/search"
        />
      </div>

      <div className="mb-5 stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/leads/search",
            label: "Generate New Leads",
            desc: "Preset or custom service & area",
            icon: HiOutlineSparkles,
          },
          {
            href: "/leads/hot",
            label: "View Hot Leads",
            desc: "Highest quality-scored records",
            icon: HiOutlineFire,
          },
          {
            href: "/leads/map",
            label: "Open Lead Map",
            desc: "Plot leads with Places coordinates",
            icon: HiOutlineMap,
          },
          {
            href: "/leads/pipeline",
            label: "Pipeline CRM",
            desc: "Move deals New → Closed",
            icon: HiOutlineViewColumns,
          },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="hover-lift group flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-card)]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition group-hover:scale-105"
                style={{ background: LOGO_GRADIENT }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink group-hover:text-brand-700">
                  {a.label}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-faint">{a.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mb-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <QuickLeadSearch embedded />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          <div
            className="relative animate-fade-up overflow-hidden rounded-2xl p-6 text-white shadow-[0_12px_36px_rgba(142,36,170,0.28)]"
            style={{ background: LOGO_GRADIENT }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 left-20 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <p className="relative text-[13px] font-medium text-white/75">
              Welcome back, {user.name || firstName}
            </p>
            <h2 className="relative mt-1 font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight sm:text-[26px]">
              Your pipeline this week
            </h2>
            <p className="relative mt-3 max-w-lg text-[14px] leading-relaxed text-white/90">
              You generated{" "}
              <strong>{data?.stats.weekLeads ?? 0} new leads</strong> this week
              (Sun–Sat). LeadFlow USA only surfaces AI-verified, quality-scored
              records — verified or blank, never fabricated.
            </p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <Link
                href="/leads/search"
                className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-semibold text-[#7b1fa2] shadow-sm transition hover:bg-white/95"
              >
                Generate Leads
              </Link>
              <Link
                href="/leads/hot"
                className="inline-flex h-9 items-center rounded-lg border border-white/30 bg-white/10 px-4 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Hot Leads
              </Link>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("leadflow:open-bot"))
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-4 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                Open live bot
              </button>
            </div>
          </div>

          <div className="animate-fade-up rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]" style={{ animationDelay: "0.12s" }}>
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-bold text-ink">
                Lead Generation Trend
              </h3>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                Total leads by day — this week (Sun–Sat)
              </p>
            </div>
            <div className="p-5">
              <div className="relative flex h-[220px] items-end gap-2 sm:gap-3">
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-full border-t border-dashed border-border"
                    />
                  ))}
                </div>
                {(
                  data?.dailyLeads ??
                  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => ({ day, count: 0 })
                  )
                ).map((d, idx) => {
                  const h = Math.max((d.count / maxDaily) * 100, 6);
                  return (
                    <div
                      key={d.day}
                      className="group relative z-10 flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="animate-bar-grow w-full max-w-[40px] rounded-t-lg transition group-hover:brightness-110"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${idx * 0.06}s`,
                          background:
                            d.count > 0
                              ? "linear-gradient(180deg, #e6007e 0%, #8e24aa 100%)"
                              : "#f3eef6",
                        }}
                      />
                      <span className="text-[11px] font-medium text-ink-faint">
                        {d.day}
                      </span>
                      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] rounded-md bg-ink px-2 py-1 text-[11px] text-white opacity-0 shadow transition group-hover:opacity-100">
                        {d.count} leads
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="animate-slide-left rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-[15px] font-bold text-ink">
                Lead Quality Split
              </h3>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                Hot / Warm / Nurture breakdown (%)
              </p>
              <div className="mt-5 space-y-4">
                {[
                  {
                    label: "Hot Leads",
                    pct: qs?.hot ?? 0,
                    count: qs?.hotCount ?? 0,
                    color: "#e6007e",
                    icon: HiOutlineFire,
                    href: "/leads/hot",
                  },
                  {
                    label: "Warm Leads",
                    pct: qs?.warm ?? 0,
                    count: qs?.warmCount ?? 0,
                    color: "#8e24aa",
                    icon: HiOutlineArrowTrendingUp,
                    href: "/leads",
                  },
                  {
                    label: "Nurture",
                    pct: qs?.nurture ?? 0,
                    count: qs?.nurtureCount ?? 0,
                    color: "#9b95a5",
                    icon: HiOutlineArrowTrendingDown,
                    href: "/leads",
                  },
                ].map((q) => {
                  const Icon = q.icon;
                  return (
                    <Link key={q.label} href={q.href} className="block">
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 font-medium text-ink">
                          <Icon className="h-4 w-4" style={{ color: q.color }} />
                          {q.label}
                          <span className="text-[11px] font-normal text-ink-faint">
                            ({q.count})
                          </span>
                        </span>
                        <span className="font-bold" style={{ color: q.color }}>
                          {q.pct}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#f3eef6]">
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

            <div className="animate-slide-right rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <HiOutlineCheckBadge className="h-5 w-5 text-brand-600" />
                <h3 className="text-[15px] font-bold text-ink">
                  Verification Engine
                </h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                Every lead is AI-verified and quality-scored before it reaches
                your dashboard. Fake, duplicate, closed, or low-quality records
                are withheld — fields are verified or blank, never fabricated.
              </p>
              <ul className="mt-4 space-y-2 text-[12px] text-ink-muted">
                <li className="flex gap-2">
                  <span className="text-brand-600">•</span>
                  Google Places + Yelp confirmation
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-600">•</span>
                  Houzz & Nextdoor best-effort enrichment
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-600">•</span>
                  LinkedIn only at ≥95% confidence
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-[14px] font-bold text-ink">Search History</h3>
                <p className="mt-0.5 text-[12px] text-ink-faint">
                  Recent lead generation runs
                </p>
              </div>
              <ul className="divide-y divide-border">
                {(data?.recentSearches ?? []).map((s, i) => (
                  <li
                    key={s.id}
                    className="animate-fade-up px-5 py-3.5 transition hover:bg-brand-50/40"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <Link href="/leads/search" className="block">
                      <p className="text-[13px] font-semibold text-ink">
                        {s.industry}
                        <span className="font-normal text-ink-muted">
                          {" "}
                          · {s.city ? `${s.city}, ` : ""}
                          {s.state}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {s.resultCount} leads · {s.radius} mi ·{" "}
                        {new Date(s.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
                {!data?.recentSearches?.length && (
                  <li className="px-5 py-6 text-center text-[13px] text-ink-faint">
                    No searches yet — generate your first leads.
                  </li>
                )}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-[14px] font-bold text-ink">Export History</h3>
                <p className="mt-0.5 text-[12px] text-ink-faint">
                  CSV / Excel downloads
                </p>
              </div>
              <ul className="divide-y divide-border">
                {(data?.recentExports ?? []).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between px-5 py-3.5 transition hover:bg-brand-50/40"
                  >
                    <div>
                      <p className="text-[13px] font-semibold uppercase text-ink">
                        {e.format}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {e.leadCount} leads ·{" "}
                        {new Date(e.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <HiOutlineArrowDownTray className="h-4 w-4 text-ink-faint" />
                  </li>
                ))}
                {!data?.recentExports?.length && (
                  <li className="px-5 py-6 text-center text-[13px] text-ink-faint">
                    No exports yet.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="animate-slide-right overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-[14px] font-bold text-ink">Credits</h3>
            <p
              className="mt-3 text-[36px] font-bold tracking-tight tabular-nums"
              style={{
                background: LOGO_GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatCredits(creditsAnim)}
            </p>
            <p className="text-[12px] uppercase tracking-wide text-ink-faint">
              Live balance
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (credits / 100) * 100)}%`,
                  background: LOGO_GRADIENT,
                }}
              />
            </div>
            <Link
              href="/billing"
              className="mt-4 inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-semibold text-white transition hover:opacity-95"
              style={{ background: LOGO_GRADIENT }}
            >
              View plan & balance
            </Link>
          </div>

          <div className="animate-slide-right rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]" style={{ animationDelay: "0.08s" }}>
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[14px] font-bold text-ink">Live Activity</h3>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                Searches, saves, status changes
              </p>
            </div>
            <ul className="divide-y divide-border">
              {(data?.activities ?? []).slice(0, 8).map((a, i) => (
                <li
                  key={a.id}
                  className="animate-fade-up flex items-start gap-3 px-5 py-3.5"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    {a.type.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug text-ink">
                      {a.message}
                    </p>
                    <p className="mt-0.5 text-[11px] capitalize text-ink-faint">
                      {a.type} ·{" "}
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
                <li className="px-5 py-6 text-center text-[13px] text-ink-faint">
                  Activity appears after your first search.
                </li>
              )}
            </ul>
          </div>

          <div className="animate-slide-right rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]" style={{ animationDelay: "0.12s" }}>
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[14px] font-bold text-ink">Top Industries</h3>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                Most searched categories
              </p>
            </div>
            <ul className="divide-y divide-border">
              {(data?.topIndustries ?? []).map((i, idx) => (
                <li
                  key={i.industry || idx}
                  className="flex items-center justify-between px-5 py-3.5 transition hover:bg-brand-50/30"
                >
                  <p className="text-[13px] font-semibold text-ink">
                    {i.industry || "Unknown"}
                  </p>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[13px] font-bold text-brand-600">
                    {i.count}
                  </span>
                </li>
              ))}
              {!data?.topIndustries?.length && (
                <li className="px-5 py-6 text-center text-[13px] text-ink-faint">
                  Industries appear after your first search.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
