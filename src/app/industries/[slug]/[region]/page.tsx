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
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
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
    path: `/industries/${trade.slug}/${region.slug}`,
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

  const lower = trade.name.toLowerCase();
  const regionLabel = usRegionLabelForState(region.code);
  const siblingCodes = siblingStateCodes(region.code, 10);
  const siblingRegions = siblingCodes
    .map((code) => SEO_REGIONS.find((r) => r.code === code))
    .filter(Boolean) as typeof SEO_REGIONS;
  const otherTrades = TRADE_PAGES.filter((t) => t.slug !== trade.slug);
  const finderHref = leadFinderDeepLink(trade.name, region.code);

  const workflow = [
    {
      title: `Filter to ${region.name}`,
      body: `Set the market to ${region.name} (${region.code}), pick ${trade.name}, and tighten by city, radius, or ZIP code.`,
      icon: HiOutlineMapPin,
    },
    {
      title: "Read the scores",
      body: "Each business returns with website, PPC, SEO, and marketing-fit scores so the weakest digital presence rises to the top.",
      icon: HiOutlineSparkles,
    },
    {
      title: "Get the owner",
      body: "Decision-maker names and contact details are enriched from the company site, with Meta ad activity alongside them.",
      icon: HiOutlineUserCircle,
    },
    {
      title: "Send the first touch",
      body: "Generate email, SMS, or a call script from that lead's audit and send it from your own mailbox.",
      icon: HiOutlineMegaphone,
    },
  ];

  return (
    <MarketingSiteShell>
      <JsonLd data={softwareApplicationJsonLd()} />
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
            href={`/industries/${trade.slug}#markets`}
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

      <SubpageSection tone="tint">
        <SubpageStats
          items={[
            { value: region.code, label: `${region.name} market coverage` },
            { value: "Live", label: "Google & Yelp data at search time" },
            { value: "4", label: "AI scores on every lead" },
            {
              value: `${otherTrades.length + 1}`,
              label: `Trades searchable in ${region.name}`,
            },
          ]}
        />
      </SubpageSection>

      <SubpageSection
        tone="light"
        eyebrow="The opportunity"
        title={`Why ${region.name} ${lower} outreach works`}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <Reveal>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
              <p>{trade.angle}</p>
              <p>
                In {region.name}, that plays out as a long tail of {lower}{" "}
                businesses with solid reviews and a weak digital footprint — the
                exact profile that converts on a specific, evidence-backed pitch
                rather than a cold template.
              </p>
              <p>
                Contractor Leads scores that footprint for you, so your first line
                names a problem the owner already knows they have.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-fuchsia-700">
                What agencies get
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  `Live Google and Yelp data for ${region.name}`,
                  "AI scores for website, PPC, SEO, and fit",
                  "Owner enrichment and Meta ads context",
                  "Email, SMS, and call scripts per lead",
                  "Pipeline stages and CRM webhooks",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[14px] leading-relaxed text-slate-700"
                  >
                    <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </SubpageSection>

      <SubpageSection
        tone="dark"
        eyebrow="How it works"
        title={`From ${region.name} search to first reply`}
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
            href={`/industries/${trade.slug}#markets`}
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
              href: `/industries/${t.slug}/${region.slug}`,
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
