"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineBolt,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckBadge,
  HiOutlineCpuChip,
  HiOutlineFire,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTierOneCountry,
  INDUSTRIES,
  TIER_ONE_COUNTRIES,
  US_STATES,
} from "@/lib/constants";
import {
  CUSTOM_INDUSTRY_VALUE,
  isPresetIndustry,
  resolveSearchCriteria,
} from "@/lib/search-criteria";
import {
  PageHeader,
  SecondaryActionLink,
  LOGO_GRADIENT,
} from "@/components/layout/page-header";
import {
  PromptCard,
  SectionHeading,
  SectionLabel,
  StatChip,
} from "@/components/ui/section";
import {
  LeadResultsHeader,
  LeadResultsList,
} from "@/components/leads/lead-result-card";
import {
  loadFinderSearchCache,
  saveFinderSearchCache,
  type SearchSessionLead,
} from "@/lib/client/search-session";

type Lead = SearchSessionLead & { phone: string | null; industry: string | null };

const PIPELINE_STEPS = [
  {
    title: "Google Places",
    detail: "Canonical name, phone, address, Maps rating",
  },
  {
    title: "Yelp verify",
    detail: "Active listing + review cross-check",
  },
  {
    title: "AI score",
    detail: "Hot / Warm / Nurture qualification",
  },
  {
    title: "Social enrich",
    detail: "LinkedIn, Houzz, Nextdoor when available",
  },
];

const QUICK_SEARCHES = [
  {
    title: "Roofing · Texas",
    description: "High-intent roofers in TX metros",
    industry: "Roofing",
    state: "TX",
    city: "Austin",
    radius: "25",
  },
  {
    title: "HVAC · Florida",
    description: "AC & heating contractors statewide",
    industry: "HVAC",
    state: "FL",
    city: "Miami",
    radius: "25",
  },
  {
    title: "Plumbing · California",
    description: "Licensed plumbers near major cities",
    industry: "Plumbing",
    state: "CA",
    city: "Los Angeles",
    radius: "25",
  },
  {
    title: "Solar · Arizona",
    description: "Installers in the Southwest corridor",
    industry: "Solar",
    state: "AZ",
    city: "Phoenix",
    radius: "50",
  },
];

export function LeadSearchForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formKey, setFormKey] = useState(0);
  const [preset, setPreset] = useState<{
    industry: string;
    customIndustry?: string;
    industryMode: "preset" | "custom";
    country: string;
    locationScope: "local" | "country";
    locationMode: "standard" | "custom";
    customLocation?: string;
    state?: string;
    city: string;
    radius?: string;
  } | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [industryMode, setIndustryMode] = useState<"preset" | "custom">("preset");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [locationScope, setLocationScope] =
    useState<"local" | "country">("local");
  const [locationMode, setLocationMode] = useState<"standard" | "custom">("standard");
  const [customIndustry, setCustomIndustry] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [stage, setStage] = useState(0);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const cached = loadFinderSearchCache();
      if (cached?.leads.length) {
        if (cancelled) return;
        setLeads(cached.leads as Lead[]);
        setSelected(new Set(cached.selectedLeadIds));
        setPreset({
          industry: cached.industry,
          customIndustry: isPresetIndustry(cached.industry) ? "" : cached.industry,
          industryMode: isPresetIndustry(cached.industry) ? "preset" : "custom",
          country: cached.country ?? "US",
          locationScope: cached.locationScope ?? "local",
          locationMode: cached.customLocation ? "custom" : "standard",
          customLocation: cached.customLocation ?? "",
          state: cached.state,
          city: cached.city,
          radius: cached.radius,
        });
        setIndustryMode(isPresetIndustry(cached.industry) ? "preset" : "custom");
        setSelectedCountry(cached.country ?? "US");
        setLocationScope(cached.locationScope ?? "local");
        setSelectedIndustry(
          isPresetIndustry(cached.industry) ? cached.industry : ""
        );
        setLocationMode(cached.customLocation ? "custom" : "standard");
        setCustomIndustry(isPresetIndustry(cached.industry) ? "" : cached.industry);
        setCustomLocation(cached.customLocation ?? "");
        setFormKey((k) => k + 1);
        setStage(4);
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
        const industry = s.industry ?? "";
        const customLoc =
          s.locationScope !== "country" &&
          s.city &&
          !s.state &&
          !s.zip
            ? s.city
            : "";
        setLeads(found);
        setSelected(new Set(found.map((l) => l.id)));
        setPreset({
          industry: isPresetIndustry(industry) ? industry : CUSTOM_INDUSTRY_VALUE,
          customIndustry: isPresetIndustry(industry) ? "" : industry,
          industryMode: isPresetIndustry(industry) ? "preset" : "custom",
          country: s.country ?? "US",
          locationScope: s.locationScope ?? "local",
          locationMode: customLoc ? "custom" : "standard",
          customLocation: customLoc,
          state: s.state ?? "",
          city: customLoc ? "" : (s.city ?? ""),
          radius: String(s.radius ?? 25),
        });
        setIndustryMode(isPresetIndustry(industry) ? "preset" : "custom");
        setSelectedCountry(s.country ?? "US");
        setLocationScope(s.locationScope ?? "local");
        setSelectedIndustry(isPresetIndustry(industry) ? industry : "");
        setLocationMode(customLoc ? "custom" : "standard");
        setCustomIndustry(isPresetIndustry(industry) ? "" : industry);
        setCustomLocation(customLoc);
        setFormKey((k) => k + 1);
        setStage(4);
        saveFinderSearchCache({
          searchId: s.id,
          leads: found,
          industry,
          country: s.country ?? "US",
          locationScope: s.locationScope ?? "local",
          state: s.state ?? undefined,
          city: customLoc ? "" : (s.city ?? ""),
          customLocation: customLoc,
          zip: s.zip ?? "",
          radius: s.radius ? String(s.radius) : undefined,
          selectedLeadIds: found.map((l) => l.id),
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

  async function runSearch(payload: {
    industry: string;
    customIndustry?: string;
    country?: string;
    locationScope?: "local" | "country";
    state?: string;
    city?: string;
    zip?: string;
    customLocation?: string;
    radius?: string | number;
  }) {
    const resolved = resolveSearchCriteria(payload);
    if (!resolved.ok) {
      setError(resolved.error);
      return;
    }

    const criteria = resolved.criteria;
    setLoading(true);
    setError("");
    setLeads([]);
    setStage(1);

    const timers = [
      setTimeout(() => setStage(2), 700),
      setTimeout(() => setStage(3), 1400),
      setTimeout(() => setStage(4), 2100),
    ];

    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Search failed");
        setLoading(false);
        setStage(0);
        return;
      }

      setLeads(data.leads);
      setSelected(new Set(data.leads.map((l: Lead) => l.id)));
      setStage(4);
      saveFinderSearchCache({
        searchId: data.search?.id,
        leads: data.leads,
        industry: criteria.industry,
        country: criteria.country,
        locationScope: criteria.locationScope,
        state: criteria.state,
        city: criteria.city ?? "",
        customLocation: criteria.customLocation ?? "",
        zip: criteria.zip ?? "",
        radius: criteria.radius ? String(criteria.radius) : undefined,
        selectedLeadIds: data.leads.map((l: Lead) => l.id),
      });
    } finally {
      timers.forEach(clearTimeout);
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await runSearch({
      industry:
        industryMode === "custom" ? CUSTOM_INDUSTRY_VALUE : selectedIndustry,
      customIndustry: customIndustry,
      country: selectedCountry,
      locationScope,
      state:
        locationScope === "local" && locationMode === "standard"
          ? String(form.get("state") || "")
          : undefined,
      city:
        locationScope === "local" && locationMode === "standard"
          ? String(form.get("city") || "")
          : undefined,
      zip:
        locationScope === "local" && locationMode === "standard"
          ? String(form.get("zip") || "")
          : undefined,
      customLocation:
        locationScope === "local" && locationMode === "custom"
          ? customLocation
          : undefined,
      radius:
        locationScope === "local"
          ? String(form.get("radius") || "25")
          : undefined,
    });
  }

  function applyQuick(q: (typeof QUICK_SEARCHES)[number]) {
    setIndustryMode("preset");
    setSelectedCountry("US");
    setLocationScope("local");
    setLocationMode("standard");
    setCustomIndustry("");
    setCustomLocation("");
    setSelectedIndustry(q.industry);
    setPreset({
      industry: q.industry,
      industryMode: "preset",
      country: "US",
      locationScope: "local",
      locationMode: "standard",
      state: q.state,
      city: q.city,
      radius: q.radius,
    });
    setFormKey((k) => k + 1);
  }

  async function exportLeads(format: "csv" | "xlsx") {
    const res = await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: Array.from(selected), format }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadflow-export.${format === "xlsx" ? "xlsx" : "csv"}`;
    a.click();
  }

  const hotCount = leads.filter((l) => l.qualityTier === "hot").length;
  const avgScore =
    leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / leads.length)
      : 0;

  return (
    <div className="page-pad page-enter">
      <div className="mesh-bg -mx-4 -mt-4 mb-6 rounded-b-2xl px-4 pb-6 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:pt-6">
        <PageHeader
          title="Lead Finder"
          description="AI-verified home-service businesses across Tier 1 countries — choose a country, entire-country or local area, then score for outreach fit."
          actions={
            <>
              <SecondaryActionLink href="/ask-expert">
                <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                Ask AI
              </SecondaryActionLink>
              <SecondaryActionLink href="/leads/hot">
                <HiOutlineFire className="h-4 w-4" />
                Hot Leads
              </SecondaryActionLink>
            </>
          }
        />

        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatChip label="Coverage" value="Tier 1" hint="US · CA · UK · AU · NZ" />
          <StatChip label="Industries" value="12" hint="Roofing → GCs" />
          <StatChip label="Cost" value="1 credit" hint="Per search run" />
          <StatChip label="Pipeline" value="4 layers" hint="Places → AI score" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="animate-slide-left overflow-hidden border-border shadow-[var(--shadow-card)]">
          <div
            className="h-1.5 w-full"
            style={{ background: LOGO_GRADIENT }}
          />
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <SectionLabel>Search studio</SectionLabel>
              <CardTitle className="mt-1 text-base">Search criteria</CardTitle>
              <p className="mt-1 text-[13px] text-ink-muted">
                Pick a preset or enter a custom service and location.
              </p>
            </div>
            <span className="hidden rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600 sm:inline">
              Live · AI scored
            </span>
          </CardHeader>
          <CardContent>
            <form
              key={formKey}
              onSubmit={handleSearch}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>Service / industry</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
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
                  </Select>
                  {industryMode === "custom" && (
                    <Input
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="e.g. Window tinting, Dog grooming"
                      required
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setCustomLocation("");
                  }}
                >
                  {TIER_ONE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search scope</Label>
                <Select
                  value={locationScope}
                  onChange={(e) =>
                    setLocationScope(e.target.value as "local" | "country")
                  }
                >
                  <option value="local">Specific area</option>
                  <option value="country">Entire country</option>
                </Select>
              </div>
              {locationScope === "local" && (
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label>Area type</Label>
                <Select
                  value={locationMode}
                  onChange={(e) =>
                    setLocationMode(e.target.value as "standard" | "custom")
                  }
                >
                  <option value="standard">Region + city / postal code</option>
                  <option value="custom">Custom area…</option>
                </Select>
              </div>
              )}
              {locationScope === "country" ? (
                <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-ink-muted sm:col-span-2 lg:col-span-3">
                  Searching top matching businesses across{" "}
                  <strong className="text-ink">
                    {getTierOneCountry(selectedCountry).name}
                  </strong>
                  . Region, city, postal code, and radius are not required.
                </div>
              ) : locationMode === "standard" ? (
                <>
                  <div className="space-y-2">
                    <Label>
                      {getTierOneCountry(selectedCountry).regionLabel}
                    </Label>
                    {selectedCountry === "US" ? (
                      <Select name="state" defaultValue={preset?.state ?? ""}>
                        <option value="">Any state</option>
                        {US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        name="state"
                        placeholder={getTierOneCountry(selectedCountry).regionLabel}
                        defaultValue={preset?.state ?? ""}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      name="city"
                      placeholder="Austin"
                      defaultValue={preset?.city ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{getTierOneCountry(selectedCountry).postalLabel}</Label>
                    <Input
                      name="zip"
                      placeholder={selectedCountry === "US" ? "78701" : "Optional"}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label>Custom area</Label>
                  <Input
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder={`e.g. a city, metro, or region in ${getTierOneCountry(selectedCountry).name}`}
                    required
                  />
                  <p className="text-[12px] text-ink-muted">
                    Free-form place name — neighborhood, metro, or city + state.
                  </p>
                </div>
              )}
              {locationScope === "local" && (
              <div className="space-y-2">
                <Label>
                  Radius ({getTierOneCountry(selectedCountry).distanceUnit})
                </Label>
                <Select name="radius" defaultValue={preset?.radius ?? "25"}>
                  {[10, 15, 25, 50, 75, 100].map((r) => (
                    <option key={r} value={r}>
                      {r} {getTierOneCountry(selectedCountry).distanceUnit}
                    </option>
                  ))}
                </Select>
              </div>
              )}
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button
                  type="submit"
                  className="w-full text-white"
                  disabled={loading}
                  style={{ background: LOGO_GRADIENT }}
                >
                  {loading ? (
                    <>
                      <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                      Verifying pipeline…
                    </>
                  ) : (
                    <>
                      <HiOutlineSparkles className="h-4 w-4" />
                      Generate Leads
                    </>
                  )}
                </Button>
              </div>
            </form>
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {loading && (
              <div className="mt-5 space-y-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-brand-50">
                  <div className="shimmer-bar h-full w-2/3 rounded-full" />
                </div>
                <p className="text-[12px] text-ink-muted">
                  Running Places → Yelp → AI qualification…
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="animate-slide-right space-y-4">
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader>
              <SectionLabel>How it works</SectionLabel>
              <CardTitle className="mt-1">Verification pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => {
                const active = loading && stage >= i + 1;
                const done = !loading && leads.length > 0;
                return (
                  <div
                    key={step.title}
                    className={`flex gap-3 rounded-lg border px-3 py-2.5 transition ${
                      active || done
                        ? "border-brand-200 bg-brand-50/60"
                        : "border-border bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                        active || done
                          ? "bg-brand-600 text-white"
                          : "bg-stone-100 text-ink-muted"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{step.title}</p>
                      <p className="text-[12px] text-ink-muted">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border bg-gradient-to-br from-white to-brand-50/40 shadow-[var(--shadow-card)]">
            <CardContent className="flex gap-3 py-4">
              <HiOutlineCpuChip className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink">AI assist tip</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                  After results load, open a lead and use Outreach Studio — or ask
                  Expert for a cold email tailored to that business.
                </p>
                <Link
                  href="/ask-expert"
                  className="mt-2 inline-flex text-[12px] font-semibold text-brand-600 hover:underline"
                >
                  Open Ask Expert →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {leads.length === 0 && !loading && !restoring && (
        <div className="mt-8">
          <SectionHeading
            title="Quick-start searches"
            description="One-click presets that fill Industry, State, City, and Radius — then hit Generate."
          />
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_SEARCHES.map((q, i) => (
              <PromptCard
                key={q.title}
                icon={HiOutlineBolt}
                title={q.title}
                description={q.description}
                delayIndex={i}
                onClick={() => applyQuick(q)}
              />
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              {
                icon: HiOutlineCheckBadge,
                title: "Verified only",
                body: "We never invent phones or social URLs. Missing data shows Not Available.",
              },
              {
                icon: HiOutlineSparkles,
                title: "AI quality tiers",
                body: "Each lead is scored and tagged Hot, Warm, or Nurture for prioritization.",
              },
              {
                icon: HiOutlineFire,
                title: "Export ready",
                body: "CSV / Excel exports pull selected leads into your CRM or ads workflow.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="hover-lift rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <f.icon className="h-5 w-5 text-brand-600" />
                <p className="mt-3 text-sm font-semibold text-ink">{f.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {restoring && leads.length === 0 && (
        <div className="mt-8 rounded-2xl border border-border/80 bg-white/90 p-6 text-center text-[13px] text-ink-muted">
          <HiOutlineArrowPath className="mx-auto mb-2 h-5 w-5 animate-spin text-brand-500" />
          Restoring your last search results…
        </div>
      )}

      {leads.length > 0 && (
        <div className="mt-8 animate-fade-up">
          <LeadResultsHeader
            count={leads.length}
            hotCount={hotCount}
            avgScore={avgScore}
            actions={
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportLeads("csv")}
                >
                  <HiOutlineArrowDownTray className="h-4 w-4" /> CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportLeads("xlsx")}
                >
                  <HiOutlineArrowDownTray className="h-4 w-4" /> Excel
                </Button>
              </>
            }
          />
          <LeadResultsList leads={leads} />
        </div>
      )}
    </div>
  );
}
