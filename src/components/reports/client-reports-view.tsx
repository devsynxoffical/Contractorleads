"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineMagnifyingGlass,
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
import { leadDetailHref } from "@/lib/nav-context";
import { LEAD_STATUSES } from "@/lib/constants";

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

type AgencyInfo = {
  companyName: string | null;
  name: string | null;
  email: string;
};

type ReportPayload = {
  agency: AgencyInfo;
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

type ClientRow = {
  leadId: string;
  savedLeadId: string;
  status: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  leadScore: number;
  qualityTier: string | null;
  reportCount: number;
  emailCount: number;
  updatedAt: string;
};

type ClientDetail = {
  client: {
    leadId: string;
    savedLeadId: string;
    status: string;
    favorite: boolean;
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
    googleRating: number | null;
    reviewCount: number | null;
    address: string | null;
    outreachAngle: string | null;
    updatedAt: string;
  };
  reports: Array<{
    id: string;
    title: string;
    type: string;
    preview: string;
    content: string;
    createdAt: string;
  }>;
  emails: Array<{
    id: string;
    direction: string;
    fromEmail: string;
    toEmail: string;
    subject: string;
    body: string;
    status: string;
    error: string | null;
    createdAt: string;
    leadId: string;
  }>;
  counts: {
    reports: number;
    emails: number;
    outbound: number;
    inbound: number;
  };
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

type Tab = "clients" | "builder";

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

function reportTypeLabel(type: string) {
  if (type.startsWith("lead_intelligence_report")) {
    const suffix = type.includes(":") ? type.split(":").pop() : "";
    if (suffix === "full") return "All-services pitch";
    if (suffix === "website") return "Website growth proposal";
    if (suffix === "seo") return "SEO growth proposal";
    if (suffix === "marketing") return "Instagram & social proposal";
    if (suffix === "ads") return "Google Ads proposal";
    if (suffix === "local") return "Local presence proposal";
    return "Client pitch report";
  }
  if (type.startsWith("qualification_detail:")) {
    const key = type.split(":")[1] || "";
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }
  if (type.startsWith("qualification")) return "Qualification";
  return type.replace(/_/g, " ");
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ClientReportsView({
  initial,
}: {
  initial: ReportPayload | null;
}) {
  const [tab, setTab] = useState<Tab>("clients");
  const [clientQuery, setClientQuery] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [openEmailId, setOpenEmailId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [data, setData] = useState<ReportPayload | null>(initial);
  const [agency, setAgency] = useState<AgencyInfo | null>(
    initial?.agency ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Pipeline report");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");

  const loadClients = useCallback(async (q: string) => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/reports/clients?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load clients");
      setClients(Array.isArray(json.clients) ? json.clients : []);
      if (json.agency) setAgency(json.agency);
    } catch (e) {
      setClientsError(e instanceof Error ? e.message : "Could not load clients");
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (leadId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setOpenReportId(null);
    setOpenEmailId(null);
    startNavigationProgress();
    try {
      const res = await fetch(
        `/api/reports/clients?leadId=${encodeURIComponent(leadId)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load client");
      setDetail({
        client: json.client,
        reports: Array.isArray(json.reports) ? json.reports : [],
        emails: Array.isArray(json.emails) ? json.emails : [],
        counts: json.counts ?? {
          reports: 0,
          emails: 0,
          outbound: 0,
          inbound: 0,
        },
      });
      setSelectedLeadId(leadId);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Could not load client");
      setDetail(null);
    } finally {
      setDetailLoading(false);
      stopNavigationProgress();
    }
  }, []);

  useEffect(() => {
    void loadClients("");
  }, [loadClients]);

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
      params.set("take", "1000");
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load report");
      setData(json);
      if (json.agency) setAgency(json.agency);
      setApplied(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setBusy(false);
      stopNavigationProgress();
    }
  }, []);

  useEffect(() => {
    if (tab === "builder" && !data) void load(EMPTY_FILTERS);
  }, [tab, data, load]);

  const agencyLabel = useMemo(() => {
    const a = agency ?? data?.agency;
    if (!a) return "Your agency";
    return a.companyName || a.name || "Your agency";
  }, [agency, data?.agency]);

  const agencyEmail = agency?.email ?? data?.agency.email ?? "";

  const reportHeading = clientName.trim()
    ? `${clientName.trim()} · ${title.trim() || "Report"}`
    : `${agencyLabel} · ${title.trim() || "Report"}`;

  function generate(e: React.FormEvent) {
    e.preventDefault();
    void load(filters);
  }

  function printReport() {
    const cleanup = () => {
      document.documentElement.classList.remove("printing-client-report");
      window.removeEventListener("afterprint", cleanup);
    };
    document.documentElement.classList.add("printing-client-report");
    window.addEventListener("afterprint", cleanup);
    // Fallback if afterprint doesn't fire (some browsers)
    window.setTimeout(cleanup, 60_000);
    window.print();
  }

  function backToClients() {
    setSelectedLeadId(null);
    setDetail(null);
    setDetailError(null);
  }

  const openReport = detail?.reports.find((r) => r.id === openReportId) ?? null;
  const openEmail = detail?.emails.find((e) => e.id === openEmailId) ?? null;

  const rankedLeads = useMemo(() => {
    if (!data?.leads?.length) return [];
    return [...data.leads].sort((a, b) => b.leadScore - a.leadScore);
  }, [data?.leads]);

  const statusLabel = useCallback((value: string) => {
    return (
      LEAD_STATUSES.find((s) => s.value === value)?.label ??
      value.replace(/_/g, " ")
    );
  }, []);

  return (
    <div className="page-pad page-enter space-y-5">
      <div className="print:hidden">
        <PageHeader
          title="Client Reports"
          description="Open a client to see their reports and every email sent to that address — or build a multi-lead pipeline snapshot."
          backHref="/dashboard"
          backLabel="Back to dashboard"
          crumbs={[
            { label: "Home", href: "/home" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Client Reports" },
            ...(detail
              ? [{ label: detail.client.businessName }]
              : []),
          ]}
        />
      </div>

      <div className="print:hidden flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("clients");
            backToClients();
          }}
          className={cn(
            "rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
            tab === "clients"
              ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
              : "text-ink-muted hover:bg-brand-50/60 hover:text-ink",
          )}
        >
          Clients
        </button>
        <button
          type="button"
          onClick={() => setTab("builder")}
          className={cn(
            "rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
            tab === "builder"
              ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
              : "text-ink-muted hover:bg-brand-50/60 hover:text-ink",
          )}
        >
          Build pipeline report
        </button>
      </div>

      {tab === "clients" ? (
        <>
        <div className="print:hidden space-y-5">
          {!selectedLeadId ? (
            <>
              <Card className="border-border shadow-[var(--shadow-soft)]">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <Input
                      className="pl-9"
                      placeholder="Search clients by name, email, city, industry…"
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void loadClients(clientQuery);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void loadClients(clientQuery)}
                    disabled={clientsLoading}
                  >
                    Search
                  </Button>
                </CardContent>
              </Card>

              {clientsError ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
                  {clientsError}
                </p>
              ) : null}

              {clientsLoading ? (
                <p className="text-[13px] text-ink-muted">Loading clients…</p>
              ) : clients.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-[14px] font-medium text-ink">
                      No clients yet
                    </p>
                    <p className="mt-1 text-[13px] text-ink-muted">
                      Save leads from Lead Finder — they appear here as clients.
                    </p>
                    <Link
                      href="/leads/search"
                      className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white transition hover:bg-brand-700"
                    >
                      Open Lead Finder
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {clients.map((c) => (
                    <button
                      key={c.leadId}
                      type="button"
                      onClick={() => void loadDetail(c.leadId)}
                      className="group rounded-2xl border border-border bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:shadow-[var(--shadow-elevated)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-ink group-hover:text-brand-700">
                            {c.businessName}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                            {[c.industry, c.city, c.state]
                              .filter(Boolean)
                              .join(" · ") || "Saved lead"}
                          </p>
                        </div>
                        <Badge variant={tierVariant(c.qualityTier)}>
                          {c.qualityTier || "nurture"}
                        </Badge>
                      </div>
                      <p className="mt-3 truncate text-[12px] text-ink-muted">
                        {c.email || c.phone || "No email on file"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-ink-faint">
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineDocumentText className="h-3.5 w-3.5" />
                          {c.reportCount} report{c.reportCount === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineEnvelope className="h-3.5 w-3.5" />
                          {c.emailCount} email{c.emailCount === 1 ? "" : "s"}
                        </span>
                        <span className="tabular-nums text-brand-600">
                          Score {c.leadScore}
                        </span>
                      </div>
                      <p className="mt-3 text-[12px] font-semibold text-brand-700 opacity-0 transition group-hover:opacity-100">
                        Open client →
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={backToClients}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline"
              >
                <HiOutlineArrowLeft className="h-4 w-4" />
                Back to clients
              </button>

              {detailLoading && !detail ? (
                <p className="text-[13px] text-ink-muted">Loading client…</p>
              ) : null}
              {detailError ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
                  {detailError}
                </p>
              ) : null}

              {detail ? (
                <>
                  <Card className="border-border shadow-[var(--shadow-soft)]">
                    <CardContent className="space-y-4 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
                              {detail.client.businessName}
                            </h2>
                            <Badge
                              variant={tierVariant(detail.client.qualityTier)}
                            >
                              {detail.client.qualityTier || "nurture"}
                            </Badge>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {statusLabel(detail.client.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] text-ink-muted">
                            {[
                              detail.client.industry,
                              detail.client.city,
                              detail.client.state,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Client profile"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={leadDetailHref(
                              detail.client.leadId,
                              "dashboard",
                            )}
                          >
                            <Button type="button" variant="secondary" size="sm">
                              Open lead
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            onClick={printReport}
                          >
                            <HiOutlinePrinter className="h-4 w-4" />
                            Print snapshot
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          {
                            label: "Owner",
                            value: detail.client.ownerName || "—",
                          },
                          {
                            label: "Email",
                            value: detail.client.email || "—",
                          },
                          {
                            label: "Phone",
                            value: detail.client.phone || "—",
                          },
                          {
                            label: "Score",
                            value: String(detail.client.leadScore),
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-xl border border-border bg-[#faf8fc] px-3 py-2.5"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                              {item.label}
                            </p>
                            <p className="mt-0.5 truncate text-[13px] font-medium text-ink">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {detail.client.outreachAngle ? (
                        <p className="rounded-xl bg-brand-50/80 px-3 py-2 text-[13px] text-brand-900">
                          {detail.client.outreachAngle}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-4 text-[12px] font-semibold text-ink-muted">
                        <span>{detail.counts.reports} reports</span>
                        <span>
                          {detail.counts.emails} emails (
                          {detail.counts.outbound} sent ·{" "}
                          {detail.counts.inbound} received)
                        </span>
                        {detail.client.website ? (
                          <a
                            href={detail.client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-700 hover:underline"
                          >
                            Website →
                          </a>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <Card className="border-border shadow-[var(--shadow-soft)]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[15px]">
                          <HiOutlineDocumentText className="h-4 w-4 text-brand-600" />
                          Reports ({detail.reports.length})
                        </CardTitle>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                          Intelligence and qualification reports for this client
                        </p>
                      </CardHeader>
                      <CardContent>
                        {detail.reports.length === 0 ? (
                          <p className="py-6 text-center text-[13px] text-ink-muted">
                            No reports yet. Generate one from the lead page.
                          </p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {detail.reports.map((r) => (
                              <li key={r.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenReportId(
                                      openReportId === r.id ? null : r.id,
                                    )
                                  }
                                  className="flex w-full flex-col gap-1 py-3 text-left transition hover:bg-brand-50/40"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-[13px] font-semibold text-ink">
                                      {r.title}
                                    </p>
                                    <span className="shrink-0 text-[12px] text-ink-muted">
                                      {formatWhen(r.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-medium text-brand-700">
                                    {reportTypeLabel(r.type)}
                                  </p>
                                  <p className="line-clamp-2 text-[12px] text-ink-muted">
                                    {r.preview}
                                  </p>
                                </button>
                                {openReportId === r.id ? (
                                  <div className="mb-3 rounded-xl border border-border bg-[#faf8fc] p-3">
                                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-[family-name:var(--font-jakarta)] text-[12px] leading-relaxed text-ink">
                                      {r.content}
                                    </pre>
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border shadow-[var(--shadow-soft)]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[15px]">
                          <HiOutlineEnvelope className="h-4 w-4 text-brand-600" />
                          Emails ({detail.emails.length})
                        </CardTitle>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                          {detail.client.email
                            ? `All messages to/from ${detail.client.email}`
                            : "Emails linked to this lead"}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {detail.emails.length === 0 ? (
                          <p className="py-6 text-center text-[13px] text-ink-muted">
                            No emails yet for this client.
                          </p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {detail.emails.map((e) => (
                              <li key={e.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenEmailId(
                                      openEmailId === e.id ? null : e.id,
                                    )
                                  }
                                  className="flex w-full flex-col gap-1 py-3 text-left transition hover:bg-brand-50/40"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-[13px] font-semibold text-ink">
                                      {e.subject || "(no subject)"}
                                    </p>
                                    <span className="shrink-0 text-[12px] text-ink-muted">
                                      {formatWhen(e.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-ink-muted">
                                    <span className="font-semibold capitalize text-ink">
                                      {e.direction}
                                    </span>
                                    {" · "}
                                    {e.direction === "outbound"
                                      ? `to ${e.toEmail}`
                                      : `from ${e.fromEmail}`}
                                    {" · "}
                                    <span className="capitalize">{e.status}</span>
                                  </p>
                                </button>
                                {openEmailId === e.id ? (
                                  <div className="mb-3 space-y-2 rounded-xl border border-border bg-[#faf8fc] p-3">
                                    <p className="text-[12px] text-ink-muted">
                                      From {e.fromEmail} → {e.toEmail}
                                    </p>
                                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-[family-name:var(--font-jakarta)] text-[12px] leading-relaxed text-ink">
                                      {e.body}
                                    </pre>
                                    {e.error ? (
                                      <p className="text-[12px] text-red-600">
                                        {e.error}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* screen-only client UI ends; print block is outside print:hidden */}
                </>
              ) : null}
            </div>
          )}
        </div>

          {detail ? (
            <div
              id="client-report-print"
              className="hidden space-y-5 print:block"
            >
              <header className="border-b border-border pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                  Client report
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-ink">
                  {detail.client.businessName}
                </h1>
                <p className="mt-1 text-[13px] text-ink-muted">
                  Prepared by {agencyLabel}
                  {agencyEmail ? ` · ${agencyEmail}` : ""} ·{" "}
                  {formatWhen(new Date().toISOString())}
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    l: "Score",
                    v: detail.client.leadScore,
                  },
                  {
                    l: "Tier",
                    v: (detail.client.qualityTier || "nurture").toUpperCase(),
                  },
                  {
                    l: "Status",
                    v: statusLabel(detail.client.status),
                  },
                  {
                    l: "Reports",
                    v: detail.reports.length,
                  },
                ].map((c) => (
                  <div
                    key={c.l}
                    className="rounded-xl border border-border px-3 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      {c.l}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                      {c.v}
                    </p>
                  </div>
                ))}
              </div>

              <section>
                <h2 className="mb-2 text-[13px] font-semibold text-ink">
                  Contact
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                  {[
                    ["Owner", detail.client.ownerName || "—"],
                    ["Email", detail.client.email || "—"],
                    ["Phone", detail.client.phone || "—"],
                    ["Website", detail.client.website || "—"],
                    [
                      "Location",
                      [detail.client.city, detail.client.state]
                        .filter(Boolean)
                        .join(", ") || "—",
                    ],
                    ["Industry", detail.client.industry || "—"],
                    [
                      "Google",
                      detail.client.googleRating != null
                        ? `${detail.client.googleRating} ★ · ${detail.client.reviewCount ?? 0} reviews`
                        : "—",
                    ],
                    ["Address", detail.client.address || "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        {k}
                      </dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                {detail.client.outreachAngle ? (
                  <p className="mt-3 rounded-xl border border-border bg-[#faf8fc] px-3 py-2 text-[13px] text-ink">
                    {detail.client.outreachAngle}
                  </p>
                ) : null}
              </section>

              {openReport ? (
                <section className="break-inside-avoid">
                  <h2 className="mb-2 text-[13px] font-semibold text-ink">
                    {openReport.title}
                  </h2>
                  <p className="mb-2 text-[12px] text-ink-muted">
                    {reportTypeLabel(openReport.type)} ·{" "}
                    {formatWhen(openReport.createdAt)}
                  </p>
                  <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                    {openReport.content}
                  </pre>
                </section>
              ) : detail.reports.length ? (
                <section>
                  <h2 className="mb-2 text-[13px] font-semibold text-ink">
                    Pitch reports ({detail.reports.length})
                  </h2>
                  <ul className="space-y-4">
                    {detail.reports.map((r) => (
                      <li key={r.id} className="break-inside-avoid">
                        <p className="font-semibold text-ink">{r.title}</p>
                        <p className="text-[12px] text-ink-muted">
                          {reportTypeLabel(r.type)} · {formatWhen(r.createdAt)}
                        </p>
                        <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-ink">
                          {r.content}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {openEmail ? (
                <section className="break-inside-avoid">
                  <h2 className="mb-2 text-[13px] font-semibold text-ink">
                    {openEmail.subject || "(no subject)"}
                  </h2>
                  <p className="mb-2 text-[12px] text-ink-muted">
                    {openEmail.direction} · {openEmail.fromEmail} →{" "}
                    {openEmail.toEmail} · {formatWhen(openEmail.createdAt)}
                  </p>
                  <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                    {openEmail.body}
                  </pre>
                </section>
              ) : detail.emails.length ? (
                <section>
                  <h2 className="mb-2 text-[13px] font-semibold text-ink">
                    Email history ({detail.emails.length})
                  </h2>
                  <ul className="space-y-3">
                    {detail.emails.map((e) => (
                      <li key={e.id} className="break-inside-avoid border-b border-border pb-3">
                        <p className="font-semibold text-ink">
                          {e.subject || "(no subject)"}
                        </p>
                        <p className="text-[12px] text-ink-muted">
                          {e.direction} · {formatWhen(e.createdAt)} ·{" "}
                          {e.status}
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-muted">
                          {e.body}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "builder" ? (
        <>
          {!data && busy ? (
            <p className="animate-pulse text-sm text-ink-muted">
              Building your report…
            </p>
          ) : null}
          {!data && !busy ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                {error || "Could not load report."}
              </p>
              <Button onClick={() => void load(EMPTY_FILTERS)}>Try again</Button>
            </div>
          ) : null}
          {data ? (
            <>
              <Card className="print:hidden border-border shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Report settings</CardTitle>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    Name the report, filter leads, then generate a printable
                    snapshot.
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
                        {data.statuses.map((s) => (
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
                        {data.industries.map((i) => (
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
                        onChange={(e) =>
                          setFilters({ ...filters, to: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <Label>Search leads</Label>
                      <Input
                        value={filters.q}
                        onChange={(e) =>
                          setFilters({ ...filters, q: e.target.value })
                        }
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
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!rankedLeads.length}
                        onClick={() => downloadCsv(rankedLeads, reportHeading)}
                      >
                        <HiOutlineArrowDownTray className="h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!rankedLeads.length}
                        onClick={printReport}
                      >
                        <HiOutlinePrinter className="h-4 w-4" />
                        Print / PDF
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

              <div
                id="client-report-print"
                className="space-y-5 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] print:border-0 print:p-0 print:shadow-none"
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
                      {agencyEmail ? ` · ${agencyEmail}` : ""} ·{" "}
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
                    { l: "Leads in report", v: data.summary.total },
                    { l: "Hot", v: data.summary.hot },
                    { l: "Warm", v: data.summary.warm },
                    { l: "Avg score", v: data.summary.avgScore },
                    { l: "Closed", v: data.summary.closed },
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

                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                      <HiOutlineDocumentText className="h-4 w-4 text-brand-600" />
                      Lead roster ({rankedLeads.length})
                    </h2>
                    <p className="text-[12px] text-ink-muted print:hidden">
                      Highest score first
                      {applied.status ? ` · ${applied.status}` : ""}
                      {applied.quality ? ` · ${applied.quality}` : ""}
                      {applied.industry ? ` · ${applied.industry}` : ""}
                      {!applied.status &&
                      !applied.quality &&
                      !applied.industry
                        ? " · all saved leads"
                        : ""}
                    </p>
                  </div>

                  {rankedLeads.length === 0 ? (
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
                    <div className="report-print-roster overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-0 text-left text-[13px] sm:min-w-[640px]">
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
                          {rankedLeads.map((l) => (
                            <tr
                              key={l.id}
                              className="border-b border-border/70 last:border-0"
                            >
                              <td className="px-3 py-2.5">
                                <button
                                  type="button"
                                  className="print:hidden text-left font-semibold text-ink hover:text-brand-700"
                                  onClick={() => {
                                    setTab("clients");
                                    void loadDetail(l.id);
                                  }}
                                >
                                  {l.businessName}
                                </button>
                                <p className="hidden font-semibold text-ink print:block">
                                  {l.businessName}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  {l.industry ? (
                                    <span className="text-[12px] text-ink-muted">
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
                                <p className="text-[11px]">
                                  {l.phone || l.email || "—"}
                                </p>
                              </td>
                              <td className="px-3 py-2.5 text-ink-muted">
                                {[l.city, l.state].filter(Boolean).join(", ") ||
                                  "—"}
                              </td>
                              <td className="px-3 py-2.5 text-ink-muted">
                                {statusLabel(l.status)}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="font-semibold tabular-nums text-brand-600">
                                  {l.leadScore}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
