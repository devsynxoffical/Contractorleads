"use client";

import { useState } from "react";
import Link from "next/link";
import { HiOutlineArrowDownTray, HiOutlineArrowRight } from "react-icons/hi2";
import { HudPanel } from "@/components/dashboard/hud-panel";
import { getTierOneCountry } from "@/lib/constants";

type QualityHealth = {
  sampleSize: number;
  avgLeadScore: number;
  completeProfileRate: number;
  hotRate: number;
  hotCount: number;
};

type RecentSearch = {
  id: string;
  industry: string;
  country: string;
  locationScope: string;
  state: string | null;
  city: string | null;
  resultCount: number;
  createdAt: string;
};

type Activity = {
  id: string;
  message: string;
  createdAt: string;
  type: string;
  metadata?: Record<string, unknown> | null;
};

type RecentExport = {
  id: string;
  format: string;
  leadCount: number;
  createdAt: string;
};

type TopIndustry = {
  industry: string | null;
  count: number;
};

function formatSearchLocation(s: RecentSearch) {
  if (s.locationScope === "country") {
    return getTierOneCountry(s.country).name;
  }
  return [s.city, s.state, getTierOneCountry(s.country).name]
    .filter(Boolean)
    .join(", ");
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityTypeLabel(type: string) {
  const labels: Record<string, string> = {
    search: "Search",
    export: "Export",
    pipeline: "Pipeline",
    save: "Saved",
    lead_generate: "Leads",
    outreach: "Outreach",
  };
  return labels[type] ?? type.replace(/_/g, " ");
}

function activityHref(type: string): string | null {
  if (type === "pipeline") return "/leads/pipeline";
  if (type === "save") return "/leads/saved";
  if (type === "export") return "/leads";
  if (type === "outreach") return "/scripts";
  if (type === "lead_generate") return "/leads";
  return null;
}

function industryLeadsHref(industry: string) {
  return `/leads?category=${encodeURIComponent(industry)}`;
}

function industrySearchHref(industry: string) {
  return `/leads/search?industry=${encodeURIComponent(industry)}`;
}

function MetricCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-brand-500/20 bg-[var(--input-bg)]/50 px-3 py-2.5 transition hover:border-brand-500/40 hover:bg-brand-500/[0.06]"
    >
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-ink">{value}</p>
      {hint ? (
        <p className="mt-1 text-[10px] text-brand-500 opacity-0 transition group-hover:opacity-100">
          {hint}
        </p>
      ) : null}
    </Link>
  );
}

async function downloadExport(exportId: string, format: string) {
  const res = await fetch(
    `/api/exports/${exportId}?format=${format === "xlsx" ? "xlsx" : "csv"}`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Download failed");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `contractor-leads-export.${format === "xlsx" ? "xlsx" : "csv"}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportDownloadButton({
  exportId,
  format,
  leadCount,
}: {
  exportId: string;
  format: string;
  leadCount: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">
          {format.toUpperCase()} export
          <span className="font-normal text-ink-muted"> · {leadCount} leads</span>
        </p>
        {error ? (
          <p className="mt-0.5 text-[11px] text-red-600">{error}</p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError("");
          void downloadExport(exportId, format)
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Download failed"),
            )
            .finally(() => setBusy(false));
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand-600 transition hover:bg-brand-500/20 disabled:opacity-60"
      >
        <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
        {busy ? "…" : "Download"}
      </button>
    </div>
  );
}

type FeedRow =
  | {
      kind: "search";
      id: string;
      createdAt: string;
      industry: string;
      location: string;
      resultCount: number;
    }
  | {
      kind: "activity";
      id: string;
      createdAt: string;
      type: string;
      message: string;
      href: string | null;
    }
  | {
      kind: "export";
      id: string;
      createdAt: string;
      format: string;
      leadCount: number;
    };

function buildFeed(
  searches: RecentSearch[],
  activities: Activity[],
  exports: RecentExport[],
): FeedRow[] {
  const rows: FeedRow[] = [];

  for (const s of searches) {
    rows.push({
      kind: "search",
      id: s.id,
      createdAt: s.createdAt,
      industry: s.industry,
      location: formatSearchLocation(s),
      resultCount: s.resultCount,
    });
  }

  for (const a of activities) {
    if (a.type === "ai" || a.type === "search" || a.type === "export") continue;
    rows.push({
      kind: "activity",
      id: a.id,
      createdAt: a.createdAt,
      type: a.type,
      message: a.message,
      href: activityHref(a.type),
    });
  }

  for (const e of exports) {
    rows.push({
      kind: "export",
      id: e.id,
      createdAt: e.createdAt,
      format: e.format,
      leadCount: e.leadCount,
    });
  }

  return rows
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);
}

export function DashboardInsights({
  qualityHealth,
  topIndustries,
  recentSearches,
  activities,
  recentExports,
}: {
  qualityHealth?: QualityHealth | null;
  topIndustries: TopIndustry[];
  recentSearches: RecentSearch[];
  activities: Activity[];
  recentExports: RecentExport[];
}) {
  const qh = qualityHealth;
  const sampleSize = qh?.sampleSize ?? 0;
  const feed = buildFeed(recentSearches, activities, recentExports);

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-5">
        <HudPanel
          title="Lead quality"
          subtitle={
            sampleSize > 0
              ? `Based on your ${sampleSize} workspace lead${sampleSize === 1 ? "" : "s"}`
              : "Run Lead Finder to see quality metrics"
          }
        >
          {sampleSize > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Avg score"
                value={String(qh?.avgLeadScore ?? 0)}
                hint="View by score →"
                href="/leads?sort=score"
              />
              <MetricCard
                label="Hot leads"
                value={`${qh?.hotCount ?? 0} (${qh?.hotRate ?? 0}%)`}
                hint="Open hot queue →"
                href="/leads/hot"
              />
              <MetricCard
                label="Rich profiles"
                value={`${qh?.completeProfileRate ?? 0}%`}
                hint="Owner + LinkedIn + social"
                href="/leads"
              />
              <MetricCard
                label="All leads"
                value={String(sampleSize)}
                hint="Browse workspace →"
                href="/leads"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-[13px] text-ink-muted">
                No leads yet. Generate your first list in Lead Finder.
              </p>
              <Link href="/leads/search" className="mt-3 inline-flex hud-btn-primary text-[12px]">
                Open Lead Finder
              </Link>
            </div>
          )}
        </HudPanel>

        <HudPanel title="Leads by industry" subtitle="Click to filter or run again">
          <ul className="divide-y divide-brand-500/10">
            {topIndustries.map((i, idx) => {
              const industry = i.industry?.trim();
              if (!industry) return null;
              return (
                <li key={industry || idx} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={industryLeadsHref(industry)}
                      className="min-w-0 flex-1 text-[13px] font-medium text-ink hover:text-brand-600"
                    >
                      {industry}
                      <span className="ml-1.5 text-ink-faint">({i.count})</span>
                    </Link>
                    <Link
                      href={industrySearchHref(industry)}
                      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                    >
                      Search again
                      <HiOutlineArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
            {!topIndustries.length && (
              <li className="py-6 text-center text-[13px] text-ink-faint">
                Industries appear after your first search.
              </li>
            )}
          </ul>
        </HudPanel>
      </div>

      <HudPanel
        title="Recent activity"
        subtitle="Searches, exports, pipeline updates"
        actions={
          <Link href="/leads" className="hud-btn-ghost text-[11px]">
            All leads
          </Link>
        }
      >
        {feed.length ? (
          <ul className="divide-y divide-brand-500/10">
            {feed.map((row) => {
              if (row.kind === "search") {
                return (
                  <li key={`search-${row.id}`} className="py-2.5">
                    <Link
                      href={industryLeadsHref(row.industry)}
                      className="group block"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="hud-pill">Search</span>
                          <p className="mt-1.5 text-[13px] font-medium text-ink group-hover:text-brand-600">
                            {row.industry}
                            <span className="font-normal text-ink-muted">
                              {" "}
                              · {row.location}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-faint">
                            {row.resultCount} leads · {formatWhen(row.createdAt)}
                          </p>
                        </div>
                        <HiOutlineArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-faint opacity-0 transition group-hover:opacity-100" />
                      </div>
                    </Link>
                  </li>
                );
              }

              if (row.kind === "export") {
                return (
                  <li key={`export-${row.id}`} className="py-2.5">
                    <div className="flex items-start gap-3">
                      <span className="hud-pill hud-pill-muted shrink-0">Export</span>
                      <div className="min-w-0 flex-1">
                        <ExportDownloadButton
                          exportId={row.id}
                          format={row.format}
                          leadCount={row.leadCount}
                        />
                        <p className="text-[10px] text-ink-faint">
                          {formatWhen(row.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              }

              const inner = (
                <>
                  <span className="hud-pill hud-pill-muted">
                    {activityTypeLabel(row.type)}
                  </span>
                  <p className="mt-1.5 text-[12px] leading-snug text-ink">{row.message}</p>
                  <p className="mt-0.5 text-[10px] text-ink-faint">
                    {formatWhen(row.createdAt)}
                  </p>
                </>
              );

              return (
                <li key={row.id} className="py-2.5">
                  {row.href ? (
                    <Link href={row.href} className="group block hover:text-brand-600">
                      {inner}
                    </Link>
                  ) : (
                    <div>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-[13px] text-ink-faint">
            Activity appears after your first Lead Finder run.
          </p>
        )}
      </HudPanel>
    </div>
  );
}
