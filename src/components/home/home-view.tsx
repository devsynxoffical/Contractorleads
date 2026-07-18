"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
} from "react-icons/hi2";
import {
  getTierOneCountry,
  INDUSTRIES,
  TIER_ONE_COUNTRIES,
  US_STATES,
} from "@/lib/constants";
import {
  CUSTOM_INDUSTRY_VALUE,
  formatSearchLabel,
  isPresetIndustry,
  resolveSearchCriteria,
} from "@/lib/search-criteria";
import {
  LeadResultsHeader,
  LeadResultsList,
} from "@/components/leads/lead-result-card";
import {
  loadHomeSearchCache,
  saveHomeSearchCache,
  type SearchSessionLead,
} from "@/lib/client/search-session";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
import { LocationAutocomplete } from "@/components/leads/location-autocomplete";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { AiAssistantWorkspace } from "@/components/ai/ai-assistant-workspace";

type Lead = SearchSessionLead;

export function HomeView({ userName }: { userName?: string | null }) {
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [industryMode, setIndustryMode] = useState<"preset" | "custom">("preset");
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("US");
  const [locationScope, setLocationScope] =
    useState<"local" | "country">("local");
  const [locationMode, setLocationMode] = useState<"standard" | "custom">("standard");
  const [customLocation, setCustomLocation] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("25");
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const cached = loadHomeSearchCache();
      if (cached?.leads.length) {
        if (cancelled) return;
        setLeads(cached.leads);
        if (isPresetIndustry(cached.industry)) {
          setSelectedIndustry(cached.industry);
          setIndustryMode("preset");
        } else {
          setCustomIndustry(cached.industry);
          setIndustryMode("custom");
        }
        setCountry(cached.country ?? "US");
        setLocationScope(cached.locationScope ?? "local");
        if (cached.customLocation) {
          setLocationMode("custom");
          setCustomLocation(cached.customLocation);
        } else {
          setLocationMode("standard");
          setState(cached.state ?? "");
          setCity(cached.city);
        }
        setZip(cached.zip);
        setRadius(cached.radius ?? "25");
        setRestoring(false);
        return;
      }

      try {
        const res = await fetch("/api/leads/search/latest");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const found = (data.leads ?? []) as Lead[];
        if (!found.length || cancelled) return;

        const s = data.search;
        const industryVal = s?.industry ?? "";
        const customLoc =
          s?.locationScope !== "country" &&
          s?.city &&
          !s?.state &&
          !s?.zip
            ? s.city
            : "";
        setLeads(found);
        if (isPresetIndustry(industryVal)) {
          setSelectedIndustry(industryVal);
          setIndustryMode("preset");
        } else {
          setCustomIndustry(industryVal);
          setIndustryMode("custom");
        }
        setCountry(s?.country ?? "US");
        setLocationScope(s?.locationScope ?? "local");
        if (customLoc) {
          setLocationMode("custom");
          setCustomLocation(customLoc);
        } else {
          setLocationMode("standard");
          if (s?.state) setState(s.state);
          if (s?.city) setCity(s.city);
        }
        if (s?.zip) setZip(s.zip);
        if (s?.radius) setRadius(String(s.radius));

        saveHomeSearchCache({
          searchId: s.id,
          leads: found,
          industry: industryVal,
          country: s.country ?? "US",
          locationScope: s.locationScope ?? "local",
          state: s.state ?? undefined,
          city: customLoc ? "" : (s.city ?? ""),
          customLocation: customLoc,
          zip: s.zip ?? "",
          radius: s.radius ? String(s.radius) : undefined,
        });
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function persistSearch(
    found: Lead[],
    params: {
      industry: string;
      country: string;
      locationScope: "local" | "country";
      state?: string;
      city?: string;
      zip?: string;
      customLocation?: string;
      radius?: number | string;
    },
    searchId?: string
  ) {
    saveHomeSearchCache({
      searchId,
      leads: found,
      industry: params.industry,
      country: params.country,
      locationScope: params.locationScope,
      state: params.state,
      city: params.city ?? "",
      customLocation: params.customLocation ?? "",
      zip: params.zip ?? "",
      radius: params.radius ? String(params.radius) : undefined,
    });
  }

  async function runSearch(raw: {
    industry?: string;
    customIndustry?: string;
    country?: string;
    locationScope?: "local" | "country";
    state?: string;
    city?: string;
    zip?: string;
    customLocation?: string;
    radius?: number | string;
  }) {
    const resolved = resolveSearchCriteria({
      industry:
        raw.industry ??
        (industryMode === "custom" ? CUSTOM_INDUSTRY_VALUE : selectedIndustry),
      customIndustry: raw.customIndustry ?? customIndustry,
      country: raw.country ?? country,
      locationScope: raw.locationScope ?? locationScope,
      state:
        raw.state ??
        (locationScope === "local" && locationMode === "standard"
          ? state
          : undefined),
      city:
        raw.city ??
        (locationScope === "local" && locationMode === "standard"
          ? city
          : undefined),
      zip:
        raw.zip ??
        (locationScope === "local" && locationMode === "standard"
          ? zip
          : undefined),
      customLocation:
        raw.customLocation ??
        (locationScope === "local" && locationMode === "custom"
          ? customLocation
          : undefined),
      radius:
        raw.radius ?? (locationScope === "local" ? radius : undefined),
    });
    if (!resolved.ok) {
      setError(resolved.error);
      return;
    }

    const params = resolved.criteria;
    setSearchLoading(true);
    startNavigationProgress();
    setError("");
    setLeads([]);

    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed");
        return;
      }

      const found = (data.leads ?? []) as Lead[];
      setLeads(found);
      persistSearch(found, params, data.search?.id);
      if (!found.length) {
        setError(
          `No leads found for ${formatSearchLabel(params)}. Try another city, service, or area.`
        );
      }
    } finally {
      setSearchLoading(false);
      stopNavigationProgress();
    }
  }

  async function handleFilterSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch({});
  }

  return (
    <div className="page-pad page-enter">
      <div className="mx-auto w-full max-w-[1100px]">
        <AiAssistantWorkspace userName={userName} compact />

        {/* Filters — lead search only */}
        <div className="animate-fade-up saas-card mt-5 p-5 sm:p-6" style={{ animationDelay: "0.08s" }}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <HiOutlineMapPin className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-ink">
                  Filters & location
                </h2>
                <p className="text-[12px] text-ink-faint">
                  Lead search · 1.65 credits per run
                </p>
              </div>
            </div>
            <Link
              href="/leads/search"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
            >
              Advanced Lead Finder →
            </Link>
          </div>

          <form
            onSubmit={handleFilterSearch}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Service / industry
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={
                    industryMode === "custom"
                      ? CUSTOM_INDUSTRY_VALUE
                      : selectedIndustry
                  }
                  onChange={(e) => {
                    if (e.target.value === CUSTOM_INDUSTRY_VALUE) {
                      setIndustryMode("custom");
                      return;
                    }
                    setIndustryMode("preset");
                    setSelectedIndustry(e.target.value);
                  }}
                  required={industryMode === "preset"}
                  className="saas-input"
                >
                  <option value="" disabled>
                    Select industry
                  </option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                  <option value={CUSTOM_INDUSTRY_VALUE}>Custom service…</option>
                </select>
                {industryMode === "custom" && (
                  <input
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="e.g. Window tinting"
                    required
                    className="saas-input"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setState("");
                  setCity("");
                  setZip("");
                  setCustomLocation("");
                }}
                className="saas-input"
              >
                {TIER_ONE_COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Search scope
              </label>
              <select
                value={locationScope}
                onChange={(e) =>
                  setLocationScope(e.target.value as "local" | "country")
                }
                className="saas-input"
              >
                <option value="local">Specific area</option>
                <option value="country">Entire country</option>
              </select>
            </div>
            {locationScope === "local" && (
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Location mode
              </label>
              <select
                value={locationMode}
                onChange={(e) =>
                  setLocationMode(e.target.value as "standard" | "custom")
                }
                className="saas-input"
              >
                <option value="standard">Region + city / postal code</option>
                <option value="custom">Custom area…</option>
              </select>
            </div>
            )}
            {locationScope === "country" ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-[13px] text-ink-muted sm:col-span-2 lg:col-span-3">
                Search top matching businesses across{" "}
                <strong className="text-ink">
                  {getTierOneCountry(country).name}
                </strong>
                . No region, city, postal code, or radius needed.
              </div>
            ) : locationMode === "standard" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    {getTierOneCountry(country).regionLabel}
                  </label>
                  {country === "US" ? (
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="saas-input"
                    >
                      <option value="">Any state</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder={getTierOneCountry(country).regionLabel}
                      className="saas-input"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    City
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Austin"
                    className="saas-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    {getTierOneCountry(country).postalLabel}
                  </label>
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="78701"
                    className="saas-input"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  Custom area
                </label>
                <LocationAutocomplete
                  value={customLocation}
                  onChange={(v) => setCustomLocation(v)}
                  country={country}
                  placeholder={`Start typing a city or region in ${getTierOneCountry(country).name}`}
                />
              </div>
            )}
            {locationScope === "local" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Radius ({getTierOneCountry(country).distanceUnit})
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="saas-input"
              >
                {[0, 10, 15, 25, 50, 75, 100].map((r) => (
                  <option key={r} value={r}>
                    {r === 0
                      ? `0 ${getTierOneCountry(country).distanceUnit} (exact area)`
                      : `${r} ${getTierOneCountry(country).distanceUnit}`}
                  </option>
                ))}
              </select>
            </div>
            )}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searchLoading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white shadow-[0_8px_22px_rgba(168,85,247,0.28)] transition hover:opacity-95 disabled:opacity-55"
                style={{ background: LOGO_GRADIENT }}
              >
                {searchLoading ? (
                  <>
                    <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <HiOutlineMagnifyingGlass className="h-4 w-4" />
                    Search leads
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-200">
              {error}
            </p>
          )}
        </div>

        {restoring && leads.length === 0 && (
          <div className="mt-6 animate-fade-up rounded-2xl border border-border/80 bg-white/90 p-5 text-center text-[13px] text-ink-muted">
            <HiOutlineArrowPath className="mx-auto mb-2 h-5 w-5 animate-spin text-brand-500" />
            Restoring your last search results…
          </div>
        )}

        {leads.length > 0 && (
          <div className="mt-6 animate-fade-up">
            <LeadResultsHeader
              count={leads.length}
              hotCount={leads.filter((l) => l.qualityTier === "hot").length}
              avgScore={Math.round(
                leads.reduce((s, l) => s + l.leadScore, 0) / leads.length
              )}
              actions={
                <Link
                  href="/leads/hot"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:underline"
                >
                  <HiOutlineFire className="h-3.5 w-3.5" />
                  Hot leads
                </Link>
              }
            />
            <LeadResultsList leads={leads} />
            <p className="mt-4 text-center text-[12px] text-ink-faint">
              Want CSV/Excel export?{" "}
              <Link
                href="/leads/search"
                className="font-semibold text-brand-600 hover:underline"
              >
                Open Lead Finder
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
