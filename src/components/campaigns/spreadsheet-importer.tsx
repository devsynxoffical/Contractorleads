"use client";

import { useState, useRef, useEffect } from "react";
import {
  HiOutlineDocumentArrowUp,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineTrash,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowUpTray,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineDocumentArrowDown,
  HiOutlineBolt,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import {
  parseSpreadsheetText,
  parseExcelBuffer,
  type ParsedLead,
  type ParseSheetResult,
} from "@/lib/spreadsheet-parser";

interface SpreadsheetImporterProps {
  onImportComplete?: (leads: ParsedLead[], stats: ParseSheetResult) => void;
  onEnrollToCampaign?: (leads: ParsedLead[]) => Promise<void>;
  campaignMode?: boolean;
  campaignName?: string;
  onClose?: () => void;
}

export function SpreadsheetImporter({
  onImportComplete,
  onEnrollToCampaign,
  campaignMode = false,
  onClose,
}: SpreadsheetImporterProps) {
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [rawText, setRawText] = useState("");
  const [parsedData, setParsedData] = useState<ParseSheetResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Waterfall Enrichment state
  const [creditCostPerLead, setCreditCostPerLead] = useState<number>(2);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichingRowIdx, setEnrichingRowIdx] = useState<number | null>(null);
  const [enrichProgress, setEnrichProgress] = useState<{
    current: number;
    total: number;
    charged: number;
    foundCount: number;
  } | null>(null);
  const [enrichSummary, setEnrichSummary] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leads/waterfall-enrich")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          if (typeof d.creditCostPerLead === "number") {
            setCreditCostPerLead(d.creditCostPerLead);
          }
          if (typeof d.creditsRemaining === "number") {
            setCreditsRemaining(d.creditsRemaining);
          }
        }
      })
      .catch(() => null);
  }, []);

  async function handleFile(file: File) {
    if (!file) return;
    setError(null);
    setEnrichSummary(null);
    setParsing(true);
    setFileName(file.name);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const result = await parseExcelBuffer(buffer, { allowMissingEmail: true });
        if (!result.leads.length) {
          setError("No valid business or contact rows found in this Excel workbook.");
        } else {
          setParsedData(result);
          onImportComplete?.(result.leads, result);
        }
      } else {
        const text = await file.text();
        const result = parseSpreadsheetText(text, { allowMissingEmail: true });
        if (!result.leads.length) {
          setError("No valid business or contact rows found in this file.");
        } else {
          setParsedData(result);
          onImportComplete?.(result.leads, result);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse spreadsheet file");
    } finally {
      setParsing(false);
    }
  }

  function handlePasteParse() {
    if (!rawText.trim()) {
      setError("Please paste spreadsheet text first");
      return;
    }
    setError(null);
    setEnrichSummary(null);
    setParsing(true);
    try {
      const result = parseSpreadsheetText(rawText, { allowMissingEmail: true });
      if (!result.leads.length) {
        setError("No valid business or contact rows could be detected in the pasted text.");
      } else {
        setParsedData(result);
        setFileName("Pasted Datasheet");
        onImportComplete?.(result.leads, result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse pasted data");
    } finally {
      setParsing(false);
    }
  }

  function reset() {
    setParsedData(null);
    setFileName(null);
    setRawText("");
    setError(null);
    setEnrichProgress(null);
    setEnrichSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function runDatasheetWaterfall(targetRowIndices?: number[]) {
    if (!parsedData?.leads.length) return;
    setError(null);
    setEnrichSummary(null);

    const indicesToEnrich =
      targetRowIndices ??
      parsedData.leads
        .map((l, idx) => (!l.email || !l.phone || !l.ownerName ? idx : -1))
        .filter((idx) => idx !== -1);

    if (indicesToEnrich.length === 0) {
      setEnrichSummary("All rows already have complete Email, Phone, and Owner details.");
      return;
    }

    const itemsPayload = indicesToEnrich.map((idx) => {
      const row = parsedData.leads[idx];
      return {
        businessName: row.businessName,
        website: row.website || null,
        ownerName: row.ownerName || null,
        email: row.email || null,
        phone: row.phone || null,
        city: row.city || null,
        state: row.state || null,
        country: row.country || "US",
      };
    });

    if (indicesToEnrich.length === 1) {
      setEnrichingRowIdx(indicesToEnrich[0]);
    } else {
      setEnriching(true);
      setEnrichProgress({
        current: 0,
        total: indicesToEnrich.length,
        charged: 0,
        foundCount: 0,
      });
    }

    try {
      const res = await fetch("/api/leads/waterfall-enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ items: itemsPayload, stream: true }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message || errJson.error || "Failed to run Waterfall Enrichment",
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream unavailable");

      const decoder = new TextDecoder();
      let buffer = "";
      let workingLeads = [...parsedData.leads];
      let foundCount = 0;
      let totalCharged = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const lines = evt.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;

          const eventName = eventLine.replace("event:", "").trim();
          const data = JSON.parse(dataLine.replace("data:", "").trim());

          if (eventName === "row") {
            const targetIdx = indicesToEnrich[data.rowIndex];
            const wf = data.result;
            if (targetIdx !== undefined && wf) {
              if (wf.foundVerifiedContact) foundCount += 1;
              totalCharged = data.totalCharged ?? totalCharged;
              if (typeof data.creditsRemaining === "number") {
                setCreditsRemaining(data.creditsRemaining);
              }

              workingLeads[targetIdx] = {
                ...workingLeads[targetIdx],
                email: wf.email || workingLeads[targetIdx].email || "",
                phone: wf.phone || workingLeads[targetIdx].phone,
                ownerName: wf.ownerName || workingLeads[targetIdx].ownerName,
                ownerTitle: wf.ownerTitle || workingLeads[targetIdx].ownerTitle,
                website: wf.website || workingLeads[targetIdx].website,
                city: wf.city || workingLeads[targetIdx].city,
                state: wf.state || workingLeads[targetIdx].state,
                linkedinUrl: wf.linkedinUrl || workingLeads[targetIdx].linkedinUrl,
                leadId: wf.leadId || workingLeads[targetIdx].leadId,
                enrichedSource: wf.winningSource || "Checked",
                emailVerified: Boolean(wf.emailVerified),
              };

              const updatedStats: ParseSheetResult = {
                ...parsedData,
                leads: [...workingLeads],
                validCount: workingLeads.filter((l) => Boolean(l.email)).length,
                needsEnrichmentCount: workingLeads.filter(
                  (l) => !l.email || !l.phone || !l.ownerName,
                ).length,
              };
              setParsedData(updatedStats);
              onImportComplete?.(updatedStats.leads, updatedStats);

              setEnrichProgress({
                current: data.current,
                total: data.total,
                charged: totalCharged,
                foundCount,
              });
            }
          } else if (eventName === "done") {
            const st = data.stats;
            if (typeof st?.creditsRemaining === "number") {
              setCreditsRemaining(st.creditsRemaining);
            }
            const stopMsg = st?.stoppedForCredits
              ? " (Stopped early: credit balance reached)"
              : "";
            setEnrichSummary(
              `Waterfall Enrichment complete: ${st?.enrichedCount ?? foundCount} of ${
                st?.totalProcessed ?? indicesToEnrich.length
              } row(s) enriched · ${st?.totalCharged ?? totalCharged} credits used${stopMsg}.`,
            );
          } else if (eventName === "error") {
            throw new Error(data.error || "Waterfall stream error");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Waterfall enrichment failed");
    } finally {
      setEnriching(false);
      setEnrichingRowIdx(null);
      setEnrichProgress(null);
    }
  }

  function downloadEnrichedCsv() {
    if (!parsedData?.leads.length) return;
    const headers = [
      "Business Name",
      "Email",
      "Email Verified",
      "Owner / Decision Maker",
      "Title",
      "Phone",
      "Website",
      "City",
      "State",
      "Country",
      "LinkedIn",
      "Enrichment Source",
    ];
    const escapeCsv = (val?: string | boolean) => {
      const s = val === undefined || val === null ? "" : String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const rows = parsedData.leads.map((l) =>
      [
        l.businessName,
        l.email,
        l.emailVerified ? "Verified" : l.email ? "Yes" : "Missing",
        l.ownerName || "",
        l.ownerTitle || "",
        l.phone || "",
        l.website || "",
        l.city || "",
        l.state || "",
        l.country || "US",
        l.linkedinUrl || "",
        l.enrichedSource || "Original Sheet",
      ]
        .map(escapeCsv)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enriched-datasheet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleEnroll() {
    const validLeads = parsedData?.leads.filter((l) => Boolean(l.email)) ?? [];
    if (!validLeads.length) return;
    if (onEnrollToCampaign) {
      setEnrolling(true);
      setError(null);
      try {
        await onEnrollToCampaign(validLeads);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to enroll leads");
      } finally {
        setEnrolling(false);
      }
    }
  }

  const missingContactRowsCount =
    parsedData?.leads.filter((l) => !l.email || !l.phone || !l.ownerName).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-[var(--input-bg)] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              tab === "upload"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <HiOutlineDocumentArrowUp className="h-4 w-4" />
            Upload Excel / CSV Datasheet
          </button>
          <button
            type="button"
            onClick={() => setTab("paste")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              tab === "paste"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <HiOutlineClipboardDocumentList className="h-4 w-4" />
            Paste Datasheet Rows
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-[12.5px] font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {enrichSummary && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-[12.5px] font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{enrichSummary}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={downloadEnrichedCsv}
            className="h-7 px-2.5 text-[11px]"
          >
            <HiOutlineDocumentArrowDown className="h-3.5 w-3.5 mr-1" />
            Export Enriched CSV
          </Button>
        </div>
      )}

      {/* Mode A: Upload Zone */}
      {!parsedData && tab === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
            dragOver
              ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/30"
              : "border-border hover:border-brand-300 bg-[var(--surface)] hover:bg-slate-50/50 dark:hover:bg-zinc-900/40"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 mb-3 shadow-sm">
            <HiOutlineArrowUpTray className="h-6 w-6" />
          </div>
          <p className="text-[14px] font-bold text-ink">
            {parsing ? "Parsing datasheet…" : "Drag & drop Excel or CSV datasheet here"}
          </p>
          <p className="text-[12px] text-ink-muted mt-1 max-w-md">
            Supports <span className="font-semibold text-ink">.xlsx, .xls, .csv, .tsv</span>. Even if your sheet is missing Emails or Phone numbers, upload it here and use{" "}
            <span className="font-semibold text-brand-600">Waterfall Enrichment</span> to find verified contacts!
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="hidden"
          />

          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={parsing}
            className="mt-4 pointer-events-none"
          >
            Browse Datasheet from Computer
          </Button>
        </div>
      )}

      {/* Mode B: Paste Data */}
      {!parsedData && tab === "paste" && (
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-ink-muted">
              Paste Rows from Google Sheets or Excel
            </label>
            <p className="text-[11.5px] text-ink-muted mt-0.5">
              Paste companies with or without emails (e.g. Company Name, Website, City, State). Missing emails/phones can be enriched with Waterfall API.
            </p>
          </div>

          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Company Name\tWebsite\tOwner Name\tPhone\tCity\tState\nSummit Roofing\tsummitroofing.com\tJohn Miller\t206-555-0199\tSeattle\tWA\nElite Plumbing LLC\teliteplumbing.com\t\t\tDallas\tTX`}
            className="saas-input w-full font-mono text-[12px] leading-relaxed resize-y"
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePasteParse}
              loading={parsing}
              disabled={!rawText.trim() || parsing}
            >
              Parse Datasheet Rows
            </Button>
          </div>
        </div>
      )}

      {/* Result Preview & Waterfall Enrichment Controls */}
      {parsedData && (
        <div className="space-y-4 rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                  <HiOutlineCheckCircle className="h-4 w-4" />
                </span>
                <p className="text-[14px] font-bold text-ink">
                  {fileName || "Imported Datasheet"}
                </p>
              </div>
              <p className="text-[12px] text-ink-muted mt-0.5">
                Loaded {parsedData.leads.length} business row(s) from your datasheet.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={downloadEnrichedCsv}
                className="h-8 text-[11.5px]"
              >
                <HiOutlineDocumentArrowDown className="h-4 w-4 mr-1" />
                Download CSV
              </Button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-[11.5px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition px-2 py-1"
              >
                <HiOutlineTrash className="h-3.5 w-3.5" />
                Replace File
              </button>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Has Email
              </span>
              <p className="text-[18px] font-bold text-emerald-700 dark:text-emerald-400">
                {parsedData.leads.filter((l) => Boolean(l.email)).length}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Has Phone
              </span>
              <p className="text-[18px] font-bold text-blue-700 dark:text-blue-400">
                {parsedData.leads.filter((l) => Boolean(l.phone)).length}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Needs Enrichment
              </span>
              <p className="text-[18px] font-bold text-amber-700 dark:text-amber-400">
                {missingContactRowsCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-900/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Enrichment Fee
              </span>
              <p className="text-[18px] font-bold text-slate-700 dark:text-slate-300">
                {creditCostPerLead} cr
              </p>
            </div>
          </div>

          {/* Waterfall Enrichment Action Banner for Uploaded Datasheet */}
          {missingContactRowsCount > 0 && (
            <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-50/90 via-indigo-50/60 to-brand-50/40 dark:from-brand-950/40 dark:via-indigo-950/20 dark:to-brand-950/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <HiOutlineBolt className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[13px] font-bold text-ink">
                      Waterfall Enrichment Available for {missingContactRowsCount} Row(s)
                    </span>
                  </div>
                  <p className="text-[11.5px] text-ink-muted max-w-xl">
                    Checks <span className="font-semibold text-ink">1. Our Internal DB</span> →{" "}
                    <span className="font-semibold text-ink">2. Company Website</span> →{" "}
                    <span className="font-semibold text-ink">3. Public Web</span> →{" "}
                    <span className="font-semibold text-ink">4. External APIs (Apollo, Hunter, Prospeo, NinjaPear)</span>{" "}
                    one by one until verified Email, Phone &amp; Owner are found. Charged{" "}
                    <span className="font-bold text-brand-700 dark:text-brand-300">
                      {creditCostPerLead} credit{creditCostPerLead === 1 ? "" : "s"} per enriched lead
                    </span>{" "}
                    (0 credits if not found).
                  </p>
                  {creditsRemaining !== null && (
                    <p className="text-[11px] font-semibold text-ink-muted">
                      Your balance: <span className="text-ink font-bold">{creditsRemaining} credits</span>
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => void runDatasheetWaterfall()}
                  loading={enriching}
                  disabled={enriching || enrichingRowIdx !== null}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm shrink-0"
                >
                  <HiOutlineSparkles className="h-4 w-4 mr-1.5" />
                  {enriching && enrichProgress
                    ? `Enriching ${enrichProgress.current}/${enrichProgress.total} (${enrichProgress.charged} cr)…`
                    : `Waterfall Enrich ${missingContactRowsCount} Row${
                        missingContactRowsCount === 1 ? "" : "s"
                      } (${creditCostPerLead} cr / found)`}
                </Button>
              </div>

              {enriching && enrichProgress && (
                <div className="mt-3 space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-brand-200/60 dark:bg-brand-950">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((enrichProgress.current / Math.max(1, enrichProgress.total)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
                    <span>
                      Processed {enrichProgress.current} of {enrichProgress.total} rows ({enrichProgress.foundCount} verified contacts found)
                    </span>
                    <span>{enrichProgress.charged} credits used</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Datasheet Table with Per-Row Waterfall Enrich Button */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Datasheet Rows ({Math.min(25, parsedData.leads.length)} of {parsedData.leads.length} shown)
            </span>
            <div className="overflow-x-auto rounded-xl border border-border max-h-[340px]">
              <table className="min-w-full divide-y divide-border text-left text-[12px]">
                <thead className="bg-[#faf8fc] dark:bg-zinc-900/60 text-ink-muted font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Company Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Owner / Decision Maker</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-[var(--surface)] font-medium text-ink">
                  {parsedData.leads.slice(0, 25).map((lead, idx) => {
                    const needsRowEnrich = !lead.email || !lead.phone || !lead.ownerName;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                        <td className="px-3 py-1.5 font-semibold truncate max-w-[160px]">
                          <div>{lead.businessName}</div>
                          {lead.website && (
                            <div className="text-[10.5px] font-normal text-ink-muted truncate">
                              {lead.website}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-1.5 truncate max-w-[190px]">
                          {lead.email ? (
                            <span className="font-bold text-brand-600 dark:text-brand-400">
                              {lead.email}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800 dark:text-amber-300">
                              Missing Email
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-ink-muted truncate max-w-[140px]">
                          {lead.ownerName || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-ink-muted truncate max-w-[120px]">
                          {lead.phone || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-[11px] text-ink-muted">
                          {lead.enrichedSource ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                              {lead.enrichedSource}
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-ink-faint">Datasheet</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {needsRowEnrich ? (
                            <button
                              type="button"
                              onClick={() => void runDatasheetWaterfall([idx])}
                              disabled={enriching || enrichingRowIdx !== null}
                              className="inline-flex items-center gap-1 rounded-lg border border-brand-500/40 bg-brand-50/70 hover:bg-brand-100 dark:bg-brand-950/40 px-2 py-1 text-[11px] font-bold text-brand-700 dark:text-brand-300 transition disabled:opacity-50"
                            >
                              <HiOutlineSparkles className="h-3 w-3" />
                              {enrichingRowIdx === idx
                                ? "Enriching…"
                                : `Enrich (${creditCostPerLead} cr)`}
                            </button>
                          ) : (
                            <span className="text-[10.5px] font-semibold text-emerald-600">
                              Complete
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Button for Campaign Enrollment */}
          {campaignMode && onEnrollToCampaign && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
              {onClose && (
                <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={enrolling}>
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleEnroll}
                loading={enrolling}
                disabled={enrolling || parsedData.leads.filter((l) => Boolean(l.email)).length === 0}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
              >
                Enroll {parsedData.leads.filter((l) => Boolean(l.email)).length} Prospects with Email into Campaign
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
