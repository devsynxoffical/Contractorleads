import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowRight, HiOutlineCheck } from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageLinkGrid, SubpageSection } from "@/components/marketing/marketing-subpage";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/components/seo/json-ld";
import { LOCATION_STATES, getLocation } from "@/lib/locations";
import { buildMetadata } from "@/lib/seo";

type Params = { params: Promise<{ state: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCATION_STATES.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state } = await params;
  const loc = getLocation(state);
  if (!loc) return {};
  const titles = [`Find Contractor Leads in ${loc.name}: Owners & Emails`, `Find Contractor Leads in ${loc.name}`];
  const descs = [
    `Find contractor leads in ${loc.name}: roofers, HVAC, plumbers and 15 more trades with owner names and verified emails, from live Google data. 10 free leads.`,
    `Find contractor leads in ${loc.name}: 18 trades with owner names and verified emails, from live Google data. 10 free leads.`,
  ];
  return buildMetadata({
    title: titles.find((t) => t.length < 60) ?? titles[1],
    description: descs.find((d) => d.length < 155) ?? descs[1],
    path: `/locations/${loc.slug}`,
    keywords: [
      `find contractor leads in ${loc.name}`,
      `contractor leads ${loc.name}`,
      `list of contractors in ${loc.name}`,
      `${loc.name} contractors email list`,
    ],
  });
}

const CORE = [
  { href: "/contractor-email-finder", label: "Contractor email finder" },
  { href: "/email-lists", label: "Contractor email lists" },
  { href: "/google-maps-scraper", label: "Google Maps scraper" },
];
const GUIDES = [
  { href: "/blog/contractor-license-lookup-owner-name", label: "Find owners with license lookups" },
  { href: "/blog/how-to-get-contractor-leads", label: "How to get contractor leads" },
];

export default async function LocationPage({ params }: Params) {
  const { state } = await params;
  const loc = getLocation(state);
  if (!loc) notFound();
  const path = `/locations/${loc.slug}`;
  const near = [...loc.neighbours, ...loc.sameDivision].slice(0, 6);

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Locations", path: "/locations" },
            { name: loc.name, path },
          ]),
          serviceJsonLd({
            name: `Find contractor leads in ${loc.name}`,
            description: loc.intro,
            path,
            serviceType: "Contractor lead finder",
            areaServed: { "@type": "State", name: loc.name, containedInPlace: { "@type": "Country", name: "United States" } },
          }),
          faqPageJsonLd(loc.faqs, path),
        ]}
      />

      <MarketingSubpageHero
        eyebrow={`${loc.name} · ${loc.profile.division}`}
        title={`Find contractor leads in ${loc.name}`}
        description={`Roofers, HVAC companies, plumbers and 15 more trades across ${loc.name}, with owner names, verified emails and AI marketing scores.`}
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            Find {loc.name} leads free
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/locations"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            All states
          </Link>
        </div>
      </MarketingSubpageHero>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <section className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900 sm:text-[22px]">{loc.quickAnswer.q}</h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-slate-700">{loc.quickAnswer.a}</p>
        </section>

        <p className="mt-8 text-[16px] leading-relaxed text-slate-700">{loc.intro}</p>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            {loc.name} contractor market at a glance
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {loc.marketFacts.map((f) => (
              <div key={f.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <dt className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">{f.label}</dt>
                <dd className="mt-1 text-[15px] font-semibold text-slate-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            Best trades to prospect in {loc.name}
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-slate-700">
            Ranked by how strongly {loc.name}&apos;s weather, growth and housing create demand for each trade. Contractors with
            more demand feel missed calls and slow seasons more, so marketing offers are easier to explain.
          </p>
          <ol className="mt-5 space-y-3">
            {loc.trades.map((t, i) => (
              <li key={t.slug} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[15px] font-semibold text-slate-900">
                  {i + 1}.{" "}
                  <Link href={`/industries/${t.slug}/${loc.slug}`} className="text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2 hover:decoration-fuchsia-500">
                    Find {t.name.toLowerCase().replace(/\bhvac\b/g, "HVAC").replace(/s$/, "")} leads in {loc.name}
                  </Link>
                </p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-slate-600">
                  {t.reasons.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(". ")}.
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            Largest {loc.name} markets to search first
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-slate-700">
            Big metros have the most contractors to compare; smaller cities usually have fewer agencies competing for the same owners.
            Search any of these, or a county or radius of your own.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {loc.cities.map((c) => (
              <li key={c} className="flex items-center gap-2 text-[15px] text-slate-700">
                <HiOutlineCheck className="h-4 w-4 text-fuchsia-600" aria-hidden /> {c}, {loc.code}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            When to contact {loc.name} contractors
          </h2>
          <ul className="mt-4 space-y-2.5">
            {loc.timing.map((t) => (
              <li key={t} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
                <HiOutlineCheck className="mt-1 h-4 w-4 shrink-0 text-fuchsia-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            How to find contractor leads in {loc.name}
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-slate-700">
            <li>Choose a trade and set the market to {loc.name}, a city such as {loc.cities[0]}, a county or a radius.</li>
            <li>Filter by rating, reviews and AI scores to keep the businesses with clear marketing gaps.</li>
            <li>Add owner names and verified emails, then export to CSV or Excel or send from the built-in outreach tools.</li>
            <li>Send from a warmed-up mailbox in small daily batches, with a postal address and an opt-out in every email.</li>
          </ol>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-700">
            Pricing is the same in every state: the first 10 leads are free, then plans start at $19.99 a month for 500 leads. See{" "}
            <Link href="/pricing" className="font-semibold text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2">
              pricing
            </Link>
            .
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
            Contractor leads in {loc.name}: FAQ
          </h2>
          <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-6">
            {loc.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-[15.5px] font-semibold text-slate-900">{f.q}</dt>
                <dd className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>

      <SubpageSection tone="soft" eyebrow="Nearby" title={`Contractor leads near ${loc.name}`}>
        <SubpageLinkGrid columns={3} items={near.map((s) => ({ href: `/locations/${s.slug}`, label: `Contractor leads in ${s.name}` }))} />
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="Keep reading" title="Trades, tools and guides">
        <SubpageLinkGrid
          columns={3}
          items={[
            ...loc.trades.slice(0, 4).map((t) => ({ href: `/industries/${t.slug}`, label: `Find ${t.name.toLowerCase().replace(/\bhvac\b/g, "HVAC").replace(/s$/, "")} leads` })),
            ...CORE,
            ...GUIDES,
          ]}
        />
      </SubpageSection>

      <SubpageCtaBand
        title={`Find contractor leads in ${loc.name}`}
        description="Search any trade and city, add owner names and verified emails, and export. Your first 10 leads are free."
        primaryLabel="Start free"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
