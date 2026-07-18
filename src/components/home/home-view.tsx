"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
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
  parseLeadQuery,
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

type Lead = SearchSessionLead;

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const LOGO_GRADIENT =
  "linear-gradient(135deg, #e6007e 0%, #8e24aa 55%, #7b1fa2 100%)";

const QUICK_PROMPTS = [
  "Roofing in Austin TX",
  "HVAC in Miami FL",
  "Plumbing in Phoenix AZ",
  "Solar in Dallas TX",
  "Window tinting in Brooklyn NY",
  "Landscaping in Denver CO",
];

export function HomeView({ userName }: { userName?: string | null }) {
  const [input, setInput] = useState("");
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [restoring, setRestoring] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi${userName ? ` ${userName.split(" ")[0]}` : ""} — describe the leads you need, or set filters below and search.`,
    },
  ]);

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
        if (cached.messages?.length) setMessages(cached.messages);
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

        const label = formatSearchLabel({
          industry: industryVal,
          country: s?.country ?? "US",
          locationScope: s?.locationScope ?? "local",
          state: s?.state ?? "",
          city: customLoc ? undefined : s?.city,
          customLocation: customLoc || undefined,
        });
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: `Restored your last search — ${found.length} leads for ${label}.`,
          },
        ]);

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
    searchId?: string,
    nextMessages?: ChatMsg[]
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
      messages: nextMessages,
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
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: resolved.error },
      ]);
      return;
    }

    const params = resolved.criteria;
    setLoading(true);
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
        const msg = data.error || "Search failed";
        setError(msg);
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", text: msg },
        ]);
        return;
      }

      const found = (data.leads ?? []) as Lead[];
      setLeads(found);
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        text: found.length
          ? `Found ${found.length} verified leads for ${formatSearchLabel(params)}.`
          : `No leads found for ${formatSearchLabel(params)}. Try another city, service, or area.`,
      };
      setMessages((m) => {
        const next = [...m, assistantMsg];
        persistSearch(found, params, data.search?.id, next);
        return next;
      });
    } finally {
      setLoading(false);
      stopNavigationProgress();
    }
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: q },
    ]);
    setInput("");

    const parsed = parseLeadQuery(q);
    if (!parsed) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: 'I need a service and location — try “Window tinting in Brooklyn NY” or use the filters below.',
        },
      ]);
      return;
    }

    if (isPresetIndustry(parsed.industry)) {
      setSelectedIndustry(parsed.industry);
      setIndustryMode("preset");
    } else {
      setCustomIndustry(parsed.industry);
      setIndustryMode("custom");
    }
    if (parsed.customLocation) {
      setLocationMode("custom");
      setCustomLocation(parsed.customLocation);
    } else {
      setLocationMode("standard");
      setState(parsed.state ?? "");
      setCity(parsed.city ?? "");
    }
    setCountry(parsed.country);
    setLocationScope(parsed.locationScope);
    await runSearch(parsed);
  }

  async function handleFilterSearch(e: React.FormEvent) {
    e.preventDefault();
    const label = formatSearchLabel({
      industry:
        industryMode === "custom" ? customIndustry : selectedIndustry,
      country,
      locationScope,
      state,
      city,
      customLocation: locationMode === "custom" ? customLocation : undefined,
    });
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "user",
        text:
          locationScope === "country"
            ? label
            : `${label} · ${radius} ${getTierOneCountry(country).distanceUnit}`,
      },
    ]);
    await runSearch({});
  }

  return (
    <div className="page-pad page-enter">
      <div className="mx-auto w-full max-w-[900px]">
        {/* Chat */}
        <div className="animate-fade-up mx-auto flex h-[300px] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)]">
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed sm:text-[14px] ${
                      msg.role === "user"
                        ? "rounded-br-md text-white shadow-sm"
                        : "rounded-bl-md border border-border/60 bg-[#faf8fc] text-ink"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: LOGO_GRADIENT }
                        : undefined
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {!messages.some((m) => m.role === "user") && (
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setMessages((m) => [
                          ...m,
                          { id: crypto.randomUUID(), role: "user", text: p },
                        ]);
                        const parsed = parseLeadQuery(p);
                        if (parsed) {
                          if (isPresetIndustry(parsed.industry)) {
                            setSelectedIndustry(parsed.industry);
                            setIndustryMode("preset");
                          } else {
                            setCustomIndustry(parsed.industry);
                            setIndustryMode("custom");
                          }
                          if (parsed.customLocation) {
                            setLocationMode("custom");
                            setCustomLocation(parsed.customLocation);
                          } else {
                            setLocationMode("standard");
                            setState(parsed.state ?? "");
                            setCity(parsed.city ?? "");
                          }
                          setCountry(parsed.country);
                          setLocationScope(parsed.locationScope);
                          void runSearch(parsed);
                        }
                      }}
                      className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[12px] font-medium text-ink-muted shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <p className="flex items-center justify-center gap-2 text-[13px] text-ink-muted">
                  <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                  Running verification pipeline…
                </p>
              )}
            </div>

            <form
              onSubmit={handleChatSubmit}
              className="flex shrink-0 gap-2 border-t border-border/80 bg-gradient-to-b from-[#faf8fc] to-white px-4 py-2.5 sm:px-5"
            >
              <div className="relative flex-1">
                <HiOutlineSparkles className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Try “HVAC in Miami FL”'
                  disabled={loading}
                  className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-[14px] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:ring-4 focus:ring-[var(--ring)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_20px_rgba(123,31,162,0.3)] transition hover:opacity-95 disabled:opacity-45"
                style={{ background: LOGO_GRADIENT }}
                aria-label="Send"
              >
                <HiOutlinePaperAirplane className="h-4 w-4" />
              </button>
            </form>
        </div>

        {/* Filters */}
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
                  Preset or custom service · state or custom area
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
                <input
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder={`e.g. a city, metro, or region in ${getTierOneCountry(country).name}`}
                  required
                  className="saas-input"
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
                {[10, 15, 25, 50, 75, 100].map((r) => (
                  <option key={r} value={r}>
                    {r} {getTierOneCountry(country).distanceUnit}
                  </option>
                ))}
              </select>
            </div>
            )}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white shadow-[0_8px_22px_rgba(123,31,162,0.28)] transition hover:opacity-95 disabled:opacity-55"
                style={{ background: LOGO_GRADIENT }}
              >
                <HiOutlineMagnifyingGlass className="h-4 w-4" />
                Search leads
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
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
