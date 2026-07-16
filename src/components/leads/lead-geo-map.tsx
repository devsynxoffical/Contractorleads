"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HiOutlineMapPin } from "react-icons/hi2";

export type GeoLead = {
  id: string;
  businessName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  qualityTier: string | null;
  googleMapsLink: string | null;
};

function project(
  leads: GeoLead[]
): { id: string; x: number; y: number; lead: GeoLead }[] {
  if (!leads.length) return [];
  const lats = leads.map((l) => l.latitude);
  const lngs = leads.map((l) => l.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.02);
  const lngSpan = Math.max(maxLng - minLng, 0.02);
  const pad = 0.08;

  return leads.map((lead) => ({
    id: lead.id,
    lead,
    x: pad + ((lead.longitude - minLng) / lngSpan) * (1 - pad * 2),
    y: pad + (1 - (lead.latitude - minLat) / latSpan) * (1 - pad * 2),
  }));
}

export function LeadGeoMap({ leads }: { leads: GeoLead[] }) {
  const points = project(leads);
  const center = leads.length
    ? {
        lat: leads.reduce((s, l) => s + l.latitude, 0) / leads.length,
        lng: leads.reduce((s, l) => s + l.longitude, 0) / leads.length,
      }
    : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#faf8fb] via-[#f3eef6] to-[#ebe4f2] sm:h-80">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(142,36,170,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(142,36,170,0.08) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {points.map((p) => (
              <Link
                key={p.id}
                href={`/leads/${p.lead.id}`}
                title={p.lead.businessName}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition hover:scale-125"
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                  width: 14,
                  height: 14,
                  background:
                    p.lead.qualityTier === "hot"
                      ? "#e6007e"
                      : p.lead.qualityTier === "warm"
                        ? "#8e24aa"
                        : "#9b95a5",
                }}
              />
            ))}
            {!leads.length && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <HiOutlineMapPin className="h-8 w-8 text-brand-500" />
                <p className="text-sm font-medium text-ink">No mapped leads yet</p>
                <p className="max-w-sm text-[13px] text-ink-muted">
                  Generate leads in Lead Finder — Places coordinates appear here.
                </p>
              </div>
            )}
            {leads.length > 0 && (
              <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-medium text-ink-muted shadow-sm backdrop-blur">
                {leads.length} lead{leads.length === 1 ? "" : "s"} plotted · Hot pink ·
                Warm purple · Nurture gray
              </div>
            )}
          </div>
          {center && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-4 py-3">
              <p className="text-[12px] text-ink-muted">
                Cluster center {center.lat.toFixed(3)}, {center.lng.toFixed(3)}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-brand-600 hover:underline"
              >
                Open area in Google Maps →
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <Card
            key={lead.id}
            className="border-border shadow-[var(--shadow-card)] transition hover:border-brand-200"
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-semibold text-ink hover:text-brand-600"
                >
                  {lead.businessName}
                </Link>
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
              </div>
              <p className="mt-1 text-xs text-ink-muted">{lead.address}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                <span className="tabular-nums text-ink-faint">
                  {lead.latitude.toFixed(4)}, {lead.longitude.toFixed(4)}
                </span>
                <a
                  href={
                    lead.googleMapsLink ||
                    `https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Maps
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
