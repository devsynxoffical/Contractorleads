"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";
import { HudPanel } from "@/components/dashboard/hud-panel";

type Payload = {
  total: number;
  byFormat: Array<{ format: string; count: number; leads: number }>;
  exports: Array<{
    id: string;
    format: string;
    leadCount: number;
    createdAt: string;
    user: {
      id: string;
      email: string;
      companyName: string | null;
      name: string | null;
      plan: string;
    };
  }>;
};

export default function AdminExportsPage() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    fetch("/api/admin/exports")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Exports Log"
        description="Every CSV / Excel / PDF export across agencies — useful for usage audits and support."
      />

      {!data ? (
        <p className="text-sm text-ink-muted animate-pulse">Loading…</p>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Total exports" value={data.total} />
            {data.byFormat.map((f) => (
              <AdminStatCard
                key={f.format}
                label={f.format.toUpperCase()}
                value={f.count}
                hint={`${f.leads} leads exported`}
              />
            ))}
          </div>

          <HudPanel title="Recent exports" subtitle="Newest first">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-brand-500/15 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    <th className="px-2 py-2 font-semibold">When</th>
                    <th className="px-2 py-2 font-semibold">Agency</th>
                    <th className="px-2 py-2 font-semibold">Plan</th>
                    <th className="px-2 py-2 font-semibold">Format</th>
                    <th className="px-2 py-2 font-semibold">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {data.exports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2 py-6 text-ink-muted">
                        No exports yet.
                      </td>
                    </tr>
                  )}
                  {data.exports.map((row) => (
                    <tr key={row.id} className="border-b border-white/[0.04]">
                      <td className="px-2 py-2.5 text-ink-muted">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="px-2 py-2.5">
                        <Link
                          href={`/admin/customers/${row.user.id}`}
                          className="font-medium text-brand-500 hover:underline"
                        >
                          {row.user.companyName ||
                            row.user.name ||
                            row.user.email}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 capitalize text-ink-muted">
                        {row.user.plan}
                      </td>
                      <td className="px-2 py-2.5 uppercase text-ink">
                        {row.format}
                      </td>
                      <td className="px-2 py-2.5 tabular-nums text-ink">
                        {row.leadCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudPanel>
        </>
      )}
    </div>
  );
}
