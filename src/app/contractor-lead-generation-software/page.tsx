import type { Metadata } from "next";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  HiOutlineArrowRight,
  HiOutlineBolt,
  HiOutlineCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCpuChip,
  HiOutlineMagnifyingGlass,
  HiOutlineMegaphone,
  HiOutlineRectangleStack,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
import {
  SubpageCard,
  SubpageCtaBand,
  SubpageSection,
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";
import { BLOG_POSTS } from "@/lib/blog-content";
import { PRIORITY_TRADE_SLUGS, TRADE_PAGES, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor Lead Generation Software for Agencies | Contractor Leads",
  description:
    "Contractor lead generation software built for agencies: live Google data, AI lead scoring, owner contacts and outreach scripts for 18 home-service trades. 10 free leads, no card.",
  path: "/contractor-lead-generation-software",
  keywords: [
    "contractor lead generation software",
    "contractor prospecting software",
    "home service lead generation software",
    "lead generation software for marketing agencies",
    "contractor leads for agencies",
    "agency lead finder",
    "B2B lead generation for home services",
    "contractor CRM for agencies",
  ],
});

type Capability = { title: string; body: string; icon: IconType };

const MUST_HAVES: Capability[] = [
  {
    title: "Live business data, not a resold list",
    body: "Most contractor lead lists are scraped once and resold for a year. Good software queries Google Places at the moment you search, so the business still exists, still trades and still answers the phone.",
    icon: HiOutlineMagnifyingGlass,
  },
  {
    title: "AI lead scoring that names the gap",
    body: "A list is only useful if it tells you who to call first. Look for website, SEO, PPC and overall marketing scores on every record, rolled into Hot, Warm and Nurture tiers.",
    icon: HiOutlineSparkles,
  },
  {
    title: "Owner names you can verify",
    body: "Pattern-guessed emails bounce and burn your sending domain. The owner name should come from the contractor's own website and be left blank when it cannot be confirmed.",
    icon: HiOutlineUserCircle,
  },
  {
    title: "Ad intelligence before the pitch",
    body: "Knowing whether a roofer already runs Facebook ads changes the first sentence of your email. Meta Ads Library status should sit on the lead card, not in a separate tab.",
    icon: HiOutlineMegaphone,
  },
  {
    title: "Outreach written from the audit",
    body: "Cold email, SMS and call scripts generated from that specific lead's scores convert better than one template you rewrite forty times a day.",
    icon: HiOutlineChatBubbleLeftRight,
  },
  {
    title: "A pipeline and your CRM, both fed",
    body: "Saved leads, stages and notes belong in the tool, and every change should mirror into GoHighLevel, HubSpot, Zapier, Make or a webhook so your CRM of record stays current.",
    icon: HiOutlineRectangleStack,
  },
];

const ROLES = [
  {
    title: "Marketing agencies",
    body: "Build a daily list of contractors with a visible marketing gap, pitch the specific service that fixes it, and track replies through to a signed retainer.",
    bullets: [
      "Filter by trade, city, rating and website quality",
      "Lead with the lowest score: web, SEO or paid",
      "Send from your own Gmail, Outlook or SMTP",
    ],
  },
  {
    title: "Media buyers and PPC shops",
    body: "Find contractors who are not yet advertising on Meta or Google, or who are advertising badly, and open with the ad they are missing.",
    bullets: [
      "Meta Ads Intel on every lead",
      "PPC opportunity score 0 to 100",
      "Local Services Ads angle for licensed trades",
    ],
  },
  {
    title: "Sales and SDR teams",
    body: "Replace the morning research block with a ranked queue. Reps open the app, call the Hot tier, and log outcomes without touching a spreadsheet.",
    bullets: [
      "Morning Digest of the leads worth calling now",
      "Call scripts per lead in Outreach Studio",
      "Team seats and shared credit pool on Agency",
    ],
  },
];

const COMPARE: Array<{ point: string; us: string; list: string; scraper: string }> = [
  {
    point: "Data freshness",
    us: "Live Google Places query at search time",
    list: "Months-old snapshot resold to many buyers",
    scraper: "Fresh at scrape time, then decays in your sheet",
  },
  {
    point: "Owner contact",
    us: "Read from the business site, blank if unverified",
    list: "Often pattern-guessed, high bounce rate",
    scraper: "Not included",
  },
  {
    point: "Who to call first",
    us: "AI scores and Hot / Warm / Nurture tiers",
    list: "None",
    scraper: "None",
  },
  {
    point: "Ad activity",
    us: "Meta Ads Intel on the lead card",
    list: "None",
    scraper: "Manual Ads Library check",
  },
  {
    point: "Outreach",
    us: "Per-lead email, SMS and call scripts",
    list: "Write your own",
    scraper: "Write your own",
  },
  {
    point: "CRM hand-off",
    us: "Webhooks to GoHighLevel, HubSpot, Zapier, Make, Slack",
    list: "CSV import",
    scraper: "CSV import or custom code",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Choose a trade and a market",
    body: "Pick from 18 home-service trades, choose a country, then narrow to a state, city, postal code or radius.",
  },
  {
    step: "02",
    title: "Read the scores",
    body: "Every lead returns website, SEO, PPC and marketing scores plus a tier. Sort by the gap your agency fixes.",
  },
  {
    step: "03",
    title: "Generate the first touch",
    body: "Open Outreach Studio for a cold email, SMS or call script written from that contractor's own audit.",
  },
  {
    step: "04",
    title: "Work the pipeline",
    body: "Save, stage and follow up in the built-in CRM while webhooks mirror every change into the tools you already pay for.",
  },
];

const FAQS = [
  {
    q: "What is contractor lead generation software?",
    a: "Contractor lead generation software finds home-service businesses such as roofers, HVAC companies and plumbers, enriches each record with contact and marketing data, and helps you reach out. Contractor Leads is built for agencies and sales teams that sell to contractors, not for homeowners looking to hire one.",
  },
  {
    q: "How is this different from buying a contractor lead list?",
    a: "A purchased list is a static file resold to many agencies, so the data decays and every buyer pitches the same businesses. Contractor Leads queries live Google Places data when you search, verifies the owner against the business website, and scores each lead so you know who to call first.",
  },
  {
    q: "Which trades and countries are covered?",
    a: `Contractor Leads covers ${INDUSTRIES.length} home-service trades, including roofing, HVAC, plumbing, electrical, solar, remodeling and general contractors, across ${TIER_ONE_COUNTRIES.length} countries: the United States, Canada, the United Kingdom, Australia and New Zealand.`,
  },
  {
    q: "How much does contractor lead generation software cost?",
    a: "Contractor Leads gives every new account 10 free scored leads with no credit card. Paid plans start at $19.99 a month for 500 credits on Starter, $49 for 2,000 on Growth and $99 for 5,000 on Agency. One credit equals one lead, and annual billing lowers the monthly price.",
  },
  {
    q: "Does it replace my CRM?",
    a: "It includes a pipeline CRM for saved leads, stages and notes, but it is designed to feed your CRM of record. Leads and status changes push to GoHighLevel, HubSpot, Zapier, Make, Slack or any webhook on Growth and above, and CSV or Excel export is on every plan.",
  },
  {
    q: "Can I send outreach from the software?",
    a: "Yes. Connect your own Gmail, Outlook or SMTP mailbox so emails come from your domain and replies land where you already work. SMS follow-up is available through Twilio with the Messaging add-on.",
  },
];

export default function ContractorLeadGenerationSoftwarePage() {
  const priorityTrades = TRADE_PAGES.filter((t) =>
    (PRIORITY_TRADE_SLUGS as readonly string[]).includes(t.slug),
  );
  const guides = BLOG_POSTS.filter((p) =>
    ["agency-lead-generation", "how-to-get-contractor-leads", "cold-email-for-agencies", "apollo-vs-google-maps-scraper"].includes(p.slug),
  );

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            {
              name: "Contractor Lead Generation Software",
              path: "/contractor-lead-generation-software",
            },
          ]),
          softwareApplicationJsonLd(),
          faqPageJsonLd(FAQS),
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
            Buyer&apos;s guide and product tour
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-white">
            Contractor lead generation software built for agencies
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75">
            Contractor Leads finds home-service businesses from live Google data, scores each one
            for marketing fit, adds the owner&apos;s name and Meta ad status, and writes the first
            email. This page explains what to look for in contractor prospecting software and how
            Contractor Leads measures up.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:opacity-95"
            >
              Get 10 free scored leads
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-full border border-white/20 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              See pricing
            </Link>
          </div>
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70">
            {[
              "No credit card required",
              `${INDUSTRIES.length} trades, ${TIER_ONE_COUNTRIES.length} countries`,
              "1 credit = 1 lead",
            ].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <HiOutlineCheck className="h-4 w-4 text-fuchsia-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <SubpageSection tone="tint">
        <SubpageStats
          items={[
            { value: "Live", label: "Google Places data at search time" },
            { value: "4", label: "AI scores on every lead" },
            { value: `${INDUSTRIES.length}`, label: "Home-service trades" },
            { value: "10", label: "Free leads on signup" },
          ]}
        />
      </SubpageSection>

      <SubpageSection
        tone="light"
        eyebrow="What to look for"
        title="Six things contractor lead generation software must do"
        description="Agencies that sell to contractors keep running into the same failures: stale lists, guessed emails, no signal about who needs help. Use this checklist when you evaluate any tool, including ours."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MUST_HAVES.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={0.05 * i}>
                <SubpageCard icon={<Icon className="h-5 w-5" />} title={c.title} body={c.body} />
              </Reveal>
            );
          })}
        </div>
      </SubpageSection>

      <SubpageSection
        tone="dark"
        eyebrow="Who it is for"
        title="Built for the teams that sell to contractors"
        description="Contractor Leads is not a directory for homeowners. It is prospecting software for the agencies, media buyers and sales teams whose customers are roofers, HVAC companies, plumbers and the other home-service trades."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {ROLES.map((r, i) => (
            <Reveal key={r.title} delay={0.05 * i}>
              <article className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <h3 className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-white">
                  {r.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">{r.body}</p>
                <ul className="mt-4 space-y-2">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13.5px] text-white/80">
                      <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      <SubpageSection
        tone="light"
        align="center"
        eyebrow="How it works"
        title="From an empty screen to a booked call"
        description="Four steps in one workspace. Most agencies run their first scored search within ten minutes of signing up."
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.step}>
              <Reveal delay={0.06 * i}>
                <div className="h-full rounded-2xl border border-violet-100 bg-white p-5">
                  <span className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-none text-fuchsia-200">
                    {s.step}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </SubpageSection>

      <SubpageSection
        tone="tint"
        align="center"
        eyebrow="Comparison"
        title="Software vs a purchased list vs a Maps scraper"
        description="Three ways agencies source contractor leads today, compared on the points that decide whether a rep books a call or wastes a morning."
      >
        <Reveal className="mx-auto max-w-5xl">
          <div className="overflow-x-auto rounded-2xl border border-violet-100 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-[13.5px]">
              <caption className="sr-only">
                Comparison of Contractor Leads with purchased lead lists and Google Maps scrapers
              </caption>
              <thead>
                <tr className="border-b border-violet-100 bg-[#faf8fc] text-[12px] font-semibold uppercase tracking-[0.12em]">
                  <th scope="col" className="px-4 py-3 text-slate-500">What matters</th>
                  <th scope="col" className="px-4 py-3 text-fuchsia-700">Contractor Leads</th>
                  <th scope="col" className="px-4 py-3 text-slate-400">Purchased list</th>
                  <th scope="col" className="px-4 py-3 text-slate-400">Maps scraper</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.point} className="border-b border-violet-50 align-top last:border-0">
                    <th scope="row" className="px-4 py-4 font-semibold text-slate-900">
                      {row.point}
                    </th>
                    <td className="px-4 py-4 text-slate-700">
                      <span className="flex gap-2">
                        <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {row.us}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      <span className="flex gap-2">
                        <HiOutlineXMark className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                        {row.list}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      <span className="flex gap-2">
                        <HiOutlineXMark className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                        {row.scraper}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[13px]">
            <Link href="/google-maps-scraper" className="font-semibold text-fuchsia-700 hover:underline">
              Compare with Google Maps scrapers →
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/apollo-alternative" className="font-semibold text-fuchsia-700 hover:underline">
              Compare with Apollo.io →
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/features" className="font-semibold text-fuchsia-700 hover:underline">
              Full feature list →
            </Link>
          </div>
        </Reveal>
      </SubpageSection>

      <SubpageSection
        tone="light"
        eyebrow="Data integrity"
        title="Blank beats wrong"
        description="The fastest way to lose a sending domain is to email a guessed address. Contractor Leads only shows what it can verify."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: HiOutlineShieldCheck,
              title: "Verified sources only",
              body: "Google Places, Yelp and the contractor's own website. No brokered dumps, no recycled contacts from a previous quarter.",
            },
            {
              icon: HiOutlineCpuChip,
              title: "Scores you can read",
              body: "Open any lead to see why it scored the way it did: page speed, mobile issues, missing Google Business Profile signals, ad activity.",
            },
            {
              icon: HiOutlineBolt,
              title: "Credits that match usage",
              body: "You are charged one credit per lead actually returned. Ask for 50 and get 48, you pay for 48. Re-exports are free.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={0.05 * i}>
                <SubpageCard icon={<Icon className="h-5 w-5" />} title={item.title} body={item.body} />
              </Reveal>
            );
          })}
        </div>
      </SubpageSection>

      <SubpageSection
        tone="soft"
        align="center"
        eyebrow="By trade"
        title="Lead generation for every home-service vertical"
        description="Scoring weights and outreach angles adapt to the trade. Start with the seven highest-volume verticals or browse all of them."
      >
        <Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {priorityTrades.map((t) => (
              <Link
                key={t.slug}
                href={`/industries/${t.slug}`}
                className="group rounded-2xl border border-violet-100 bg-white p-4 text-left transition hover:border-fuchsia-300 hover:shadow-md"
              >
                <p className="text-[14px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                  {t.headline}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{t.angle}</p>
              </Link>
            ))}
            <Link
              href="/industries"
              className="flex items-center justify-center rounded-2xl border border-dashed border-fuchsia-300 bg-fuchsia-50/50 p-4 text-[14px] font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
            >
              All {INDUSTRIES.length} trades →
            </Link>
          </div>
        </Reveal>
      </SubpageSection>

      {guides.length > 0 && (
        <SubpageSection
          tone="light"
          eyebrow="Keep reading"
          title="Guides for agencies that sell to contractors"
          description="Playbooks from the Contractor Leads blog on finding, pitching and closing home-service clients."
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {guides.map((g, i) => (
              <li key={g.slug}>
                <Reveal delay={0.05 * i}>
                  <Link href={`/blog/${g.slug}`} className="group block h-full">
                    <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                      <h3 className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                        {g.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">
                        {g.summary}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-fuchsia-700">
                        Read guide
                        <HiOutlineArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </article>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </SubpageSection>
      )}

      <SubpageSection
        id="faq"
        tone="tint"
        eyebrow="FAQ"
        title="Contractor lead generation software: common questions"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={0.04 * i}>
              <details className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm open:border-fuchsia-200">
                <summary className="cursor-pointer list-none font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="Run your first scored contractor search free"
        description="Pick a trade and a city, get 10 live leads with scores and owner names, and send the first email today."
        primaryLabel="Start free (10 leads)"
        secondaryHref="/pricing"
        secondaryLabel="Compare plans"
        note="No credit card required · Starter from $19.99/mo · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
