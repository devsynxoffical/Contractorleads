import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineDocumentArrowDown,
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineMegaphone,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineXMark,
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
  title: "Google Maps Scraper for Contractor Leads With Owner Data",
  description:
    "A Google Maps scraper alternative built for agencies: live Google business data, owner names, AI scores and Excel export. Try 10 free leads.",
  path: "/google-maps-scraper",
  keywords: [
    "google maps scraper",
    "google maps scraper for leads",
    "google maps scraper for emails",
    "google maps scraper to excel",
    "best google maps scraper",
    "is scraping google maps legal",
    "google maps scraper chrome extension",
  ],
});

const SCRAPER_FAQS = [
  {
    q: "Is scraping Google Maps legal?",
    a: "Collecting public business information is common practice, but automated scraping of the Google Maps interface can break Google's Terms of Service, and data rules vary by country. Contractor Leads works from live Google Places data inside its own platform; check your own legal advice for your market.",
  },
  {
    q: "What is the best Google Maps scraper for leads?",
    a: "For agencies that sell to contractors, the best option is one that adds owner names, ad status and a score to each business, so you can decide who to call first. Contractor Leads does this for 18 home-service trades.",
  },
  {
    q: "Can a Google Maps scraper find emails?",
    a: "Maps listings do not show emails. Contractor Leads looks for owner names and contact details on the business's own website and leaves the field blank when it cannot verify one.",
  },
  {
    q: "Can I export Google Maps leads to Excel?",
    a: "Yes. Saved leads export to CSV or Excel on every plan, including the free 10 leads.",
  },
  {
    q: "Is there a free Google Maps scraper?",
    a: "Contractor Leads gives every new account 10 free scored leads with no credit card. Paid plans start at $19 a month for 500 credits.",
  },
];

export default function GoogleMapsScraperPage() {
  return (
    <MarketingSiteShell>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Google Maps Scraper", path: "/google-maps-scraper" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(SCRAPER_FAQS)} />

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
            Prospecting Tool & Alternative
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-white">
            Google Maps scraper for contractor leads, with owner names and AI scores
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/75">
            Contractor Leads gives you what people use a Google Maps scraper for—a list of local
            businesses with phone, website, rating and reviews—but pulled from live Google Places
            data and enriched with owner names, Meta ad status and AI lead scores. Pick a trade
            and a city, export to CSV or Excel.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:opacity-95"
            >
              Run a free search: 10 leads
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features"
              className="inline-flex rounded-full border border-white/20 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Explore features
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-white/50">
            No credit card required · Instant Excel and CSV export
          </p>
        </div>
      </header>

      {/* What a Scraper Does & Where It Stops */}
      <SubpageSection
        tone="light"
        eyebrow="The Gap"
        title="What a Google Maps scraper does, and where it stops"
        description="Standard scrapers copy public text from Google Maps listings. But for marketing agencies, raw data is only 20% of the battle."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
              What you get from a typical scraper
            </h3>
            <p className="mt-2 text-[14px] text-slate-600">
              Basic fields copied directly from public Google Maps interfaces:
            </p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-700">
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Business Name & category
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Physical street address & coordinates
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Main office switchboard phone number
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Public website URL (if entered)
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Star rating & total review count
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-rose-50/30 p-6 sm:p-8 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-[18px] font-bold text-slate-900">
              What agencies still have to do by hand
            </h3>
            <p className="mt-2 text-[14px] text-slate-600">
              The grueling manual tasks that eat up your sales team’s morning:
            </p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-700">
              <li className="flex items-center gap-2">
                <HiOutlineXMark className="h-4 w-4 text-rose-600 shrink-0" />
                Hunt down the actual owner’s name on LinkedIn or About pages
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineXMark className="h-4 w-4 text-rose-600 shrink-0" />
                Audit their website speed and SEO to find a pitch angle
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineXMark className="h-4 w-4 text-rose-600 shrink-0" />
                Check the Meta Ad Library to see if they already run ads
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineXMark className="h-4 w-4 text-rose-600 shrink-0" />
                Write a tailored first message or cold call hook from scratch
              </li>
              <li className="flex items-center gap-2">
                <HiOutlineXMark className="h-4 w-4 text-rose-600 shrink-0" />
                Manually dedupe and upload rows into GoHighLevel or CRM
              </li>
            </ul>
          </div>
        </div>
      </SubpageSection>

      {/* How Contractor Leads Works */}
      <SubpageSection
        tone="tint"
        eyebrow="The Solution"
        title="How Contractor Leads works as a Google Maps lead scraper"
        description="A complete prospecting workspace designed specifically for agencies selling to home-service trades."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <HiOutlineMagnifyingGlass className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-bold text-slate-900">
              Search by trade, city, ZIP or radius
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              Filter across 18 home-service trades in the United States, Canada, the UK, Australia,
              and New Zealand. Zero in on a single postal code or scan a 50-mile metro radius.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700">
              <HiOutlineSparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-bold text-slate-900">
              Every result is AI scored (0–100)
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              Instantly see Website, PPC, SEO, and Marketing Opportunity scores. Leads are sorted into
              Hot, Warm, and Nurture tiers so you dial businesses with obvious gaps first.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-700">
              <HiOutlineUserCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-bold text-slate-900">
              Owner enrichment from real sites
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              Decision-maker names are enriched directly from company websites and business records.
              We never guess patterns or inject fictitious data.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <HiOutlineMegaphone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-bold text-slate-900">
              Meta Ads Intel on every profile
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              See whether the contractor is currently running Facebook or Instagram ads before you
              pick up the phone. Pitch paid ads to non-advertisers, or offer creative refreshes to active spenders.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <HiOutlineDocumentArrowDown className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-bold text-slate-900">
              Export to Excel or push to CRM
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              Export verified data to CSV and formatted Excel on every plan. On Growth plans, push
              leads directly into GoHighLevel, HubSpot, Zapier, Make, or custom webhooks.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <HiOutlineGlobeAlt className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-bold text-slate-900">
              Live Google data at search time
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
              No stale scrapings stored from 9 months ago. Your query hits live Places data when you
              click search, so numbers and phone lines are active.
            </p>
          </div>
        </div>
      </SubpageSection>

      {/* Emails and Legal Context */}
      <SubpageSection
        tone="light"
        eyebrow="Transparency"
        title="Google Maps scraper for emails and owner names"
        description="Understanding how data extraction works and why quality beats raw volume."
      >
        <div className="space-y-6 text-[15px] leading-relaxed text-slate-700">
          <p>
            One of the most frequent searches agencies run is <em>&ldquo;google maps scraper for emails&rdquo;</em>.
            However, Google Maps business profiles do not publicly display email addresses. Generic scraping
            tools often try to scrape random mailto links from footer pages, frequently catching generic spam traps
            or webmaster addresses.
          </p>
          <p>
            Contractor Leads takes an engineered approach: we inspect the business’s verified website to identify
            executive and owner contact information. When an email or decision-maker is verified, it is enriched
            on the lead profile. <strong>When it cannot be verified, we leave it blank.</strong> In sales prospecting,
            blank beats wrong every single time.
          </p>
        </div>
      </SubpageSection>

      {/* Comparison Table */}
      <SubpageSection
        tone="tint"
        eyebrow="Comparison"
        title="Best Google Maps scraper options compared"
        description="How Contractor Leads compares to Chrome extensions, cloud actors, and manual scraping."
      >
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                <th className="py-3 px-4">Feature / Capability</th>
                <th className="py-3 px-4 text-fuchsia-700">Contractor Leads</th>
                <th className="py-3 px-4">Chrome Extension Scrapers</th>
                <th className="py-3 px-4">Cloud Actors (Apify/Outscraper)</th>
                <th className="py-3 px-4">Manual Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Data Source</td>
                <td className="py-3.5 px-4 font-semibold text-fuchsia-700">Live Google Places API</td>
                <td className="py-3.5 px-4 text-slate-600">DOM extraction / HTML</td>
                <td className="py-3.5 px-4 text-slate-600">Headless browser actors</td>
                <td className="py-3.5 px-4 text-slate-600">Manual copy-paste</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Owner Enrichment</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Included on records</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-400">Requires extra scraper</td>
                <td className="py-3.5 px-4 text-slate-600">Manual search</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">AI Opportunity Scoring</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Hot, Warm, Nurture (0–100)</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Meta Ads Intelligence</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Live ad status check</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-600">Manual tab check</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Outreach Studio Scripts</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Built-in AI generator</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">CRM Push (GHL / HubSpot)</td>
                <td className="py-3.5 px-4 text-emerald-600 font-semibold">Direct 1-click sync</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
                <td className="py-3.5 px-4 text-slate-600">Webhook configuration</td>
                <td className="py-3.5 px-4 text-slate-400">No</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Setup Time</td>
                <td className="py-3.5 px-4 text-slate-700">0 min (Web app ready)</td>
                <td className="py-3.5 px-4 text-slate-700">Install extension</td>
                <td className="py-3.5 px-4 text-slate-700">Build actor tasks / API keys</td>
                <td className="py-3.5 px-4 text-slate-700">Hours per day</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Entry Pricing</td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">Free 10 leads, then $19/mo</td>
                <td className="py-3.5 px-4 text-slate-600">$15–$50/mo</td>
                <td className="py-3.5 px-4 text-slate-600">Usage credits + compute</td>
                <td className="py-3.5 px-4 text-slate-600">Labor costs</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-[12px] text-slate-400">
            Competitor feature comparisons checked 22 Oct 2026. Review current terms on provider websites.
          </p>
        </div>
      </SubpageSection>

      {/* Legal Section */}
      <SubpageSection
        tone="light"
        eyebrow="Compliance"
        title="Is scraping Google Maps legal?"
        description="An honest assessment of business directory prospecting and legal boundaries."
      >
        <div className="rounded-2xl border border-violet-100 bg-[#faf8fc] p-6 text-[15px] leading-relaxed text-slate-700 space-y-4">
          <p>
            Collecting public business listings is standard sales practice across the globe. However, automated
            bot-scraping of Google Maps interface elements can violate Google&apos;s Terms of Service, and data
            regulations (like CAN-SPAM in the US, GDPR in Europe, and PECR in the UK) place strict rules on consumer
            privacy.
          </p>
          <p>
            Contractor Leads operates within commercial business intelligence boundaries: we query official
            Google Places data points directly through platform interfaces at search time, focus strictly on
            commercial B2B home-service entities, and provide opt-out transparency.
          </p>
          <p className="text-[13px] text-slate-500 italic">
            Disclaimer: This overview does not constitute formal legal counsel. Agencies should review local
            telecommunications and outreach regulations for their specific operational territory.
          </p>
        </div>
      </SubpageSection>

      {/* Pricing Section */}
      <SubpageSection
        tone="tint"
        align="center"
        eyebrow="Pricing"
        title="Start free, upgrade when you close"
        description="Every new account receives 10 free scored leads with no credit card required."
      >
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto text-left">
          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <p className="text-[13px] font-bold uppercase tracking-wider text-fuchsia-600">Starter</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-extrabold text-slate-900">
              $19<span className="text-[14px] font-normal text-slate-500">/mo</span>
            </p>
            <p className="mt-2 text-[13px] text-slate-600">500 credits/mo ($0.038/lead)</p>
            <p className="mt-4 text-[13px] text-slate-600">Ideal for solo agency operators starting outreach.</p>
            <Link
              href="/pricing"
              className="mt-6 block rounded-full border border-violet-200 bg-violet-50 py-2 text-center text-[13px] font-semibold text-violet-700 hover:bg-violet-100"
            >
              Choose Starter
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-fuchsia-500 bg-white p-6 shadow-md relative">
            <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
              Most Popular
            </span>
            <p className="text-[13px] font-bold uppercase tracking-wider text-fuchsia-600">Growth</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-extrabold text-slate-900">
              $49<span className="text-[14px] font-normal text-slate-500">/mo</span>
            </p>
            <p className="mt-2 text-[13px] text-slate-600">2,000 credits/mo ($0.024/lead)</p>
            <p className="mt-4 text-[13px] text-slate-600">Full CRM webhook push, GoHighLevel & Outreach Studio.</p>
            <Link
              href="/pricing"
              className="mt-6 block rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 py-2 text-center text-[13px] font-semibold text-white hover:opacity-95"
            >
              Choose Growth
            </Link>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <p className="text-[13px] font-bold uppercase tracking-wider text-fuchsia-600">Agency</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-extrabold text-slate-900">
              $99<span className="text-[14px] font-normal text-slate-500">/mo</span>
            </p>
            <p className="mt-2 text-[13px] text-slate-600">5,000 credits/mo ($0.019/lead)</p>
            <p className="mt-4 text-[13px] text-slate-600">High-volume prospecting desks and cold calling teams.</p>
            <Link
              href="/pricing"
              className="mt-6 block rounded-full border border-violet-200 bg-violet-50 py-2 text-center text-[13px] font-semibold text-violet-700 hover:bg-violet-100"
            >
              Choose Agency
            </Link>
          </div>
        </div>
      </SubpageSection>

      {/* FAQs */}
      <SubpageSection
        tone="light"
        eyebrow="Questions"
        title="Frequently asked questions about Google Maps scrapers"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {SCRAPER_FAQS.map((faq, idx) => (
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
        title="Pick a trade and a city. See 10 scored leads free."
        description="Try our Google Maps scraper alternative today. 10 complete records with owner enrichment and AI scoring, zero card required."
        primaryLabel="Run a free search (10 leads)"
        secondaryHref="/apollo-alternative"
        secondaryLabel="Compare with Apollo.io"
        note="1 credit = 1 lead · Instant CSV & Excel export"
      />
    </MarketingSiteShell>
  );
}
