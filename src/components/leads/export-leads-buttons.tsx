"use client";

import { useState } from "react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
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
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant="secondary"
        size={size}
        disabled={!canExport || busy !== null}
        onClick={() => download("csv")}
      >
        <HiOutlineArrowDownTray className="h-4 w-4" />
        {busy === "csv" ? "Exporting…" : "Export CSV"}
      </Button>
      <Button
        variant="secondary"
        size={size}
        disabled={!canExport || busy !== null}
        onClick={() => download("xlsx")}
      >
        <HiOutlineArrowDownTray className="h-4 w-4" />
        {busy === "xlsx" ? "Exporting…" : "Export Excel"}
      </Button>
    </div>
  );
}
