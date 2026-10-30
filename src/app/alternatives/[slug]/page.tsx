import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineXMark,
} from "react-icons/hi2";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import { ALTERNATIVES, getAlternative } from "@/lib/alternatives-content";
import { buildMetadata, getTradeBySlug } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ALTERNATIVES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const alt = getAlternative(slug);
  if (!alt) return {};
  return buildMetadata({
    title: alt.titleTag,
    description: alt.metaDescription,
    path: `/alternatives/${alt.slug}`,
    keywords: alt.keywords,
  });
}

export default async function AlternativePage({ params }: Params) {
  const { slug } = await params;
  const alt = getAlternative(slug);
  if (!alt) notFound();

  const others = ALTERNATIVES.filter((a) => a.slug !== alt.slug).slice(0, 3);
  const industries = alt.relatedIndustries
    .map((s) => getTradeBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Alternatives", path: "/alternatives" },
            { name: `${alt.name} alternative`, path: `/alternatives/${alt.slug}` },
          ]),
          softwareApplicationJsonLd(),
          faqPageJsonLd(alt.faqs),
        ]}
      />

      <header className="relative overflow-hidden border-b border-white/10 bg-[#07040f] py-16 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(168,85,247,0.35), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            {alt.category} · comparison
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-white">
            {alt.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75">
            {alt.intro}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:opacity-95"
            >
              Try 10 free contractor leads
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/alternatives"
              className="inline-flex rounded-full border border-white/20 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              All comparisons
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-white/50">
            No credit card required · Starter from $19.99/mo
          </p>
        </div>
      </header>

      <SubpageSection
        tone="light"
        eyebrow="Fair comparison"
        title={`When ${alt.name} is the right tool, and when it is not`}
        description={`${alt.name} is a ${alt.category.toLowerCase()}. Here is where it fits and where agencies prospecting home-service contractors hit its limits.`}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
              Where {alt.name} is a good fit
            </h3>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-700">
              {alt.bestFor.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-rose-100 bg-rose-50/30 p-6 shadow-sm sm:p-8">
            <h3 className="font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
              Where it falls short for contractor prospecting
            </h3>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-700">
              {alt.gaps.map((g) => (
                <li key={g} className="flex items-start gap-2">
                  <HiOutlineXMark className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SubpageSection>

      <SubpageSection
        tone="tint"
        eyebrow="Side by side"
        title={`Contractor Leads vs ${alt.name}`}
        description="Compared on the points that decide whether a rep books a call or spends the morning researching."
      >
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Feature comparison between Contractor Leads and {alt.name}
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                <th scope="col" className="px-4 py-3">Feature</th>
                <th scope="col" className="px-4 py-3">{alt.name}</th>
                <th scope="col" className="px-4 py-3 text-fuchsia-700">Contractor Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alt.rows.map((r) => (
                <tr key={r.point}>
                  <th scope="row" className="px-4 py-3.5 font-semibold text-slate-900">
                    {r.point}
                  </th>
                  <td className="px-4 py-3.5 text-slate-600">{r.them}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{r.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[12px] text-slate-400">
            {alt.pricingNote} Competitor details reflect public information at the time of writing;
            verify on {alt.website}.
          </p>
        </div>
      </SubpageSection>

      <SubpageSection
        tone="light"
        eyebrow="Test it"
        title="How to compare in one afternoon"
        description={`A four-step benchmark of ${alt.name} against Contractor Leads on a market you already work.`}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {alt.switchSteps.map((step, i) => (
            <Reveal key={step} delay={0.05 * i}>
              <div className="h-full rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-[13px] font-bold text-violet-700">
                  {i + 1}
                </span>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-700">{step}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      {industries.length > 0 && (
        <SubpageSection
          tone="soft"
          eyebrow="By trade"
          title="Trades agencies usually run through this comparison"
          description="Each trade page explains how that market buys marketing and what comes back on every lead."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((t) => (
              <Link
                key={t.slug}
                href={`/industries/${t.slug}`}
                className="group rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
              >
                <p className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                  {t.headline}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{t.description}</p>
              </Link>
            ))}
          </div>
        </SubpageSection>
      )}

      <SubpageSection tone="light" eyebrow="FAQ" title={`${alt.name} alternative questions`}>
        <div className="mx-auto max-w-3xl space-y-4">
          {alt.faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
              <h3 className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900">
                {f.q}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>
      </SubpageSection>

      {others.length > 0 && (
        <SubpageSection
          tone="tint"
          eyebrow="More comparisons"
          title="Other tools agencies compare"
        >
          <ul className="grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/alternatives/${o.slug}`}
                  className="group block h-full rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600">
                    {o.category}
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                    {o.name} alternative
                  </p>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/apollo-alternative"
                className="group block h-full rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600">
                  B2B contact database
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                  Apollo.io alternative
                </p>
              </Link>
            </li>
          </ul>
        </SubpageSection>
      )}

      <SubpageCtaBand
        title={`Run your ${alt.name} list's trade and city in Lead Finder`}
        description="See how many businesses come back with an owner name, a score and ad status. 10 leads free, no card."
        primaryLabel="Start free (10 leads)"
        secondaryHref="/contractor-lead-generation-software"
        secondaryLabel="Read the buyer's guide"
        note="Starter $19.99/mo · Growth $49/mo · Agency $99/mo"
      />
    </MarketingSiteShell>
  );
}
