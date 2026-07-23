"use client";

import { useState } from "react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
import { cn } from "@/lib/utils";

type Scope = "all" | "saved" | "hot";

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
  const canExport = !disabled && (scope || (leadIds && leadIds.length > 0));

  async function download(format: "csv" | "xlsx") {
    if (!canExport || busy) return;
    setBusy(format);
    startNavigationProgress();
    try {
      let res: Response;
      if (leadIds && leadIds.length > 0) {
        res = await fetch("/api/exports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadIds, format }),
        });
      } else {
        res = await fetch(
          `/api/exports?scope=${scope ?? "all"}&format=${format}`
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

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leadflow-export.${format === "xlsx" ? "xlsx" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
      stopNavigationProgress();
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant="secondary"
        size={size}
        loading={busy === "csv"}
        disabled={!canExport || busy !== null}
        onClick={() => download("csv")}
      >
        {busy !== "csv" && <HiOutlineArrowDownTray className="h-4 w-4" />}
        {busy === "csv" ? "Exporting…" : "Export CSV"}
      </Button>
      <Button
        variant="secondary"
        size={size}
        loading={busy === "xlsx"}
        disabled={!canExport || busy !== null}
        onClick={() => download("xlsx")}
      >
        {busy !== "xlsx" && <HiOutlineArrowDownTray className="h-4 w-4" />}
        {busy === "xlsx" ? "Exporting…" : "Export Excel"}
      </Button>
    </div>
  );
}
