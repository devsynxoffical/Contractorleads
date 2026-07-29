"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineGlobeAmericas,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { TIER_ONE_COUNTRIES } from "@/lib/constants";
import {
  FEATURED_US_STATE_CODES,
  US_MARKET_REGIONS,
} from "@/lib/marketing-us-regions";
import { SEO_REGIONS } from "@/lib/seo";
import { Reveal } from "./marketing-ui";

function regionHref(industrySlug: string, stateName: string) {
  const region = SEO_REGIONS.find((r) => r.name === stateName);
  if (!region) return `/industries/${industrySlug}`;
  return `/industries/${industrySlug}/${region.slug}`;
}

export function IndustryLocationSection({
  industryName,
  industrySlug,
}: {
  industryName: string;
  industrySlug: string;
}) {
  const [query, setQuery] = useState("");
  const lowerIndustry = industryName.toLowerCase();

  const regionByCode = useMemo(
    () => new Map(SEO_REGIONS.map((r) => [r.code, r])),
    [],
  );

  const featured = FEATURED_US_STATE_CODES.map((code) => regionByCode.get(code)).filter(
    Boolean,
  ) as typeof SEO_REGIONS;

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return US_MARKET_REGIONS;

    return US_MARKET_REGIONS.map((group) => ({
      ...group,
      codes: group.codes.filter((code) => {
        const region = regionByCode.get(code);
        if (!region) return false;
        return (
          region.name.toLowerCase().includes(q) ||
          region.code.toLowerCase().includes(q)
        );
      }),
    })).filter((group) => group.codes.length > 0);
  }, [query, regionByCode]);

  return (
    <div className="space-y-10">
      <Reveal>
        <div className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-fuchsia-50/40 to-violet-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">
              Run a live {lowerIndustry} search in Lead Finder
            </p>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-600">
              Pick a US state below for market-specific tips, or open Lead Finder
              to search the entire country — plus Canada, the UK, Australia, and
              New Zealand.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20 transition hover:opacity-95"
          >
            Search all US {industryName}
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      <div>
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600">
            Top US markets
          </p>
          <p className="mt-1 text-[14px] text-slate-600">
            Agencies prospecting {lowerIndustry} contractors start here most often.
          </p>
        </Reveal>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((region, i) => (
            <li key={region.code}>
              <Reveal delay={0.03 * i}>
                <Link
                  href={regionHref(industrySlug, region.name)}
                  className="group flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
                >
                  <span className="inline-flex w-fit rounded-lg bg-fuchsia-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-fuchsia-700">
                    {region.code}
                  </span>
                  <span className="mt-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                    {region.name}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 group-hover:text-fuchsia-600">
                    View market
                    <HiOutlineArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600">
                All 50 states
              </p>
              <p className="mt-1 text-[14px] text-slate-600">
                Open any state for localized {lowerIndustry} prospecting guidance.
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter states…"
                className="w-full rounded-xl border border-violet-100 bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-800 outline-none ring-fuchsia-200 transition focus:border-fuchsia-300 focus:ring-2"
              />
            </label>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {filteredGroups.map((group) => (
            <Reveal key={group.label}>
              <div className="rounded-2xl border border-violet-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {group.label}
                </p>
                <ul className="mt-3 space-y-1">
                  {group.codes.map((code) => {
                    const region = regionByCode.get(code);
                    if (!region) return null;
                    return (
                      <li key={code}>
                        <Link
                          href={regionHref(industrySlug, region.name)}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[13px] text-slate-700 transition hover:bg-fuchsia-50 hover:text-fuchsia-800"
                        >
                          <span>{region.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {region.code}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {query && filteredGroups.every((g) => g.codes.length === 0) ? (
          <p className="mt-4 text-center text-[13px] text-slate-500">
            No states match &ldquo;{query}&rdquo;.
          </p>
        ) : null}
      </div>

      <Reveal>
        <div className="rounded-2xl border border-slate-200 bg-[#faf8fc] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-fuchsia-600 shadow-sm">
              <HiOutlineGlobeAmericas className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">
                Also available outside the US
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                After signup, search {lowerIndustry} contractors in{" "}
                {TIER_ONE_COUNTRIES.map((c) => c.name).join(", ")} from Lead
                Finder — same verified data and AI scores.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TIER_ONE_COUNTRIES.map((c) => (
                  <span
                    key={c.code}
                    className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-700"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
