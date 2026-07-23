"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/jsvectormap.min.css";
import "jsvectormap/dist/maps/world.js";
import { HiOutlineArrowsPointingOut, HiOutlineMapPin } from "react-icons/hi2";

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

type MapInstance = {
  destroy: () => void;
  updateSize: () => void;
  setFocus: (config: Record<string, unknown>) => void;
  setSelectedRegions: (regions: string | string[]) => void;
  clearSelectedRegions: () => void;
  clearSelectedMarkers: () => void;
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
  if (tier === "hot") return "#f472b6";
  if (tier === "warm") return "#c084fc";
  return "#38bdf8";
}

function leadHref(base: string, id: string) {
  const root = base.replace(/\/$/, "");
  return `${root}/${id}`;
}

export function LeadGeoMapInner({
  leads,
  compact = false,
  title = "Traffic Analytics",
  subtitle = "Lead locations worldwide",
  leadDetailBase = "/leads",
}: {
  leads: GeoLead[];
  compact?: boolean;
  title?: string;
  subtitle?: string;
  /** Path prefix for lead detail links, e.g. `/admin/leads` */
  leadDetailBase?: string;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const plotRef = useRef<GeoLead[]>([]);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [viewEpoch, setViewEpoch] = useState(0);

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

  // Deduplicate stacked pins that share the exact same coords.
  const plotLeads = useMemo(() => {
    const seen = new Map<string, number>();
    return leads
      .filter(
        (lead) =>
          Number.isFinite(lead.latitude) &&
          Number.isFinite(lead.longitude) &&
          Math.abs(lead.latitude) <= 90 &&
          Math.abs(lead.longitude) <= 180,
      )
      .map((lead) => {
        const key = `${lead.latitude.toFixed(5)},${lead.longitude.toFixed(5)}`;
        const n = seen.get(key) ?? 0;
        seen.set(key, n + 1);
        if (n === 0) return lead;
        const jitter = 0.00045 * n;
        return {
          ...lead,
          latitude: lead.latitude + jitter,
          longitude: lead.longitude + jitter * 0.75,
        };
      });
  }, [leads]);

  plotRef.current = plotLeads;

  const activeLead = useMemo(
    () => leads.find((l) => l.id === activeLeadId) ?? null,
    [leads, activeLeadId],
  );

  const plotSignature = useMemo(
    () =>
      plotLeads
        .map((l) => `${l.id}:${l.latitude.toFixed(4)}:${l.longitude.toFixed(4)}`)
        .join("|"),
    [plotLeads],
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
          stroke: "#0b1220",
          strokeWidth: 1.5,
          strokeOpacity: 0.9,
          fillOpacity: 0.95,
          r: 5,
        },
        hover: {
          fill: "#ffffff",
          stroke: tierColor(lead.qualityTier),
          strokeWidth: 2.5,
          strokeOpacity: 1,
          r: 7,
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
      // Gentle zoom — avoid huge jumps on click / wheel
      zoomMax: 5,
      zoomMin: 1,
      zoomStep: 1.12,
      zoomOnScrollSpeed: 1.15,
      zoomAnimate: true,
      showTooltip: true,
      regionStyle: {
        initial: {
          fill: "#243044",
          fillOpacity: 1,
          stroke: "#152033",
          strokeWidth: 0.45,
          strokeOpacity: 1,
        },
        hover: {
          fill: "#334761",
          fillOpacity: 1,
          cursor: "pointer",
        },
        selected: {
          fill: "#7c3aed",
          fillOpacity: 0.45,
        },
      },
      markerStyle: {
        initial: {
          fill: "#38bdf8",
          stroke: "#0b1220",
          strokeWidth: 1.5,
          fillOpacity: 0.95,
          r: 5,
        },
        hover: {
          fill: "#ffffff",
          stroke: "#38bdf8",
          strokeWidth: 2.5,
          r: 7,
        },
      },
      markers,
      onMarkerTooltipShow(
        _event: Event,
        tooltip: { text: (value: string) => void },
        index: string | number,
      ) {
        const lead = plotRef.current[Number(index)];
        if (!lead) return;
        const place = [lead.city, lead.state, countryLabel(lead.country)]
          .filter(Boolean)
          .join(", ");
        tooltip.text(
          `${lead.businessName}${place ? ` · ${place}` : ""}`,
        );
      },
      onMarkerClick(_event: Event, index: string | number) {
        const lead = plotRef.current[Number(index)];
        if (!lead) return;
        setActiveLeadId(lead.id);
        setActiveCountry((lead.country || "US").toUpperCase());
      },
      onRegionClick(_event: Event, code: string) {
        const next = code.toUpperCase();
        setActiveCountry(next);
        setActiveLeadId(null);
        try {
          (map as MapInstance).setSelectedRegions([next]);
        } catch {
          /* ignore */
        }
      },
    }) as MapInstance;

    mapRef.current = map;

    const syncSize = () => {
      try {
        map.updateSize();
      } catch {
        /* ignore */
      }
    };

    // Layout often settles after paint — sync a few times so pins land correctly
    syncSize();
    const t1 = window.setTimeout(syncSize, 50);
    const t2 = window.setTimeout(syncSize, 200);
    const t3 = window.setTimeout(syncSize, 500);
    const raf = requestAnimationFrame(() => {
      syncSize();
      requestAnimationFrame(syncSize);
    });

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => syncSize())
        : null;
    if (mapEl.current && ro) ro.observe(mapEl.current);

    window.addEventListener("resize", syncSize);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", syncSize);
      ro?.disconnect();
      map.destroy();
      mapRef.current = null;
    };
    // Recreate only when pin set changes (stable signature) or reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotSignature, viewEpoch]);

  // Soft focus when a lead is selected — never slam to max zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeLeadId) return;
    const lead =
      plotRef.current.find((l) => l.id === activeLeadId) ??
      leads.find((l) => l.id === activeLeadId);
    if (!lead) return;
    // Wait a tick so map layout is ready after recreate
    const t = window.setTimeout(() => {
      try {
        map.setFocus({
          coords: [lead.latitude, lead.longitude],
          scale: 2.35,
          animate: true,
        });
      } catch {
        /* ignore */
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [activeLeadId, leads, viewEpoch]);

  // Highlight country without auto-fitting (avoids insane zoom on small regions)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeCountry) return;
    try {
      map.setSelectedRegions([activeCountry]);
    } catch {
      /* ignore */
    }
  }, [activeCountry, viewEpoch]);

  function resetView() {
    setActiveCountry(null);
    setActiveLeadId(null);
    setViewEpoch((n) => n + 1);
  }

  const filteredCards = useMemo(() => {
    const list = activeCountry
      ? leads.filter(
          (l) => (l.country || "US").toUpperCase() === activeCountry,
        )
      : leads;
    return list.slice(0, 24);
  }, [leads, activeCountry]);

  return (
    <div className="space-y-5">
      <div className="hud-panel overflow-hidden !p-0">
        <span className="hud-bracket hud-bracket-tl" aria-hidden />
        <span className="hud-bracket hud-bracket-tr" aria-hidden />
        <span className="hud-bracket hud-bracket-bl" aria-hidden />
        <span className="hud-bracket hud-bracket-br" aria-hidden />

        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-ink">
              {title}
            </p>
            <h2 className="mt-0.5 text-[12px] text-ink-muted">
              {subtitle}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 text-[11px] font-medium text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f472b6]" /> Hot
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#c084fc]" /> Warm
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#38bdf8]" /> Nurture
              </span>
            </div>
            <button
              type="button"
              onClick={resetView}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/25 bg-[var(--input-bg)] px-2.5 py-1.5 text-[11px] font-semibold text-ink transition hover:border-brand-500/45 hover:text-brand-500"
            >
              <HiOutlineArrowsPointingOut className="h-3.5 w-3.5" />
              Reset view
            </button>
          </div>
        </div>

        <div
          className={`relative z-[1] w-full overflow-hidden bg-[var(--input-bg)] ${
            compact
              ? "h-[320px] sm:h-[380px]"
              : "h-[400px] sm:h-[480px] lg:h-[540px]"
          }`}
        >
          <div ref={mapEl} className="lead-vector-map h-full w-full" />

          {!plotLeads.length && (
            <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-[var(--panel-solid)]/80 px-6 text-center">
              <HiOutlineMapPin className="h-8 w-8 text-brand-500" />
              <p className="text-sm font-medium text-ink">
                No mapped leads yet
              </p>
              <p className="max-w-sm text-[13px] text-ink-muted">
                Leads with coordinates or a Google Maps link appear as pins
                here.
              </p>
            </div>
          )}
        </div>

        <div className="relative z-[1] grid gap-0 border-t border-brand-500/10 lg:grid-cols-[1fr_220px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  <th className="px-5 py-3">Country</th>
                  <th className="px-3 py-3">Leads</th>
                  <th className="px-5 py-3">Pct%</th>
                </tr>
              </thead>
              <tbody>
                {countryRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-ink-faint">
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
                        className={`cursor-pointer border-b border-border/70 transition ${
                          active
                            ? "bg-brand-50 text-brand-600"
                            : "text-ink hover:bg-[var(--input-bg)]"
                        }`}
                      >
                        <td className="px-5 py-2.5 font-semibold tracking-wide">
                          {row.name}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums font-medium">
                          {row.count}
                        </td>
                        <td className="px-5 py-2.5 tabular-nums font-medium">
                          {row.pct}%
                        </td>
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
                  360,
                )}deg, rgba(168,85,247,0.12) 0)`,
              }}
            >
              <div className="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full bg-[var(--panel-solid)]">
                <span className="text-lg font-bold tabular-nums text-ink">
                  {plotLeads.length}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-ink-faint">
                  pins
                </span>
              </div>
            </div>
            <p className="text-center text-[11px] text-ink-muted">
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Selected pin
              </p>
              <Link
                href={leadHref(leadDetailBase, activeLead.id)}
                className="mt-1 block text-base font-semibold text-ink hover:text-brand-500"
              >
                {activeLead.businessName}
              </Link>
              <p className="mt-1 text-xs text-ink-muted">
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
          {filteredCards.map((lead) => (
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
              <p className="font-semibold text-ink">{lead.businessName}</p>
              <p className="mt-1 text-xs text-ink-muted">
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
