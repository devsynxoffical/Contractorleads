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
  SubpageLinkGrid,
  SubpageSection,
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { IndustryLocationSection } from "@/components/marketing/industry-location-section";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
  faqPageJsonLd,
  serviceJsonLd,
} from "@/components/seo/json-ld";
import { TIER_ONE_COUNTRIES } from "@/lib/constants";
import {
  SEO_REGIONS,
  TRADE_PAGES,
  buildMetadata,
  getTradeBySlug,
  isPriorityTrade,
  lowerTradeLabel,
  tradeCompaniesLabel,
  tradeFindLabel,
} from "@/lib/seo";
import { BLOG_POSTS } from "@/lib/blog-content";
import { getTradeHubContent } from "@/lib/trade-hub-content";
import { EMAIL_LIST_TRADES } from "@/lib/email-list-pages";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TRADE_PAGES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trade = getTradeBySlug(slug);
  if (!trade) return {};
  // Keyword first, then the offer (the pattern Hunter and Prospeo use on tool pages).
  // "Find [Trade] Leads" (the user's target phrasing, as Apollo and Prospeo use it) plus
  // "Companies for Agencies", which tells Google this is B2B prospecting, not homeowner leads.
  const find = tradeFindLabel(trade);
  const companies = tradeCompaniesLabel(trade.slug, trade.name);
  const titleOptions = [`Find ${find}: ${companies} for Agencies`, `Find ${find} for Agencies`, `Find ${find}`];
  const title = titleOptions.find((t) => t.length < 60) ?? `Find ${find}`;
  const descOptions = [
    `Find ${lowerTradeLabel(find)} for your agency: ${lowerTradeLabel(companies)} with owner names, verified emails and AI scores by city or state. 10 free leads.`,
    `Find ${lowerTradeLabel(find)}: ${lowerTradeLabel(companies)} with owner names, verified emails and AI scores. 10 free leads.`,
  ];
  return buildMetadata({
    title,
    description: descOptions.find((d) => d.length < 155) ?? descOptions[descOptions.length - 1],
    path: `/industries/${trade.slug}`,
    keywords: [
      `find ${lowerTradeLabel(find)}`,
      lowerTradeLabel(find),
      `list of ${lowerTradeLabel(companies)}`,
      `${lowerTradeLabel(companies)} email list`,
      ...trade.keywords,
    ],
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

  const lower = lowerTradeLabel(trade.name);
  const related = TRADE_PAGES.filter((t) => t.slug !== trade.slug).slice(0, 6);
  const priority = isPriorityTrade(trade.slug);
  const hub = getTradeHubContent(trade.slug);
  const quickAnswer = hub?.quickAnswer ?? {
    q: `How do agencies find ${lower} contractor leads?`,
    a: `Search live Google data for ${lower} businesses by city or state, then prioritise the ones with strong reviews but weak websites or no ads. ${trade.description} Every lead includes AI scores for website, SEO, ads and marketing, and your first 10 leads are free.`,
  };
  const playbooks = BLOG_POSTS.filter((p) =>
    p.relatedIndustries?.includes(trade.slug),
  ).slice(0, 4);

  return (
    <MarketingSiteShell>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={serviceJsonLd({
          name: `${trade.name} contractor leads for agencies`,
          description: trade.description,
          path: `/industries/${trade.slug}`,
          serviceType: `${trade.name} contractor lead generation data`,
        })}
      />
      {hub && <JsonLd data={faqPageJsonLd(hub.faqs, `/industries/${trade.slug}`)} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: trade.name, path: `/industries/${trade.slug}` },
        ])}
      />

      <MarketingSubpageHero
        eyebrow={`${trade.name} leads`}
        title={`Find ${lowerTradeLabel(tradeFindLabel(trade))} for your agency`}
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
              value: `${TIER_ONE_COUNTRIES.length}`,
              label: "Countries you can prospect",
            },
            {
              value: "10 Free",
              label: "Leads on signup with no card",
            },
          ]}
        />
      </SubpageSection>

      {/* Trade-specific quick answer and buying guide (no illustrative statistics) */}
      <section className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50/60 to-fuchsia-50/60 p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold text-slate-900">
            {quickAnswer.q}
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-700">{quickAnswer.a}</p>
          {EMAIL_LIST_TRADES.some((t) => t.slug === trade.slug) ? (
            <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-slate-700">
              Need contacts to email?{" "}
              <Link href={`/email-lists/${trade.slug}`} className="font-semibold text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2 hover:decoration-fuchsia-500">
                Build a verified {lower} email list
              </Link>{" "}
              for any city or state, with owner names and checked emails.
            </p>
          ) : null}

          {hub && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-2xs">
                <h3 className="text-[15px] font-bold text-slate-900">What {lower} owners buy from agencies</h3>
                <ul className="mt-3 space-y-2">
                  {hub.buys.map((b) => (
                    <li key={b} className="flex gap-2 text-[14px] leading-relaxed text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-2xs">
                <h3 className="text-[15px] font-bold text-slate-900">When {lower} companies buy marketing</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-700">{hub.season}</p>
                <Link
                  href={`#states`}
                  className="mt-4 inline-flex text-[13px] font-semibold text-fuchsia-700 hover:underline"
                >
                  See timing for your state →
                </Link>
              </div>
            </div>
          )}

          {hub?.searchTerms?.length ? (
            <div className="mt-5 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-2xs">
              <h3 className="text-[15px] font-bold text-slate-900">Searches {lower} companies want to rank for</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-700">
                These are the searches homeowners use to find {lower} companies. Check where a prospect appears for them in its own city before you pitch, and lead with the gap you find.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {hub.searchTerms.map((t) => (
                  <li key={t} className="rounded-full bg-violet-50 px-3 py-1 text-[13px] font-medium text-violet-800 ring-1 ring-violet-100">
                    {t} + city
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hub?.mistakes?.length ? (
            <div className="mt-5 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-2xs">
              <h3 className="text-[15px] font-bold text-slate-900">Mistakes agencies make pitching {lower} companies</h3>
              <ul className="mt-3 space-y-3">
                {hub.mistakes.map((m) => {
                  const dot = m.indexOf(". ");
                  return (
                    <li key={m} className="text-[14px] leading-relaxed text-slate-700">
                      <b className="text-slate-900">{m.slice(0, dot + 1)}</b> {m.slice(dot + 2)}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* Related guides for this trade (driven by BLOG_POSTS.relatedIndustries) */}
          {playbooks.length > 0 && (
            <div className="mt-6 rounded-2xl border border-violet-200 bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-wider text-fuchsia-600">
                Recommended {trade.name} Playbooks
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                {playbooks.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="font-semibold text-fuchsia-700 hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

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
        title={`Find ${trade.name} leads by country`}
        description={`Prospect verified ${lower} contractors across the United States, Canada, the UK, Australia, and New Zealand — same live data and AI scores everywhere.`}
        align="center"
      >
        <IndustryLocationSection industryName={trade.name} />
      </SubpageSection>

      {priority && (
        <SubpageSection
          tone="tint"
          id="states"
          eyebrow="United States"
          title={`${trade.name} contractor leads by state`}
          description={`State-level market estimates, opening angles and FAQs for ${lower} contractors in every US state.`}
        >
          <Reveal>
            <SubpageLinkGrid
              columns={5}
              items={SEO_REGIONS.map((r) => ({
                href: `/industries/${trade.slug}/${r.slug}`,
                label: r.name,
              }))}
            />
          </Reveal>
        </SubpageSection>
      )}

      {hub && (
        <SubpageSection tone="light" eyebrow="FAQ" title={`${trade.name} contractor leads: FAQ`}>
          <dl className="mx-auto max-w-3xl divide-y divide-violet-100 rounded-2xl border border-violet-100 bg-white px-6 shadow-xs">
            {hub.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-[15.5px] font-semibold text-slate-900">{f.q}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-slate-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </SubpageSection>
      )}

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
