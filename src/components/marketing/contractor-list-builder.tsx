"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBolt,
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineMegaphone,
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineUser,
} from "react-icons/hi2";

export type BuilderTrade = { slug: string; name: string };
export type BuilderState = { slug: string; name: string; code: string; cities: string[] };

/** Columns every list includes (product facts, see /features). */
const COLUMNS = [
  { icon: HiOutlineUser, label: "Owner name" },
  { icon: HiOutlineEnvelope, label: "Verified email" },
  { icon: HiOutlinePhone, label: "Business phone" },
  { icon: HiOutlineGlobeAlt, label: "Website and SEO score" },
  { icon: HiOutlineStar, label: "Google rating and reviews" },
  { icon: HiOutlineMegaphone, label: "Meta ad status" },
  { icon: HiOutlineBolt, label: "AI score: Hot, Warm or Nurture" },
];

const selectClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14.5px] font-medium text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-100";

/**
 * Interactive list builder: pick a trade, state and city, see exactly what the list contains,
 * then claim it by signing up (the choice is carried to /register).
 * The preview shows the format only; real businesses appear after sign-up, from live Google data.
 */
export function ContractorListBuilder({
  trades,
  states,
  defaultTrade = "roofing",
  defaultState = "texas",
  heading = "Which contractors do you sell to?",
  tradeLabel = "Trade",
  listTemplate = "{trade} companies in {place}",
  example = "default",
}: {
  trades: BuilderTrade[];
  states: BuilderState[];
  defaultTrade?: string;
  defaultState?: string;
  /** Card heading above the controls. */
  heading?: string;
  tradeLabel?: string;
  /** List name shown in the preview and on /register; {trade} and {place} are replaced. */
  listTemplate?: string;
  /** "no-website" shows the example lead as a business with no website found. */
  example?: "default" | "no-website";
}) {
  const [tradeSlug, setTradeSlug] = useState(defaultTrade);
  const [stateSlug, setStateSlug] = useState(defaultState);
  const state = states.find((s) => s.slug === stateSlug) ?? states[0];
  const [city, setCity] = useState(state.cities[0] ?? "");
  const trade = trades.find((t) => t.slug === tradeSlug) ?? trades[0];
  const place = city ? `${city}, ${state.code}` : state.name;
  const listName = listTemplate.replace("{trade}", trade.name).replace("{place}", place);
  const noSite = example === "no-website";

  const href = useMemo(() => {
    const q = new URLSearchParams({ trade: trade.slug, state: state.slug, list: listName });
    if (city) q.set("city", city);
    return `/register?${q.toString()}`;
  }, [trade.slug, state.slug, city, listName]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      {/* Controls */}
      <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(124,58,237,0.45)]">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-fuchsia-600">Build your list</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900">
          {heading}
        </h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">{tradeLabel}</span>
            <select className={selectClass} value={trade.slug} onChange={(e) => setTradeSlug(e.target.value)}>
              {trades.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">State</span>
            <select
              className={selectClass}
              value={state.slug}
              onChange={(e) => {
                const next = states.find((s) => s.slug === e.target.value) ?? states[0];
                setStateSlug(next.slug);
                setCity(next.cities[0] ?? "");
              }}
            >
              {states.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {state.cities.length ? (
            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">City</span>
              <div className="flex flex-wrap gap-2">
                {state.cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    aria-pressed={city === c}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                      city === c
                        ? "bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-fuchsia-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCity("")}
                  aria-pressed={city === ""}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                    city === ""
                      ? "bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-fuchsia-300"
                  }`}
                >
                  Whole state
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <Link
          href={href}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(192,38,211,0.8)] transition hover:opacity-95"
        >
          Get my {trade.name} list free
          <HiOutlineArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="mt-3 text-center text-[12.5px] text-slate-500">10 free leads · No credit card · Export to CSV or your CRM</p>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-violet-600">Your list</p>
            <p className="truncate font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
              {listName}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Live Google data
          </span>
        </div>

        <div className="p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">Every lead includes</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {COLUMNS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-[13.5px] font-medium text-slate-700">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-fuchsia-600 ring-1 ring-fuchsia-100">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>

          {/* Format example: clearly labelled, no real business */}
          <div className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-wider text-violet-700">Example lead (format only)</p>
              <span className="rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                HOT
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="font-semibold text-slate-900">Example {trade.name} Co.</p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-600">
                  <HiOutlineMapPin className="h-3.5 w-3.5" aria-hidden /> {place}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-slate-700">
                  <HiOutlineCheckBadge className="h-4 w-4 text-emerald-600" aria-hidden /> Owner name and verified email
                </p>
                {noSite ? (
                  <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700 ring-1 ring-amber-200">
                    No website
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                {(noSite
                  ? [
                      { k: "Website", v: 0 },
                      { k: "SEO", v: 0 },
                      { k: "Ads", v: 0 },
                    ]
                  : [
                      { k: "Website", v: 32 },
                      { k: "SEO", v: 18 },
                      { k: "Ads", v: 0 },
                    ]
                ).map((s) => (
                  <div key={s.k}>
                    <div className="flex justify-between text-[12px] font-semibold text-slate-600">
                      <span>{s.k} score</span>
                      <span>{s.v}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" style={{ width: `${Math.max(s.v, 3)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">
              {noSite
                ? "No website found means the business is a prospect for a first site: your first email can open with what customers see when they search for it."
                : "Low scores mean a gap you can sell: this example has a weak website and no ads running, so your first email can open with that."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
