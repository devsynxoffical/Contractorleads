"use client";

import { useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
import { notifyCreditsChanged } from "@/lib/client/credits-sync";
import { cn } from "@/lib/utils";

type Scope = "all" | "saved" | "hot";
type EmailExportFilter = "all" | "safe_only" | "safe_and_catchall" | "exclude_invalid";

export function ExportLeadsButtons({
  scope,
  leadIds,
  disabled,
  className,
  size = "default",
}: {
  scope?: Scope;
  leadIds?: string[];
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm";
}) {
  const [busy, setBusy] = useState<"csv" | "xlsx" | null>(null);
  const [dialogFormat, setDialogFormat] = useState<"csv" | "xlsx" | null>(null);
  const [emailFilter, setEmailFilter] = useState<EmailExportFilter>("all");
  const [verifyBeforeExport, setVerifyBeforeExport] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canExport = !disabled && (scope || (leadIds && leadIds.length > 0));

  async function download(format: "csv" | "xlsx") {
    if (!canExport || busy) return;
    setBusy(format);
    setStatusMessage(null);
    startNavigationProgress();
    try {
      // Section 05 & 07 Approach B: Verify unverified emails before export if requested
      if (
        verifyBeforeExport &&
        leadIds &&
        leadIds.length > 0
      ) {
        setStatusMessage(`Verifying ${leadIds.length} lead emails before export…`);
        await fetch("/api/leads/bulk-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadIds }),
        }).catch(() => null);
      }

      setStatusMessage(`Generating ${format.toUpperCase()} file…`);

      let res: Response;
      if (leadIds && leadIds.length > 0) {
        res = await fetch("/api/exports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadIds, format, emailFilter }),
        });
      } else {
        res = await fetch(
          `/api/exports?scope=${scope ?? "all"}&format=${format}&emailFilter=${emailFilter}`,
        );
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 402 && data?.upgradeUrl) {
          const go = confirm(
            `${data.error || "Not enough credits to export."}\n\nOpen Billing to purchase a plan?`,
          );
          if (go) window.location.href = data.upgradeUrl;
          return;
        }
        alert(data?.error ?? "Export failed");
        return;
      }

      const exported = Number(res.headers.get("X-Export-Count") || 0);
      const requested = Number(res.headers.get("X-Export-Requested") || 0);
      const skipped = Number(res.headers.get("X-Export-Skipped") || 0);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const suffix = emailFilter === "safe_only" ? "-safe-verified" : "";
      a.download = `contractor-leads${suffix}.${format === "xlsx" ? "xlsx" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);

      setDialogFormat(null);

      if (skipped > 0 && exported > 0) {
        alert(
          `Exported ${exported} of ${requested} leads. ${skipped} skipped because you need more credits (1 per lead). Purchase more on Billing to export the rest.`,
        );
      }
      const charged = Number(res.headers.get("X-Export-Charged") || 0);
      if (charged > 0) {
        notifyCreditsChanged();
      }
    } finally {
      setBusy(null);
      setStatusMessage(null);
      stopNavigationProgress();
    }
  }

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        <Button
          variant="secondary"
          size={size}
          loading={busy === "csv"}
          disabled={!canExport || busy !== null}
          onClick={() => setDialogFormat("csv")}
        >
          {busy !== "csv" && <HiOutlineArrowDownTray className="h-4 w-4" />}
          {busy === "csv" ? "Exporting…" : "Export CSV"}
        </Button>
        <Button
          variant="secondary"
          size={size}
          loading={busy === "xlsx"}
          disabled={!canExport || busy !== null}
          onClick={() => setDialogFormat("xlsx")}
        >
          {busy !== "xlsx" && <HiOutlineArrowDownTray className="h-4 w-4" />}
          {busy === "xlsx" ? "Exporting…" : "Export Excel"}
        </Button>
      </div>

      {/* Section 08 Export Dialog with 'Export only Safe emails' toggle */}
      {dialogFormat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => !busy && setDialogFormat(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <HiOutlineShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-ink">
                    Export Leads ({dialogFormat.toUpperCase()})
                  </h3>
                  <p className="text-[11.5px] text-ink-muted">
                    Choose email verification filters for cold email safety
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setDialogFormat(null)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-left">
              {/* Quick Toggle: Export Only Safe Emails */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                <input
                  type="checkbox"
                  checked={emailFilter === "safe_only"}
                  onChange={(e) =>
                    setEmailFilter(e.target.checked ? "safe_only" : "all")
                  }
                  className="mt-0.5 h-4 w-4 accent-emerald-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />
                    Export only Safe emails (Recommended)
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/80">
                    Only exports 100% valid mailboxes (&lt; 1% bounce risk). Filters out Catchall, Role Accounts (info@, admin@), and Invalid hard bounces.
                  </p>
                </div>
              </label>

              {/* Granular Filter Selector */}
              <div>
                <label className="block text-[11.5px] font-semibold text-ink-muted mb-1.5">
                  Email Category Filter
                </label>
                <select
                  value={emailFilter}
                  onChange={(e) =>
                    setEmailFilter(e.target.value as EmailExportFilter)
                  }
                  className="saas-input w-full text-xs font-medium"
                >
                  <option value="all">
                    All Leads (Include Safe, Catchall, Role &amp; Phone-Only)
                  </option>
                  <option value="safe_only">
                    🟢 Safe Only — Primary Cold Email List (&lt; 1% bounce risk)
                  </option>
                  <option value="safe_and_catchall">
                    🟡 Safe + Catchall — Include Accept-All domains
                  </option>
                  <option value="exclude_invalid">
                    🛡️ Exclude Invalid Hard Bounces (Keep Safe, Catchall, Role &amp; Phone)
                  </option>
                </select>
              </div>

              {/* Verify before export option */}
              {leadIds && leadIds.length > 0 && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-[var(--input-bg)] px-3.5 py-2.5 text-xs">
                  <input
                    type="checkbox"
                    checked={verifyBeforeExport}
                    onChange={(e) => setVerifyBeforeExport(e.target.checked)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="font-medium text-ink">
                    Auto-verify unverified emails before downloading (30-day cached)
                  </span>
                </label>
              )}

              {statusMessage && (
                <div className="rounded-xl border border-brand-200 bg-brand-50/70 px-3 py-2 text-xs font-semibold text-brand-800">
                  {statusMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy !== null}
                onClick={() => setDialogFormat(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={busy === dialogFormat}
                disabled={busy !== null}
                onClick={() => void download(dialogFormat)}
              >
                <HiOutlineArrowDownTray className="h-4 w-4" />
                Download {dialogFormat.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
