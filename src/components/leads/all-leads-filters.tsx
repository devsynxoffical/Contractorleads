"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FilterChipRow } from "@/components/leads/filter-chip-row";
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
    Boolean(q.trim());

  return (
    <div
      className={cn(
        "mb-4 space-y-4 rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]",
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

      <FilterChipRow
        label="When found"
        options={LEAD_WHEN_FILTERS}
        value={when}
        onChange={(value) => pushParams({ when: value })}
      />

      <FilterChipRow
        label="Quality tier"
        options={LEAD_TIER_FILTERS}
        value={tier}
        onChange={(value) => pushParams({ tier: value })}
        tone="tier"
      />

      <FilterChipRow
        label="Lead score"
        options={LEAD_STRENGTH_FILTERS}
        value={strength}
        onChange={(value) => pushParams({ strength: value })}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-[11px] font-medium text-ink-muted">
          Service / industry
          <select
            className="saas-input mt-1"
            value={category}
            onChange={(e) => pushParams({ category: e.target.value })}
          >
            <option value="all">All services</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[11px] font-medium text-ink-muted">
          Sort
          <select
            className="saas-input mt-1"
            value={sort}
            onChange={(e) => pushParams({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-[11px] text-ink-faint">
        Date filters use when you ran the search. Tier and score reflect AI
        qualification on each lead.
      </p>

      {hasActive && (
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-[12px] text-ink-muted">Filters active</p>
          <button
            type="button"
            onClick={() => {
              startTransition(() => router.push(pathname));
            }}
            className="text-[12px] font-semibold text-brand-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
