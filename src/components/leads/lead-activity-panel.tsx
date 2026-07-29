"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineInboxArrowDown,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActivityReport = {
  id: string;
  title: string;
  type: string;
  preview: string;
  content: string;
  createdAt: string;
};

type ActivityEmail = {
  id: string;
  direction: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  createdAt: string;
};

type ActivityPayload = {
  email: string | null;
  reports: ActivityReport[];
  emails: ActivityEmail[];
  counts: {
    reports: number;
    emails: number;
    outbound: number;
    inbound: number;
  };
};

type Tab = "overview" | "emails" | "reports";
type EmailFilter = "all" | "outbound" | "inbound";

function reportTypeLabel(type: string) {
  if (type.startsWith("lead_intelligence_report")) {
    const suffix = type.includes(":") ? type.split(":").pop() : "";
    if (suffix === "website") return "Website growth proposal";
    if (suffix === "seo") return "SEO growth proposal";
    if (suffix === "marketing") return "Instagram & social proposal";
    if (suffix === "ads") return "Google Ads proposal";
    if (suffix === "local") return "Local presence proposal";
    if (suffix === "full") return "Full growth proposal";
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

export function LeadActivityPanel({
  leadId,
  refreshKey = 0,
}: {
  leadId: string;
  refreshKey?: number;
}) {
  const [data, setData] = useState<ActivityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [emailFilter, setEmailFilter] = useState<EmailFilter>("all");
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [openEmailId, setOpenEmailId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/activity`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not load activity");
        setData(null);
        return;
      }
      setData(json as ActivityPayload);
    } catch {
      setError("Could not load activity");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const counts = data?.counts ?? {
    reports: 0,
    emails: 0,
    outbound: 0,
    inbound: 0,
  };

  const filteredEmails = useMemo(() => {
    const list = data?.emails ?? [];
    if (emailFilter === "all") return list;
    return list.filter((e) => e.direction === emailFilter);
  }, [data?.emails, emailFilter]);

  function scrollToDetail() {
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function openEmails(filter: EmailFilter, expandId?: string | null) {
    setEmailFilter(filter);
    setTab("emails");
    setOpenEmailId(expandId ?? null);
    setOpenReportId(null);
    scrollToDetail();
  }

  function openReports(expandId?: string | null) {
    setTab("reports");
    setOpenReportId(expandId ?? null);
    setOpenEmailId(null);
    scrollToDetail();
  }

  const stats: Array<{
    key: string;
    label: string;
    value: number;
    icon: typeof HiOutlineEnvelope;
    active: boolean;
    onClick: () => void;
  }> = [
    {
      key: "outbound",
      label: "Emails sent",
      value: counts.outbound,
      icon: HiOutlinePaperAirplane,
      active: tab === "emails" && emailFilter === "outbound",
      onClick: () => openEmails("outbound"),
    },
    {
      key: "inbound",
      label: "Emails received",
      value: counts.inbound,
      icon: HiOutlineInboxArrowDown,
      active: tab === "emails" && emailFilter === "inbound",
      onClick: () => openEmails("inbound"),
    },
    {
      key: "all-emails",
      label: "All emails",
      value: counts.emails,
      icon: HiOutlineEnvelope,
      active: tab === "emails" && emailFilter === "all",
      onClick: () => openEmails("all"),
    },
    {
      key: "reports",
      label: "Saved reports",
      value: counts.reports,
      icon: HiOutlineDocumentText,
      active: tab === "reports",
      onClick: () => openReports(),
    },
  ];

  return (
    <Card className="border-border shadow-[var(--shadow-soft)]">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-[16px]">Client activity</CardTitle>
          <p className="mt-1 text-[12px] text-ink-muted">
            Click a card to open emails or reports for this lead.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={() => void load()}
        >
          {!loading && <HiOutlineArrowPath className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={stat.onClick}
              className={cn(
                "rounded-xl border px-3.5 py-3 text-left transition",
                stat.active
                  ? "border-brand-300 bg-brand-50 shadow-[var(--shadow-soft)] ring-1 ring-brand-200"
                  : "border-border bg-[#faf8fc] hover:border-brand-200 hover:bg-white",
              )}
            >
              <div className="flex items-center gap-2 text-brand-600">
                <stat.icon className="h-4 w-4" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {stat.label}
                </p>
              </div>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">
                {loading && !data ? "—" : stat.value}
              </p>
              <p className="mt-1 text-[11px] font-medium text-brand-700">
                View details →
              </p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "overview" as const, label: "Overview" },
              {
                id: "emails" as const,
                label: `Emails (${counts.emails})`,
                onClick: () => openEmails(emailFilter === "all" ? "all" : emailFilter),
              },
              {
                id: "reports" as const,
                label: `Reports (${counts.reports})`,
                onClick: () => openReports(),
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "overview") {
                  setTab("overview");
                  return;
                }
                if ("onClick" in item && item.onClick) item.onClick();
                else setTab(item.id);
              }}
              className={cn(
                "rounded-xl px-3 py-1.5 text-[12px] font-semibold transition",
                tab === item.id
                  ? "bg-brand-600 text-white"
                  : "border border-border bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        ) : null}

        {loading && !data ? (
          <p className="py-8 text-center text-[13px] text-ink-muted">
            Loading activity…
          </p>
        ) : null}

        <div ref={detailRef}>
          {data && tab === "overview" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-ink">
                    Recent emails
                  </p>
                  <button
                    type="button"
                    onClick={() => openEmails("all")}
                    className="text-[12px] font-semibold text-brand-700 hover:underline"
                  >
                    View all →
                  </button>
                </div>
                {data.emails.length === 0 ? (
                  <p className="mt-2 text-[12px] text-ink-muted">
                    No emails yet. Use Send email or Outreach on this page.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {data.emails.slice(0, 4).map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() =>
                            openEmails(
                              e.direction === "inbound" ? "inbound" : "outbound",
                              e.id,
                            )
                          }
                          className="w-full py-2 text-left transition hover:bg-brand-50/40"
                        >
                          <p className="truncate text-[13px] font-medium text-ink">
                            {e.subject || "(no subject)"}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            <span className="capitalize">{e.direction}</span>
                            {" · "}
                            {formatWhen(e.createdAt)}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-ink">
                    Recent reports
                  </p>
                  <button
                    type="button"
                    onClick={() => openReports()}
                    className="text-[12px] font-semibold text-brand-700 hover:underline"
                  >
                    View all →
                  </button>
                </div>
                {data.reports.length === 0 ? (
                  <p className="mt-2 text-[12px] text-ink-muted">
                    No proposals yet. Generate one in Client pitch report below.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {data.reports.slice(0, 4).map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => openReports(r.id)}
                          className="w-full py-2 text-left transition hover:bg-brand-50/40"
                        >
                          <p className="truncate text-[13px] font-medium text-ink">
                            {r.title}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {reportTypeLabel(r.type)} · {formatWhen(r.createdAt)}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          {data && tab === "emails" ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "all" as const, label: `All (${counts.emails})` },
                    {
                      id: "outbound" as const,
                      label: `Sent (${counts.outbound})`,
                    },
                    {
                      id: "inbound" as const,
                      label: `Received (${counts.inbound})`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setEmailFilter(f.id);
                      setOpenEmailId(null);
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
                      emailFilter === f.id
                        ? "bg-brand-100 text-brand-800"
                        : "bg-slate-100 text-ink-muted hover:bg-brand-50 hover:text-brand-700",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="mb-2 text-[12px] text-ink-muted">
                {emailFilter === "outbound"
                  ? "Emails you sent to this client"
                  : emailFilter === "inbound"
                    ? "Emails received from this client"
                    : data.email
                      ? `All messages linked to this lead or ${data.email}`
                      : "All emails linked to this lead"}
              </p>
              {filteredEmails.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-muted">
                  {emailFilter === "outbound"
                    ? "No sent emails yet for this client."
                    : emailFilter === "inbound"
                      ? "No received emails yet for this client."
                      : "No emails yet for this client."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredEmails.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenEmailId(openEmailId === e.id ? null : e.id)
                        }
                        className="flex w-full flex-col gap-1 py-3 text-left transition hover:bg-brand-50/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink">
                            {e.subject || "(no subject)"}
                          </p>
                          <span className="shrink-0 text-[11px] text-ink-faint">
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
                          <p className="text-[11px] text-ink-faint">
                            From {e.fromEmail} → {e.toEmail}
                          </p>
                          <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-[family-name:var(--font-jakarta)] text-[12px] leading-relaxed text-ink">
                            {e.body}
                          </pre>
                          {e.error ? (
                            <p className="text-[12px] text-red-600">{e.error}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {data && tab === "reports" ? (
            <div>
              <p className="mb-2 text-[12px] text-ink-muted">
                All client proposals and qualification reports saved for this lead (
                {data.reports.length})
              </p>
              {data.reports.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-muted">
                  No proposals yet. Generate one from Client pitch report on this
                  page.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.reports.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenReportId(openReportId === r.id ? null : r.id)
                        }
                        className="flex w-full flex-col gap-1 py-3 text-left transition hover:bg-brand-50/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink">
                            {r.title}
                          </p>
                          <span className="shrink-0 text-[11px] text-ink-faint">
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
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
