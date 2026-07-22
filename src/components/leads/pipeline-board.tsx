"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LEAD_STATUSES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const dragMovedRef = useRef(false);

  const totalLeads = useMemo(
    () => columns.reduce((n, c) => n + c.items.length, 0),
    [columns],
  );

  function locateItem(cols: Column[], savedId: string) {
    for (const col of cols) {
      const item = col.items.find((i) => i.id === savedId);
      if (item) return { item, fromStatus: col.value };
    }
    return null;
  }

  function applyMove(cols: Column[], savedId: string, fromStatus: string, toStatus: string) {
    let moved: PipelineItem | null = null;
    const without = cols.map((col) => {
      if (col.value !== fromStatus) return col;
      const item = col.items.find((i) => i.id === savedId);
      if (item) moved = { ...item, status: toStatus };
      return { ...col, items: col.items.filter((i) => i.id !== savedId) };
    });
    if (!moved) return cols;
    return without.map((col) =>
      col.value === toStatus ? { ...col, items: [moved!, ...col.items] } : col,
    );
  }

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
      const located = locateItem(cols, savedId);
      const from = located?.fromStatus ?? fromStatus;
      return applyMove(cols, savedId, from, toStatus);
    });
  }

  function handleDrop(targetStatus: string, savedId: string | null) {
    setDraggingId(null);
    if (!savedId) return;
    const located = locateItem(columns, savedId);
    if (!located || located.fromStatus === targetStatus) return;
    void moveLead(savedId, located.fromStatus, targetStatus);
  }

  if (!totalLeads) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-[#faf8fb] px-6 py-14 text-center">
        <p className="text-base font-semibold text-ink">No leads in your pipeline yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Save leads from Lead Finder or Saved Leads — they appear here as cards you can drag
          between stages or move with the status menu.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/leads/search"
            className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Generate leads
          </Link>
          <Link
            href="/leads/saved"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-ink hover:border-brand-300"
          >
            Saved leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[12px] text-ink-muted">
        Drag cards between columns or use the status menu on each card. Changes sync to CRM
        webhooks when connected.
      </p>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col.value}
            className={cn(
              "w-[240px] shrink-0 rounded-xl border border-border bg-[#faf8fb] p-3 transition sm:w-[260px]",
              draggingId && "border-brand-200/80",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(col.value, e.dataTransfer.getData("text/plain") || null);
            }}
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
                  draggable={busyId !== s.id}
                  onDragStart={(e) => {
                    dragMovedRef.current = false;
                    e.dataTransfer.setData("text/plain", s.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(s.id);
                  }}
                  onDrag={() => {
                    dragMovedRef.current = true;
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={cn(
                    "cursor-grab border-border shadow-sm transition hover:border-brand-200 active:cursor-grabbing",
                    busyId === s.id && "opacity-60",
                    draggingId === s.id && "opacity-60 ring-2 ring-brand-300",
                  )}
                >
                  <CardContent className="py-3">
                    <Link
                      href={`/leads/${s.lead.id}?from=saved`}
                      className="font-semibold text-ink hover:text-brand-600"
                      onClick={(e) => {
                        if (dragMovedRef.current) e.preventDefault();
                      }}
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
                        value={s.status}
                        disabled={busyId === s.id}
                        onChange={(e) =>
                          void moveLead(s.id, s.status, e.target.value)
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
                  Drop leads here
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
