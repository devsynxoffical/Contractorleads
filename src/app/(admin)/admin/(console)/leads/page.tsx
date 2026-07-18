"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

type Busy =
  | "load"
  | "create"
  | "delete"
  | "export-csv"
  | "export-xlsx"
  | "export-sel-csv"
  | "export-sel-xlsx"
  | null;

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
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<Busy>("load");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    website: "",
    industry: INDUSTRIES[0] as string,
    country: "US",
    city: "",
    state: "",
  });

  const loading = busy === "load";

  async function load() {
    setBusy("load");
    startNavigationProgress();
    try {
      const params = new URLSearchParams();
      if (industry) params.set("industry", industry);
      if (country) params.set("country", country);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setSelected(new Set());
    } finally {
      setBusy(null);
      stopNavigationProgress();
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function downloadExport(key: Busy, url: string, filename: string) {
    if (busy) return;
    setBusy(key);
    startNavigationProgress();
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.error ?? "Export failed");
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setBusy(null);
      stopNavigationProgress();
    }
  }

  async function bulkDelete() {
    if (!selected.size || busy) return;
    if (!confirm(`Delete ${selected.size} lead(s) permanently?`)) return;
    setBusy("delete");
    startNavigationProgress();
    try {
      const res = await fetch("/api/admin/leads/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Bulk delete failed");
        return;
      }
      setMessage(`Deleted ${data.deleted} lead(s)`);
      await load();
    } finally {
      setBusy(null);
      stopNavigationProgress();
    }
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy("create");
    startNavigationProgress();
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Create failed");
        stopNavigationProgress();
        return;
      }
      setShowCreate(false);
      router.push(`/admin/leads/${data.lead.id}`);
    } finally {
      setBusy(null);
    }
  }

  const exportParams = new URLSearchParams({
    ...(industry ? { industry } : {}),
    ...(country ? { country } : {}),
    ...(q ? { q } : {}),
  });

  return (
    <div>
      <AdminPageHeader
        title="All Leads"
        description="Create, edit, bulk-delete, enrich, and export the global lead pool."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowCreate((v) => !v)} disabled={!!busy}>
              {showCreate ? "Close" : "Create lead"}
            </Button>
            <Button
              variant="danger"
              loading={busy === "delete"}
              disabled={!selected.size || !!busy}
              onClick={bulkDelete}
            >
              {busy === "delete"
                ? "Deleting…"
                : `Delete selected (${selected.size})`}
            </Button>
            <Button
              variant="secondary"
              loading={busy === "export-csv"}
              disabled={!!busy}
              onClick={() =>
                downloadExport(
                  "export-csv",
                  `/api/admin/leads/export?${exportParams}&format=csv`,
                  "leads-export.csv"
                )
              }
            >
              {busy === "export-csv" ? "Exporting…" : "Export CSV"}
            </Button>
            <Button
              variant="secondary"
              loading={busy === "export-xlsx"}
              disabled={!!busy}
              onClick={() =>
                downloadExport(
                  "export-xlsx",
                  `/api/admin/leads/export?${exportParams}&format=xlsx`,
                  "leads-export.xlsx"
                )
              }
            >
              {busy === "export-xlsx" ? "Exporting…" : "Export Excel"}
            </Button>
            {selected.size > 0 && (
              <>
                <Button
                  variant="secondary"
                  loading={busy === "export-sel-csv"}
                  disabled={!!busy}
                  onClick={() => {
                    const ids = [...selected].join(",");
                    downloadExport(
                      "export-sel-csv",
                      `/api/admin/leads/export?ids=${encodeURIComponent(ids)}&format=csv`,
                      "leads-selected.csv"
                    );
                  }}
                >
                  {busy === "export-sel-csv"
                    ? "Exporting…"
                    : `CSV selected (${selected.size})`}
                </Button>
                <Button
                  variant="secondary"
                  loading={busy === "export-sel-xlsx"}
                  disabled={!!busy}
                  onClick={() => {
                    const ids = [...selected].join(",");
                    downloadExport(
                      "export-sel-xlsx",
                      `/api/admin/leads/export?ids=${encodeURIComponent(ids)}&format=xlsx`,
                      "leads-selected.xlsx"
                    );
                  }}
                >
                  {busy === "export-sel-xlsx"
                    ? "Exporting…"
                    : `Excel selected (${selected.size})`}
                </Button>
              </>
            )}
          </div>
        }
      />

      {message && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      )}

      {showCreate && (
        <form
          onSubmit={createLead}
          className="mb-5 grid gap-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-sm font-semibold text-ink">
            Manual lead
          </h2>
          {(
            [
              ["businessName", "Business name"],
              ["ownerName", "Owner"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["website", "Website"],
              ["city", "City"],
              ["state", "State"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-[12px]">
              <span className="font-medium text-ink-muted">{label}</span>
              <input
                required={key === "businessName"}
                className="saas-input mt-1"
                value={createForm[key]}
                onChange={(e) =>
                  setCreateForm({ ...createForm, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Industry</span>
            <select
              className="saas-input mt-1"
              value={createForm.industry}
              onChange={(e) =>
                setCreateForm({ ...createForm, industry: e.target.value })
              }
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Country</span>
            <select
              className="saas-input mt-1"
              value={createForm.country}
              onChange={(e) =>
                setCreateForm({ ...createForm, country: e.target.value })
              }
            >
              {TIER_ONE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" loading={busy === "create"}>
              {busy === "create" ? "Creating…" : "Create & edit"}
            </Button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="saas-input max-w-[180px]"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          disabled={!!busy}
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
          disabled={!!busy}
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
          disabled={!!busy}
        />
        <Button
          type="button"
          size="sm"
          loading={busy === "load"}
          disabled={!!busy && busy !== "load"}
          onClick={load}
        >
          {busy === "load" ? "Loading…" : "Filter"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[780px] text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 w-10" />
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
                <td colSpan={7} className="px-4 py-8 text-ink-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              leads.map((lead) => (
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
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      Edit
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
