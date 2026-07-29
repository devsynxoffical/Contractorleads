import type { Metadata } from "next";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  HiOutlineArrowRight,
  HiOutlineBolt,
  HiOutlineChartBarSquare,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineCpuChip,
  HiOutlineEnvelope,
  HiOutlineFunnel,
  HiOutlineGlobeAmericas,
  HiOutlineMagnifyingGlass,
  HiOutlineMap,
  HiOutlineMegaphone,
  HiOutlineRectangleStack,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import {
  SubpageCard,
  SubpageCtaBand,
  SubpageSection,
  type SectionTone,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
import { TRADE_PAGES, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Features — AI contractor lead finder for agencies | US, UK, CA, AU, NZ",
  description:
    "Lead Finder, AI scoring, owner enrichment, Meta ads intel, Outreach Studio, pipeline CRM, email & SMS — everything agencies need to prospect home-service contractors across the US, Canada, UK, Australia, and New Zealand.",
  path: "/features",
  keywords: [
    "contractor lead generation software",
    "AI contractor lead scoring",
    "contractor prospecting software for agencies",
    "contractor leads UK",
    "contractor leads Canada",
    "contractor leads Australia",
    "tradie leads New Zealand",
    "home service lead finder",
    "cold outreach software for agencies",
  ],
});

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  CA: "🇨🇦",
  GB: "🇬🇧",
  AU: "🇦🇺",
  NZ: "🇳🇿",
};

type Feature = {
  title: string;
  body: string;
  icon: IconType;
};

/** Alternating bands so the page breathes like the homepage instead of one flat grid. */
const GROUP_TONES: SectionTone[] = ["tint", "light", "dark", "light"];

const FEATURE_GROUPS: Array<{
  eyebrow: string;
  heading: string;
  intro: string;
  features: Feature[];
}> = [
  {
    eyebrow: "Step 1 — Find",
    heading: "Build the list from live data, not a stale spreadsheet",
    intro:
      "Every search hits live business data at the moment you run it, so the contractor you call today still exists, still trades, and still answers the phone.",
    features: [
      {
        title: "Lead Finder",
        body: "Search live Google Places data by trade, city, region, radius, or postcode — not a static purchased list resold to twenty other agencies.",
        icon: HiOutlineMagnifyingGlass,
      },
      {
        title: "Multi-country coverage",
        body: "Prospect across the United States, Canada, the United Kingdom, Australia, and New Zealand, with local address, region, and postcode formats handled for you.",
        icon: HiOutlineGlobeAmericas,
      },
      {
        title: "Lead Map",
        body: "See contractor density by metro before you spend a credit or a pound of ad budget, so you pick territories that can actually support a retainer.",
        icon: HiOutlineMap,
      },
    ],
  },
  {
    eyebrow: "Step 2 — Qualify",
    heading: "Know who is worth a pitch before you open your mouth",
    intro:
      "Scoring runs on the contractor's real digital footprint — their site, their rankings, their ad activity — so your first line already names a problem they recognise.",
    features: [
      {
        title: "AI lead scoring",
        body: "Every lead gets website, PPC, SEO, and marketing-opportunity scores, so you dial the accounts with the biggest visible gap first.",
        icon: HiOutlineSparkles,
      },
      {
        title: "Owner enrichment",
        body: "Decision-maker names pulled from the business site and cross-checked — never guessed from a first.last@ pattern that bounces.",
        icon: HiOutlineUserCircle,
      },
      {
        title: "Meta ads intel",
        body: "Check Facebook Ads Library context before you pitch, so you know whether they already spend and what angle they are running.",
        icon: HiOutlineMegaphone,
      },
      {
        title: "Social presence filter",
        body: "Require a verified LinkedIn profile, active social accounts, and an identified owner before a lead is allowed into your results.",
        icon: HiOutlineFunnel,
      },
      {
        title: "Verified sources",
        body: "Google, Yelp, and live website data only. When a field cannot be verified we leave it blank — a gap beats an invented phone number.",
        icon: HiOutlineShieldCheck,
      },
      {
        title: "Qualification reports",
        body: "Open any score to get a written breakdown of what is broken, why it matters commercially, and which service to lead with.",
        icon: HiOutlineChartBarSquare,
      },
    ],
  },
  {
    eyebrow: "Step 3 — Reach out",
    heading: "Turn a scored lead into a booked call the same morning",
    intro:
      "Outreach is generated per lead from that lead's own audit, so the copy references their actual site and their actual market instead of a generic template.",
    features: [
      {
        title: "Outreach Studio",
        body: "Generate cold email, SMS, follow-up sequences, and call scripts for a specific lead in one click, then save the winners to your library.",
        icon: HiOutlineEnvelope,
      },
      {
        title: "Email and SMS sending",
        body: "Send from your own SMTP mailbox so replies land where you already work, and add Twilio SMS with the Messaging add-on for text follow-up.",
        icon: HiOutlineChatBubbleLeftRight,
      },
      {
        title: "Morning Digest",
        body: "Start the day with a short ranked list of the leads most worth contacting right now, each one ready to email without extra digging.",
        icon: HiOutlineBolt,
      },
    ],
  },
  {
    eyebrow: "Step 4 — Manage",
    heading: "Keep the pipeline in one place and feed the tools you already pay for",
    intro:
      "Contractor Leads does not ask you to abandon your CRM or your reporting stack. It fills them, and it answers questions about your own pipeline.",
    features: [
      {
        title: "Pipeline CRM",
        body: "Save leads, move stages, favourite hot accounts, and keep notes and call outcomes without paying for a second tool.",
        icon: HiOutlineRectangleStack,
      },
      {
        title: "Integrations",
        body: "Push new leads and status changes to GoHighLevel, Zapier, Make, HubSpot, Slack, or any custom webhook — and export to CSV when someone wants a spreadsheet.",
        icon: HiOutlineArrowRight,
      },
      {
        title: "Ask Contractor Leads",
        body: "A growth assistant that already knows your agency, your ICP, and your goal from onboarding, so you skip re-explaining context every session.",
        icon: HiOutlineCpuChip,
      },
    ],
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Pick a market",
    body: "Choose a trade, a country, and a city or radius. Layer on filters for rating, review count, website quality, or social presence.",
  },
  {
    step: "02",
    title: "Let scoring sort them",
    body: "Leads come back scored Hot, Warm, or Nurture with the specific weaknesses that make each one a fit for what you sell.",
  },
  {
    step: "03",
    title: "Send the first touch",
    body: "Generate email, SMS, or a call script from that lead's audit and send it from your own mailbox in the same session.",
  },
  {
    step: "04",
    title: "Work the pipeline",
    body: "Track replies and stages in the built-in CRM while webhooks mirror every change into your CRM of record.",
  },
];

const COMPARISON: Array<{ point: string; us: string; them: string }> = [
  {
    point: "Where the data comes from",
    us: "Live Google Places, Yelp, and the contractor's own website, fetched when you search",
    them: "A brokered list scraped months ago and resold to every agency in your niche",
  },
  {
    point: "Contact accuracy",
    us: "Owner names verified against the business site; unverified fields left blank",
    them: "Pattern-guessed emails that bounce and burn your sending domain",
  },
  {
    point: "Prioritisation",
    us: "AI scores for website, SEO, PPC, and overall marketing opportunity",
    them: "An alphabetical spreadsheet with no signal about who needs you",
  },
  {
    point: "Outreach",
    us: "Per-lead email, SMS, and call scripts written from that lead's audit",
    them: "One generic template you rewrite by hand for every prospect",
  },
  {
    point: "Coverage",
    us: "United States, Canada, United Kingdom, Australia, and New Zealand",
    them: "Usually a single country, often a single state",
  },
];

const FEATURE_FAQ = [
  {
    q: "Which countries does Contractor Leads cover?",
    a: "Contractor Leads supports five Tier-1 markets: the United States, Canada, the United Kingdom, Australia, and New Zealand. Each market uses its own address, region, and postal formats — states and ZIP codes in the US, provinces and postal codes in Canada, counties and postcodes in the UK, states and postcodes in Australia, and regions and postcodes in New Zealand. Distances are shown in miles or kilometres to match the market you are searching.",
  },
  {
    q: "Is this for marketing agencies or for contractors?",
    a: "It is built for marketing agencies, media buyers, and B2B sales teams that sell services to home-service contractors. It is not a directory for homeowners looking to hire a plumber or a roofer.",
  },
  {
    q: "How is this different from buying a contractor lead list?",
    a: "Purchased lists are static snapshots resold repeatedly, so contact data decays and every agency pitches the same businesses. Contractor Leads queries live business data at search time, verifies owner details against the company website, and scores each lead on the marketing gaps you can actually fix.",
  },
  {
    q: "Which trades can I prospect?",
    a: `You can search ${INDUSTRIES.length} home-service verticals including ${INDUSTRIES.slice(0, 6).join(", ")}, and more. Each trade has its own landing page explaining how that market buys marketing services.`,
  },
  {
    q: "Do I need my own OpenAI API key?",
    a: "No. Scoring, qualification reports, outreach generation, and the Ask Contractor Leads assistant all run on our backend. There is nothing extra to configure or pay for separately.",
  },
  {
    q: "Can I push leads into my existing CRM?",
    a: "Yes. Contractor Leads delivers new leads and status changes to GoHighLevel, Zapier, Make, HubSpot, Slack, or any custom webhook endpoint, and you can export to CSV at any time.",
  },
  {
    q: "Do I send outreach from Contractor Leads or from my own mailbox?",
    a: "From your own mailbox. Connect your SMTP credentials so email arrives from your domain and replies land in the inbox you already monitor. SMS sending is available through Twilio with the Messaging add-on.",
  },
];

export default function FeaturesPage() {
  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Features", path: "/features" },
          ]),
          softwareApplicationJsonLd(),
          faqPageJsonLd(FEATURE_FAQ),
        ]}
      />
      <MarketingSubpageHero
        eyebrow="Features"
        title="Contractor prospecting without the five-tab circus"
        description="Live business search, AI scoring, owner contacts, ad intel, and outreach in one workspace — for agencies selling into home-service trades across five Tier-1 markets."
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
            href="/pricing"
            className="inline-flex rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-fuchsia-300"
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
          <li className="inline-flex items-center gap-1.5">
            <HiOutlineCheck className="h-4 w-4 text-fuchsia-300" />
            {INDUSTRIES.length} trades, 5 countries
          </li>
        </ul>
      </MarketingSubpageHero>

      <SubpageSection
        id="coverage"
        tone="light"
        align="center"
        eyebrow="Coverage"
        title="Not a US-only tool"
        description="Contractor Leads searches live business data across five English-speaking Tier-1 markets. Pick your country and the whole app adapts — region labels, postal formats, distance units, and phone formatting all follow the market you sell into."
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TIER_ONE_COUNTRIES.map((country, i) => (
            <li key={country.code}>
              <Reveal delay={0.05 * i}>
                <div className="h-full rounded-2xl border border-violet-100 bg-[#faf8fc] p-4 text-center">
                  <span className="text-2xl" aria-hidden>
                    {COUNTRY_FLAGS[country.code]}
                  </span>
                  <p className="mt-2 text-[14px] font-semibold text-slate-900">
                    {country.name}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                    {country.regionLabel} · {country.postalLabel} ·{" "}
                    {country.distanceUnit}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </SubpageSection>

      {FEATURE_GROUPS.map((group, gi) => {
        const tone = GROUP_TONES[gi % GROUP_TONES.length];
        return (
          <SubpageSection
            key={group.eyebrow}
            id={`group-${gi}`}
            tone={tone}
            eyebrow={group.eyebrow}
            title={group.heading}
            description={group.intro}
            decor={gi === 1}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.features.map((f, fi) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={0.05 * fi}>
                    <SubpageCard
                      tone={tone}
                      icon={<Icon className="h-5 w-5" />}
                      title={f.title}
                      body={f.body}
                    />
                  </Reveal>
                );
              })}
            </div>
          </SubpageSection>
        );
      })}

      <SubpageSection
        id="workflow"
        tone="tint"
        align="center"
        eyebrow="How it works"
        title="From empty screen to first booked call"
        description="Four steps, one workspace. Most agencies run their first scored batch within ten minutes of signing up."
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((s, i) => (
            <li key={s.step}>
              <Reveal delay={0.06 * i}>
                <div className="h-full rounded-2xl border border-violet-100 bg-white p-5">
                  <span className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-none text-fuchsia-200">
                    {s.step}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </SubpageSection>

      <SubpageSection
        id="compare"
        tone="light"
        align="center"
        eyebrow="Comparison"
        title="Contractor Leads vs a purchased lead list"
        description="Bought lists are cheap because they are already spent. Here is what changes when the data is fetched live and scored for fit."
      >
        <Reveal className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Feature comparison between Contractor Leads and purchased contractor lead
                lists
              </caption>
              <thead>
                <tr className="border-b border-violet-100 bg-[#faf8fc]">
                  <th
                    scope="col"
                    className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    What matters
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-fuchsia-700"
                  >
                    Contractor Leads
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Purchased list
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr
                    key={row.point}
                    className="border-b border-violet-50 align-top last:border-0"
                  >
                    <th
                      scope="row"
                      className="px-4 py-4 text-[13.5px] font-semibold text-slate-900"
                    >
                      {row.point}
                    </th>
                    <td className="px-4 py-4 text-[13.5px] leading-relaxed text-slate-700">
                      <span className="flex gap-2">
                        <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {row.us}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[13.5px] leading-relaxed text-slate-500">
                      <span className="flex gap-2">
                        <HiOutlineXMark className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                        {row.them}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </SubpageSection>

      <SubpageSection
        id="trades"
        tone="soft"
        align="center"
        eyebrow="Industries"
        title={`Every feature works across ${INDUSTRIES.length} home-service trades`}
        description="Scoring weights and outreach angles adapt to the vertical you pitch. Open a trade to see how that market buys marketing."
      >
        <Reveal>
          <ul className="flex flex-wrap justify-center gap-2">
            {TRADE_PAGES.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/industries/${t.slug}`}
                  className="inline-flex rounded-full border border-violet-100 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-fuchsia-300 hover:text-fuchsia-700"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </SubpageSection>

      <SubpageSection
        id="faq"
        tone="light"
        eyebrow="FAQs"
        title="Questions agencies ask before signing up"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {FEATURE_FAQ.map((item, i) => (
            <Reveal key={item.q} delay={0.04 * i}>
              <details className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm open:border-fuchsia-200">
                <summary className="cursor-pointer list-none font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="Run your first scored batch today"
        description="Start on Starter with 10 free leads, pick a trade and a market, and see what your next ten pitches should be."
        primaryLabel="Get started free"
        secondaryHref="/blog"
        secondaryLabel="Read the playbooks"
        note="No credit card required · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
