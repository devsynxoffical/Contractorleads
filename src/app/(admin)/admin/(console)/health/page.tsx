"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";

type Check = {
  name: string;
  status: "ok" | "warn" | "error" | "missing";
  detail: string;
};

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/health");
    const data = await res.json();
    setChecks(data.checks ?? []);
    setCheckedAt(data.checkedAt ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  const color = (status: string) => {
    if (status === "ok") return "bg-emerald-50 text-emerald-800";
    if (status === "error" || status === "missing")
      return "bg-red-50 text-red-800";
    return "bg-amber-50 text-amber-900";
  };

  return (
    <div>
      <AdminPageHeader
        title="Feature Health Audit"
        description="Quick status of core platform integrations."
        actions={
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-border bg-white px-3 py-2 text-[12px] font-semibold text-ink-muted"
          >
            Re-check
          </button>
        }
      />

      {checkedAt && (
        <p className="mb-4 text-[12px] text-ink-faint">
          Checked {new Date(checkedAt).toLocaleString()}
        </p>
      )}

      <ul className="space-y-2">
        {checks.map((c) => (
          <li
            key={c.name}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white px-4 py-3 shadow-[var(--shadow-card)]"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{c.name}</p>
              <p className="text-[12px] text-ink-muted">{c.detail}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${color(c.status)}`}
            >
              {c.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
