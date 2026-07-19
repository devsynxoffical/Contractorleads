"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  stats: {
    totalLeads: number;
    weekLeads: number;
    savedCount: number;
    closedCount: number;
    searchCount: number;
    exportCount: number;
    creditsRemaining: number;
  };
  dailyLeads: Array<{ day: string; count: number }>;
  qualitySplit: {
    hot: number;
    warm: number;
    nurture: number;
    hotCount: number;
    warmCount: number;
    nurtureCount: number;
  };
  topIndustries: Array<{ industry: string | null; count: number }>;
};

export function AnalyticsView() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/dashboard/stats")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load (${r.status})`);
        }
        return r.json() as Promise<Stats>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load analytics");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxDay = Math.max(1, ...(data?.dailyLeads.map((d) => d.count) ?? [1]));

  return (
    <div className="page-pad page-enter space-y-5">
      <PageHeader
        title="Analytics"
        description="Search volume, lead quality, and CRM conversion across your workspace."
        actions={
          <Link
            href="/dashboard"
            className="text-[13px] font-semibold text-brand-600 hover:underline"
          >
            Business Insights →
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-ink-muted">Loading analytics…</p>
      ) : error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              className="mt-3 text-[13px] font-semibold text-brand-600 hover:underline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </CardContent>
        </Card>
      ) : !data ? (
        <p className="text-sm text-ink-muted">No analytics data yet.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: "Leads found", v: data.stats.totalLeads },
              { l: "This week", v: data.stats.weekLeads },
              { l: "Saved in CRM", v: data.stats.savedCount },
              { l: "Closed", v: data.stats.closedCount },
            ].map((c) => (
              <Card key={c.l}>
                <CardContent className="py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    {c.l}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-ink">
                    {c.v}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly lead volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-end gap-2">
                  {data.dailyLeads.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-brand-500/80"
                        style={{
                          height: `${Math.max(6, (d.count / maxDay) * 100)}%`,
                        }}
                        title={`${d.count}`}
                      />
                      <span className="text-[10px] text-ink-faint">{d.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality mix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { l: "Hot", c: data.qualitySplit.hotCount, p: data.qualitySplit.hot, color: "bg-red-500" },
                  { l: "Warm", c: data.qualitySplit.warmCount, p: data.qualitySplit.warm, color: "bg-amber-500" },
                  { l: "Nurture", c: data.qualitySplit.nurtureCount, p: data.qualitySplit.nurture, color: "bg-sky-500" },
                ].map((row) => (
                  <div key={row.l}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="font-medium text-ink">{row.l}</span>
                      <span className="tabular-nums text-ink-muted">
                        {row.c} · {row.p}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-brand-50">
                      <div
                        className={`h-full rounded-full ${row.color}`}
                        style={{ width: `${Math.max(4, row.p)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top industries</CardTitle>
            </CardHeader>
            <CardContent>
              {(data.topIndustries ?? []).length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Run Lead Finder searches to populate industry breakdown.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.topIndustries.map((i) => (
                    <li
                      key={String(i.industry)}
                      className="flex justify-between rounded-xl border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-ink">{i.industry || "Other"}</span>
                      <span className="tabular-nums text-ink-muted">{i.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
