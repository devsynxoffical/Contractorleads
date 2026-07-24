"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LEAD_STATUSES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PipelineItem = {
  id: string;
  status: string;
  favorite?: boolean;
  lead: {
    id: string;
    businessName: string;
    address: string | null;
    leadScore: number;
    email?: string | null;
    qualityTier?: string | null;
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
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const dragMovedRef = useRef(false);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const filteredColumns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return columns.map((col) => ({
      ...col,
      items: col.items.filter((item) => {
        if (favoritesOnly && !item.favorite) return false;
        if (
          tierFilter !== "all" &&
          (item.lead.qualityTier || "").toLowerCase() !== tierFilter
        ) {
          return false;
        }
        if (!q) return true;
        return (
          item.lead.businessName.toLowerCase().includes(q) ||
          (item.lead.address || "").toLowerCase().includes(q) ||
          (item.lead.email || "").toLowerCase().includes(q)
        );
      }),
    }));
  }, [columns, query, tierFilter, favoritesOnly]);

  const totalLeads = useMemo(
    () => columns.reduce((n, c) => n + c.items.length, 0),
    [columns],
  );
  const visibleCount = useMemo(
    () => filteredColumns.reduce((n, c) => n + c.items.length, 0),
    [filteredColumns],
  );

  function locateItem(cols: Column[], savedId: string) {
    for (const col of cols) {
      const item = col.items.find((i) => i.id === savedId);
      if (item) return { item, fromStatus: col.value };
    }
    return null;
  }

  function applyMove(
    cols: Column[],
    savedId: string,
    fromStatus: string,
    toStatus: string,
  ) {
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

  async function moveLead(
    savedId: string,
    fromStatus: string,
    toStatus: string,
  ) {
    if (fromStatus === toStatus) return;
    setBusyId(savedId);
    setError("");

    // Optimistic UI — move immediately, roll back on failure
    const snapshot = columns;
    setColumns((cols) => applyMove(cols, savedId, fromStatus, toStatus));

    try {
      const res = await fetch(`/api/leads/saved/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setColumns(snapshot);
        setError(data.error || "Could not update status");
      }
    } catch {
      setColumns(snapshot);
      setError("Network error — status was not saved");
    } finally {
      setBusyId(null);
    }
  }

  async function removeLead(savedId: string) {
    if (!confirm("Remove this lead from your pipeline?")) return;
    setBusyId(savedId);
    setError("");
    const snapshot = columns;
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        items: col.items.filter((i) => i.id !== savedId),
      })),
    );
    try {
      const res = await fetch(`/api/leads/saved/${savedId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setColumns(snapshot);
        setError(data.error || "Could not remove lead");
      }
    } catch {
      setColumns(snapshot);
      setError("Network error — lead was not removed");
    } finally {
      setBusyId(null);
    }
  }

  function handleDrop(targetStatus: string, savedId: string | null) {
    setDraggingId(null);
    setDropTarget(null);
    if (!savedId) return;
    const located = locateItem(columns, savedId);
    if (!located || located.fromStatus === targetStatus) return;
    void moveLead(savedId, located.fromStatus, targetStatus);
  }

  if (!totalLeads) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-[#faf8fb] px-6 py-14 text-center">
        <p className="text-base font-semibold text-ink">
          No leads in your pipeline yet
        </p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
          Pipeline only shows leads you add. From Lead Finder, click{" "}
          <span className="font-semibold text-ink">Add to pipeline</span> on a
          result — or open a lead and save it. Then drag cards between New →
          Contacted → Qualified → Closed.
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
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="block min-w-[200px] flex-1 text-[12px]">
          <span className="font-medium text-ink-muted">Search pipeline</span>
          <input
            className="saas-input mt-1"
            placeholder="Business, address, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="block text-[12px]">
          <span className="font-medium text-ink-muted">Tier</span>
          <select
            className="saas-input mt-1"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="nurture">Nurture</option>
          </select>
        </label>
        <label className="mb-1 flex items-center gap-2 text-[12px] text-ink-muted">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          Favorites only
        </label>
        <p className="mb-1 text-[12px] text-ink-faint">
          Showing {visibleCount} of {totalLeads}
        </p>
      </div>
      <p className="mb-3 text-[12px] text-ink-muted">
        Drag a card onto another column, or pick a stage from the menu. On
        mobile, use the status menu. Emailing a lead from its profile moves New
        → Contacted.
      </p>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {filteredColumns.map((col) => (
          <div
            key={col.value}
            className={cn(
              "w-[240px] shrink-0 rounded-xl border border-border bg-[#faf8fb] p-3 transition sm:w-[260px]",
              dropTarget === col.value &&
                "border-brand-500 bg-brand-50/60 ring-2 ring-brand-300/40",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropTarget(col.value);
            }}
            onDragLeave={() => {
              setDropTarget((cur) => (cur === col.value ? null : cur));
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(
                col.value,
                e.dataTransfer.getData("text/plain") || null,
              );
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
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTarget(null);
                  }}
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
                      {s.lead.qualityTier
                        ? ` · ${s.lead.qualityTier}`
                        : ""}
                      {s.favorite ? " · ★" : ""}
                    </p>
                    <label className="mt-2 block">
                      <span className="sr-only">Move status</span>
                      <select
                        value={
                          LEAD_STATUSES.some((st) => st.value === s.status)
                            ? s.status
                            : "new"
                        }
                        disabled={busyId === s.id}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
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
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-medium text-red-600 hover:underline"
                      disabled={busyId === s.id}
                      onClick={() => void removeLead(s.id)}
                    >
                      Remove
                    </button>
                  </CardContent>
                </Card>
              ))}
              {!col.items.length && (
                <p
                  className={cn(
                    "rounded-lg border border-dashed border-border bg-white px-3 py-6 text-center text-xs text-ink-faint",
                    dropTarget === col.value &&
                      "border-brand-400 text-brand-600",
                  )}
                >
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
