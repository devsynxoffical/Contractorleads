"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiStar,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Badge } from "@/components/ui/badge";
import {
  getTierOneCountry,
  getRegionAnyLabel,
  getRegionsForCountry,
  INDUSTRIES,
  TIER_ONE_COUNTRIES,
} from "@/lib/constants";
import {
  CUSTOM_INDUSTRY_VALUE,
  formatSearchLabel,
  isPresetIndustry,
  parseLeadQuery,
  resolveSearchCriteria,
} from "@/lib/search-criteria";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
import { notifyCreditsChanged } from "@/lib/client/credits-sync";
import { LocationAutocomplete } from "@/components/leads/location-autocomplete";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  businessName: string;
  address: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  leadScore: number;
  qualityTier: string | null;
  city: string | null;
  state: string | null;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const QUICK_PROMPTS = [
  "Roofing in Austin TX",
  "HVAC contractors in Miami FL",
  "Window tinting in Brooklyn NY",
  "Plumbing in Phoenix AZ",
];

export function QuickLeadSearch({ embedded = true }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [input, setInput] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>(INDUSTRIES[0]);
  const [industryMode, setIndustryMode] = useState<"preset" | "custom">("preset");
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("US");
  const [locationScope, setLocationScope] =
    useState<"local" | "country">("local");
  const [locationMode, setLocationMode] = useState<"standard" | "custom">("standard");
  const [customLocation, setCustomLocation] = useState("");
  const [state, setState] = useState("TX");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Tell me what leads you need — e.g. “Window tinting in Brooklyn NY” — or use the filters below.",
    },
  ]);

  async function runSearch(raw: {
    industry?: string;
    customIndustry?: string;
    country?: string;
    locationScope?: "local" | "country";
    state?: string;
    city?: string;
    customLocation?: string;
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
      customLocation:
        raw.customLocation ??
        (locationScope === "local" && locationMode === "custom"
          ? customLocation
          : undefined),
      radius: locationScope === "local" ? 25 : undefined,
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
      if (typeof data.creditsRemaining === "number") {
        notifyCreditsChanged(data.creditsRemaining);
      } else if (typeof data.capacity?.balance === "number") {
        notifyCreditsChanged(data.capacity.balance);
      }
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: found.length
            ? `Found ${found.length} verified leads for ${formatSearchLabel(params)}.`
            : `No leads found for ${formatSearchLabel(params)}. Try another service or area.`,
        },
      ]);
    } finally {
      setLoading(false);
      stopNavigationProgress();
    }
  }

  function applyParsed(parsed: NonNullable<ReturnType<typeof parseLeadQuery>>) {
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
          text: 'I need a service and location — try “Window tinting in Brooklyn NY” or use the filters.',
        },
      ]);
      return;
    }

    applyParsed(parsed);
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
      { id: crypto.randomUUID(), role: "user", text: label },
    ]);
    await runSearch({});
  }

  const fieldClass = cn(
    "h-10 w-full rounded-xl border px-3 font-[family-name:var(--font-jakarta)] text-[13px] outline-none transition",
    embedded
      ? "border-brand-500/20 bg-[var(--panel-solid)] text-ink placeholder:text-ink-faint focus:border-brand-500/50"
      : "border-border bg-white text-ink placeholder:text-ink-faint focus:border-brand-400",
  );

  const panel = (
    <div
      className={cn(
        "font-[family-name:var(--font-jakarta)] text-ink",
        embedded
          ? "overflow-hidden"
          : "relative flex h-[min(640px,92dvh)] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-white shadow-2xl sm:rounded-2xl",
      )}
    >
      {!embedded && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlineChatBubbleLeftEllipsis className="h-5 w-5" />
            </span>
            <div>
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-ink">
                Search Leads
              </p>
              <p className="text-[11px] text-ink-faint">
                Chat or filters — preset or custom service & area
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-brand-50 hover:text-ink"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "space-y-3 overflow-y-auto",
          embedded ? "max-h-[300px] px-0.5 py-1" : "flex-1 px-4 py-4 sm:px-5",
        )}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-3.5 py-2.5 font-[family-name:var(--font-jakarta)] text-[13px] leading-relaxed",
                msg.role === "user"
                  ? "rounded-br-md text-white"
                  : embedded
                    ? "rounded-bl-md border border-brand-500/15 bg-brand-500/[0.06] text-ink"
                    : "rounded-bl-md bg-[#faf8fb] text-ink",
              )}
              style={
                msg.role === "user" ? { background: LOGO_GRADIENT } : undefined
              }
            >
              {msg.text}
            </div>
          </div>
        ))}

        {!messages.some((m) => m.role === "user") && (
          <div className="flex flex-wrap gap-2">
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
                    applyParsed(parsed);
                    void runSearch(parsed);
                  }
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-[family-name:var(--font-jakarta)] text-[12px] font-medium transition",
                  embedded
                    ? "border-brand-500/20 bg-[var(--panel-solid)] text-ink-muted hover:border-brand-500/40 hover:text-brand-600"
                    : "border-border bg-white text-ink-muted hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="flex items-center gap-2 font-[family-name:var(--font-jakarta)] text-[13px] text-ink-muted">
            <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
            Searching verified leads…
          </p>
        )}

        {leads.length > 0 && (
          <div className="space-y-2 pt-1">
            {leads.slice(0, embedded ? 5 : 8).map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}?from=search`}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border px-3 py-3 transition",
                  embedded
                    ? "border-brand-500/15 bg-[var(--panel-solid)] hover:border-brand-500/35"
                    : "border-border bg-white hover:border-brand-200 hover:bg-brand-50/40",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-[family-name:var(--font-display)] text-[14px] font-semibold tracking-tight text-ink">
                    {lead.businessName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
                    <HiOutlineMapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {lead.city || lead.state || lead.address || "—"}
                    </span>
                  </p>
                  {lead.googleRating != null && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-muted">
                      <HiStar className="h-3 w-3 text-amber-400" />
                      {lead.googleRating} ({lead.reviewCount ?? 0})
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    variant={
                      lead.qualityTier === "hot"
                        ? "hot"
                        : lead.qualityTier === "warm"
                          ? "warm"
                          : "nurture"
                    }
                  >
                    {lead.qualityTier ?? "nurture"}
                  </Badge>
                  <p className="mt-1 text-[11px] font-semibold tabular-nums text-brand-600">
                    Score {lead.leadScore}
                  </p>
                </div>
              </Link>
            ))}
            {leads.length > (embedded ? 5 : 8) && (
              <Link
                href="/leads/search"
                className="block text-center text-[12px] font-semibold text-brand-600 hover:underline"
              >
                View all in Lead Finder →
              </Link>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "border-t",
          embedded
            ? "mt-3 border-brand-500/15 pt-3"
            : "border-border bg-[#faf8fb] px-4 py-3 sm:px-5",
        )}
      >
        <form onSubmit={handleFilterSearch} className="mb-3 space-y-2.5">
          <div className="grid gap-2 sm:grid-cols-3">
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
              className={fieldClass}
              aria-label="Service"
            >
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
                placeholder="Custom service"
                required
                className={fieldClass}
              />
            )}
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setState("");
                setCity("");
                setCustomLocation("");
              }}
              className={fieldClass}
              aria-label="Country"
            >
              {TIER_ONE_COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={locationScope}
              onChange={(e) =>
                setLocationScope(e.target.value as "local" | "country")
              }
              className={fieldClass}
              aria-label="Search scope"
            >
              <option value="local">Specific area</option>
              <option value="country">Entire country</option>
            </select>
          </div>

          {locationScope === "local" && (
            <div
              className={cn(
                "inline-flex rounded-xl border p-0.5",
                embedded
                  ? "border-brand-500/20 bg-[var(--panel-solid)]"
                  : "border-border bg-white",
              )}
              role="group"
              aria-label="Location type"
            >
              <button
                type="button"
                onClick={() => setLocationMode("standard")}
                className={cn(
                  "rounded-[10px] px-3 py-1.5 font-[family-name:var(--font-jakarta)] text-[12px] font-semibold transition",
                  locationMode === "standard"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                Region + city
              </button>
              <button
                type="button"
                onClick={() => setLocationMode("custom")}
                className={cn(
                  "rounded-[10px] px-3 py-1.5 font-[family-name:var(--font-jakarta)] text-[12px] font-semibold transition",
                  locationMode === "custom"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                Custom area
              </button>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            {locationScope === "country" ? (
              <p
                className={cn(
                  "flex min-h-10 items-center rounded-xl border px-3 text-[12px] text-ink-muted",
                  embedded
                    ? "border-brand-500/20 bg-brand-500/[0.06]"
                    : "border-brand-100 bg-brand-50/60",
                )}
              >
                Searching across {getTierOneCountry(country).name}
              </p>
            ) : locationMode === "standard" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {getRegionsForCountry(country).length > 0 ? (
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={fieldClass}
                    aria-label="Region"
                  >
                    <option value="">{getRegionAnyLabel(country)}</option>
                    {getRegionsForCountry(country).map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder={getTierOneCountry(country).regionLabel}
                    className={fieldClass}
                  />
                )}
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (optional)"
                  className={fieldClass}
                />
              </div>
            ) : (
              <LocationAutocomplete
                value={customLocation}
                onChange={(v) => setCustomLocation(v)}
                country={country}
                placeholder={`City, county, or region in ${getTierOneCountry(country).name}`}
                inputClassName={cn(
                  fieldClass,
                  "!pl-9",
                  embedded && "!bg-[var(--panel-solid)]",
                )}
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 min-w-[7.5rem] items-center justify-center gap-1.5 rounded-xl font-[family-name:var(--font-jakarta)] text-[13px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlineMagnifyingGlass className="h-3.5 w-3.5" />
              Search
            </button>
          </div>
        </form>

        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Try "Roofing in Austin TX"'
              disabled={loading}
              className={cn(fieldClass, "pl-9 pr-3")}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:opacity-95 disabled:opacity-50"
            style={{ background: LOGO_GRADIENT }}
            aria-label="Send"
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
          </button>
        </form>
        {error && (
          <p className="mt-2 text-[12px] text-red-600">{error}</p>
        )}
      </div>
    </div>
  );

  if (embedded) return panel;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 flex h-12 items-center gap-2 rounded-full px-4 text-sm font-medium text-white shadow-lg transition hover:opacity-95 sm:px-5"
        style={{
          background: LOGO_GRADIENT,
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          right: "max(1rem, calc(env(safe-area-inset-right) + 8.5rem))",
        }}
        aria-label="Search leads"
      >
        <HiOutlineMagnifyingGlass className="h-4 w-4" />
        <span className="hidden sm:inline">Search Leads</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-end sm:justify-end sm:p-4 md:p-6">
          <div
            className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          {panel}
        </div>
      )}
    </>
  );
}
