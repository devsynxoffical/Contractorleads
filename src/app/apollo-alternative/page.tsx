import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineGlobeAlt,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineBriefcase,
} from "react-icons/hi2";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Apollo Alternative for Local Contractor Leads",
  description:
    "Looking for an Apollo.io alternative for local contractor leads? Get live Google data, owner names and AI scores from $19.99 a month. 10 leads free.",
  path: "/apollo-alternative",
  keywords: [
    "apollo alternative",
    "best apollo io alternative",
    "apollo.io alternatives free",
    "apollo io cheaper alternative",
    "apollo alternative for lead generation",
    "is apollo.io free",
    "alternatives to apollo",
  ],
});

const APOLLO_FAQS = [
  {
    q: "What is the best Apollo.io alternative for local businesses?",
    a: "For home-service contractors, a tool built on live Google business data works better than a B2B contact database, because most contractors are owner-run and live on Google Maps. Contractor Leads is built for exactly that.",
  },
  {
    q: "Is there a free Apollo.io alternative?",
    a: "Contractor Leads gives 10 free scored leads with no credit card, then starts at $19.99 a month for 500 credits.",
  },
  {
    q: "Is Apollo.io free?",
    a: "Apollo.io has a free plan with limits; check apollo.io/pricing for the current credit limits before relying on it.",
  },
  {
    q: "Can Contractor Leads replace Apollo.io?",
    a: "For prospecting home-service contractors, yes: it finds the business, the owner, the marketing gaps and writes the outreach. For B2B prospecting into companies with sales teams, keep a B2B database.",
  },
  {
    q: "Does Contractor Leads integrate with my CRM like Apollo.io does?",
    a: "Yes. It pushes leads and status changes to GoHighLevel, HubSpot, Zapier, Make, Slack or a webhook on the Growth plan and above, and exports CSV or Excel on every plan.",
  },
];

export default function ApolloAlternativePage() {
  return (
    <MarketingSiteShell>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Apollo Alternative", path: "/apollo-alternative" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(APOLLO_FAQS)} />

      {/* Hero Section */}
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
            Platform Comparison
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-white">
            The Apollo.io alternative for agencies selling to local contractors
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75">
            Apollo.io is built around company and contact databases for B2B sales. Local contractors
            often have thin company data and no sales team on LinkedIn. Contractor Leads searches live
            Google business data instead, finds the owner from the business website and scores each
            lead, from $19.99 a month.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:opacity-95"
            >
              Try 10 free contractor leads
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/google-maps-scraper"
              className="inline-flex rounded-full border border-white/20 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              See Google Maps tool
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-white/50">
            No credit card required · Starter starts at $19.99/mo (500 leads)
          </p>
        </div>
      </header>

      {/* When Apollo is Right vs Not */}
      <SubpageSection
        tone="light"
        eyebrow="Analysis"
        title="When Apollo.io is the right tool, and when it is not"
        description="Understanding why enterprise B2B data providers struggle with residential trades and local operators."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700">
              <HiOutlineBriefcase className="h-6 w-6" />
              <h3 className="font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
                When Apollo.io shines
              </h3>
            </div>
            <p className="mt-3 text-[14px] text-slate-600">
              Apollo.io is a powerhouse when prospecting white-collar B2B companies with established
              corporate departments:
            </p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-700">
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Companies with 50+ corporate employees and HR titles
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Prospects with active corporate LinkedIn profiles
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Targeting VPs of Sales, CTOs, and HR Directors
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Complex multi-tier enterprise sequence workflows
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-violet-50/30 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-fuchsia-700">
              <HiOutlineGlobeAlt className="h-6 w-6" />
              <h3 className="font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
                Where Contractor Leads wins
              </h3>
            </div>
            <p className="mt-3 text-[14px] text-slate-600">
              Contractor Leads is purpose-built for the blue-collar home-service economy:
            </p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-700">
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Roofers, plumbers, and HVAC shops with 2 to 20 staff
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Owner-operators who live on Google Maps, not LinkedIn
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Digital gap scoring (Website speed, SEO, PPC audit scores)
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Meta Ads Intel to instantly see who spends on Facebook ads
              </li>
            </ul>
          </div>
        </div>
      </SubpageSection>

      {/* Side by Side Comparison Table */}
      <SubpageSection
        tone="tint"
        eyebrow="Side-by-side"
        title="Contractor Leads vs Apollo.io: feature breakdown"
        description="A direct comparison for agencies prospecting local trades and contractors."
      >
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-fuchsia-700 font-bold">Contractor Leads</th>
                <th className="py-3 px-4">Apollo.io</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Primary Data Source</td>
                <td className="py-3.5 px-4 font-semibold text-fuchsia-700">Live Google Places at search time</td>
                <td className="py-3.5 px-4 text-slate-600">Stored B2B contact database</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Local Contractor Coverage</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">100% of Google Maps listings</td>
                <td className="py-3.5 px-4 text-slate-600">Thin (often lacks trade owners)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Owner Enrichment</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Scanned from business website</td>
                <td className="py-3.5 px-4 text-slate-600">Scraped from LinkedIn records</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">AI Scoring for Marketing Gaps</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Yes (Website, SEO, PPC 0–100)</td>
                <td className="py-3.5 px-4 text-slate-400">No (Requires manual research)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Facebook / Meta Ads Status</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Built-in Meta Ads Intel</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Outreach Studio per Lead</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">AI email, SMS & call scripts</td>
                <td className="py-3.5 px-4 text-slate-600">B2B template builder</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">GoHighLevel Integration</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">1-click direct push</td>
                <td className="py-3.5 px-4 text-slate-600">Requires Zapier/Make flow</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Free Starting Tier</td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">10 free scored leads (no card)</td>
                <td className="py-3.5 px-4 text-slate-600">Limited free account</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Entry Paid Price</td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">$19.99/mo (500 credits)</td>
                <td className="py-3.5 px-4 text-slate-600">$49/user/mo (billed annually)</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-[12px] text-slate-400">
            Apollo.io figures reflect its public pricing page as of October 2026 and may change; check apollo.io/pricing before relying on them.
          </p>
        </div>
      </SubpageSection>

      {/* Why Agencies Switch */}
      <SubpageSection
        tone="light"
        eyebrow="Key Benefits"
        title="Why agencies switch to Contractor Leads for local prospecting"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-[16px] font-bold text-slate-900">
              Live data, not stored records
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Queries hit live Google Places data. You never call a roofer whose phone was disconnected
              four months ago.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-[16px] font-bold text-slate-900">
              Scores that tell you what to sell
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              A plumber with a 30 Website score needs a new site. One with a 90 site but no Meta ads
              needs Facebook lead generation.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-[16px] font-bold text-slate-900">
              Outreach that names the gap
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Outreach Studio automatically generates the first sentence based on the business&apos;s
              specific scores and ad activity.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-[16px] font-bold text-slate-900">
              Built-in pipeline CRM
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Track leads through New, Contacted, Meeting, and Won, or push straight to GoHighLevel
              with one click.
            </p>
          </div>
        </div>
      </SubpageSection>

      {/* Migration in One Afternoon */}
      <SubpageSection
        tone="tint"
        eyebrow="Migration"
        title="How to test Contractor Leads in one afternoon"
        description="A simple 4-step workflow to benchmark coverage against your existing Apollo list."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-[13px] font-bold text-violet-700">
              1
            </span>
            <h3 className="mt-3 font-semibold text-slate-900 text-[15px]">Export current list</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Export your contractor contacts from Apollo as a CSV file to check their titles and coverage.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-[13px] font-bold text-violet-700">
              2
            </span>
            <h3 className="mt-3 font-semibold text-slate-900 text-[15px]">Run Lead Finder</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Run the exact same trade and metro inside Contractor Leads to fetch live Google Places records.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-[13px] font-bold text-violet-700">
              3
            </span>
            <h3 className="mt-3 font-semibold text-slate-900 text-[15px]">Compare intelligence</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Count how many records feature verified owner names, marketing opportunity scores, and ad status.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-[13px] font-bold text-violet-700">
              4
            </span>
            <h3 className="mt-3 font-semibold text-slate-900 text-[15px]">Push Hot leads to CRM</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Sync the top-scoring Hot leads into GoHighLevel or your mailbox and begin calling.
            </p>
          </div>
        </div>
      </SubpageSection>

      {/* FAQs */}
      <SubpageSection
        tone="light"
        eyebrow="Questions"
        title="Frequently asked questions about Apollo.io alternatives"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {APOLLO_FAQS.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xs">
              <h3 className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900">
                {faq.q}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="Run your Apollo.io list's trade and city in Lead Finder."
        description="Experience the difference live Google data and AI scoring make for contractor outreach. Start with 10 free leads."
        primaryLabel="Start free trial (10 leads)"
        secondaryHref="/pricing"
        secondaryLabel="View all plans"
        note="Starter $19.99/mo · Growth $49/mo · Agency $99/mo"
      />
    </MarketingSiteShell>
  );
}
