"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";

type SavedRow = {
  id: string;
  status: string;
  favorite: boolean;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    companyName: string | null;
    name: string | null;
  };
  lead: {
    id: string;
    businessName: string;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string;
    leadScore: number;
    phone: string | null;
    email: string | null;
  };
};

export default function AdminSavedLeadsPage() {
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/admin/saved-leads")
      .then((r) => r.json())
      .then((d) => {
        setSaved(d.saved ?? []);
        setTotal(d.total ?? 0);
      });
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Saved leads"
        description="Which agencies have saved which leads in their CRM."
      />
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Agency</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {saved.map((row) => (
              <tr key={row.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${row.user.id}`}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    {row.user.companyName || row.user.name || row.user.email}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/leads/${row.lead.id}`}
                    className="font-semibold text-ink hover:underline"
                  >
                    {row.lead.businessName}
                  </Link>
                  <p className="text-[11px] text-ink-muted">
                    {row.lead.industry} ·{" "}
                    {[row.lead.city, row.lead.state, row.lead.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </td>
                <td className="px-4 py-3 capitalize">
                  {row.status}
                  {row.favorite ? " ★" : ""}
                </td>
                <td className="px-4 py-3 tabular-nums">{row.lead.leadScore}</td>
                <td className="px-4 py-3 text-[12px] text-ink-muted">
                  {new Date(row.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {saved.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-ink-muted">
                  No saved leads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="border-t border-border/60 px-4 py-2 text-[12px] text-ink-faint">
          {total} saved
        </p>
      </div>
    </div>
  );
}
