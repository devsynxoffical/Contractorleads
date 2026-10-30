import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineMapPin,
  HiOutlineMegaphone,
  HiOutlineSparkles,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import {
  SubpageCard,
  SubpageCtaBand,
  SubpageLinkGrid,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from "@/components/seo/json-ld";
import {
  leadFinderDeepLink,
  siblingStateCodes,
  usRegionLabelForState,
} from "@/lib/marketing-us-regions";
import {
  SEO_REGIONS,
  TRADE_PAGES,
  buildMetadata,
  getRegionBySlug,
  getTradeBySlug,
  isPriorityTrade,
} from "@/lib/seo";
import { getStateMarketData } from "@/lib/state-market-data";
import { StateDataBlocks } from "@/components/marketing/state-data-blocks";

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

  const priority = isPriorityTrade(trade.slug);
  const market = getStateMarketData(trade.slug, trade.name, region.slug, region.name, region.code);

  // Priority trade titles follow: "[Trade] Contractor Leads in [State]: [N] Businesses Scored" (< 60 chars)
  const fullTitle = `${trade.name} Contractor Leads in ${region.name} for Agencies`;
  const title = fullTitle.length <= 60 ? fullTitle : `${trade.name} Contractor Leads in ${region.name}`;

  const description = `Find ${trade.name.toLowerCase()} contractor leads in ${region.name}: live Google data, AI scores, owner contacts and outreach scripts. An estimated ${market.noWebsitePct}% have no website. Start with 10 free leads.`;

  return buildMetadata({
    title,
    description,
    path: `/industries/${trade.slug}/${region.slug}`,
    keywords: [
      `${trade.name.toLowerCase()} contractor leads ${region.name}`,
      `${region.name} ${trade.name.toLowerCase()} contractors`,
      `${trade.name.toLowerCase()} leads for agencies`,
      "verified contractor leads",
    ],
    noIndex: !priority, // Non-priority trades (11 trades) get noindex, follow
  });
}

export default async function TradeRegionPage({ params }: Params) {
  const { slug, region: regionSlug } = await params;
  const trade = getTradeBySlug(slug);
  const region = getRegionBySlug(regionSlug);
  if (!trade || !region) notFound();

  const priority = isPriorityTrade(trade.slug);
  const lower = trade.name.toLowerCase();
  const regionLabel = usRegionLabelForState(region.code);
  const siblingCodes = siblingStateCodes(region.code, 10);
  const siblingRegions = siblingCodes
    .map((code) => SEO_REGIONS.find((r) => r.code === code))
    .filter(Boolean) as typeof SEO_REGIONS;
  const otherTrades = TRADE_PAGES.filter((t) => t.slug !== trade.slug);
  const finderHref = leadFinderDeepLink(trade.name, region.code);

  const market = getStateMarketData(trade.slug, trade.name, region.slug, region.name, region.code);

  const workflow = [
    {
      title: `1. Filter to ${region.name}`,
      body: `Set the market to ${region.name} (${region.code}), pick ${trade.name}, and filter by city or radius.`,
      icon: HiOutlineMapPin,
    },
    {
      title: "2. Read AI Scores",
      body: "Identify businesses with weak website and PPC presence that convert fastest on marketing pitches.",
      icon: HiOutlineSparkles,
    },
    {
      title: "3. Enrich Decision-Maker",
      body: "Extract verified owner names and review active Facebook/Meta ads intelligence.",
      icon: HiOutlineUserCircle,
    },
    {
      title: "4. Launch Outreach",
      body: "Generate personalized cold email, SMS, or call scripts directly in Outreach Studio.",
      icon: HiOutlineMegaphone,
    },
  ];

  return (
    <MarketingSiteShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: trade.name, path: `/industries/${trade.slug}` },
          {
            name: region.name,
            path: `/industries/${trade.slug}/${region.slug}`,
          },
        ])}
      />
      {priority && <JsonLd data={faqPageJsonLd(market.faqs)} />}

      <MarketingSubpageHero
        eyebrow={`${trade.name} · ${region.name}`}
        title={`${trade.name} contractor leads in ${region.name}`}
        description={`Find verified ${lower} contractors in ${region.name} (${region.code}) — live Google data, AI opportunity scores, owner contacts, and outreach scripts.`}
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            Start free — {region.name} {trade.name}
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/industries/${trade.slug}#states`}
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            All {trade.name} states
          </Link>
        </div>
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70">
          <li className="inline-flex items-center gap-1.5">
            <HiOutlineCheck className="h-4 w-4 text-fuchsia-300" />
            10 free leads on Starter
          </li>
          <li className="inline-flex items-center gap-1.5">
            <HiOutlineCheck className="h-4 w-4 text-fuchsia-300" />
            No credit card required
          </li>
        </ul>
      </MarketingSubpageHero>

      {/* Main Content Area: Data Blocks for Priority Trades */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {priority ? (
          <StateDataBlocks data={market} />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-slate-700">
            <p className="text-[14px]">
              Detailed {region.name} market estimates are published for our seven highest-volume trades. {trade.name} leads in {region.name} are fully searchable in the app with the same live Google data, AI scores and owner enrichment.
            </p>
          </div>
        )}
      </section>

      {/* Compact 4-Step Process Section */}
      <SubpageSection
        tone="dark"
        eyebrow="Workflow"
        title={`From search to first reply in ${region.name}`}
        description="Four steps in one workspace — no exporting, no second tool, no manual research pass."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={0.05 * i}>
                <SubpageCard
                  tone="dark"
                  icon={<Icon className="h-5 w-5" />}
                  title={step.title}
                  body={step.body}
                />
              </Reveal>
            );
          })}
        </div>
      </SubpageSection>

      {/* Neighbouring Markets */}
      <SubpageSection
        tone="light"
        eyebrow="More markets"
        title={`Other ${regionLabel} states for ${trade.name}`}
        description={`Browse neighbouring ${regionLabel} markets, or open the full ${trade.name} state list.`}
      >
        <Reveal>
          <SubpageLinkGrid
            columns={4}
            items={siblingRegions.map((r) => ({
              href: `/industries/${trade.slug}/${r.slug}`,
              label: r.name,
            }))}
          />
        </Reveal>
        <Reveal delay={0.1}>
          <Link
            href={`/industries/${trade.slug}#states`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-[13px] font-semibold text-fuchsia-800 transition hover:border-fuchsia-300"
          >
            Browse all {SEO_REGIONS.length} US states
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Reveal>
        <p className="mt-4 text-center text-[12px] text-slate-500">
          Signed in?{" "}
          <Link href={finderHref} className="font-semibold text-fuchsia-700 hover:underline">
            Open Lead Finder for {region.name} {trade.name}
          </Link>
        </p>
      </SubpageSection>

      {/* Other Trades in this State */}
      <SubpageSection
        tone="soft"
        eyebrow="Other industries"
        title={`Other trades in ${region.name}`}
        description={`The same live data and scoring works across every vertical we cover in ${region.name}.`}
      >
        <Reveal>
          <SubpageLinkGrid
            columns={4}
            items={otherTrades.map((t) => ({
              href: isPriorityTrade(t.slug)
                ? `/industries/${t.slug}/${region.slug}`
                : `/industries/${t.slug}`,
              label: t.name,
            }))}
          />
        </Reveal>
      </SubpageSection>

      <SubpageCtaBand
        title={`Find ${lower} leads in ${region.name}`}
        description={`Run a live ${region.name} search, get AI scores and owner contacts, and send your first sequence the same day.`}
        primaryLabel="Start free trial"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
