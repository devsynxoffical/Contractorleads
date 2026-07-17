import Link from "next/link";
import { INDUSTRIES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PrimaryActionLink,
} from "@/components/layout/page-header";
import { SectionHeading, SectionLabel } from "@/components/ui/section";
import {
  HiOutlineCheckBadge,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineSparkles,
} from "react-icons/hi2";

const INDUSTRY_HINTS: Record<string, string> = {
  Roofing: "Storm restoration · residential & commercial",
  HVAC: "Install, service & membership plans",
  Plumbing: "Emergency + remodel plumbers",
  Electrical: "Licensed residential electricians",
  Solar: "Installation & financing partners",
  Landscaping: "Lawn, hardscape & maintenance",
  Remodeling: "Kitchen, bath & whole-home",
  Painting: "Interior / exterior crews",
  "Cleaning Services": "Residential & commercial cleaners",
  "Pest Control": "Recurring route businesses",
  "Pool Services": "Service + renovation pools",
  "General Contractors": "Design-build & GCs",
};

export default function IndustriesPage() {
  return (
    <div className="page-pad page-enter">
      <div className="mesh-bg -mx-4 -mt-4 mb-6 rounded-b-2xl px-4 pb-6 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <PageHeader
          title="Industries"
          description="12 home-service verticals across Tier 1 countries — pick one and jump into Lead Finder."
          actions={
            <PrimaryActionLink href="/leads/search">
              <HiOutlineMagnifyingGlass className="h-4 w-4" />
              Search by industry
            </PrimaryActionLink>
          }
        />

        <div className="stagger grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white/90 px-4 py-3 shadow-sm">
            <SectionLabel>Coverage</SectionLabel>
            <p className="mt-1 text-lg font-semibold">Tier 1 countries</p>
          </div>
          <div className="rounded-xl border border-border bg-white/90 px-4 py-3 shadow-sm">
            <SectionLabel>Source</SectionLabel>
            <p className="mt-1 text-lg font-semibold">Google Places + AI</p>
          </div>
          <div className="rounded-xl border border-border bg-white/90 px-4 py-3 shadow-sm">
            <SectionLabel>Export</SectionLabel>
            <p className="mt-1 text-lg font-semibold">CSV · Excel</p>
          </div>
        </div>
      </div>

      <SectionHeading
        title="All verticals"
        description="Each card opens Lead Finder so you can choose a country, entire-country scope, or a local area."
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry) => (
          <Link key={industry} href="/leads/search" className="block">
            <Card className="hover-lift h-full border-border shadow-[var(--shadow-card)]">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{industry}</p>
                  <HiOutlineSparkles className="h-4 w-4 shrink-0 text-brand-500" />
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
                  {INDUSTRY_HINTS[industry] ?? "Verified Tier 1 contractors"}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600">
                  <HiOutlineMapPin className="h-3.5 w-3.5" />
                  Search this industry →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-card)]">
        <HiOutlineCheckBadge className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Lead scores use ratings, reviews, completeness, and optional AI
          qualification — not invented data. Social links stay blank until a
          verified match exists.
        </p>
      </div>
    </div>
  );
}
