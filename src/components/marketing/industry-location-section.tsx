"use client";

import Link from "next/link";
import { HiOutlineArrowRight, HiOutlineGlobeAmericas } from "react-icons/hi2";
import { TIER_ONE_COUNTRIES } from "@/lib/constants";
import { Reveal } from "./marketing-ui";

const COUNTRY_BLURBS: Record<string, string> = {
  US: "Largest home-service agency market — search nationwide or tighten by city later.",
  CA: "Provinces and territories with the same live Google data and AI scoring.",
  GB: "England, Scotland, Wales, and Northern Ireland coverage in Lead Finder.",
  AU: "States and territories with verified contractors and opportunity scores.",
  NZ: "Nationwide New Zealand prospecting with the same enrichment pipeline.",
};

export function IndustryLocationSection({
  industryName,
}: {
  industryName: string;
  /** Kept for call-site compatibility; state landers are no longer listed here. */
  industrySlug?: string;
}) {
  const lowerIndustry = industryName.toLowerCase();

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-fuchsia-50/40 to-violet-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-fuchsia-600 shadow-sm">
              <HiOutlineGlobeAmericas className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">
                Prospect {lowerIndustry} contractors by country
              </p>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-600">
                Contractor Leads covers {TIER_ONE_COUNTRIES.length} Tier‑1
                countries. After signup, pick a country in Lead Finder and pull
                live, AI-scored leads with owner contacts.
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20 transition hover:opacity-95"
          >
            Start free trial
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TIER_ONE_COUNTRIES.map((country, i) => (
          <li key={country.code}>
            <Reveal delay={0.04 * i}>
              <Link
                href="/register"
                className="group flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
              >
                <span className="inline-flex w-fit rounded-lg bg-fuchsia-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-fuchsia-700">
                  {country.code}
                </span>
                <span className="mt-3 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                  {country.name}
                </span>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-600">
                  {COUNTRY_BLURBS[country.code] ??
                    `Search verified ${lowerIndustry} contractors across ${country.name}.`}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-fuchsia-700">
                  Search {industryName} in {country.name}
                  <HiOutlineArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
