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
        "mb-4 space-y-3 rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]",
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

      <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
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

        {hasActive ? (
          <button
            type="button"
            onClick={() => {
              startTransition(() => router.push(pathname));
            }}
            className="h-10 shrink-0 self-stretch rounded-xl border border-border px-3 text-[12px] font-semibold text-brand-600 transition hover:bg-brand-50 lg:self-end"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
