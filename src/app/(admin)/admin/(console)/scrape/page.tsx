"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import {
  AdminIndustryField,
  industryPayloadForApi,
  resolvedIndustryForQuery,
} from "@/components/admin/admin-industry-field";
import {
  INDUSTRIES,
  TIER_ONE_COUNTRIES,
  getTierOneCountry,
  getRegionAnyLabel,
  getRegionsForCountry,
} from "@/lib/constants";
import { CUSTOM_INDUSTRY_VALUE } from "@/lib/search-criteria";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

type ScrapeLead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string;
  industry: string | null;
  leadScore: number;
  qualityTier: string | null;
  createdAt: string;
};

type NicheRow = { name: string; count: number };

export default function AdminScrapePage() {
  const [industrySelect, setIndustrySelect] = useState<string>(INDUSTRIES[0]);
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("US");
  const [locationScope, setLocationScope] = useState<"local" | "country">(
    "local",
  );
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);
  const [targetLeadCount, setTargetLeadCount] = useState(50);
  const [customLeadCount, setCustomLeadCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [niches, setNiches] = useState<NicheRow[]>([]);
  const [leads, setLeads] = useState<ScrapeLead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsIndustry, setLeadsIndustry] = useState<string | null>(null);
  const [nicheFilter, setNicheFilter] = useState("");

  const countryMeta = getTierOneCountry(country);

  const knownNicheNames = useMemo(() => niches.map((n) => n.name), [niches]);

  const customNiches = useMemo(() => {
    const presets = new Set<string>(INDUSTRIES);
    return niches.filter((n) => !presets.has(n.name));
  }, [niches]);

  const filteredCustomNiches = useMemo(() => {
    const q = nicheFilter.trim().toLowerCase();
    if (!q) return customNiches;
    return customNiches.filter((n) => n.name.toLowerCase().includes(q));
  }, [customNiches, nicheFilter]);

  const resolvedLeadCount = (() => {
    if (targetLeadCount === -1) {
      const n = Number(customLeadCount);
      if (!Number.isFinite(n)) return 50;
      return Math.max(1, Math.min(1000, Math.floor(n)));
    }
    return targetLeadCount;
  })();

  const activeIndustry = resolvedIndustryForQuery(
    industrySelect,
    customIndustry,
  );

  const loadNiches = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/scrape");
      const data = await res.json();
      if (res.ok) setNiches(data.niches ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadLeadsForIndustry = useCallback(async (industry: string) => {
    if (!industry.trim()) {
      setLeads([]);
      setLeadsTotal(0);
      setLeadsIndustry(null);
      return;
    }
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams({
        industry,
        take: "100",
      });
      const res = await fetch(`/api/admin/scrape?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load leads");
      setLeads(data.leads ?? []);
      setLeadsTotal(data.total ?? 0);
      setLeadsIndustry(industry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    void loadNiches();
  }, [loadNiches]);

  function selectNiche(name: string) {
    const presets = new Set<string>(INDUSTRIES);
    if (presets.has(name)) {
      setIndustrySelect(name);
      setCustomIndustry("");
    } else {
      setIndustrySelect(name);
      setCustomIndustry("");
    }
    setResult(null);
    setError(null);
    void loadLeadsForIndustry(name);
  }

  async function runScrape() {
    const industry = resolvedIndustryForQuery(industrySelect, customIndustry);
    if (!industry) {
      setError("Enter a service / niche name.");
      return;
    }

    setLoading(true);
    startNavigationProgress();
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...industryPayloadForApi(industrySelect, customIndustry),
          country,
          locationScope,
          state: locationScope === "local" ? state : undefined,
          city: locationScope === "local" ? city : undefined,
          zip: locationScope === "local" ? zip : undefined,
          radius: locationScope === "local" ? radius : undefined,
          targetLeadCount: resolvedLeadCount,
        }),
        signal: AbortSignal.timeout(180000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");

      const scraped: ScrapeLead[] = data.leads ?? [];
      setLeads(scraped);
      setLeadsTotal(scraped.length);
      setLeadsIndustry(industry);
      setResult(
        `Created/reused ${scraped.length} of ${resolvedLeadCount} requested leads for ${industry}.`,
      );

      // Promote custom niche into the select list immediately
      if (industrySelect === CUSTOM_INDUSTRY_VALUE && industry) {
        setIndustrySelect(industry);
        setCustomIndustry("");
      }

      await loadNiches();
      // Refresh full pool for this niche (may include older rows)
      void loadLeadsForIndustry(industry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scrape failed");
    } finally {
      setLoading(false);
      stopNavigationProgress();
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Scrape Leads"
        description="Run a fresh niche scrape into the global pool. No credits are charged for super admins. Existing businesses are reused when already in the pool."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="max-w-xl space-y-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
          <AdminIndustryField
            selectValue={industrySelect}
            customValue={customIndustry}
            onSelectChange={(v) => {
              setIndustrySelect(v);
              if (v !== CUSTOM_INDUSTRY_VALUE) {
                setCustomIndustry("");
                if (v) void loadLeadsForIndustry(v);
              }
            }}
            onCustomChange={setCustomIndustry}
            knownNiches={knownNicheNames}
          />

          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">Country</span>
            <select
              className="saas-input mt-1"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {TIER_ONE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLocationScope("local")}
              className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${
                locationScope === "local"
                  ? "bg-brand-50 text-brand-700"
                  : "bg-[#faf8fc] text-ink-muted"
              }`}
            >
              Local area
            </button>
            <button
              type="button"
              onClick={() => setLocationScope("country")}
              className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${
                locationScope === "country"
                  ? "bg-brand-50 text-brand-700"
                  : "bg-[#faf8fc] text-ink-muted"
              }`}
            >
              Entire country
            </button>
          </div>

          {locationScope === "local" && (
            <>
              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">
                  {countryMeta?.regionLabel ?? "State"}
                </span>
                {getRegionsForCountry(country).length > 0 ? (
                  <select
                    className="saas-input mt-1"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">{getRegionAnyLabel(country)}</option>
                    {getRegionsForCountry(country).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="saas-input mt-1"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                )}
              </label>
              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">City</span>
                <input
                  className="saas-input mt-1"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">
                  {countryMeta?.postalLabel ?? "ZIP"}
                </span>
                <input
                  className="saas-input mt-1"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </label>
              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">
                  Radius ({countryMeta?.distanceUnit ?? "mi"})
                </span>
                <input
                  type="number"
                  min={0}
                  className="saas-input mt-1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value) || 0)}
                />
                <p className="mt-1 text-[11px] text-ink-faint">
                  Use 0 for exact area only.
                </p>
              </label>
            </>
          )}

          <label className="block text-[12px]">
            <span className="font-medium text-ink-muted">How many leads</span>
            <select
              className="saas-input mt-1"
              value={
                targetLeadCount === -1 ? "custom" : String(targetLeadCount)
              }
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setTargetLeadCount(-1);
                  if (!customLeadCount) setCustomLeadCount("50");
                } else {
                  setTargetLeadCount(Number(e.target.value));
                }
              }}
            >
              {[10, 25, 50, 100, 250, 500, 1000].map((n) => (
                <option key={n} value={n}>
                  {n} leads
                </option>
              ))}
              <option value="custom">Custom number…</option>
            </select>
          </label>

          {targetLeadCount === -1 && (
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">
                Custom lead count
              </span>
              <input
                type="number"
                min={1}
                max={1000}
                className="saas-input mt-1"
                value={customLeadCount}
                onChange={(e) => setCustomLeadCount(e.target.value)}
                placeholder="e.g. 75"
              />
              <p className="mt-1 text-[11px] text-ink-faint">
                Between 1 and 1000. Requesting {resolvedLeadCount} leads.
              </p>
            </label>
          )}

          <Button onClick={runScrape} loading={loading}>
            {loading ? "Scraping…" : `Run scrape (${resolvedLeadCount})`}
          </Button>

          {loading && (
            <div className="space-y-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-50">
                <div className="shimmer-bar h-full w-2/3 rounded-full" />
              </div>
              <p className="text-[12px] text-ink-muted">
                Running Places → enrich → score. This can take up to a couple
                minutes…
              </p>
            </div>
          )}

          {result && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              {result}
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">
                  Scraped niches
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  Custom services like “Agency owners” appear here so you can
                  find and reopen them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadNiches()}
                className="text-[12px] font-semibold text-brand-600 hover:underline"
              >
                Refresh
              </button>
            </div>

            <input
              className="saas-input mt-3"
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              placeholder="Filter niches… e.g. agency"
            />

            {filteredCustomNiches.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-muted">
                {customNiches.length === 0
                  ? "No custom niches yet. Run a scrape with “Custom service…” to create one."
                  : "No niches match that filter."}
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {filteredCustomNiches.map((n) => {
                  const active =
                    activeIndustry.toLowerCase() === n.name.toLowerCase();
                  return (
                    <button
                      key={n.name}
                      type="button"
                      onClick={() => selectNiche(n.name)}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                        active
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-border bg-[#faf8fc] text-ink hover:border-brand-300"
                      }`}
                    >
                      {n.name}
                      <span className="ml-1.5 tabular-nums text-ink-faint">
                        {n.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">
                  Scraped leads
                  {leadsIndustry ? (
                    <span className="font-normal text-ink-muted">
                      {" "}
                      · {leadsIndustry}
                    </span>
                  ) : null}
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  {loadingLeads
                    ? "Loading…"
                    : leadsIndustry
                      ? `Showing ${leads.length} of ${leadsTotal} in pool`
                      : "Pick a niche or run a scrape to see leads here"}
                </p>
              </div>
              {leadsIndustry && (
                <Link
                  href={`/admin/leads?industry=${encodeURIComponent(leadsIndustry)}`}
                  className="text-[12px] font-semibold text-brand-600 hover:underline"
                >
                  Open in All Leads →
                </Link>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-[#faf8fc] text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    <th className="px-4 py-2.5">Business</th>
                    <th className="px-4 py-2.5">Owner</th>
                    <th className="px-4 py-2.5">Location</th>
                    <th className="px-4 py-2.5">Contact</th>
                    <th className="px-4 py-2.5">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-ink-muted"
                      >
                        {loadingLeads
                          ? "Loading leads…"
                          : "No leads to show yet."}
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-border/70 hover:bg-[#faf8fc]/60"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="font-semibold text-ink hover:text-brand-600"
                          >
                            {lead.businessName}
                          </Link>
                          {lead.website && (
                            <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                              {lead.website.replace(/^https?:\/\//, "")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">
                          {lead.ownerName || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">
                          {[lead.city, lead.state, lead.country]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">
                          <div className="space-y-0.5">
                            {lead.phone && <p>{lead.phone}</p>}
                            {lead.email && (
                              <p className="truncate text-[12px]">
                                {lead.email}
                              </p>
                            )}
                            {!lead.phone && !lead.email && "—"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="tabular-nums font-semibold text-ink">
                            {lead.leadScore}
                          </span>
                          {lead.qualityTier && (
                            <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-faint">
                              {lead.qualityTier}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
