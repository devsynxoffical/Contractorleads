"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import {
  AdminIndustryField,
  industryPayloadForApi,
  resolvedIndustryForQuery,
} from "@/components/admin/admin-industry-field";
import { INDUSTRIES, TIER_ONE_COUNTRIES, getTierOneCountry, getRegionAnyLabel, getRegionsForCountry } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

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
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countryMeta = getTierOneCountry(country);

  const resolvedLeadCount = (() => {
    if (targetLeadCount === -1) {
      const n = Number(customLeadCount);
      if (!Number.isFinite(n)) return 50;
      return Math.max(1, Math.min(1000, Math.floor(n)));
    }
    return targetLeadCount;
  })();

  async function runScrape() {
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
      setResult(
        `Created/reused ${data.leads?.length ?? 0} of ${resolvedLeadCount} requested leads for ${resolvedIndustryForQuery(industrySelect, customIndustry) || industrySelect}.`,
      );
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

      <div className="max-w-xl space-y-3 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
        <AdminIndustryField
          selectValue={industrySelect}
          customValue={customIndustry}
          onSelectChange={setIndustrySelect}
          onCustomChange={setCustomIndustry}
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
            value={targetLeadCount === -1 ? "custom" : String(targetLeadCount)}
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
            <span className="font-medium text-ink-muted">Custom lead count</span>
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
              Running Places → enrich → score. This can take up to a couple minutes…
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
    </div>
  );
}
