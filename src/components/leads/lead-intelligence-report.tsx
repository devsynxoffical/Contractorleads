"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineArrowDownTray,
  HiOutlineCheck,
  HiOutlineClipboardDocument,
  HiOutlineDocumentText,
  HiOutlinePencilSquare,
  HiOutlinePrinter,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { notifyCreditsChanged } from "@/lib/client/credits-sync";
import {
  LEAD_REPORT_TYPES,
  LEAD_REPORT_TYPE_META,
  type LeadReportType,
} from "@/lib/services/lead-intelligence-report-meta";
import { cn } from "@/lib/utils";

type SavedReport = {
  id: string;
  type: string;
  title: string | null;
  content: string;
  createdAt: string;
};

function reportTypeFromScript(type: string): LeadReportType {
  const suffix = type.includes(":") ? type.split(":").pop() : null;
  if (suffix && (LEAD_REPORT_TYPES as readonly string[]).includes(suffix)) {
    return suffix as LeadReportType;
  }
  return "full";
}

function formatWhen(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LeadIntelligenceReportCard({
  leadId,
  businessName,
}: {
  leadId: string;
  businessName: string;
}) {
  const [reportType, setReportType] = useState<LeadReportType>("full");
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creditCost, setCreditCost] = useState(2);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const active = reports.find((r) => r.id === activeId) ?? reports[0] ?? null;
  const dirty =
    editing &&
    active != null &&
    (draftTitle.trim() !== (active.title || "").trim() ||
      draftContent.trim() !== active.content.trim());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${leadId}/report`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not load reports");
        return;
      }
      const list = (data.reports as SavedReport[] | undefined) ?? [];
      setReports(list);
      setCreditCost(
        typeof data.creditCost === "number" ? data.creditCost : 2,
      );
      setActiveId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setError("Could not load reports");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(report: SavedReport) {
    setEditing(true);
    setDraftTitle(report.title || "");
    setDraftContent(report.content);
    setStatusMsg(null);
    setError("");
  }

  function cancelEdit() {
    setEditing(false);
    setDraftTitle("");
    setDraftContent("");
    setError("");
  }

  function selectReport(id: string) {
    if (dirty) {
      const ok = window.confirm(
        "You have unsaved edits. Discard them and switch reports?",
      );
      if (!ok) return;
    }
    setActiveId(id);
    setEditing(false);
    setError("");
    setStatusMsg(null);
  }

  async function saveEdits(reportId: string): Promise<SavedReport | null> {
    const title = draftTitle.trim();
    const content = draftContent.trim();
    if (!content) {
      setError("Report content cannot be empty");
      return null;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/scripts/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          content,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save changes");
        return null;
      }
      const script = data.script as SavedReport;
      setReports((prev) =>
        prev.map((r) =>
          r.id === script.id
            ? {
                ...r,
                title: script.title,
                content: script.content,
              }
            : r,
        ),
      );
      setDraftTitle(script.title || "");
      setDraftContent(script.content);
      setEditing(false);
      setStatusMsg(
        "Report updated. Download PDF or attach it when emailing the lead.",
      );
      return script;
    } catch {
      setError("Could not save changes");
      return null;
    } finally {
      setSaving(false);
    }
  }

  /** Persist dirty edits before PDF / copy so the lead never gets stale content. */
  async function ensureSaved(): Promise<SavedReport | null> {
    if (!active) return null;
    if (editing && dirty) {
      return saveEdits(active.id);
    }
    if (editing && !dirty) {
      setEditing(false);
    }
    return active;
  }

  async function generate() {
    if (dirty) {
      const ok = window.confirm(
        "You have unsaved edits on the current report. Generate a new one anyway?",
      );
      if (!ok) return;
    }
    setGenerating(true);
    setError("");
    setStatusMsg(null);
    setEditing(false);
    try {
      const res = await fetch(`/api/leads/${leadId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) {
          setError("Insufficient credits. Purchase more on Billing.");
        } else {
          setError(data.error || "Failed to generate report");
        }
        return;
      }
      const report = data.report as SavedReport;
      setReports((prev) => [report, ...prev]);
      setActiveId(report.id);
      setStatusMsg(
        data.source === "fallback"
          ? "Report generated from live scores (AI key unavailable). Edit anything before sending."
          : "Report ready — review and edit before downloading PDF or emailing.",
      );
      // Drop straight into edit so the user can customize before send
      startEdit(report);
      if (typeof data.creditsRemaining === "number") {
        notifyCreditsChanged(data.creditsRemaining);
      }
    } catch {
      setError("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  async function copyReport() {
    const report = await ensureSaved();
    if (!report?.content) return;
    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  async function downloadPdf() {
    const report = await ensureSaved();
    if (!report?.id) return;
    setDownloadingPdf(true);
    setError("");
    try {
      const res = await fetch(
        `/api/leads/${leadId}/report/${report.id}/pdf`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not download PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] || `${businessName}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg(
        "PDF downloaded with your edits. Attach the same report when emailing this lead.",
      );
    } catch {
      setError("Could not download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function printReport() {
    const report = await ensureSaved();
    if (!report?.content) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!win) return;
    const title = report.title || `${businessName} report`;
    win.document.write(`<!doctype html><html><head><title>${title}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.55;padding:32px;max-width:820px;margin:0 auto}
        h1{font-size:22px;margin:0 0 8px}
        .meta{color:#64748b;font-size:13px;margin-bottom:24px}
        pre{white-space:pre-wrap;font-family:inherit;font-size:14px;margin:0}
      </style></head><body>
      <h1>${title.replace(/</g, "&lt;")}</h1>
      <div class="meta">${businessName.replace(/</g, "&lt;")} · ${formatWhen(report.createdAt)}</div>
      <pre>${report.content.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <HiOutlineDocumentText className="h-5 w-5 text-brand-600" />
            Lead intelligence report
          </CardTitle>
          <p className="mt-1 text-[12px] text-ink-muted">
            Generate, then edit anything that looks wrong before you download
            PDF or email the lead. PDFs use your{" "}
            <Link href="/settings" className="font-medium text-brand-600 hover:underline">
              company logo &amp; branding
            </Link>
            .
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {LEAD_REPORT_TYPES.map((key) => {
            const meta = LEAD_REPORT_TYPE_META[key];
            const selected = reportType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setReportType(key)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition",
                  selected
                    ? "border-brand-300 bg-brand-50/80 ring-1 ring-brand-200"
                    : "border-border bg-white hover:border-brand-200",
                )}
              >
                <p className="text-[13px] font-semibold text-ink">
                  {meta.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            loading={generating}
            disabled={generating || saving}
            onClick={() => void generate()}
          >
            {generating
              ? "Generating report…"
              : `Generate ${LEAD_REPORT_TYPE_META[reportType].label}`}
          </Button>
          <span className="text-[12px] text-ink-muted">
            Uses {creditCost} credits · saved to{" "}
            <Link href="/scripts" className="font-medium text-brand-600 hover:underline">
              My Scripts
            </Link>
          </span>
          {reports.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void load()}
              disabled={loading || generating || saving}
            >
              <HiOutlineArrowPath className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
            {error}{" "}
            {error.toLowerCase().includes("credit") ? (
              <Link href="/billing" className="font-semibold underline">
                Go to Billing
              </Link>
            ) : null}
          </p>
        ) : null}
        {statusMsg ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
            {statusMsg}
          </p>
        ) : null}
        {dirty ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            Unsaved edits — save before emailing, or Download PDF will save
            automatically.
          </p>
        ) : null}

        {loading && !active ? (
          <p className="text-[13px] text-ink-muted">Loading saved reports…</p>
        ) : null}

        {reports.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {reports.map((r) => {
              const t = reportTypeFromScript(r.type);
              const selected = active?.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectReport(r.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] font-medium transition",
                    selected
                      ? "border-brand-300 bg-brand-50 text-brand-800"
                      : "border-border bg-white text-ink-muted hover:border-brand-200",
                  )}
                >
                  {LEAD_REPORT_TYPE_META[t].label} · {formatWhen(r.createdAt)}
                </button>
              );
            })}
          </div>
        ) : null}

        {active ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-[#faf8fc]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {editing
                    ? "Editing report"
                    : active.title || "Lead report"}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {formatWhen(active.createdAt)}
                  {editing
                    ? " · customize title & body, then save"
                    : " · edit before sending to the lead"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      loading={saving}
                      disabled={saving || !draftContent.trim()}
                      onClick={() => void saveEdits(active.id)}
                    >
                      <HiOutlineCheck className="mr-1.5 h-3.5 w-3.5" />
                      Save changes
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                      onClick={cancelEdit}
                    >
                      <HiOutlineXMark className="mr-1.5 h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(active)}
                  >
                    <HiOutlinePencilSquare className="mr-1.5 h-3.5 w-3.5" />
                    Edit report
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => void copyReport()}
                >
                  {copied ? (
                    <HiOutlineCheck className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <HiOutlineClipboardDocument className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={downloadingPdf || saving}
                  disabled={downloadingPdf || saving}
                  onClick={() => void downloadPdf()}
                >
                  <HiOutlineArrowDownTray className="mr-1.5 h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => void printReport()}
                >
                  <HiOutlinePrinter className="mr-1.5 h-3.5 w-3.5" />
                  Print
                </Button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3 bg-white px-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Report title
                  </label>
                  <Input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder={`${LEAD_REPORT_TYPE_META[reportTypeFromScript(active.type)].label} — ${businessName}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Report body
                  </label>
                  <Textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="min-h-[28rem] font-mono text-[13px] leading-relaxed"
                    spellCheck
                  />
                  <p className="text-[11px] text-ink-muted">
                    Tip: keep section headings like{" "}
                    <span className="font-medium">1) Executive summary</span> so
                    the PDF formats cleanly. Save, then attach from Email lead.
                  </p>
                </div>
              </div>
            ) : (
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap px-4 py-4 text-[13px] leading-relaxed text-ink">
                {active.content}
              </pre>
            )}
          </div>
        ) : !loading ? (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-[13px] text-ink-muted">
            No report yet for this lead. Choose a report type and generate one.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
