"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import {
  AdminIndustryField,
  resolvedIndustryForQuery,
} from "@/components/admin/admin-industry-field";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
import { CUSTOM_INDUSTRY_VALUE } from "@/lib/search-criteria";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      id?: string;
      email: string;
      companyName: string | null;
      name?: string | null;
    } | null;
  } | null;
};

type FilterUser = {
  id: string;
  email: string;
  label: string;
  searchCount: number;
};

const WHEN_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<FilterUser[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [when, setWhen] = useState("all");
  const [tier, setTier] = useState("all");
  const [strength, setStrength] = useState("all");
  const [userId, setUserId] = useState("");
  const [sort, setSort] = useState("newest");
  const [filterIndustrySelect, setFilterIndustrySelect] = useState("");
  const [filterCustomIndustry, setFilterCustomIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<Busy>("load");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createIndustrySelect, setCreateIndustrySelect] = useState<string>(
    INDUSTRIES[0],
  );
  const [createCustomIndustry, setCreateCustomIndustry] = useState("");
  const [createForm, setCreateForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    website: "",
    country: "US",
    city: "",
    state: "",
  });

  const loading = busy === "load";

  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    const industry = resolvedIndustryForQuery(
      filterIndustrySelect,
      filterCustomIndustry,
    );
    if (industry) params.set("industry", industry);
    if (country) params.set("country", country);
    if (q.trim()) params.set("q", q.trim());
    if (when !== "all") params.set("when", when);
    if (tier !== "all") params.set("tier", tier);
    if (strength !== "all") params.set("strength", strength);
    if (userId) params.set("userId", userId);
    if (sort !== "newest") params.set("sort", sort);
    params.set("pageSize", "50");
    return params;
  }, [
    filterIndustrySelect,
    filterCustomIndustry,
    country,
    q,
    when,
    tier,
    strength,
    userId,
    sort,
  ]);

  async function load(override?: URLSearchParams) {
    setBusy("load");
    startNavigationProgress();
    try {
      const params = override ?? filterParams;
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setUsers(data.filters?.users ?? []);
      setCategories(data.filters?.categories ?? []);
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

  function clearFilters() {
    setWhen("all");
    setTier("all");
    setStrength("all");
    setUserId("");
    setSort("newest");
    setFilterIndustrySelect("");
    setFilterCustomIndustry("");
    setCountry("");
    setQ("");
    const params = new URLSearchParams({ pageSize: "50" });
    void load(params);
  }

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
        body: JSON.stringify({
          ...createForm,
          industry:
            resolvedIndustryForQuery(
              createIndustrySelect,
              createCustomIndustry,
            ) || INDUSTRIES[0],
        }),
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

  const hasActiveFilters =
    when !== "all" ||
    tier !== "all" ||
    strength !== "all" ||
    Boolean(userId) ||
    sort !== "newest" ||
    Boolean(country) ||
    Boolean(q.trim()) ||
    Boolean(
      resolvedIndustryForQuery(filterIndustrySelect, filterCustomIndustry),
    );

  const industryOptions = Array.from(
    new Set([
      ...categories,
      ...INDUSTRIES,
    ]),
  ).sort((a, b) => a.localeCompare(b));

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
                  `/api/admin/leads/export?${filterParams}&format=csv`,
                  "leads-export.csv",
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
                  `/api/admin/leads/export?${filterParams}&format=xlsx`,
                  "leads-export.xlsx",
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
                      "leads-selected.csv",
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
                      "leads-selected.xlsx",
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
          <AdminIndustryField
            label="Industry"
            selectValue={createIndustrySelect}
            customValue={createCustomIndustry}
            onSelectChange={setCreateIndustrySelect}
            onCustomChange={setCreateCustomIndustry}
            className="sm:col-span-2"
          />
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
            <Button
              type="submit"
              loading={busy === "create"}
            >
              {busy === "create" ? "Creating…" : "Create & edit"}
            </Button>
          </div>
        </form>
      )}

      <div
        className={cn(
          "mb-4 space-y-3 rounded-2xl border border-border/80 bg-white p-4 shadow-[var(--shadow-card)]",
          loading && "opacity-80",
        )}
      >
        <div className="flex flex-wrap gap-1.5">
          {WHEN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!!busy}
              onClick={() => setWhen(opt.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                when === opt.value
                  ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                  : "bg-[#faf8fb] text-ink-muted hover:text-ink",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="block text-[11px] font-medium text-ink-muted">
            Customer / user
            <select
              className="saas-input mt-1"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!!busy}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.email})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-medium text-ink-muted">
            Tier
            <select
              className="saas-input mt-1"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              disabled={!!busy}
            >
              <option value="all">All tiers</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="nurture">Nurture</option>
            </select>
          </label>

          <label className="block text-[11px] font-medium text-ink-muted">
            Strength
            <select
              className="saas-input mt-1"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              disabled={!!busy}
            >
              <option value="all">Any strength</option>
              <option value="strong">Strong (75+)</option>
              <option value="medium">Medium (50–74)</option>
              <option value="developing">Developing (&lt;50)</option>
            </select>
          </label>

          <label className="block text-[11px] font-medium text-ink-muted">
            Category / industry
            <select
              className="saas-input mt-1"
              value={filterIndustrySelect || "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") {
                  setFilterIndustrySelect("");
                  setFilterCustomIndustry("");
                } else {
                  setFilterIndustrySelect(v);
                  if (v !== CUSTOM_INDUSTRY_VALUE) setFilterCustomIndustry("");
                }
              }}
              disabled={!!busy}
            >
              <option value="all">All categories</option>
              {industryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={CUSTOM_INDUSTRY_VALUE}>Custom…</option>
            </select>
          </label>

          {filterIndustrySelect === CUSTOM_INDUSTRY_VALUE && (
            <label className="block text-[11px] font-medium text-ink-muted">
              Custom industry
              <input
                className="saas-input mt-1"
                value={filterCustomIndustry}
                onChange={(e) => setFilterCustomIndustry(e.target.value)}
                placeholder="e.g. Window tinting"
                disabled={!!busy}
              />
            </label>
          )}

          <label className="block text-[11px] font-medium text-ink-muted">
            Country
            <select
              className="saas-input mt-1"
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
          </label>

          <label className="block text-[11px] font-medium text-ink-muted">
            Sort
            <select
              className="saas-input mt-1"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              disabled={!!busy}
            >
              <option value="newest">Newest first</option>
              <option value="score">Highest score</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>

          <label className="block text-[11px] font-medium text-ink-muted sm:col-span-2">
            Search
            <input
              className="saas-input mt-1"
              placeholder="Business, owner, email, phone, city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              disabled={!!busy}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            loading={busy === "load"}
            disabled={!!busy && busy !== "load"}
            onClick={() => load()}
          >
            {busy === "load" ? "Loading…" : "Apply filters"}
          </Button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              disabled={!!busy}
              className="text-[12px] font-semibold text-brand-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
          <span className="text-[12px] text-ink-faint">
            {total} lead{total === 1 ? "" : "s"} match
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="border-b border-border bg-[#faf8fc] text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3">Source agency</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-ink-muted">
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
                  <td className="px-4 py-3 text-[12px] tabular-nums text-ink-muted">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-muted">
                    {lead.search?.user?.companyName ||
                      lead.search?.user?.email ||
                      "—"}
                  </td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            {!loading && !leads.length && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-ink-muted"
                >
                  No leads match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="border-t border-border/60 px-4 py-2 text-[12px] text-ink-faint">
          Showing {leads.length} of {total} lead{total === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
