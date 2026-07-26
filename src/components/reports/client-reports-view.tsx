"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowDownTray,
  HiOutlineDocumentText,
  HiOutlinePrinter,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  LOGO_GRADIENT,
} from "@/components/layout/page-header";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
import { cn } from "@/lib/utils";

type ReportLead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  leadScore: number;
  qualityTier: string | null;
  status: string;
  googleRating: number | null;
  reviewCount: number | null;
  updatedAt: string;
};

type ReportPayload = {
  agency: {
    companyName: string | null;
    name: string | null;
    email: string;
  };
  summary: {
    total: number;
    hot: number;
    warm: number;
    nurture: number;
    avgScore: number;
    closed: number;
    byStatus: Record<string, number>;
    byQuality: Record<string, number>;
  };
  pipelineTotals: Record<string, number>;
  industries: string[];
  statuses: Array<{ value: string; label: string }>;
  leads: ReportLead[];
  generatedAt: string;
};

type Filters = {
  status: string;
  quality: string;
  industry: string;
  from: string;
  to: string;
  q: string;
};

const EMPTY_FILTERS: Filters = {
  status: "",
  quality: "",
  industry: "",
  from: "",
  to: "",
  q: "",
};

function csvEscape(v: string | number | null | undefined) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(leads: ReportLead[], title: string) {
  const headers = [
    "Business",
    "Owner",
    "Phone",
    "Email",
    "Website",
    "City",
    "State",
    "Industry",
    "Score",
    "Quality",
    "Pipeline status",
    "Google rating",
    "Reviews",
  ];
  const rows = leads.map((l) =>
    [
      l.businessName,
      l.ownerName,
      l.phone,
      l.email,
      l.website,
      l.city,
      l.state,
      l.industry,
      l.leadScore,
      l.qualityTier,
      l.status,
      l.googleRating,
      l.reviewCount,
    ]
      .map(csvEscape)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "client-report"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function tierVariant(tier?: string | null) {
  if (tier === "hot") return "hot" as const;
  if (tier === "warm") return "warm" as const;
  return "nurture" as const;
}

export function ClientReportsView({
  initial,
}: {
  initial: ReportPayload | null;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [data, setData] = useState<ReportPayload | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Pipeline report");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async (f: Filters) => {
    setBusy(true);
    setError(null);
    startNavigationProgress();
    try {
      const params = new URLSearchParams();
      if (f.status) params.set("status", f.status);
      if (f.quality) params.set("quality", f.quality);
      if (f.industry) params.set("industry", f.industry);
      if (f.from) params.set("from", f.from);
      if (f.to) params.set("to", f.to);
      if (f.q) params.set("q", f.q);
      params.set("take", "300");
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load report");
      setData(json);
      setApplied(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setBusy(false);
      stopNavigationProgress();
    }
  }, []);

  useEffect(() => {
    if (!initial) void load(EMPTY_FILTERS);
  }, [initial, load]);

  const agencyLabel = useMemo(() => {
    if (!data) return "Your agency";
    return data.agency.companyName || data.agency.name || "Your agency";
  }, [data]);

  const reportHeading = clientName.trim()
    ? `${clientName.trim()} · ${title.trim() || "Report"}`
    : `${agencyLabel} · ${title.trim() || "Report"}`;

  function generate(e: React.FormEvent) {
    e.preventDefault();
    void load(filters);
  }

  function printReport() {
    window.print();
  }

  if (!data && busy) {
    return (
      <div className="page-pad">
        <p className="animate-pulse text-sm text-ink-muted">
          Building your report…
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-pad space-y-3">
        <p className="text-sm text-red-600">{error || "Could not load report."}</p>
        <Button onClick={() => void load(EMPTY_FILTERS)}>Try again</Button>
      </div>
    );
  }

  const { summary, leads, statuses, industries } = data;

  return (
    <div className="page-pad page-enter space-y-5">
      <div className="print:hidden">
        <PageHeader
          title="Client Reports"
          description="Build a branded pipeline snapshot for a client — filter leads, then print/PDF or download CSV."
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={!leads.length}
                onClick={() => downloadCsv(leads, reportHeading)}
              >
                <HiOutlineArrowDownTray className="h-4 w-4" />
                Download CSV
              </Button>
              <Button
                size="sm"
                disabled={!leads.length}
                onClick={printReport}
              >
                <HiOutlinePrinter className="h-4 w-4" />
                Print / Save PDF
              </Button>
            </>
          }
        />
      </div>

      <Card className="print:hidden border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Report settings</CardTitle>
          <p className="mt-1 text-[13px] text-ink-muted">
            Name the report for your client, pick who to include, then generate.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={generate}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Report title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pipeline report"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Client name (optional)</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Summit Roofing Co"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pipeline status</Label>
              <Select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quality</Label>
              <Select
                value={filters.quality}
                onChange={(e) =>
                  setFilters({ ...filters, quality: e.target.value })
                }
              >
                <option value="">All tiers</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="nurture">Nurture</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select
                value={filters.industry}
                onChange={(e) =>
                  setFilters({ ...filters, industry: e.target.value })
                }
              >
                <option value="">All industries</option>
                {industries.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Updated from</Label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters({ ...filters, from: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Updated to</Label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Search leads</Label>
              <Input
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder="Business, owner, city…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>Notes for the client (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Focus this week: hot HVAC owners in TX"
              />
            </div>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" loading={busy}>
                <HiOutlineSparkles className="h-4 w-4" />
                {busy ? "Generating…" : "Generate report"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  void load(EMPTY_FILTERS);
                }}
              >
                Reset filters
              </Button>
            </div>
          </form>
          {error ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Printable report body */}
      <div
        id="client-report-print"
        className="space-y-5 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] print:border-0 print:p-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Client report
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink">
              {reportHeading}
            </h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              Prepared by {agencyLabel}
              {data.agency.email ? ` · ${data.agency.email}` : ""} ·{" "}
              {new Date(data.generatedAt).toLocaleString()}
            </p>
            {notes.trim() ? (
              <p className="mt-2 max-w-2xl rounded-xl bg-brand-50/70 px-3 py-2 text-[13px] text-brand-900">
                {notes.trim()}
              </p>
            ) : null}
          </div>
          <div
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white sm:flex print:flex"
            style={{ background: LOGO_GRADIENT }}
            aria-hidden
          >
            {(agencyLabel.charAt(0) || "C").toUpperCase()}
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { l: "Leads in report", v: summary.total },
            { l: "Hot", v: summary.hot },
            { l: "Warm", v: summary.warm },
            { l: "Avg score", v: summary.avgScore },
            { l: "Closed", v: summary.closed },
          ].map((c) => (
            <div
              key={c.l}
              className="rounded-xl border border-border bg-[#faf8fc] px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {c.l}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-ink">
                {c.v}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-ink">
              Pipeline mix
            </h2>
            <ul className="space-y-1.5">
              {statuses.map((s) => {
                const count = summary.byStatus[s.value] || 0;
                const pct =
                  summary.total > 0
                    ? Math.round((count / summary.total) * 100)
                    : 0;
                return (
                  <li key={s.value}>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-ink-muted">{s.label}</span>
                      <span className="tabular-nums font-semibold text-ink">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-500/10">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{
                          width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-ink">
              Quality mix
            </h2>
            <ul className="space-y-1.5">
              {(
                [
                  ["hot", "Hot"],
                  ["warm", "Warm"],
                  ["nurture", "Nurture"],
                ] as const
              ).map(([key, label]) => {
                const count = summary.byQuality[key] || 0;
                const pct =
                  summary.total > 0
                    ? Math.round((count / summary.total) * 100)
                    : 0;
                return (
                  <li key={key}>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-ink-muted">{label}</span>
                      <span className="tabular-nums font-semibold text-ink">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-500/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          key === "hot"
                            ? "bg-orange-500"
                            : key === "warm"
                              ? "bg-amber-400"
                              : "bg-slate-400",
                        )}
                        style={{
                          width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <HiOutlineDocumentText className="h-4 w-4 text-brand-600" />
              Lead roster ({leads.length})
            </h2>
            <p className="text-[11px] text-ink-faint print:hidden">
              Filters applied
              {applied.status ? ` · ${applied.status}` : ""}
              {applied.quality ? ` · ${applied.quality}` : ""}
              {applied.industry ? ` · ${applied.industry}` : ""}
              {!applied.status && !applied.quality && !applied.industry
                ? " · all saved leads"
                : ""}
            </p>
          </div>

          {leads.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-ink-muted">
              No saved leads match these filters.{" "}
              <Link
                href="/leads/search"
                className="font-semibold text-brand-600 print:hidden"
              >
                Find leads →
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-[#faf8fc] text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    <th className="px-3 py-2.5">Business</th>
                    <th className="px-3 py-2.5">Contact</th>
                    <th className="px-3 py-2.5">Location</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-ink">
                          {l.businessName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {l.industry ? (
                            <span className="text-[11px] text-ink-faint">
                              {l.industry}
                            </span>
                          ) : null}
                          <Badge variant={tierVariant(l.qualityTier)}>
                            {l.qualityTier || "nurture"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted">
                        <p>{l.ownerName || "—"}</p>
                        <p className="text-[11px]">{l.phone || l.email || "—"}</p>
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted">
                        {[l.city, l.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-3 py-2.5 capitalize text-ink-muted">
                        {l.status}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold tabular-nums text-brand-600">
                          {l.leadScore}
                        </span>
                        {l.googleRating != null ? (
                          <span className="ml-1.5 text-[11px] text-ink-faint">
                            ★ {l.googleRating.toFixed(1)}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="border-t border-border pt-3 text-[11px] text-ink-faint">
          Generated with Contractor Leads · For client review · Not a credit
          bureau report
        </footer>
      </div>
    </div>
  );
}
