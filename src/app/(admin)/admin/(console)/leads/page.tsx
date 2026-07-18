"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";

type LeadRow = {
  id: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string;
  leadScore: number;
  qualityTier: string | null;
  createdAt: string;
  search: {
    user: {
      email: string;
      companyName: string | null;
    } | null;
  } | null;
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    if (country) params.set("country", country);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="All Leads"
        description="Every lead scraped by any agency — the shared platform pool."
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
        <select
          className="saas-input max-w-[160px]"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">All countries</option>
          {TIER_ONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="saas-input max-w-xs"
          placeholder="Search name, owner, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
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
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Source agency</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-ink-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{lead.businessName}</p>
                    <p className="text-[12px] text-ink-muted">
                      {lead.ownerName || lead.phone || lead.email || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">{lead.industry}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {[lead.city, lead.state, lead.country]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {lead.leadScore}
                    <span className="ml-1 text-[11px] capitalize text-ink-faint">
                      {lead.qualityTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-muted">
                    {lead.search?.user?.companyName ||
                      lead.search?.user?.email ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="border-t border-border/60 px-4 py-2 text-[12px] text-ink-faint">
          {total} lead{total === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
