"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineArrowDownTray,
  HiOutlineCheck,
  HiOutlineClipboardDocument,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineMegaphone,
  HiOutlinePencilSquare,
  HiOutlinePrinter,
  HiOutlinePresentationChartLine,
  HiOutlineSparkles,
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
import { ReportBrandingModal } from "@/components/leads/report-branding-modal";
import { ReportPdfPreviewModal } from "@/components/leads/report-pdf-preview-modal";
import { cn } from "@/lib/utils";

const REPORT_ICONS: Record<
  LeadReportType,
  React.ComponentType<{ className?: string }>
> = {
  website: HiOutlineGlobeAlt,
  seo: HiOutlineMagnifyingGlass,
  marketing: HiOutlineMegaphone,
  ads: HiOutlinePresentationChartLine,
  local: HiOutlineMapPin,
};

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
  return "website";
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
  onReportsChange,
}: {
  leadId: string;
  businessName: string;
  onReportsChange?: () => void;
}) {
  const [reportType, setReportType] = useState<LeadReportType>("website");
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
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);

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
      onReportsChange?.();
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

  async function fetchPdfBlob(reportId: string, preview = false) {
    const res = await fetch(
      `/api/leads/${leadId}/report/${reportId}/pdf${preview ? "?preview=1" : ""}`,
    );
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("pdf")) {
      const data = contentType.includes("json")
        ? await res.json().catch(() => ({}))
        : {};
      throw new Error(
        (data as { error?: string }).error ||
          `Could not build PDF (${res.status})`,
      );
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    return {
      blob,
      filename: match?.[1] || `${businessName}-report.pdf`,
    };
  }

  function revokePreviewUrl() {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function downloadPdf(reportId?: string | null) {
    setDownloadingPdf(true);
    setError("");
    try {
      let id = reportId ?? null;
      if (!id) {
        const saved = await ensureSaved();
        id = saved?.id ?? null;
      }
      if (!id) return;
      const { blob, filename } = await fetchPdfBlob(id, false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg(
        "PDF downloaded with your branding. Attach the same report when emailing this lead.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function openPdfPreview() {
    const report = await ensureSaved();
    if (!report?.id) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewTitle(report.title || `${businessName} report`);
    setPreviewReportId(report.id);
    revokePreviewUrl();
    try {
      const { blob } = await fetchPdfBlob(report.id, true);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e) {
      setPreviewError(
        e instanceof Error ? e.message : "Could not build PDF preview",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePdfPreview() {
    setPreviewOpen(false);
    setPreviewError(null);
    setPreviewReportId(null);
    revokePreviewUrl();
  }

  async function printReport() {
    setError("");
    try {
      const report = await ensureSaved();
      if (!report?.id) return;

      // Prefer printing the branded PDF (same as download)
      const { blob } = await fetchPdfBlob(report.id, true);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "width=900,height=700");
      if (!win) {
        URL.revokeObjectURL(url);
        setError("Pop-up blocked — allow pop-ups to print, or use Preview PDF.");
        return;
      }
      const revoke = () => URL.revokeObjectURL(url);
      win.addEventListener("beforeunload", revoke);
      // Give the PDF viewer a moment to load, then print
      window.setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch {
          /* viewer may handle print UI itself */
        }
      }, 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not print report");
    }
  }

  function printPreviewPdf() {
    if (!previewUrl) return;
    const win = window.open(previewUrl, "_blank", "width=900,height=700");
    if (!win) {
      setPreviewError("Pop-up blocked — allow pop-ups to print.");
      return;
    }
    window.setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore */
      }
    }, 600);
  }

  return (
    <Card className="overflow-hidden border-border shadow-[var(--shadow-soft)]">
      <CardHeader className="border-b border-border/70 bg-[#faf8fc]/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[16px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                <HiOutlineDocumentText className="h-4 w-4" />
              </span>
              Lead intelligence report
            </CardTitle>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
              Pick a report type, generate, then preview or download a branded
              PDF. Set your logo and company details here — not in system
              settings.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setBrandingOpen(true)}
          >
            <HiOutlineCog6Tooth className="mr-1.5 h-3.5 w-3.5" />
            Setup logo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Report type
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {LEAD_REPORT_TYPES.map((key) => {
              const meta = LEAD_REPORT_TYPE_META[key];
              const selected = reportType === key;
              const Icon = REPORT_ICONS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReportType(key)}
                  className={cn(
                    "flex h-full flex-col rounded-2xl border px-3.5 py-3 text-left transition",
                    selected
                      ? "border-brand-300 bg-brand-50 shadow-[var(--shadow-soft)] ring-1 ring-brand-200"
                      : "border-border bg-white hover:border-brand-200 hover:bg-brand-50/40",
                  )}
                >
                  <span
                    className={cn(
                      "mb-2 flex h-8 w-8 items-center justify-center rounded-lg",
                      selected
                        ? "bg-white text-brand-700 ring-1 ring-brand-200"
                        : "bg-[#faf8fc] text-ink-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-[13px] font-semibold text-ink">
                    {meta.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-ink-muted">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[#faf8fc] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-ink">
              Generate {LEAD_REPORT_TYPE_META[reportType].label}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {creditCost} credits · saved to{" "}
              <Link
                href="/scripts"
                className="font-medium text-brand-600 hover:underline"
              >
                My Scripts
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {reports.length > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void load()}
                disabled={loading || generating || saving}
              >
                <HiOutlineArrowPath className="mr-1.5 h-3.5 w-3.5" />
                Refresh list
              </Button>
            ) : null}
            <Button
              size="sm"
              loading={generating}
              disabled={generating || saving}
              onClick={() => void generate()}
            >
              <HiOutlineSparkles className="mr-1.5 h-3.5 w-3.5" />
              {generating
                ? "Generating…"
                : `Generate ${LEAD_REPORT_TYPE_META[reportType].label}`}
            </Button>
          </div>
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
                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
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
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-soft)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-[#faf8fc]/80 px-4 py-3">
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
                  disabled={saving}
                  onClick={() => void openPdfPreview()}
                >
                  <HiOutlineEye className="mr-1.5 h-3.5 w-3.5" />
                  Preview PDF
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
          <div className="rounded-2xl border border-dashed border-border bg-[#faf8fc] px-4 py-10 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-brand-100">
              <HiOutlineGlobeAlt className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-ink">
              No report yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-ink-muted">
              Choose a report type above and generate one for {businessName}.
            </p>
          </div>
        ) : null}
      </CardContent>

      <ReportBrandingModal
        open={brandingOpen}
        onClose={() => setBrandingOpen(false)}
        onSaved={() => {
          if (previewOpen && previewReportId) {
            void (async () => {
              setPreviewLoading(true);
              setPreviewError(null);
              revokePreviewUrl();
              try {
                const { blob } = await fetchPdfBlob(previewReportId, true);
                setPreviewUrl(URL.createObjectURL(blob));
              } catch (e) {
                setPreviewError(
                  e instanceof Error ? e.message : "Could not refresh preview",
                );
              } finally {
                setPreviewLoading(false);
              }
            })();
          }
        }}
      />

      <ReportPdfPreviewModal
        open={previewOpen}
        title={previewTitle}
        pdfUrl={previewUrl}
        loading={previewLoading}
        error={previewError}
        downloading={downloadingPdf}
        onClose={closePdfPreview}
        onDownload={() => void downloadPdf(previewReportId ?? undefined)}
        onPrint={printPreviewPdf}
        onOpenBranding={() => setBrandingOpen(true)}
      />
    </Card>
  );
}
