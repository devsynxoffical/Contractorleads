"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import {
  AdminIndustryField,
  resolvedIndustryForQuery,
} from "@/components/admin/admin-industry-field";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type PoolLead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  city: string | null;
  state: string | null;
  country: string;
  leadScore: number;
  industry: string | null;
};

type Customer = {
  id: string;
  email: string;
  companyName: string | null;
  name: string | null;
};

export default function AdminCopyLeadsPage() {
  const [industrySelect, setIndustrySelect] = useState<string>(INDUSTRIES[0]);
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pool, setPool] = useState<PoolLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/customers?pageSize=50")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  async function preview() {
    setLoading(true);
    setMessage(null);
    const industry = resolvedIndustryForQuery(industrySelect, customIndustry);
    if (!industry) {
      setLoading(false);
      setMessage("Enter a custom service name.");
      return;
    }
    const params = new URLSearchParams({ industry });
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    const res = await fetch(`/api/admin/leads/pool?${params}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Preview failed");
      return;
    }
    setPool(data.leads ?? []);
    setSelected(new Set((data.leads ?? []).map((l: PoolLead) => l.id)));
  }

  async function copySelected() {
    if (!agencyId) {
      setMessage("Pick a target agency first");
      return;
    }
    const leadIds = [...selected];
    if (!leadIds.length) {
      setMessage("No leads selected");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/leads/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, leadIds }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Copy failed");
      return;
    }
    setMessage(
      `Copied ${data.copied} lead(s) to the agency. Skipped ${data.skipped} already saved.`,
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <AdminPageHeader
        title="Copy Leads"
        description="Give an agency leads for a service that another agency already scraped — no second Google Places call."
      />

      <div className="mb-4 grid max-w-3xl gap-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] sm:grid-cols-2">
        <AdminIndustryField
          label="Service"
          selectValue={industrySelect}
          customValue={customIndustry}
          onSelectChange={setIndustrySelect}
          onCustomChange={setCustomIndustry}
        />
        <label className="block text-[12px]">
          <span className="font-medium text-ink-muted">Country (optional)</span>
          <select
            className="saas-input mt-1"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Any</option>
            {TIER_ONE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px]">
          <span className="font-medium text-ink-muted">City (optional)</span>
          <input
            className="saas-input mt-1"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <label className="block text-[12px]">
          <span className="font-medium text-ink-muted">Target agency</span>
          <select
            className="saas-input mt-1"
            value={agencyId}
            onChange={(e) => setAgencyId(e.target.value)}
          >
            <option value="">Select agency…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.name || c.email}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button onClick={preview} disabled={loading}>
            {loading ? "Loading…" : "Preview pool"}
          </Button>
          <Button
            variant="secondary"
            onClick={copySelected}
            disabled={loading || !selected.size}
          >
            Copy selected ({selected.size})
          </Button>
        </div>
        {message && (
          <p className="sm:col-span-2 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
            {message}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 w-10" />
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {pool.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-ink-muted">
                  Preview a service to see existing pool leads.
                </td>
              </tr>
            )}
            {pool.map((lead) => (
              <tr key={lead.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(lead.id)}
                    onChange={() => toggle(lead.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{lead.businessName}</p>
                  <p className="text-[12px] text-ink-muted">
                    {lead.ownerName || "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {[lead.city, lead.state, lead.country]
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className="px-4 py-3 tabular-nums">{lead.leadScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
