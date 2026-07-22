"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/jsvectormap.min.css";
import "jsvectormap/dist/maps/world.js";
import { HiOutlineMapPin } from "react-icons/hi2";

export type GeoLead = {
  id: string;
  businessName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  qualityTier: string | null;
  googleMapsLink: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  industry?: string | null;
  leadScore?: number | null;
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  USA: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  UK: "United Kingdom",
  AU: "Australia",
  MX: "Mexico",
  FR: "France",
  ES: "Spain",
  BE: "Belgium",
  DE: "Germany",
  IN: "India",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  PH: "Philippines",
  SG: "Singapore",
  NZ: "New Zealand",
};

function countryLabel(code?: string | null) {
  if (!code) return "Unknown";
  const key = code.trim().toUpperCase();
  return COUNTRY_NAMES[key] ?? code;
}

function tierColor(tier?: string | null) {
  if (tier === "hot") return "#ec4899";
  if (tier === "warm") return "#a855f7";
  return "#d946ef";
}

export function LeadGeoMapInner({
  leads,
  compact = false,
  title = "Traffic Analytics",
  subtitle = "Lead locations worldwide",
}: {
  leads: GeoLead[];
  compact?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<jsVectorMap | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const countryRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const key = (lead.country || "US").toUpperCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const total = leads.length || 1;
    return [...counts.entries()]
      .map(([code, count]) => ({
        code,
        name: countryLabel(code),
        count,
        pct: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [leads]);

  // Deduplicate stacked pins that share the exact same coords (common in
  // dense metros) so tooltips/clicks still map 1:1 to a lead.
  const plotLeads = useMemo(() => {
    const seen = new Map<string, number>();
    return leads.map((lead) => {
      const key = `${lead.latitude.toFixed(5)},${lead.longitude.toFixed(5)}`;
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      if (n === 0) return lead;
      // Nudge duplicates by ~40–120m so each pin is clickable
      const jitter = 0.00035 * n;
      return {
        ...lead,
        latitude: lead.latitude + jitter,
        longitude: lead.longitude + jitter * 0.8,
      };
    });
  }, [leads]);

  const activeLead = useMemo(
    () => leads.find((l) => l.id === activeLeadId) ?? null,
    [leads, activeLeadId]
  );

  useEffect(() => {
    if (!mapEl.current) return;

    mapRef.current?.destroy();
    mapRef.current = null;
    mapEl.current.innerHTML = "";

    const markers = plotLeads.map((lead) => ({
      name: lead.businessName,
      coords: [lead.latitude, lead.longitude] as [number, number],
      style: {
        initial: {
          fill: tierColor(lead.qualityTier),
          stroke: tierColor(lead.qualityTier),
          strokeWidth: 5,
          strokeOpacity: 0.28,
          fillOpacity: 1,
          r: 4,
        },
        hover: {
          fill: "#ffffff",
          stroke: tierColor(lead.qualityTier),
          strokeWidth: 7,
          strokeOpacity: 0.4,
          r: 5,
        },
      },
    }));

    const map = new jsVectorMap({
      selector: mapEl.current,
      map: "world",
      backgroundColor: "transparent",
      draggable: true,
      zoomButtons: true,
      zoomOnScroll: true,
      zoomMax: 12,
      zoomMin: 1,
      zoomStep: 1.4,
      showTooltip: true,
      regionStyle: {
        initial: {
          fill: "#2d3748",
          fillOpacity: 1,
          stroke: "#1a2332",
          strokeWidth: 0.4,
          strokeOpacity: 1,
        },
        hover: {
          fill: "#3d4d63",
          fillOpacity: 1,
          cursor: "pointer",
        },
        selected: {
          fill: "#a855f7",
          fillOpacity: 0.35,
        },
      },
      markerStyle: {
        initial: {
          fill: "#a855f7",
          stroke: "#a855f7",
          strokeWidth: 5,
          strokeOpacity: 0.28,
          fillOpacity: 1,
          r: 4,
        },
        hover: {
          fill: "#ffffff",
          stroke: "#a855f7",
          strokeWidth: 7,
          strokeOpacity: 0.45,
          r: 5,
        },
      },
      markers,
      onMarkerTooltipShow(
        _event: Event,
        tooltip: { text: (value: string) => void },
        index: string | number
      ) {
        const lead = plotLeads[Number(index)];
        if (!lead) return;
        tooltip.text(
          `${lead.businessName} · ${countryLabel(lead.country)}`
        );
      },
      onMarkerClick(_event: Event, index: string | number) {
        const lead = plotLeads[Number(index)];
        if (!lead) return;
        setActiveLeadId(lead.id);
        setActiveCountry((lead.country || "US").toUpperCase());
      },
      onRegionClick(_event: Event, code: string) {
        setActiveCountry(code.toUpperCase());
        setActiveLeadId(null);
      },
    });

    mapRef.current = map;

    const onResize = () => map.updateSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.destroy();
      mapRef.current = null;
    };
  }, [plotLeads]);

  return (
    <div className="space-y-5">
      <div className="hud-panel overflow-hidden !p-0">
        <span className="hud-bracket hud-bracket-tl" aria-hidden />
        <span className="hud-bracket hud-bracket-tr" aria-hidden />
        <span className="hud-bracket hud-bracket-bl" aria-hidden />
        <span className="hud-bracket hud-bracket-br" aria-hidden />

        <div className="relative z-[1] border-b border-brand-500/10 px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b9aab]">
            {title}
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-white">{subtitle}</h2>
        </div>

        <div
          className={`relative z-[1] w-full bg-[#0a101a] ${
            compact
              ? "h-[300px] sm:h-[340px]"
              : "h-[380px] sm:h-[460px] lg:h-[520px]"
          }`}
        >
          <div ref={mapEl} className="lead-vector-map h-full w-full" />

          {!leads.length && (
            <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-[#0a101a]/70 px-6 text-center">
              <HiOutlineMapPin className="h-8 w-8 text-brand-500" />
              <p className="text-sm font-medium text-white">No mapped leads yet</p>
              <p className="max-w-sm text-[13px] text-[#8b9aab]">
                Generate leads in Lead Finder — Places coordinates show as cyan
                dots on this map.
              </p>
            </div>
          )}
        </div>

        <div className="relative z-[1] grid gap-0 border-t border-brand-500/10 lg:grid-cols-[1fr_220px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-brand-500/10 text-[10px] uppercase tracking-[0.16em] text-[#5c6b7c]">
                  <th className="px-5 py-3 font-semibold">Country</th>
                  <th className="px-3 py-3 font-semibold">Leads</th>
                  <th className="px-5 py-3 font-semibold">Pct%</th>
                </tr>
              </thead>
              <tbody>
                {countryRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-6 text-[#5c6b7c]"
                    >
                      No country data yet
                    </td>
                  </tr>
                ) : (
                  countryRows.map((row) => {
                    const active = activeCountry === row.code;
                    return (
                      <tr
                        key={row.code}
                        onClick={() => {
                          setActiveCountry(row.code);
                          setActiveLeadId(null);
                        }}
                        className={`cursor-pointer border-b border-white/[0.04] transition ${
                          active
                            ? "bg-brand-500/10 text-brand-500"
                            : "text-[#c5d0dc] hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="px-5 py-2.5 font-semibold uppercase tracking-wide">
                          {row.name}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">{row.count}</td>
                        <td className="px-5 py-2.5 tabular-nums">{row.pct}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 border-t border-brand-500/10 px-5 py-6 lg:border-l lg:border-t-0">
            <div
              className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#a855f7 ${Math.min(
                  (leads.length ? countryRows[0]?.pct ?? 0 : 0) * 3.6,
                  360
                )}deg, rgba(168,85,247,0.12) 0)`,
              }}
            >
              <div className="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full bg-[#0b1220]">
                <span className="text-lg font-bold tabular-nums text-white">
                  {leads.length}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#5c6b7c]">
                  pins
                </span>
              </div>
            </div>
            <p className="text-center text-[11px] text-[#8b9aab]">
              {countryRows[0]
                ? `${countryRows[0].name} leads ${countryRows[0].pct}%`
                : "Awaiting mapped leads"}
            </p>
          </div>
        </div>
      </div>

      {activeLead && (
        <div className="hud-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5c6b7c]">
                Selected pin
              </p>
              <Link
                href={`/leads/${activeLead.id}`}
                className="mt-1 block text-base font-semibold text-white hover:text-brand-500"
              >
                {activeLead.businessName}
              </Link>
              <p className="mt-1 text-xs text-[#8b9aab]">
                {activeLead.address ||
                  [activeLead.city, activeLead.state, activeLead.country]
                    .filter(Boolean)
                    .join(", ")}
              </p>
            </div>
            <span
              className="rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                color: tierColor(activeLead.qualityTier),
                borderColor: `${tierColor(activeLead.qualityTier)}55`,
              }}
            >
              {activeLead.qualityTier ?? "nurture"}
            </span>
          </div>
        </div>
      )}

      {!compact && leads.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leads
            .filter((l) =>
              activeCountry
                ? (l.country || "US").toUpperCase() === activeCountry
                : true
            )
            .slice(0, 24)
            .map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => {
                  setActiveLeadId(lead.id);
                  setActiveCountry((lead.country || "US").toUpperCase());
                }}
                className={`hud-panel w-full text-left transition hover:brightness-110 ${
                  activeLeadId === lead.id ? "ring-1 ring-brand-500/40" : ""
                }`}
              >
                <p className="font-semibold text-white">{lead.businessName}</p>
                <p className="mt-1 text-xs text-[#8b9aab]">
                  {lead.city || lead.state
                    ? [lead.city, lead.state].filter(Boolean).join(", ")
                    : lead.address || countryLabel(lead.country)}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-brand-400">
                  {lead.qualityTier ?? "nurture"}
                </p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
