"use client";

import { useState, useRef } from "react";
import {
  HiOutlineDocumentArrowUp,
  HiOutlineTableCells,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineTrash,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowUpTray,
  HiOutlineXMark,
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
  campaignName,
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

  async function handleFile(file: File) {
    if (!file) return;
    setError(null);
    setParsing(true);
    setFileName(file.name);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const result = await parseExcelBuffer(buffer);
        if (!result.leads.length) {
          setError("No valid email addresses found in this Excel workbook.");
        } else {
          setParsedData(result);
          onImportComplete?.(result.leads, result);
        }
      } else {
        // CSV, TSV, TXT
        const text = await file.text();
        const result = parseSpreadsheetText(text);
        if (!result.leads.length) {
          setError("No valid email addresses found in this file.");
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
    setParsing(true);
    try {
      const result = parseSpreadsheetText(rawText);
      if (!result.leads.length) {
        setError("No valid email addresses could be detected in the pasted text.");
      } else {
        setParsedData(result);
        setFileName("Pasted Spreadsheet Data");
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleEnroll() {
    if (!parsedData?.leads.length) return;
    if (onEnrollToCampaign) {
      setEnrolling(true);
      setError(null);
      try {
        await onEnrollToCampaign(parsedData.leads);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to enroll leads");
      } finally {
        setEnrolling(false);
      }
    }
  }

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
            Upload Excel / CSV
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
            Paste Spreadsheet Rows
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
            {parsing ? "Parsing spreadsheet data…" : "Drag & drop Excel or CSV spreadsheet here"}
          </p>
          <p className="text-[12px] text-ink-muted mt-1 max-w-sm">
            Supports <span className="font-semibold text-ink">.xlsx, .xls, .csv, .tsv</span>. Columns like Email, Company, Name, Phone, and City will be auto-detected.
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
            Browse from Computer
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
              Copy columns from your sheet (including headers if present) and paste below.
            </p>
          </div>

          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Email\tCompany Name\tContact Name\tPhone\tCity\tState\njohn@summitroofing.com\tSummit Roofing\tJohn Miller\t206-555-0199\tSeattle\tWA\nsarah@eliteplumbing.com\tElite Plumbing LLC\tSarah Jenkins\t415-555-0144\tSan Francisco\tCA`}
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
              Parse Spreadsheet Data
            </Button>
          </div>
        </div>
      )}

      {/* Result Preview & Confirmation */}
      {parsedData && (
        <div className="space-y-4 rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                  <HiOutlineCheckCircle className="h-4 w-4" />
                </span>
                <p className="text-[14px] font-bold text-ink">
                  {fileName || "Imported Sheet"}
                </p>
              </div>
              <p className="text-[12px] text-ink-muted mt-0.5">
                Parsed {parsedData.totalRows} row(s) from spreadsheet.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition self-start sm:self-auto"
            >
              <HiOutlineTrash className="h-3.5 w-3.5" />
              Upload Different File
            </button>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Valid Prospects
              </span>
              <p className="text-[18px] font-bold text-emerald-700 dark:text-emerald-400">
                {parsedData.validCount}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Duplicates Filtered
              </span>
              <p className="text-[18px] font-bold text-amber-700 dark:text-amber-400">
                {parsedData.duplicateCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-900/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Invalid / Empty
              </span>
              <p className="text-[18px] font-bold text-slate-700 dark:text-slate-300">
                {parsedData.invalidEmailCount}
              </p>
            </div>
          </div>

          {/* Detected Column Mapping */}
          <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5">
              Auto-Detected Column Mapping:
            </span>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {parsedData.detectedColumns.emailCol && (
                <span className="rounded-md bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  Email: {parsedData.detectedColumns.emailCol}
                </span>
              )}
              {parsedData.detectedColumns.businessNameCol && (
                <span className="rounded-md bg-blue-100/80 dark:bg-blue-950 px-2 py-0.5 font-semibold text-blue-800 dark:text-blue-300">
                  Business: {parsedData.detectedColumns.businessNameCol}
                </span>
              )}
              {parsedData.detectedColumns.ownerNameCol && (
                <span className="rounded-md bg-purple-100/80 dark:bg-purple-950 px-2 py-0.5 font-semibold text-purple-800 dark:text-purple-300">
                  Name: {parsedData.detectedColumns.ownerNameCol}
                </span>
              )}
              {parsedData.detectedColumns.phoneCol && (
                <span className="rounded-md bg-slate-200 dark:bg-slate-800 px-2 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  Phone: {parsedData.detectedColumns.phoneCol}
                </span>
              )}
              {parsedData.detectedColumns.cityCol && (
                <span className="rounded-md bg-slate-200 dark:bg-slate-800 px-2 py-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  City: {parsedData.detectedColumns.cityCol}
                </span>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Sample Prospect Preview ({Math.min(5, parsedData.leads.length)} of {parsedData.leads.length})
            </span>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full divide-y divide-border text-left text-[12px]">
                <thead className="bg-[#faf8fc] dark:bg-zinc-900/60 text-ink-muted font-semibold">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Company Name</th>
                    <th className="px-3 py-2">Owner / Contact</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-[var(--surface)] font-medium text-ink">
                  {parsedData.leads.slice(0, 5).map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                      <td className="px-3 py-1.5 font-bold text-brand-600 truncate max-w-[180px]">
                        {lead.email}
                      </td>
                      <td className="px-3 py-1.5 truncate max-w-[150px]">
                        {lead.businessName}
                      </td>
                      <td className="px-3 py-1.5 text-ink-muted truncate max-w-[120px]">
                        {lead.ownerName || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-ink-muted truncate max-w-[110px]">
                        {lead.phone || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-ink-muted truncate max-w-[100px]">
                        {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
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
                disabled={enrolling || parsedData.validCount === 0}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
              >
                Enroll {parsedData.validCount} Prospects into Campaign
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
