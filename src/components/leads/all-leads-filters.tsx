"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LEAD_STRENGTH_FILTERS,
  LEAD_TIER_FILTERS,
  LEAD_WHEN_FILTERS,
} from "@/lib/lead-date-filters";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "score", label: "Highest score" },
  { value: "oldest", label: "Oldest first" },
] as const;

type Props = {
  categories: string[];
};

function FilterSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium text-ink-muted",
        className,
      )}
    >
      <span className="truncate">{label}</span>
      <select
        className="saas-input h-10 w-full min-w-0 text-[13px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export function AllLeadsFilters({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const when = searchParams.get("when") ?? "all";
  const tier = searchParams.get("tier") ?? "all";
  const strength = searchParams.get("strength") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const sort = searchParams.get("sort") ?? "newest";
  const q = searchParams.get("q") ?? "";

  // SME Intelligence parameters
  const country = searchParams.get("country") ?? "all";
  const age = searchParams.get("age") ?? "all";
  const size = searchParams.get("size") ?? "all";
  const dm = searchParams.get("dm") ?? "all";
  const targetSme = searchParams.get("targetSme") === "1";
  const excludeEnterprise = searchParams.get("excludeEnterprise") === "1";

  const pushParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value || value === "all") next.delete(key);
        else next.set(key, value);
      }
      if (patch.q === "") next.delete("q");
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  const hasActive =
    when !== "all" ||
    tier !== "all" ||
    strength !== "all" ||
    category !== "all" ||
    sort !== "newest" ||
    country !== "all" ||
    age !== "all" ||
    size !== "all" ||
    dm !== "all" ||
    targetSme ||
    excludeEnterprise ||
    Boolean(q.trim());

  return (
    <div
      className={cn(
        "mb-4 space-y-3 rounded-xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]",
        pending && "opacity-80",
      )}
    >
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          pushParams({ q: String(fd.get("q") ?? "").trim() });
        }}
      >
        <input
          name="q"
          defaultValue={q}
          key={q}
          placeholder="Search business, owner, city, phone…"
          className="saas-input min-w-0 flex-1"
        />
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#1a1224] px-4 text-[13px] font-semibold text-white transition hover:opacity-90"
        >
          Search
        </button>
      </form>

      {/* Primary Filters Row */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          <FilterSelect
            label="Country"
            value={country}
            onChange={(value) => pushParams({ country: value })}
          >
            <option value="all">All Countries</option>
            <option value="US">🇺🇸 United States</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="CA">🇨🇦 Canada</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="NZ">🇳🇿 New Zealand</option>
          </FilterSelect>

          <FilterSelect
            label="Service / industry"
            value={category}
            onChange={(value) => pushParams({ category: value })}
          >
            <option value="all">All services</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="When found"
            value={when}
            onChange={(value) => pushParams({ when: value })}
          >
            {LEAD_WHEN_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Quality tier"
            value={tier}
            onChange={(value) => pushParams({ tier: value })}
          >
            {LEAD_TIER_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(value) => pushParams({ sort: value })}
            className="col-span-2 sm:col-span-1"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>

      {/* SME Intelligence & Decision-Maker Row */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/60 lg:flex-row lg:items-end">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          <FilterSelect
            label="Business age"
            value={age}
            onChange={(value) => pushParams({ age: value })}
          >
            <option value="all">Any Business Age</option>
            <option value="0-2">0–2 years (Emerging)</option>
            <option value="2-5">2–5 years (Growing)</option>
            <option value="5-15">5–15 years (Ideal Target)</option>
            <option value="15-30">15–30 years (Mature)</option>
            <option value="30+">30+ years (Highly Established)</option>
          </FilterSelect>

          <FilterSelect
            label="Company size"
            value={size}
            onChange={(value) => pushParams({ size: value })}
          >
            <option value="all">Any Size</option>
            <option value="solo">Solo (1 person)</option>
            <option value="2-5">2–5 employees (Prime Target)</option>
            <option value="6-10">6–10 employees</option>
            <option value="11-15">11–15 employees</option>
            <option value="16-20">16–20 employees</option>
            <option value="21-50">21–50 (Large)</option>
            <option value="51-100">51–100 (Corporate)</option>
            <option value="100+">100+ (Enterprise)</option>
          </FilterSelect>

          <FilterSelect
            label="Decision-maker"
            value={dm}
            onChange={(value) => pushParams({ dm: value })}
          >
            <option value="all">All Leads</option>
            <option value="verified">✅ Verified Decision-Maker</option>
            <option value="email">✉️ Direct DM Email</option>
            <option value="phone">📞 Direct DM Phone</option>
            <option value="missing">❌ No DM (Generic only)</option>
          </FilterSelect>

          <FilterSelect
            label="Lead score"
            value={strength}
            onChange={(value) => pushParams({ strength: value })}
          >
            {LEAD_STRENGTH_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>
        </div>

        {hasActive ? (
          <button
            type="button"
            onClick={() => {
              startTransition(() => router.push(pathname));
            }}
            className="h-10 shrink-0 self-stretch rounded-xl border border-border px-3 text-[12px] font-semibold text-brand-600 transition hover:bg-brand-50 lg:self-end"
          >
            Reset
          </button>
        ) : null}
      </div>

      {/* SME Target Presets / Exclusion Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px]">
        <button
          type="button"
          onClick={() => pushParams({ targetSme: targetSme ? "0" : "1" })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition border",
            targetSme
              ? "bg-brand-600 text-white border-brand-600 shadow-xs"
              : "bg-[var(--surface)] text-ink-muted border-border hover:border-brand-300 hover:text-brand-700"
          )}
        >
          <span>🎯</span>
          <span>Target SME Profile (1–15 team, 2–15 yrs, DM Verified)</span>
        </button>

        <button
          type="button"
          onClick={() => pushParams({ excludeEnterprise: excludeEnterprise ? "0" : "1" })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition border",
            excludeEnterprise
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-[var(--surface)] text-ink-muted border-border hover:border-rose-300 hover:text-rose-700"
          )}
        >
          <span>🚫</span>
          <span>Exclude 30+ yr & Large Enterprises</span>
        </button>
      </div>
    </div>
  );
}
