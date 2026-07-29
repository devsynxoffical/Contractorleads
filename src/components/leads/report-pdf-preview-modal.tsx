"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineArrowDownTray,
  HiOutlineCog6Tooth,
  HiOutlinePrinter,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

export function ReportPdfPreviewModal({
  open,
  title,
  pdfUrl,
  loading,
  error,
  onClose,
  onDownload,
  onPrint,
  onOpenBranding,
  downloading,
}: {
  open: boolean;
  title: string;
  pdfUrl: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onOpenBranding: () => void;
  downloading?: boolean;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0f0c14]/55 backdrop-blur-[3px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="h-1.5 w-full shrink-0" style={{ background: LOGO_GRADIENT }} />
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-[15px] font-semibold text-ink">
              PDF preview
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-ink-muted">{title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenBranding}
            >
              <HiOutlineCog6Tooth className="mr-1.5 h-3.5 w-3.5" />
              Setup logo
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!pdfUrl || loading}
              onClick={onPrint}
            >
              <HiOutlinePrinter className="mr-1.5 h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              type="button"
              size="sm"
              loading={downloading}
              disabled={!pdfUrl || loading || downloading}
              onClick={onDownload}
            >
              <HiOutlineArrowDownTray className="mr-1.5 h-3.5 w-3.5" />
              Download PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
              aria-label="Close"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100 p-2 sm:p-3">
          {error ? (
            <p className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
              {error}
            </p>
          ) : null}
          {loading ? (
            <p className="py-16 text-center text-[13px] text-ink-muted">
              Building PDF preview…
            </p>
          ) : pdfUrl ? (
            <iframe
              title="Report PDF preview"
              src={pdfUrl}
              className="h-full w-full rounded-xl border border-border bg-white"
            />
          ) : (
            <p className="py-16 text-center text-[13px] text-ink-muted">
              No preview available.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
