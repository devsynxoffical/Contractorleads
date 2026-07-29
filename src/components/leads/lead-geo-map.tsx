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
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-[var(--input-bg)] sm:h-[380px]">
        <p className="font-[family-name:var(--font-jakarta)] text-[13px] text-ink-muted">
          Loading map…
        </p>
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
  leadFrom,
}: {
  leads: GeoLead[];
  compact?: boolean;
  title?: string;
  subtitle?: string;
  leadDetailBase?: string;
  /** Query `from` stamped on lead detail links (default map). */
  leadFrom?: string;
}) {
  return (
    <LeadGeoMapInner
      leads={leads}
      compact={compact}
      title={title}
      subtitle={subtitle}
      leadDetailBase={leadDetailBase}
      leadFrom={leadFrom}
    />
  );
}
