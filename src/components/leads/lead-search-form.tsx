"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  HiOutlineArrowPath,
  HiOutlineBolt,
  HiOutlineBookmark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineCheckBadge,
  HiOutlineCpuChip,
  HiOutlineFire,
  HiOutlineSparkles,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTierOneCountry,
  getRegionAnyLabel,
  getRegionsForCountry,
  INDUSTRIES,
  TIER_ONE_COUNTRIES,
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
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
import { notifyCreditsChanged } from "@/lib/client/credits-sync";
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
import { ExportLeadsButtons } from "@/components/leads/export-leads-buttons";
import { LocationAutocomplete } from "@/components/leads/location-autocomplete";
import {
  loadFinderSearchCache,
  saveFinderSearchCache,
  type SearchSessionLead,
} from "@/lib/client/search-session";

type Lead = SearchSessionLead & { phone: string | null; industry: string | null };

function hasLinkedInAndSocial(lead: Lead): boolean {
  const linkedin = Boolean(
    lead.linkedinUrl || lead.linkedinCompanyUrl || lead.linkedinOwnerUrl,
  );
  const social = Boolean(
    lead.facebook || lead.instagram || lead.youtube || lead.tiktok,
  );
  return linkedin && social;
}

/** LinkedIn + social leads first, then the rest — each group by score. */
function byLeadScoreDesc(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const aRank = hasLinkedInAndSocial(a) ? 0 : 1;
    const bRank = hasLinkedInAndSocial(b) ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return b.leadScore - a.leadScore;
  });
}

const SEARCH_STAGES = [
  { pct: 12, label: "Searching Google Places…" },
  { pct: 38, label: "Enriching contacts & social profiles…" },
  { pct: 62, label: "AI scoring & verification…" },
  { pct: 88, label: "Finalizing your lead list…" },
] as const;

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
  const [selectedState, setSelectedState] = useState("");
  const [city, setCity] = useState("");
  const [targetLeadCount, setTargetLeadCount] = useState(50);
  const [leadCapacity, setLeadCapacity] = useState<number | null>(null);
  const [filterNote, setFilterNote] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [liveStatus, setLiveStatus] = useState<{
    current: number;
    target: number;
    placeName: string;
  } | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [showSaveSegmentModal, setShowSaveSegmentModal] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [segmentWhen, setSegmentWhen] = useState("today");
  const [savingSegment, setSavingSegment] = useState(false);
  const [segmentSuccessMsg, setSegmentSuccessMsg] = useState<string | null>(null);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading) {
      setProgressPct(0);
      return;
    }
    const stageIdx = Math.min(Math.max(stage, 1), SEARCH_STAGES.length) - 1;
    const target = SEARCH_STAGES[stageIdx]?.pct ?? 12;
    setProgressPct((p) => Math.max(p, target));

    const id = window.setInterval(() => {
      setProgressPct((p) => {
        const cap = stage >= 4 ? 96 : Math.min(target + 10, 94);
        if (p >= cap) return p;
        return Math.min(cap, p + 1);
      });
    }, 450);
    return () => window.clearInterval(id);
  }, [loading, stage]);

  useEffect(() => {
    let cancelled = false;
    async function loadCapacity() {
      try {
        const res = await fetch("/api/leads/search");
        const data = await res.json();
        if (!cancelled && res.ok && typeof data.capacity?.available === "number") {
          setLeadCapacity(data.capacity.available);
          setTargetLeadCount((n) =>
            data.capacity.available > 0
              ? Math.min(n, data.capacity.available)
              : n,
          );
        }
      } catch {
        /* ignore */
      }
    }
    void loadCapacity();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const qIndustry = searchParams.get("industry");
    const qState = searchParams.get("state")?.trim().toUpperCase() ?? "";
    if (qIndustry && isPresetIndustry(qIndustry)) {
      setSelectedIndustry(qIndustry);
      setIndustryMode("preset");
      setPreset((p) => ({
        industry: qIndustry,
        customIndustry: "",
        industryMode: "preset",
        country: p?.country ?? "US",
        locationScope: qState ? "local" : (p?.locationScope ?? "local"),
        locationMode: p?.locationMode ?? "standard",
        customLocation: p?.customLocation ?? "",
        state: qState || p?.state,
        city: p?.city ?? "",
        radius: p?.radius ?? "25",
      }));
      if (qState) {
        setSelectedState(qState);
        setLocationScope("local");
        setSelectedCountry("US");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const deepLinkIndustry = searchParams.get("industry");
    // Deep-link from Industries should start a fresh search form, not restore cache
    const skipRestore = Boolean(deepLinkIndustry && isPresetIndustry(deepLinkIndustry));

    async function restoreSession() {
      if (skipRestore) {
        if (!cancelled) setRestoring(false);
        return;
      }

      const cached = loadFinderSearchCache();
      if (cached?.leads.length) {
        if (cancelled) return;
        setLeads(byLeadScoreDesc(cached.leads as Lead[]));
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
        setSelectedState(cached.state ?? "");
        setCity(cached.city ?? "");
        setFormKey((k) => k + 1);
        setStage(4);
        setRestoring(false);
        return;
      }

      try {
        const res = await fetch("/api/leads/search/latest");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const found = byLeadScoreDesc((data.leads ?? []) as Lead[]);
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
        setSelectedState(s.state ?? "");
        setCity(customLoc ? "" : (s.city ?? ""));
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
  }, [searchParams]);

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
    targetLeadCount?: number;
  }) {
    const resolved = resolveSearchCriteria(payload);
    if (!resolved.ok) {
      setError(resolved.error);
      return;
    }

    const criteria = resolved.criteria;
    setLoading(true);
    startNavigationProgress();
    setError("");
    setFilterNote(null);
    setLeads([]);
    setStage(1);
    setProgressPct(8);

    const timers = [
      setTimeout(() => setStage(2), 1800),
      setTimeout(() => setStage(3), 4500),
      setTimeout(() => setStage(4), 9000),
    ];

    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
        },
        body: JSON.stringify({ ...criteria, stream: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Search failed");
        if (typeof data.available === "number") {
          setLeadCapacity(data.available);
        }
        setLoading(false);
        setStage(0);
        setProgressPct(0);
        setLiveStatus(null);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (!part.trim()) continue;
            const eventMatch = part.match(/^event:\s*(\w+)/m);
            const dataMatch = part.match(/^data:\s*(.+)$/m);
            if (!dataMatch) continue;

            const eventType = eventMatch ? eventMatch[1] : "message";
            let payload: any;
            try {
              payload = JSON.parse(dataMatch[1]);
            } catch {
              continue;
            }

            if (eventType === "start") {
              setStage(2);
            } else if (eventType === "lead") {
              const newLead = payload.lead as Lead;
              setStage(3);
              setLiveStatus({
                current: payload.current,
                target: payload.target,
                placeName: payload.placeName,
              });
              setLeads((prev) => {
                const existingIdx = prev.findIndex((l) => l.id === newLead.id);
                if (existingIdx >= 0) {
                  const copy = [...prev];
                  copy[existingIdx] = newLead;
                  return copy;
                }
                return [newLead, ...prev];
              });
              setSelected((prev) => new Set([...prev, newLead.id]));
              if (payload.target > 0) {
                const pct = Math.min(
                  96,
                  Math.round((payload.current / payload.target) * 90) + 10,
                );
                setProgressPct(pct);
              }
            } else if (eventType === "done") {
              setProgressPct(100);
              setLiveStatus(null);
              const ranked = byLeadScoreDesc(payload.leads as Lead[]);
              setLeads(ranked);
              setSelected(new Set(ranked.map((l) => l.id)));
              if (typeof payload.capacity?.available === "number") {
                setLeadCapacity(payload.capacity.available);
              }
              if (typeof payload.creditsRemaining === "number") {
                notifyCreditsChanged(payload.creditsRemaining);
              } else if (typeof payload.capacity?.balance === "number") {
                notifyCreditsChanged(payload.capacity.balance);
              }
              setStage(4);
              const billed = payload.meta?.billing?.searchCharged;
              const returned = payload.meta?.leadsReturned ?? ranked.length;
              const billedCount = payload.meta?.leadsBilled ?? returned;
              const requested = payload.meta?.requestedLeadCount;
              if (typeof billed === "number" && billed > 0) {
                const shortfall =
                  typeof requested === "number" && requested > billedCount
                    ? ` Requested ${requested}, billed ${billedCount}.`
                    : "";
                setFilterNote(
                  `Charged ${billed} credits for ${billedCount} lead${billedCount === 1 ? "" : "s"} (${payload.meta.billing.costPerLead} each).${shortfall}`,
                );
              } else if (payload.meta?.cappedByLeadLimit) {
                setFilterNote(
                  `Requested ${payload.meta.requestedLeadCount} leads — capped to ${payload.meta.targetLeadCount} by your remaining lead limit. Export existing leads or buy credits to raise the cap.`,
                );
              }
              saveFinderSearchCache({
                searchId: payload.search?.id,
                leads: ranked,
                industry: criteria.industry,
                country: criteria.country,
                locationScope: criteria.locationScope,
                state: criteria.state,
                city: criteria.city ?? "",
                customLocation: criteria.customLocation ?? "",
                zip: criteria.zip ?? "",
                radius: criteria.radius ? String(criteria.radius) : undefined,
                selectedLeadIds: ranked.map((l) => l.id),
              });
            } else if (eventType === "error") {
              setError(payload.error || "Search failed");
            }
          }
        }
      } else {
        const data = await res.json();
        setProgressPct(100);
        const ranked = byLeadScoreDesc(data.leads as Lead[]);
        setLeads(ranked);
        setSelected(new Set(ranked.map((l) => l.id)));
        if (typeof data.capacity?.available === "number") {
          setLeadCapacity(data.capacity.available);
        }
        if (typeof data.creditsRemaining === "number") {
          notifyCreditsChanged(data.creditsRemaining);
        } else if (typeof data.capacity?.balance === "number") {
          notifyCreditsChanged(data.capacity.balance);
        }
        setStage(4);
        const billed = data.meta?.billing?.searchCharged;
        const returned = data.meta?.leadsReturned ?? ranked.length;
        const billedCount = data.meta?.leadsBilled ?? returned;
        const requested = data.meta?.requestedLeadCount;
        if (typeof billed === "number" && billed > 0) {
          const shortfall =
            typeof requested === "number" && requested > billedCount
              ? ` Requested ${requested}, billed ${billedCount}.`
              : "";
          setFilterNote(
            `Charged ${billed} credits for ${billedCount} lead${billedCount === 1 ? "" : "s"} (${data.meta.billing.costPerLead} each).${shortfall}`,
          );
        } else if (data.meta?.cappedByLeadLimit) {
          setFilterNote(
            `Requested ${data.meta.requestedLeadCount} leads — capped to ${data.meta.targetLeadCount} by your remaining lead limit. Export existing leads or buy credits to raise the cap.`,
          );
        }
        saveFinderSearchCache({
          searchId: data.search?.id,
          leads: ranked,
          industry: criteria.industry,
          country: criteria.country,
          locationScope: criteria.locationScope,
          state: criteria.state,
          city: criteria.city ?? "",
          customLocation: criteria.customLocation ?? "",
          zip: criteria.zip ?? "",
          radius: criteria.radius ? String(criteria.radius) : undefined,
          selectedLeadIds: ranked.map((l) => l.id),
        });
      }
    } finally {
      timers.forEach(clearTimeout);
      setLoading(false);
      setLiveStatus(null);
      setStage(0);
      stopNavigationProgress();
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
      targetLeadCount,
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
    setSelectedState(q.state ?? "");
    setCity(q.city ?? "");
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
          backHref="/dashboard"
          backLabel="Back to dashboard"
          crumbs={[
            { label: "Home", href: "/home" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Lead Finder" },
          ]}
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
          <StatChip
            label="Industries"
            value="12"
            hint="Roofing → General Contractors"
          />
          <StatChip label="Per lead" value="1 credit" hint="Only leads returned" />
          <StatChip label="Re-export" value="Free" hint="Already billed leads" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="animate-slide-left border-border shadow-[var(--shadow-card)]">
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
                    setSelectedState("");
                    setCity("");
                    setFormKey((k) => k + 1);
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
                    {getRegionsForCountry(selectedCountry).length > 0 ? (
                      <Select
                        name="state"
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setCity("");
                        }}
                      >
                        <option value="">{getRegionAnyLabel(selectedCountry)}</option>
                        {getRegionsForCountry(selectedCountry).map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        name="state"
                        placeholder={getTierOneCountry(selectedCountry).regionLabel}
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      name="city"
                      placeholder={
                        selectedCountry === "CA"
                          ? "Winnipeg"
                          : selectedCountry === "GB"
                            ? "Manchester"
                            : selectedCountry === "AU"
                              ? "Melbourne"
                              : selectedCountry === "NZ"
                                ? "Auckland"
                                : "Austin"
                      }
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
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
                  <LocationAutocomplete
                    value={customLocation}
                    onChange={(v) => setCustomLocation(v)}
                    country={selectedCountry}
                    placeholder={`City, address, or region in ${getTierOneCountry(selectedCountry).name}`}
                  />
                  <p className="text-[12px] text-ink-muted">
                    Type to see matching places below — pick one for the best results.
                  </p>
                </div>
              )}
              {locationScope === "local" && (
              <div className="space-y-2">
                <Label>
                  Radius ({getTierOneCountry(selectedCountry).distanceUnit})
                </Label>
                <Select name="radius" defaultValue={preset?.radius ?? "25"}>
                  {[0, 10, 15, 25, 50, 75, 100].map((r) => (
                    <option key={r} value={r}>
                      {r === 0
                        ? `0 ${getTierOneCountry(selectedCountry).distanceUnit} (exact area)`
                        : `${r} ${getTierOneCountry(selectedCountry).distanceUnit}`}
                    </option>
                  ))}
                </Select>
              </div>
              )}

              <div className="space-y-2">
                <Label>How many leads</Label>
                <Select
                  value={String(
                    leadCapacity != null && leadCapacity > 0
                      ? Math.min(targetLeadCount, leadCapacity)
                      : targetLeadCount,
                  )}
                  onChange={(e) => setTargetLeadCount(Number(e.target.value))}
                  disabled={leadCapacity === 0}
                >
                  {leadCapacity === 0 ? (
                    <option value={targetLeadCount}>0 leads available</option>
                  ) : (
                    [25, 50, 100, 250, 500, 1000]
                      .filter((n) => leadCapacity == null || n <= leadCapacity)
                      .concat(
                        leadCapacity != null &&
                          leadCapacity > 0 &&
                          ![25, 50, 100, 250, 500, 1000].includes(leadCapacity)
                          ? [leadCapacity]
                          : [],
                      )
                      .sort((a, b) => a - b)
                      .map((n) => (
                        <option key={n} value={n}>
                          {n} leads
                          {n >= 250 ? " (volume — faster rules scoring)" : ""}
                        </option>
                      ))
                  )}
                </Select>
                <p className="text-[11px] text-ink-muted">
                  {leadCapacity == null
                    ? "Limited by your remaining credits (1 credit per lead returned)."
                    : leadCapacity <= 0
                      ? "Lead limit reached — export existing leads or purchase credits on Billing."
                      : `You can generate up to ${leadCapacity} more lead${leadCapacity === 1 ? "" : "s"}. You are only charged for leads actually returned.`}
                </p>
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  disabled={leadCapacity === 0}
                >
                  {loading ? (
                    "Verifying pipeline…"
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
              <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            {filterNote && !error && (
              <div className="mt-4 rounded-lg border border-brand-500/25 bg-brand-500/08 px-3 py-2 text-sm text-ink">
                {filterNote}
              </div>
            )}
            {loading && (
              <div className="mt-5 space-y-3 rounded-2xl border border-brand-500/20 bg-brand-500/05 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                    </span>
                    <p className="text-[13px] font-semibold text-ink">
                      {liveStatus
                        ? `Live Scraping: ${leads.length} of ${liveStatus.target} leads found`
                        : SEARCH_STAGES[
                            Math.min(Math.max(stage, 1), SEARCH_STAGES.length) - 1
                          ]?.label}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold tabular-nums text-brand-700">
                    {Math.min(100, Math.round(progressPct))}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface)] ring-1 ring-brand-500/20">
                  <div
                    className="h-full rounded-full transition-[width] duration-300 ease-out"
                    style={{
                      width: `${Math.min(100, progressPct)}%`,
                      background:
                        "linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)",
                    }}
                  />
                </div>
                {liveStatus?.placeName ? (
                  <p className="truncate text-[12px] text-ink-muted">
                    <span className="font-medium text-brand-600">Latest discovered:</span>{" "}
                    {liveStatus.placeName}
                  </p>
                ) : (
                  <p className="text-[12px] text-ink-muted">
                    Discovering places and verifying owners, emails, phones, and social directories...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="animate-slide-right space-y-4">
          <Card className="border border-brand-500/15 bg-[var(--panel-solid)] shadow-[var(--shadow-card)]">
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
                className="hover-lift rounded-xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
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
        <div className="mt-8 rounded-2xl border border-border/80 bg-[var(--surface)] p-6 text-center text-[13px] text-ink-muted">
          <HiOutlineArrowPath className="mx-auto mb-2 h-5 w-5 animate-spin text-brand-500" />
          Restoring your last search results…
        </div>
      )}

      {leads.length > 0 && (
        <div className="mt-8 animate-fade-up">
          {segmentSuccessMsg && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-900 shadow-sm dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <HiOutlineCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold">{segmentSuccessMsg}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Link
                  href="/email/compose"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white transition hover:bg-emerald-700"
                >
                  Reach out in Compose →
                </Link>
                <Link
                  href="/leads"
                  className="rounded-lg border border-emerald-600/30 bg-[var(--surface)] px-3 py-1.5 text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
                >
                  View in All Leads
                </Link>
              </div>
            </div>
          )}

          <LeadResultsHeader
            count={leads.length}
            hotCount={hotCount}
            avgScore={avgScore}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rawIndustry = (industryMode === "preset" ? selectedIndustry : customIndustry).trim();
                    const ind = rawIndustry || "Leads";
                    const loc =
                      locationScope === "country"
                        ? (getTierOneCountry(selectedCountry)?.name ?? selectedCountry)
                        : locationMode === "custom" && customLocation
                        ? customLocation
                        : city
                        ? `${city}${selectedState ? `, ${selectedState}` : ""}`
                        : selectedState || (getTierOneCountry(selectedCountry)?.name ?? selectedCountry);

                    setSegmentName(`${ind} · ${loc}`);
                    setSegmentWhen("today");
                    setSegmentError(null);
                    setShowSaveSegmentModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50/80 px-3.5 py-2 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-100 hover:border-brand-400 dark:border-brand-500/30 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50"
                  title="Save current search criteria as a segment"
                >
                  <HiOutlineBookmark className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  Save as Segment
                </button>
                <ExportLeadsButtons
                  size="sm"
                  leadIds={
                    selected.size > 0
                      ? Array.from(selected)
                      : leads.map((l) => l.id)
                  }
                />
              </div>
            }
          />
          <LeadResultsList
            leads={leads}
            openInNewTab={true}
            profileHrefFor={(lead) => `/leads/${lead.id}?from=search`}
          />
        </div>
      )}

      {showSaveSegmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-2xl animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-label="Save segment"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <HiOutlineBookmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">Save as Segment</h3>
                  <p className="text-[12px] text-ink-muted">
                    Save this search to target in email outreach and filter leads.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveSegmentModal(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {/* Summary pill */}
              <div className="rounded-xl border border-border/70 bg-[var(--input-bg)] p-3 text-xs text-ink-muted">
                <div className="font-semibold text-ink mb-1.5">Search Criteria:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-[var(--surface)] border border-border px-2 py-0.5 font-medium text-ink">
                    Industry: {(industryMode === "preset" ? selectedIndustry : customIndustry) || "Any"}
                  </span>
                  <span className="rounded-md bg-[var(--surface)] border border-border px-2 py-0.5 font-medium text-ink">
                    {locationScope === "country"
                      ? (getTierOneCountry(selectedCountry)?.name ?? selectedCountry)
                      : city
                      ? `${city}, ${selectedState || selectedCountry}`
                      : selectedState || selectedCountry}
                  </span>
                  <span className="rounded-md bg-[var(--surface)] border border-border px-2 py-0.5 font-medium text-brand-600 dark:text-brand-400">
                    {leads.length} leads generated
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  Segment Name
                </label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !savingSegment && segmentName.trim()) {
                      void (async () => {
                        setSavingSegment(true);
                        setSegmentError(null);
                        try {
                          const rawIndustry = (industryMode === "preset" ? selectedIndustry : customIndustry).trim();
                          const res = await fetch("/api/segments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: segmentName.trim(),
                              industry: rawIndustry || null,
                              when: segmentWhen || "today",
                              tier: null,
                              strength: null,
                              q: null,
                              sort: "newest",
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            setSegmentError(data.error || "Failed to save segment");
                            return;
                          }
                          setShowSaveSegmentModal(false);
                          setSegmentSuccessMsg(`Segment "${segmentName.trim()}" saved!`);
                          setTimeout(() => setSegmentSuccessMsg(null), 7000);
                        } catch {
                          setSegmentError("Failed to save segment. Please try again.");
                        } finally {
                          setSavingSegment(false);
                        }
                      })();
                    }
                  }}
                  placeholder="e.g. Plumbing · California"
                  maxLength={60}
                  className="saas-input w-full"
                  disabled={savingSegment}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  Timeframe Filter
                </label>
                <select
                  value={segmentWhen}
                  onChange={(e) => setSegmentWhen(e.target.value)}
                  className="saas-input w-full"
                  disabled={savingSegment}
                >
                  <option value="today">Today (leads generated today)</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time (all matching industry leads)</option>
                </select>
              </div>

              {segmentError && (
                <p className="text-xs font-medium text-rose-600">{segmentError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setShowSaveSegmentModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-[13px] font-semibold text-ink transition hover:bg-[var(--input-bg)]"
                disabled={savingSegment}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!segmentName.trim()) {
                    setSegmentError("Please enter a name for the segment.");
                    return;
                  }
                  setSavingSegment(true);
                  setSegmentError(null);
                  try {
                    const rawIndustry = (industryMode === "preset" ? selectedIndustry : customIndustry).trim();
                    const res = await fetch("/api/segments", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: segmentName.trim(),
                        industry: rawIndustry || null,
                        when: segmentWhen || "today",
                        tier: null,
                        strength: null,
                        q: null,
                        sort: "newest",
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setSegmentError(data.error || "Failed to save segment");
                      return;
                    }
                    setShowSaveSegmentModal(false);
                    setSegmentSuccessMsg(`Segment "${segmentName.trim()}" saved!`);
                    setTimeout(() => setSegmentSuccessMsg(null), 7000);
                  } catch {
                    setSegmentError("Failed to save segment. Please try again.");
                  } finally {
                    setSavingSegment(false);
                  }
                }}
                disabled={savingSegment || !segmentName.trim()}
                className="rounded-xl bg-[#1a1224] px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                {savingSegment ? "Saving…" : "Save Segment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
