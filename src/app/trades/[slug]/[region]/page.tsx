import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingChrome, MarketingHero } from "@/components/marketing/marketing-chrome";
import {
  JsonLd,
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import {
  SEO_REGIONS,
  TRADE_PAGES,
  buildMetadata,
  getRegionBySlug,
  getTradeBySlug,
} from "@/lib/seo";

type Params = { params: Promise<{ slug: string; region: string }> };

export function generateStaticParams() {
  const params: Array<{ slug: string; region: string }> = [];
  for (const trade of TRADE_PAGES) {
    for (const region of SEO_REGIONS) {
      params.push({ slug: trade.slug, region: region.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, region: regionSlug } = await params;
  const trade = getTradeBySlug(slug);
  const region = getRegionBySlug(regionSlug);
  if (!trade || !region) return {};
  const title = `${trade.name} contractor leads in ${region.name}`;
  return buildMetadata({
    title: `${title} for agencies`,
    description: `Find verified ${trade.name.toLowerCase()} contractors in ${region.name}. AI-scored leads with phones, owners, and outreach scripts for agencies.`,
    path: `/trades/${trade.slug}/${region.slug}`,
    keywords: [
      `${trade.name.toLowerCase()} contractor leads ${region.name}`,
      `${region.name} ${trade.name.toLowerCase()} contractors`,
      `${trade.name.toLowerCase()} leads for agencies`,
      "verified contractor leads",
    ],
  });
}

export default async function TradeRegionPage({ params }: Params) {
  const { slug, region: regionSlug } = await params;
  const trade = getTradeBySlug(slug);
  const region = getRegionBySlug(regionSlug);
  if (!trade || !region) notFound();

  const regionIndex = SEO_REGIONS.findIndex((r) => r.slug === region.slug);
  const showRegions = SEO_REGIONS.filter((_, i) => {
    const d = Math.abs(i - regionIndex);
    return d > 0 && d <= 4;
  }).slice(0, 8);

  return (
    <MarketingChrome>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Trades", path: "/trades" },
          { name: trade.name, path: `/trades/${trade.slug}` },
          {
            name: region.name,
            path: `/trades/${trade.slug}/${region.slug}`,
          },
        ])}
      />

      <MarketingHero
        eyebrow={`${trade.name} · ${region.name}`}
        title={`${trade.name} contractor leads in ${region.name}`}
        description={`Agencies use Contractor Leads to find verified ${trade.name.toLowerCase()} businesses across ${region.name} (${region.code}) — with AI scores, owner contacts, and outreach-ready scripts.`}
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Search {region.name} {trade.name.toLowerCase()} leads
          </Link>
          <Link
            href={`/trades/${trade.slug}`}
            className="rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700"
          >
            All {trade.name} pages
          </Link>
        </div>
      </MarketingHero>

      <section className="mx-auto max-w-3xl space-y-8 px-5 py-16 text-[15px] leading-relaxed text-slate-600 sm:px-8">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            Why {region.name} {trade.name.toLowerCase()} outreach
          </h2>
          <p className="mt-3">{trade.angle}</p>
          <p className="mt-3">
            Filter Lead Finder by {region.name}, pick {trade.name}, and pull a
            scored batch with phones, websites, ratings, and decision-maker
            enrichment when available — then move keepers into Pipeline CRM.
          </p>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            What agencies get
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Live Google / Yelp business data for {region.name}</li>
            <li>AI opportunity scores (website, PPC, SEO, marketing fit)</li>
            <li>Owner enrichment + Meta ads context when available</li>
            <li>Cold email, SMS, and call scripts from Outreach Studio</li>
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            More {trade.name} markets
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {showRegions.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/trades/${trade.slug}/${r.slug}`}
                  className="inline-flex rounded-full border border-violet-100 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:border-fuchsia-300"
                >
                  {r.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/trades/${trade.slug}`}
                className="inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-[13px] font-semibold text-fuchsia-800"
              >
                All states →
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            Other trades in {region.name}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TRADE_PAGES.filter((t) => t.slug !== trade.slug).map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/trades/${t.slug}/${region.slug}`}
                  className="inline-flex rounded-full border border-violet-100 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:border-fuchsia-300"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingChrome>
  );
}
