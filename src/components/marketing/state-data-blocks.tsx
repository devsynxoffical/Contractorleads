import Link from "next/link";
import {
  HiOutlineChartBar,
  HiOutlineGlobeAlt,
  HiOutlineMegaphone,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import type { StateMarketData } from "@/lib/state-market-data";
import { Reveal } from "./marketing-ui";

export function StateDataBlocks({ data }: { data: StateMarketData }) {
  return (
    <div className="space-y-12">
      {/* 1. Market Size & 4 Digital Gap Stats */}
      <section className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/30 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-violet-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-fuchsia-700">
              <HiOutlineChartBar className="h-3.5 w-3.5" />
              Market Estimate
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[22px] font-bold text-slate-900 sm:text-[26px]">
              An estimated {data.businessCount.toLocaleString()} {data.tradeName.toLowerCase()} businesses in {data.stateName}
            </h2>
            <p className="mt-1 text-[14px] text-slate-600">
              Modeled from typical Contractor Leads search results and state market size. Live counts come from Lead Finder.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-xs">
            <HiOutlineStar className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-[12px] font-semibold text-slate-500">Reputation Baseline</p>
              <p className="text-[14px] font-bold text-slate-900">
                {data.medianRating} ★ median · {data.medianReviews} reviews
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <HiOutlineGlobeAlt className="h-5 w-5" />
              <span className="text-[12px] font-bold uppercase tracking-wider">No Website</span>
            </div>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[32px] font-extrabold text-slate-900">
              {data.noWebsitePct}%
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Contractors without any active website or domain
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-amber-600">
              <HiOutlineShieldCheck className="h-5 w-5" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Weak Site (&lt;50)</span>
            </div>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[32px] font-extrabold text-slate-900">
              {data.weakWebsitePct}%
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Sites scoring under 50 on mobile speed & SEO
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-violet-600">
              <HiOutlineUser className="h-5 w-5" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Owner Found</span>
            </div>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[32px] font-extrabold text-slate-900">
              {data.ownerIdentifiedPct}%
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Share of leads where enrichment typically returns an owner name
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-600">
              <HiOutlineMegaphone className="h-5 w-5" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Running Meta Ads</span>
            </div>
            <p className="mt-3 font-[family-name:var(--font-display)] text-[32px] font-extrabold text-slate-900">
              {data.runningMetaAdsPct}%
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Share of businesses typically running Meta/IG ads
            </p>
          </div>
        </div>

        {/* Hot / Warm / Nurture Split */}
        <div className="mt-8 rounded-2xl border border-violet-100 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] font-semibold text-slate-900">
              AI Lead Scoring Opportunity Tiers
            </p>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 font-medium text-rose-600">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Hot ({data.tierSplit.hotPct}%)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-amber-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Warm ({data.tierSplit.warmPct}%)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                Nurture ({data.tierSplit.nurturePct}%)
              </span>
            </div>
          </div>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${data.tierSplit.hotPct}%` }}
              className="bg-rose-500 transition-all"
            />
            <div
              style={{ width: `${data.tierSplit.warmPct}%` }}
              className="bg-amber-400 transition-all"
            />
            <div
              style={{ width: `${data.tierSplit.nurturePct}%` }}
              className="bg-slate-300 transition-all"
            />
          </div>
        </div>
      </section>

      {/* 2. Top Cities Table */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900">
          Top {data.stateName} Markets for {data.tradeName}
        </h3>
        <p className="mt-1 text-[13px] text-slate-600">
          City breakdown by contractor concentration and digital marketing gap.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Est. Businesses</th>
                <th className="py-3 px-4">% Without Website</th>
                <th className="py-3 px-4">% Running Meta Ads</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.topCities.map((c) => (
                <tr key={c.city} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{c.city}</td>
                  <td className="py-3.5 px-4 text-slate-700">{c.count.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-rose-600 font-medium">{c.noWebsitePct}%</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-medium">{c.runningMetaAdsPct}%</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href="/register"
                      className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700 hover:bg-violet-100 transition"
                    >
                      View leads
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Best Opening Angle */}
      <section className="rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-900 to-[#120a28] p-6 sm:p-8 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-fuchsia-300">
          <HiOutlineSparkles className="h-3.5 w-3.5" />
          Recommended Agency Angle
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-[20px] font-bold text-white">
          How to pitch {data.tradeName.toLowerCase()} contractors in {data.stateName}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-white/80">
          {data.openingAngle}
        </p>
      </section>

      {/* 4. Sample Anonymized Lead Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900">
              What a Scored Lead Looks Like in {data.stateName}
            </h3>
            <p className="text-[13px] text-slate-600">
              Illustrative examples of the Hot, Warm and Nurture tiers. Business names, owner names and live scores appear in the app.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-600 hover:text-fuchsia-700"
          >
            Pull live records with 10 free leads →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {data.sampleLeads.map((lead, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm space-y-4 hover:border-violet-300 transition"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    lead.tier === "Hot"
                      ? "bg-rose-100 text-rose-700"
                      : lead.tier === "Warm"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {lead.tier} Lead
                </span>
                <span className="text-[12px] font-medium text-slate-500">
                  {lead.city}, {lead.stateCode}
                </span>
              </div>

              <div>
                <p className="font-semibold text-slate-900">{lead.category}</p>
                <p className="text-[12px] text-slate-400">Owner contact shown in app</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-y border-slate-100 py-3 text-[12px]">
                <div>
                  <span className="text-slate-500">Website Score:</span>{" "}
                  <strong className="text-slate-900">{lead.websiteScore}/100</strong>
                </div>
                <div>
                  <span className="text-slate-500">Marketing Score:</span>{" "}
                  <strong className="text-slate-900">{lead.marketingScore}/100</strong>
                </div>
                <div>
                  <span className="text-slate-500">Google Rating:</span>{" "}
                  <strong className="text-slate-900">{lead.rating} ★</strong>
                </div>
                <div>
                  <span className="text-slate-500">Reviews:</span>{" "}
                  <strong className="text-slate-900">{lead.reviewCount}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11.5px] text-slate-600">
                <span className="flex items-center gap-1">
                  <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                  Owner name typical
                </span>
                <span>{lead.runningAds ? "Running Meta Ads" : "No Active Ads"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Method & Freshness Note */}
      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-5 py-3 text-center text-[12.5px] text-slate-500">
        <p>{data.freshnessNote}</p>
      </div>

      {/* 6. State Specific FAQ */}
      <section className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900">
          Frequently Asked Questions: {data.tradeName} in {data.stateName}
        </h3>
        <div className="mt-6 space-y-5">
          {data.faqs.map((faq, i) => (
            <div key={i} className="border-b border-slate-100 pb-5 last:border-none last:pb-0">
              <h4 className="font-semibold text-slate-900 text-[15px]">
                {faq.q}
              </h4>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
