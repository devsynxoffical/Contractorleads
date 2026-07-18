"use client";

import Link from "next/link";
import {
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineUser,
  HiStar,
} from "react-icons/hi2";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

export type LeadResult = {
  id: string;
  businessName: string;
  ownerName?: string | null;
  ownerTitle?: string | null;
  teamMembersJson?: string | null;
  peopleEnrichedAt?: string | Date | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  leadScore: number;
  qualityTier?: string | null;
  industry?: string | null;
  serviceCategory?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  outreachAngle?: string | null;
  revenueRangeEstimate?: string | null;
  websiteQualityScore?: number | null;
  marketingOpportunityScore?: number | null;
  yelpUrl?: string | null;
  yelpRating?: number | null;
  googleMapsLink?: string | null;
};

function tierVariant(tier?: string | null) {
  if (tier === "hot") return "hot" as const;
  if (tier === "warm") return "warm" as const;
  return "nurture" as const;
}

function ScoreRing({ score, id }: { score: number; id: string }) {
  const pct = Math.min(100, Math.max(0, score));
  const gradId = `scoreGrad-${id}`;
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 36 36"
      >
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="rgba(0,229,255,0.15)"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#0097a7" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-[13px] font-bold tabular-nums text-[#00e5ff]">
        {score}
      </span>
    </div>
  );
}

export function LeadResultCard({
  lead,
  index = 0,
}: {
  lead: LeadResult;
  index?: number;
}) {
  const location =
    [lead.city, lead.state, lead.zip].filter(Boolean).join(", ") ||
    lead.address ||
    "Location pending";

  const initial = lead.businessName.charAt(0).toUpperCase();
  const teamCount = (() => {
    if (!lead.teamMembersJson) return 0;
    try {
      const team = JSON.parse(lead.teamMembersJson);
      return Array.isArray(team) ? team.length : 0;
    } catch {
      return 0;
    }
  })();
  const hasPublicPeople = Boolean(lead.ownerName || teamCount);

  return (
    <article
      className="hover-lift animate-fade-up group overflow-hidden rounded-2xl border border-[#00e5ff]/15 bg-[rgba(12,22,38,0.92)] shadow-[var(--shadow-card)]"
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-[#041018] shadow-sm"
          style={{ background: LOGO_GRADIENT }}
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight text-white">
                  {lead.businessName}
                </h3>
                <Badge variant={tierVariant(lead.qualityTier)}>
                  {lead.qualityTier ?? "nurture"}
                </Badge>
                <Badge variant="verified">AI verified</Badge>
                {hasPublicPeople && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                    <HiOutlineUser className="h-3 w-3" />
                    {lead.ownerName
                      ? "Decision maker found"
                      : `${teamCount} team member${teamCount === 1 ? "" : "s"}`}
                  </span>
                )}
              </div>
              <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-ink-muted">
                <HiOutlineMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00e5ff]" />
                <span className="line-clamp-2">{lead.address || location}</span>
              </p>
            </div>
            <ScoreRing score={lead.leadScore} id={lead.id} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(lead.industry || lead.serviceCategory) && (
              <span className="rounded-lg bg-[#faf8fc] px-2.5 py-1 text-[11px] font-semibold text-ink-muted ring-1 ring-border">
                {lead.industry || lead.serviceCategory}
              </span>
            )}
            {lead.googleRating != null && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-100">
                <HiStar className="h-3.5 w-3.5 text-amber-400" />
                {lead.googleRating.toFixed(1)} · {lead.reviewCount ?? 0} reviews
              </span>
            )}
            {lead.yelpRating != null && (
              <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-100">
                Yelp {lead.yelpRating.toFixed(1)}
              </span>
            )}
            {lead.revenueRangeEstimate && (
              <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                Est. {lead.revenueRangeEstimate}
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-[#faf8fc] px-3 py-2 text-[12px] text-ink-muted">
              <HiOutlineUser className="h-3.5 w-3.5 shrink-0 text-brand-500" />
              <span className="truncate">
                {lead.ownerName
                  ? `${lead.ownerName}${lead.ownerTitle ? ` · ${lead.ownerTitle}` : ""}`
                  : teamCount
                    ? `${teamCount} public team member${teamCount === 1 ? "" : "s"}`
                    : lead.peopleEnrichedAt
                      ? "No public owner found"
                      : "Owner not checked"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#faf8fc] px-3 py-2 text-[12px] text-ink-muted">
              <HiOutlinePhone className="h-3.5 w-3.5 shrink-0 text-brand-500" />
              <span className="truncate">{lead.phone || "Phone N/A"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#faf8fc] px-3 py-2 text-[12px] text-ink-muted">
              <HiOutlineGlobeAlt className="h-3.5 w-3.5 shrink-0 text-brand-500" />
              <span className="truncate">
                {lead.website ? "Website found" : "No website"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#faf8fc] px-3 py-2 text-[12px] text-ink-muted">
              <HiOutlineEnvelope className="h-3.5 w-3.5 shrink-0 text-brand-500" />
              <span className="truncate">{lead.email || "Email N/A"}</span>
            </div>
          </div>

          {lead.outreachAngle && (
            <p className="mt-3 line-clamp-2 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/80 to-white px-3 py-2 text-[12px] leading-relaxed text-ink-muted">
              <span className="font-semibold text-brand-700">AI angle · </span>
              {lead.outreachAngle}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
            <Link
              href={`/leads/${lead.id}`}
              className="inline-flex h-9 items-center rounded-xl px-4 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-95"
              style={{ background: LOGO_GRADIENT }}
            >
              View full profile
            </Link>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-[12px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
              >
                Call
              </a>
            )}
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-[12px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
              >
                Website
              </a>
            )}
            {lead.googleMapsLink && (
              <a
                href={lead.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-[12px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
              >
                Maps
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function LeadResultsHeader({
  count,
  hotCount,
  avgScore,
  actions,
  className,
}: {
  count: number;
  hotCount?: number;
  avgScore?: number;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-2xl border border-border/80 bg-white/90 p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <HiOutlineCheckBadge className="h-5 w-5 text-brand-600" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-ink">
            {count} verified lead{count === 1 ? "" : "s"}
          </h2>
        </div>
        <p className="mt-1 text-[13px] text-ink-muted">
          AI-scored and verified ·{" "}
          {typeof hotCount === "number" && (
            <span className="font-semibold text-brand-600">{hotCount} hot</span>
          )}
          {typeof avgScore === "number" && (
            <>
              {" "}
              · avg score{" "}
              <span className="font-semibold tabular-nums text-ink">
                {avgScore}
              </span>
            </>
          )}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function LeadResultsList({ leads }: { leads: LeadResult[] }) {
  if (!leads.length) return null;
  return (
    <div className="space-y-3">
      {leads.map((lead, i) => (
        <LeadResultCard key={lead.id} lead={lead} index={i} />
      ))}
    </div>
  );
}
