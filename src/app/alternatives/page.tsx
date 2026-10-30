import type { Metadata } from "next";
import Link from "next/link";
import { HiOutlineArrowRight, HiOutlineCheck } from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/components/seo/json-ld";
import { ALTERNATIVES } from "@/lib/alternatives-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor Leads vs Alternatives: Scrapers, Databases and Lead Finders",
  description:
    "Compare Contractor Leads with Outscraper, Apify, PhantomBuster, ZoomInfo, Lusha, D7 Lead Finder, UpLead and Apollo for finding and pitching home-service contractors.",
  path: "/alternatives",
  keywords: [
    "contractor leads alternatives",
    "lead generation tool comparison",
    "google maps scraper alternative",
    "b2b database alternative for local businesses",
    "best tool to find contractor leads",
  ],
});

const HUB_FAQS = [
  {
    q: "Which type of tool is best for finding contractor leads?",
    a: "It depends on the job. Scrapers export raw listings, B2B databases cover companies with employees online, and Contractor Leads is built for one buyer: agencies and sales teams whose customers are home-service contractors. It finds the business, the owner and the marketing gap, then writes the outreach.",
  },
  {
    q: "Can Contractor Leads replace a B2B database like ZoomInfo or Apollo?",
    a: "Only for the contractor segment. If you also sell to corporate accounts with departments, keep a B2B database for those and use Contractor Leads for local trades, both feeding the same CRM.",
  },
  {
    q: "How do I compare tools fairly?",
    a: "Run the same trade and city in each, then count rows with a verified owner name, a usable score and ad status. Contractor Leads gives 10 free scored leads so the test costs nothing.",
  },
];

export default function AlternativesHubPage() {
  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Alternatives", path: "/alternatives" },
          ]),
          faqPageJsonLd(HUB_FAQS),
        ]}
      />
      <MarketingSubpageHero
        eyebrow="Comparisons"
        title="Contractor Leads vs the tools agencies use today"
        description="Honest, side-by-side comparisons with Google Maps scrapers, B2B contact databases and local lead finders, written for agencies that sell to home-service contractors."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            Test with 10 free leads
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contractor-lead-generation-software"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Read the buyer&apos;s guide
          </Link>
        </div>
      </MarketingSubpageHero>

      <SubpageSection
        tone="light"
        eyebrow="Pick a comparison"
        title="Alternatives by tool"
        description="Each page covers where the other tool is genuinely the better fit, where it falls short for contractor prospecting, a feature table, pricing models and a four-step test."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal>
            <Link href="/apollo-alternative" className="group block h-full">
              <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600">
                  B2B contact database
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                  Apollo.io alternative
                </h2>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">
                  Why a LinkedIn-centric database misses owner-run contractors, and what to use instead.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-700">
                  Compare <HiOutlineArrowRight className="h-3.5 w-3.5" />
                </span>
              </article>
            </Link>
          </Reveal>
          {ALTERNATIVES.map((a, i) => (
            <Reveal key={a.slug} delay={0.04 * (i + 1)}>
              <Link href={`/alternatives/${a.slug}`} className="group block h-full">
                <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600">
                    {a.category}
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                    {a.name} alternative
                  </h2>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">
                    {a.metaDescription}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-700">
                    Compare <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </span>
                </article>
              </Link>
            </Reveal>
          ))}
          <Reveal delay={0.04 * (ALTERNATIVES.length + 1)}>
            <Link href="/google-maps-scraper" className="group block h-full">
              <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600">
                  Category overview
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                  Google Maps scrapers in general
                </h2>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">
                  What any Maps scraper gives you, where it stops, and the legal questions to ask.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-700">
                  Compare <HiOutlineArrowRight className="h-3.5 w-3.5" />
                </span>
              </article>
            </Link>
          </Reveal>
        </div>
      </SubpageSection>

      <SubpageSection
        tone="tint"
        align="center"
        eyebrow="What stays constant"
        title="What every comparison comes back to"
        description="Whichever tool you compare, the same four things decide whether a rep books a call or spends the morning researching."
      >
        <ul className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
          {[
            "Is the business data live, or a snapshot resold to every agency in your niche?",
            "Is there an owner name you can verify, or a pattern-guessed email that bounces?",
            "Does anything tell the rep who to call first and what to say?",
            "Does the lead flow into the CRM you already pay for?",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-2xl border border-violet-100 bg-white p-4 text-[14px] leading-relaxed text-slate-700"
            >
              <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" />
              {item}
            </li>
          ))}
        </ul>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="FAQ" title="Choosing a contractor lead tool">
        <div className="mx-auto max-w-3xl space-y-3">
          {HUB_FAQS.map((f) => (
            <details
              key={f.q}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm open:border-fuchsia-200"
            >
              <summary className="cursor-pointer list-none font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 marker:hidden">
                {f.q}
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="Run the same search in Contractor Leads"
        description="Pick a trade and a city, and compare owner names, scores and ad status against the tool you use today. 10 leads free."
        primaryLabel="Start free (10 leads)"
        secondaryHref="/pricing"
        secondaryLabel="See pricing"
        note="No credit card required · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
