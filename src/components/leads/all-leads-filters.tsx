"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const WHEN_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

const TIER_OPTIONS = [
  { value: "all", label: "All tiers" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "nurture", label: "Nurture" },
] as const;

const STRENGTH_OPTIONS = [
  { value: "all", label: "Any strength" },
  { value: "strong", label: "Strong (75+)" },
  { value: "medium", label: "Medium (50–74)" },
  { value: "developing", label: "Developing (<50)" },
] as const;

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
      // Preserve empty q deletion
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

      <div className="flex flex-wrap gap-1.5">
        {WHEN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => pushParams({ when: opt.value })}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
              when === opt.value
                ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                : "bg-[#faf8fb] text-ink-muted hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-[11px] font-medium text-ink-muted">
          Tier
          <select
            className="saas-input mt-1"
            value={tier}
            onChange={(e) => pushParams({ tier: e.target.value })}
          >
            {TIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[11px] font-medium text-ink-muted">
          Strength
          <select
            className="saas-input mt-1"
            value={strength}
            onChange={(e) => pushParams({ strength: e.target.value })}
          >
            {STRENGTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[11px] font-medium text-ink-muted">
          Category
          <select
            className="saas-input mt-1"
            value={category}
            onChange={(e) => pushParams({ category: e.target.value })}
          >
            <option value="all">All categories</option>
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

      {hasActive && (
        <div className="flex items-center justify-between gap-2">
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
