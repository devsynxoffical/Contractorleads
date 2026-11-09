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
import { leadFinderDeepLink } from "@/lib/marketing-us-regions";
import {
  SEO_REGIONS,
  TRADE_PAGES,
  buildMetadata,
  getRegionBySlug,
  getTradeBySlug,
  isPriorityTrade,
  lowerTradeLabel,
  tradeCompaniesLabel,
  tradeFindLabel,
} from "@/lib/seo";
import { buildStateInsight, getStateProfile, topCitiesForState } from "@/lib/state-profiles";
import { StateInsights } from "@/components/marketing/state-insights";
import { EMAIL_LIST_TRADES } from "@/lib/email-list-pages";

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

/** "Roofing Contractor Leads", but "General Contractor Leads" (not "General Contractors Contractor Leads"). */
function tradeLeadsLabel(name: string) {
  return /contractors$/i.test(name) ? `${name.replace(/s$/i, "")} Leads` : `${name} Contractor Leads`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, region: regionSlug } = await params;
  const trade = getTradeBySlug(slug);
  const region = getRegionBySlug(regionSlug);
  if (!trade || !region) return {};

  const priority = isPriorityTrade(trade.slug);

  // List intent ("roofing companies in Texas"), which matches what the page offers. The old
  // "[Trade] Contractor Leads in [State]" phrasing is mostly searched by contractors who
  // want homeowner leads, so those results are dominated by lead sellers.
  const leads = tradeLeadsLabel(trade.name);
  const companies = tradeCompaniesLabel(trade.slug, trade.name);
  // "Find [Trade] Leads in [State]" + "Company List": the find-leads phrasing with list intent.
  const find = tradeFindLabel(trade);
  const titleOptions = [
    `Find ${find} in ${region.name}: Company List`,
    `Find ${find} in ${region.name}`,
    `${companies} in ${region.name}`,
  ];
  const title = titleOptions.find((t) => t.length < 60) ?? titleOptions[titleOptions.length - 1];

  // Under 155 chars; only true statements (no modeled numbers in search results).
  const lower = lowerTradeLabel(companies);
  const descOptions = [
    `Find ${lowerTradeLabel(find)} in ${region.name}: ${lower} with owner names, verified emails and AI scores, from live Google data. 10 free leads.`,
    `Find ${lowerTradeLabel(find)} in ${region.name}: ${lower} with owner names, verified emails and AI scores. 10 free leads.`,
    `${companies} in ${region.name} with owner names, verified emails and AI scores. 10 free leads.`,
  ];
  const description = descOptions.find((d) => d.length < 155) ?? descOptions[descOptions.length - 1];

  return buildMetadata({
    title,
    description,
    path: `/industries/${trade.slug}/${region.slug}`,
    keywords: [
      `find ${lowerTradeLabel(find)} in ${region.name}`,
      `${lowerTradeLabel(find)} ${region.name}`,
      `${lower} in ${region.name}`,
      `list of ${lower} in ${region.name}`,
      `${leads.toLowerCase()} ${region.name}`,
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
  const lower = lowerTradeLabel(trade.name);
  const profile = getStateProfile(region.code);
  if (!profile) notFound();
  const topCities = topCitiesForState(region.code);
  const insight = buildStateInsight(trade.slug, trade.name, region.name, profile, topCities);
  // The four neighbouring (or nearest) states, per the internal linking plan.
  const neighbourRegions = profile.neighbours
    .map((code) => SEO_REGIONS.find((r) => r.code === code))
    .filter(Boolean) as typeof SEO_REGIONS;
  const otherTrades = TRADE_PAGES.filter((t) => t.slug !== trade.slug);
  const finderHref = leadFinderDeepLink(trade.name, region.code);

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
      {priority && <JsonLd data={faqPageJsonLd(insight.faqs, `/industries/${trade.slug}/${region.slug}`)} />}

      <MarketingSubpageHero
        eyebrow={`${trade.name} · ${region.name}`}
        title={`Find ${lowerTradeLabel(tradeFindLabel(trade))} in ${region.name}`}
        description={`Build a fresh list of ${lowerTradeLabel(tradeCompaniesLabel(trade.slug, trade.name))} in ${region.name} (${region.code}) for agency outreach: live Google data, owner names, verified emails, AI opportunity scores and outreach scripts.`}
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

      {/* State-specific guidance built from real state facts */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <StateInsights
          tradeName={trade.name}
          leadsLabel={tradeFindLabel(trade)}
          companiesLabel={tradeCompaniesLabel(trade.slug, trade.name)}
          stateName={region.name}
          stateCode={region.code}
          profile={profile}
          insight={insight}
          topCities={topCities}
          finderHref={finderHref}
        />
        {EMAIL_LIST_TRADES.some((t) => t.slug === trade.slug) ? (
          <p className="mt-6 text-center text-[14.5px] text-slate-700">
            Want a ready-to-send file?{" "}
            <Link href={`/email-lists/${trade.slug}`} className="font-semibold text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2 hover:decoration-fuchsia-500">
              Build a {lower} email list for {region.name}
            </Link>{" "}
            with owner names and verified emails.
          </p>
        ) : null}
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
        eyebrow="Neighbouring markets"
        title={`${trade.name} leads in states near ${region.name}`}
        description={`${profile.allBordering ? "Neighbouring" : "Neighbouring and nearby"} states for ${trade.name.toLowerCase()} prospecting, plus the full ${trade.name} state list.`}
      >
        <Reveal>
          <SubpageLinkGrid
            columns={4}
            items={neighbourRegions.map((r) => ({
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
