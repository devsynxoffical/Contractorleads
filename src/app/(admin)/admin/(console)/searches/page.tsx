"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { INDUSTRIES } from "@/lib/constants";

type SearchRow = {
  id: string;
  industry: string;
  country: string;
  locationScope: string;
  state: string | null;
  city: string | null;
  resultCount: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    companyName: string | null;
    name: string | null;
  };
  _count: { leads: number };
};

export default function AdminSearchesPage() {
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [industry, setIndustry] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    const res = await fetch(`/api/admin/searches?${params}`);
    const data = await res.json();
    setSearches(data.searches ?? []);
    setTotal(data.total ?? 0);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="All searches"
        description="Every niche scrape run by any agency or admin."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="saas-input max-w-[180px]"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">All services</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-brand-600 px-4 py-2 text-[12px] font-semibold text-white"
        >
          Filter
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Agency</th>
              <th className="px-4 py-3">Niche</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Results</th>
            </tr>
          </thead>
          <tbody>
            {searches.map((s) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="px-4 py-3 text-[12px] text-ink-muted">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${s.user.id}`}
                    className="font-semibold text-brand-600 hover:underline"
                  >
                    {s.user.companyName || s.user.name || s.user.email}
                  </Link>
                </td>
                <td className="px-4 py-3">{s.industry}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {s.locationScope === "country"
                    ? s.country
                    : [s.city, s.state, s.country].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {s.resultCount} / {s._count.leads} leads
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-border/60 px-4 py-2 text-[12px] text-ink-faint">
          {total} searches
        </p>
      </div>
    </div>
  );
}
