import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
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
  SubpageSection,
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { IndustryLocationSection } from "@/components/marketing/industry-location-section";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import { TIER_ONE_COUNTRIES } from "@/lib/constants";
import {
  SEO_REGIONS,
  TRADE_PAGES,
  buildMetadata,
  getTradeBySlug,
} from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TRADE_PAGES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trade = getTradeBySlug(slug);
  if (!trade) return {};
  return buildMetadata({
    title: trade.headline,
    description: trade.description,
    path: `/industries/${trade.slug}`,
    keywords: trade.keywords,
  });
}

const LEAD_DATA = [
  {
    title: "Live business data",
    body: "Google and Yelp records pulled at search time — never a brokered dump that decayed months ago.",
    icon: HiOutlineMagnifyingGlass,
  },
  {
    title: "Contact and reputation",
    body: "Phone, website, rating, and review-velocity signals whenever the source publishes them.",
    icon: HiOutlineShieldCheck,
  },
  {
    title: "Owner enrichment",
    body: "Decision-maker names read off the company site and cross-checked, not guessed from an email pattern.",
    icon: HiOutlineUserCircle,
  },
  {
    title: "AI opportunity scores",
    body: "Website, PPC, SEO, and overall marketing-fit scores so you know which gap to lead the call with.",
    icon: HiOutlineSparkles,
  },
  {
    title: "Outreach that fits",
    body: "Cold email, SMS, and call scripts generated from that specific contractor's audit.",
    icon: HiOutlineChatBubbleLeftRight,
  },
];

export default async function TradePage({ params }: Params) {
  const { slug } = await params;
  const trade = getTradeBySlug(slug);
  if (!trade) notFound();

  const lower = trade.name.toLowerCase();
  const related = TRADE_PAGES.filter((t) => t.slug !== trade.slug).slice(0, 6);

  return (
    <MarketingSiteShell>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: trade.name, path: `/industries/${trade.slug}` },
        ])}
      />

      <MarketingSubpageHero
        eyebrow={`${trade.name} leads`}
        title={trade.headline}
        description={trade.description}
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            Find {trade.name} leads free
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            View plans
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
            { value: "Live", label: "Google & Yelp data at search time" },
            { value: "4", label: "AI scores on every lead" },
            {
              value: `${SEO_REGIONS.length}`,
              label: `US state markets for ${lower}`,
            },
            {
              value: `${TIER_ONE_COUNTRIES.length}`,
              label: "Countries you can prospect",
            },
          ]}
        />
      </SubpageSection>

      <SubpageSection
        tone="light"
        eyebrow="The opportunity"
        title={`Why agencies pitch ${lower} contractors`}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <Reveal>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
              <p>{trade.angle}</p>
              <p>
                Most {lower} businesses in this space are still winning work on
                referrals and a website nobody has touched in three years. That gap
                is your pitch — and Contractor Leads shows you exactly how wide it
                is before you pick up the phone.
              </p>
              <p>
                Filter by market, sort by opportunity score, and open a lead to see
                the site audit, the ad activity, and the owner worth calling.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-fuchsia-700">
                Good fit if you sell
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Local SEO and Google Business Profile work",
                  "Paid search and Local Services Ads",
                  "Meta ads and creative production",
                  "Website rebuilds and landing pages",
                  "CRM setup and lead-response automation",
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
        eyebrow="Every record"
        title="What you get on every lead"
        description={`Each ${lower} business comes back enriched and scored, so the list is ready to work instead of ready to research.`}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEAD_DATA.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={0.05 * i}>
                <SubpageCard
                  tone="dark"
                  icon={<Icon className="h-5 w-5" />}
                  title={item.title}
                  body={item.body}
                />
              </Reveal>
            );
          })}
        </div>
      </SubpageSection>

      <SubpageSection
        tone="light"
        id="markets"
        eyebrow="By location"
        title={`Find ${trade.name} leads by US state`}
        description={`Choose a state to see how agencies prospect ${lower} contractors in that market — then run a live search in Lead Finder with AI scores and owner contacts.`}
        align="center"
      >
        <IndustryLocationSection
          industryName={trade.name}
          industrySlug={trade.slug}
        />
      </SubpageSection>

      <SubpageSection
        tone="soft"
        eyebrow="Related industries"
        title="Other trades agencies pair with this one"
        description="Most agencies run two or three adjacent verticals off the same offer. These are the closest fits."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((t, i) => (
            <Reveal key={t.slug} delay={0.05 * i}>
              <Link href={`/industries/${t.slug}`} className="group block h-full">
                <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                  <h3 className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900">
                    {t.name}
                  </h3>
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

      <SubpageCtaBand
        title={`Start prospecting ${lower} contractors`}
        description={`Pull a live, AI-scored ${lower} list with owner contacts and outreach scripts — in any market you sell into.`}
        primaryLabel="Start free trial"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
