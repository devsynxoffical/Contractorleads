import type { Metadata } from "next";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import { JsonLd, breadcrumbJsonLd, collectionPageJsonLd } from "@/components/seo/json-ld";
import { TIER_ONE_COUNTRIES } from "@/lib/constants";
import { SEO_REGIONS, TRADE_PAGES, buildMetadata } from "@/lib/seo";
import { getTradeHubContent } from "@/lib/trade-hub-content";

export const metadata: Metadata = buildMetadata({
  title: "Find Contractor Leads by Trade: Roofing, HVAC, Plumbing",
  description:
    "Find contractor leads in 18 trades: roofing, HVAC, plumbing, electrical, solar, remodeling and more, with owner names and verified emails, in all 50 states.",
  path: "/industries",
  keywords: [
    "contractor leads by industry",
    "roofing contractor leads",
    "HVAC contractor leads",
    "plumbing contractor leads",
    "home service lead generation",
  ],
});

/** Strip the site's [label](/path) link syntax for plain table text. */
const plain = (t: string) => t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

const compareRows = TRADE_PAGES.flatMap((t) => {
  const hub = getTradeHubContent(t.slug);
  if (!hub) return [];
  return [
    {
      slug: t.slug,
      name: t.name,
      buys: hub.buys.slice(0, 2).map(plain),
      season: plain(hub.season.split(/(?<=\.)\s/)[0]),
    },
  ];
});

export default function TradesIndexPage() {
  return (
    <MarketingSiteShell>
      <JsonLd
        data={collectionPageJsonLd({
          name: "Contractor leads by trade",
          description: "Contractor lead finders for 18 home-service trades, each with owner contacts and AI scores.",
          path: "/industries",
          items: TRADE_PAGES.map((t) => ({ name: `${t.name} contractor leads`, path: `/industries/${t.slug}` })),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ])}
      />
      <MarketingSubpageHero
        eyebrow="Industries"
        title="Contractor leads for every home-service vertical"
        description="Agencies sell into specific trades. Jump into the vertical you pitch — each page is built around how that market buys marketing."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            Start free trial
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/features"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            See how it works
          </Link>
        </div>
      </MarketingSubpageHero>

      <SubpageSection tone="tint">
        <SubpageStats
          items={[
            { value: `${TRADE_PAGES.length}`, label: "Home-service verticals" },
            { value: `${SEO_REGIONS.length}`, label: "US state landing pages" },
            {
              value: `${TIER_ONE_COUNTRIES.length}`,
              label: "Countries you can prospect",
            },
            { value: "Live", label: "Google & Yelp data at search time" },
          ]}
        />
      </SubpageSection>

      <SubpageSection
        tone="light"
        eyebrow="Browse"
        title="Pick the vertical you pitch"
        description="Each trade page covers why that market buys marketing, what data comes back on every lead, and state-level landers for local outreach."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRADE_PAGES.map((t, i) => (
            <Reveal key={t.slug} delay={0.04 * i}>
              <Link href={`/industries/${t.slug}`} className="group block h-full">
                <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                  <h2 className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900">
                    {t.name}
                  </h2>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">
                    {t.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-700">
                    View {t.name} leads
                    <HiOutlineArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      <SubpageSection
        tone="soft"
        eyebrow="Compare trades"
        title="What each trade buys from agencies, and when"
        description="The services owners in each trade most often pay an agency for, and when they plan their marketing, so you pitch the right offer at the right time."
      >
        <div className="rounded-2xl border border-slate-200 bg-white sm:overflow-x-auto">
          <table className="block w-full text-left text-[14px] sm:table sm:min-w-[720px]">
            <caption className="sr-only">Marketing services each home-service trade buys and when they plan marketing</caption>
            <thead className="hidden bg-slate-50 sm:table-header-group text-[12.5px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Trade</th>
                <th scope="col" className="px-4 py-3">What owners buy first</th>
                <th scope="col" className="px-4 py-3">When they plan marketing</th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-slate-100 sm:table-row-group">
              {compareRows.map((r) => (
                <tr key={r.slug} className="block px-1 py-2 align-top sm:table-row sm:p-0">
                  <th scope="row" className="block px-4 pt-2 font-semibold sm:table-cell sm:py-3">
                    <Link href={`/industries/${r.slug}`} className="text-fuchsia-700 hover:underline">
                      {r.name}
                    </Link>
                  </th>
                  <td className="block px-4 py-1 text-slate-700 sm:table-cell sm:py-3">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">What owners buy first: </span>
                    <ul className="list-disc space-y-1 pl-4">
                      {r.buys.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="block px-4 py-1 text-slate-700 sm:table-cell sm:py-3">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">When they plan marketing: </span>{r.season}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="Pick a trade and pull your first scored list"
        description="Search live business data in any of these verticals across the US, Canada, the UK, Australia, and New Zealand."
        primaryLabel="Start free trial"
        secondaryHref="/features"
        secondaryLabel="See how it works"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
