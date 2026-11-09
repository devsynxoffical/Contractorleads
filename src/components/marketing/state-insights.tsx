import Link from "next/link";
import {
  HiOutlineBolt,
  HiOutlineCalendarDays,
  HiOutlineCloud,
  HiOutlineLightBulb,
  HiOutlineMapPin,
} from "react-icons/hi2";
import type { StateInsight, StateProfile } from "@/lib/state-profiles";
import { exposureLabels } from "@/lib/state-profiles";
import { lowerTradeLabel } from "@/lib/seo";

/**
 * State-specific guidance for a trade, built from real state facts (climate, growth,
 * housing age, neighbours, major cities). No modeled or invented statistics.
 */
export function StateInsights({
  tradeName,
  leadsLabel,
  companiesLabel,
  stateName,
  stateCode,
  profile,
  insight,
  topCities,
  finderHref,
}: {
  tradeName: string;
  leadsLabel: string;
  companiesLabel: string;
  stateName: string;
  stateCode: string;
  profile: StateProfile;
  insight: StateInsight;
  topCities: string[];
  finderHref: string;
}) {
  const trade = lowerTradeLabel(tradeName);
  const exposures = exposureLabels(profile);

  return (
    <div className="space-y-8">
      {/* Quick answer */}
      <div className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900 sm:text-[22px]">
          How do I find {lowerTradeLabel(leadsLabel)} in {stateName}?
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
          Search live Google data for {lowerTradeLabel(companiesLabel)} in {stateName}, starting with{" "}
          {topCities.slice(0, 3).join(", ")}. Contractor Leads adds owner names, verified emails and
          an AI score for website, SEO and ad gaps, so your list shows which businesses need marketing
          most. Export it to CSV or Excel; your first 10 leads are free, with no credit card.
        </p>
      </div>

      {/* Market facts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Fact icon={<HiOutlineMapPin className="h-5 w-5" />} label="Census division" value={profile.division} />
        <Fact
          icon={<HiOutlineCloud className="h-5 w-5" />}
          label="Weather factors"
          value={exposures.length ? exposures.join(", ") : "Mild, with occasional storms"}
        />
        <Fact
          icon={<HiOutlineBolt className="h-5 w-5" />}
          label="Market signals"
          value={
            [
              profile.fastGrowing ? "Fast-growing population" : null,
              profile.olderHousing ? "Older housing stock" : null,
              trade === "solar"
                ? `${profile.solar === "strong" ? "Strong" : profile.solar === "good" ? "Good" : "Lower"} solar resource`
                : null,
            ]
              .filter(Boolean)
              .join(", ") || "Steady, established market"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-[19px] font-bold text-slate-900">
            What drives {trade} demand in {stateName}
          </h2>
          <ul className="mt-4 space-y-3">
            {insight.demandDrivers.map((d) => (
              <li key={d} className="flex gap-2.5 text-[14px] leading-relaxed text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" aria-hidden />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-[19px] font-bold text-slate-900">
            <HiOutlineCalendarDays className="h-5 w-5 text-fuchsia-600" aria-hidden />
            When to reach out
          </h2>
          <ul className="mt-4 space-y-3">
            {insight.outreachTiming.map((t) => (
              <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-fuchsia-700">
              <HiOutlineLightBulb className="h-4 w-4" aria-hidden />
              Recommended angle
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-slate-700">{insight.angle}</p>
          </div>
        </section>
      </div>

      {/* Cities */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-bold text-slate-900">
          Largest {stateName} markets to start with
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          The biggest metros have the most {trade} businesses to compare; smaller cities usually have
          less agency competition. Counts change daily, so run a live search for the current number.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {topCities.map((c) => (
            <li
              key={c}
              className="rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-[13px] font-semibold text-violet-800"
            >
              {c}, {stateCode}
            </li>
          ))}
        </ul>
        <Link
          href={finderHref}
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-700 hover:underline"
        >
          Search {trade} businesses in {stateName} (signed-in users) →
        </Link>
      </section>

      {/* Visible FAQ (matches the FAQPage structured data) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-[19px] font-bold text-slate-900">
          {tradeName} leads in {stateName}: FAQ
        </h2>
        <dl className="mt-4 divide-y divide-slate-100">
          {insight.faqs.map((f) => (
            <div key={f.q} className="py-4 first:pt-0 last:pb-0">
              <dt className="text-[15px] font-semibold text-slate-900">{f.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-fuchsia-600">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-[15px] font-semibold leading-snug text-slate-900">{value}</p>
    </div>
  );
}
