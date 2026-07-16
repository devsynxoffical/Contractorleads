"use client";

import { useState } from "react";
import Link from "next/link";
import { LEAD_STATUSES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

type PipelineItem = {
  id: string;
  status: string;
  lead: {
    id: string;
    businessName: string;
    address: string | null;
    leadScore: number;
  };
};

type Column = {
  value: string;
  label: string;
  items: PipelineItem[];
};

export function PipelineBoard({ initialColumns }: { initialColumns: Column[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function moveLead(savedId: string, fromStatus: string, toStatus: string) {
    if (fromStatus === toStatus) return;
    setBusyId(savedId);
    setError("");

    const res = await fetch(`/api/leads/saved/${savedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStatus }),
    });

    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update status");
      return;
    }

    setColumns((cols) => {
      let moved: PipelineItem | null = null;
      const without = cols.map((col) => {
        if (col.value !== fromStatus) return col;
        const item = col.items.find((i) => i.id === savedId);
        if (item) moved = { ...item, status: toStatus };
        return { ...col, items: col.items.filter((i) => i.id !== savedId) };
      });
      if (!moved) return cols;
      return without.map((col) =>
        col.value === toStatus
          ? { ...col, items: [moved!, ...col.items] }
          : col
      );
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col.value}
            className="w-[240px] shrink-0 rounded-xl border border-border bg-[#faf8fb] p-3 sm:w-[260px]"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink">{col.label}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-600 shadow-sm">
                {col.items.length}
              </span>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 sm:max-h-none">
              {col.items.map((s) => (
                <Card
                  key={s.id}
                  className={`border-border shadow-sm transition hover:border-brand-200 ${
                    busyId === s.id ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="py-3">
                    <Link
                      href={`/leads/${s.lead.id}`}
                      className="font-semibold text-ink hover:text-brand-600"
                    >
                      {s.lead.businessName}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                      {s.lead.address}
                    </p>
                    <p className="mt-2 text-xs font-semibold tabular-nums text-brand-600">
                      Score {s.lead.leadScore}
                    </p>
                    <label className="mt-2 block">
                      <span className="sr-only">Move status</span>
                      <select
                        value={col.value}
                        disabled={busyId === s.id}
                        onChange={(e) =>
                          void moveLead(s.id, col.value, e.target.value)
                        }
                        className="mt-1 h-8 w-full rounded-lg border border-border bg-white px-2 text-[11px] text-ink outline-none focus:border-brand-400"
                      >
                        {LEAD_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </CardContent>
                </Card>
              ))}
              {!col.items.length && (
                <p className="rounded-lg border border-dashed border-border bg-white px-3 py-6 text-center text-xs text-ink-faint">
                  No leads
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
