"use client";

import dynamic from "next/dynamic";
import type { GeoLead } from "@/components/leads/lead-geo-map-inner";

export type { GeoLead };

const LeadGeoMapInner = dynamic(
  () =>
    import("@/components/leads/lead-geo-map-inner").then(
      (m) => m.LeadGeoMapInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="hud-panel flex h-[420px] items-center justify-center sm:h-[520px]">
        <p className="text-[13px] text-[#8b9aab]">Loading global map…</p>
      </div>
    ),
  }
);

export function LeadGeoMap({
  leads,
  compact,
  title,
  subtitle,
  leadDetailBase,
}: {
  leads: GeoLead[];
  compact?: boolean;
  title?: string;
  subtitle?: string;
  leadDetailBase?: string;
}) {
  return (
    <LeadGeoMapInner
      leads={leads}
      compact={compact}
      title={title}
      subtitle={subtitle}
      leadDetailBase={leadDetailBase}
    />
  );
}
