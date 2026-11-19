import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowDownTray,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineXMark,
} from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageSection } from "@/components/marketing/marketing-subpage";
import { ContractorListBuilder } from "@/components/marketing/contractor-list-builder";
import {
  JsonLd,
  SPEAKABLE_CLASS,
  breadcrumbJsonLd,
  faqPageJsonLd,
  webPageJsonLd,
} from "@/components/seo/json-ld";
import { PRIORITY_TRADE_SLUGS, SEO_REGIONS, TRADE_PAGES, buildMetadata } from "@/lib/seo";
import { topCitiesForState } from "@/lib/state-profiles";
import { pageUpdated } from "@/lib/page-dates";

const PATH = "/contractor-list";

export const metadata: Metadata = buildMetadata({
  title: "Free Contractor List Builder: Roofers, HVAC, Plumbers",
  description:
    "Build a free list of roofers, HVAC companies, plumbers and 15 more trades in any US city, with owner names, verified emails and AI lead scores. 10 leads free.",
  path: PATH,
  keywords: [
    "contractor list",
    "free contractor list",
    "list of contractors",
    "list of roofing companies",
    "hvac contractors list",
    "contractor list by city",
  ],
});

const STEPS = [
  {
    icon: HiOutlineAdjustmentsHorizontal,
    title: "Pick a trade and a city",
    text: "Choose from 18 home-service trades and any US state or city. The search runs on live Google business data, so new companies appear the day they list.",
  },
  {
    icon: HiOutlineSparkles,
    title: "Get owners and AI scores",
    text: "Each business gets the owner's name, verified contact details and scores for its website, SEO and ads, ranked Hot, Warm or Nurture.",
  },
  {
    icon: HiOutlineArrowDownTray,
    title: "Export or start outreach",
    text: "Download CSV or Excel, send to GoHighLevel, HubSpot or Zapier, or write a cold email from each lead's own audit in Outreach Studio.",
  },
];

const COMPARE = {
  headers: ["", "Bought email list", "Google Maps scraper", "Contractor Leads"],
  rows: [
    ["Fresh when you pull it", false, true, true],
    ["Owner name", "Sometimes", false, true],
    ["Verified emails", "Varies", false, true],
    ["Marketing-gap scores", false, false, true],
    ["Meta ad status", false, false, true],
    ["Outreach written per lead", false, false, true],
  ] as Array<[string, boolean | string, boolean | string, boolean | string]>,
};

const FAQS = [
  {
    q: "How do I get a list of contractors in my area?",
    a: "Pick the trade and the city or state in the list builder above, then create a free account. Contractor Leads pulls every matching business from live Google data and adds the owner's name, verified contact details and AI scores. Your first 10 leads are free.",
  },
  {
    q: "Is the contractor list really free?",
    a: "Yes. New accounts get 10 leads free with no credit card. After that, plans start at $19.99 a month for 500 leads; one credit equals one lead.",
  },
  {
    q: "Which trades can I build a list for?",
    a: "18 home-service trades: roofing, HVAC, plumbing, electrical, solar, general contractors, remodeling, home improvement, flooring, landscaping, painting, concrete, windows and doors, fencing, garage doors, pest control, cleaning and pool services.",
  },
  {
    q: "Where does the data come from?",
    a: "From live Google business listings at the moment you search, cross-checked with Yelp and each company's website. Fields that cannot be verified are left blank rather than guessed.",
  },
  {
    q: "Can I use the list for cold email?",
    a: "Yes, for business-to-business outreach that follows CAN-SPAM: an honest subject line, your physical address and a working opt-out. Verify addresses before sending; Contractor Leads verifies emails before export.",
  },
];

export default function ContractorListPage() {
  const trades = TRADE_PAGES.map((t) => ({ slug: t.slug, name: t.name }));
  const states = SEO_REGIONS.map((r) => ({
    slug: r.slug,
    name: r.name,
    code: r.code,
    cities: topCitiesForState(r.code).slice(0, 4),
  }));
  const popular = (["texas", "florida", "california", "ohio", "georgia", "north-carolina"] as const).flatMap((s) =>
    PRIORITY_TRADE_SLUGS.slice(0, 3).map((t) => {
      const trade = TRADE_PAGES.find((x) => x.slug === t);
      const state = SEO_REGIONS.find((x) => x.slug === s);
      return { href: `/industries/${t}/${s}`, label: `${trade?.name} companies in ${state?.name}` };
    }),
  );

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contractor list builder", path: PATH },
          ]),
          webPageJsonLd({
            name: "Free contractor list builder",
            description: "Build a list of contractors by trade and city with owner names, verified emails and AI lead scores.",
            path: PATH,
            dateModified: pageUpdated(PATH),
            speakable: true,
          }),
          faqPageJsonLd(FAQS, PATH),
        ]}
      />

      <MarketingSubpageHero
        eyebrow="Free contractor list builder"
        title="Build a list of contractors in any US city"
        description="Roofers, HVAC companies, plumbers and 15 more trades, with owner names, verified emails and a score for every marketing gap. Pick your market below; your first 10 leads are free."
      >
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] font-medium text-white/80">
          {["18 trades", "All 50 states", "Live Google data", "No credit card"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <HiOutlineCheck className="h-4 w-4 text-fuchsia-300" aria-hidden />
              {t}
            </span>
          ))}
        </div>
      </MarketingSubpageHero>

      <section className="relative bg-gradient-to-b from-violet-50/70 via-white to-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ContractorListBuilder trades={trades} states={states} />
        </div>
      </section>

      <SubpageSection tone="light" eyebrow="How it works" title="From market to first email in three steps">
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="relative rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <span className="absolute right-5 top-5 font-[family-name:var(--font-display)] text-[40px] font-bold leading-none text-violet-100">
                {i + 1}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-md">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-[17px] font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </SubpageSection>

      <SubpageSection tone="soft" eyebrow="Quick answer" title="What makes a contractor list worth using?">
        <div className="mx-auto max-w-3xl rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6 sm:p-8">
          <p className={`${SPEAKABLE_CLASS} text-[16px] leading-relaxed text-slate-700`}>
            A useful contractor list is fresh, reaches the owner rather than an info@ inbox, and tells you why each
            business might buy. Bought lists go stale and rarely name the owner; scrapers give raw listings with no
            emails. Contractor Leads pulls the businesses live, finds the owner and verified email, and scores each
            company&apos;s website, SEO and ads, so you start with the contractors most likely to need your service.
          </p>
        </div>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="Compare" title="Bought lists, scrapers and Contractor Leads">
        <div className="mx-auto max-w-4xl overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="bg-slate-50 text-[12.5px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {COMPARE.headers.map((h, i) => (
                  <th key={h || "feature"} scope="col" className={`px-4 py-3 ${i === 3 ? "text-fuchsia-700" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARE.rows.map(([label, ...cells]) => (
                <tr key={label}>
                  <th scope="row" className="px-4 py-3 font-semibold text-slate-900">
                    {label}
                  </th>
                  {cells.map((c, i) => (
                    <td key={i} className={`px-4 py-3 ${i === 2 ? "bg-fuchsia-50/50" : ""}`}>
                      {c === true ? (
                        <HiOutlineCheck className="h-5 w-5 text-emerald-600" aria-label="Yes" />
                      ) : c === false ? (
                        <HiOutlineXMark className="h-5 w-5 text-slate-300" aria-label="No" />
                      ) : (
                        <span className="text-slate-600">{c}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-4 max-w-4xl text-[13px] text-slate-500">
          More detail: <Link href="/blog/buy-vs-build-contractor-email-list" className="font-semibold text-fuchsia-700 hover:underline">buy or build a contractor email list</Link>{" "}
          and <Link href="/blog/best-google-maps-scrapers" className="font-semibold text-fuchsia-700 hover:underline">Google Maps scrapers compared</Link>.
        </p>
      </SubpageSection>

      <SubpageSection tone="soft" eyebrow="Popular lists" title="Start with the biggest markets">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex items-center justify-between rounded-2xl border border-violet-100 bg-white px-4 py-3.5 text-[14.5px] font-semibold text-slate-800 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
            >
              {p.label}
              <HiOutlineArrowRight className="h-4 w-4 text-fuchsia-600 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </div>
        <p className="mt-5 text-center text-[13.5px] text-slate-600">
          Or browse <Link href="/industries" className="font-semibold text-fuchsia-700 hover:underline">all 18 trades</Link>,{" "}
          <Link href="/locations" className="font-semibold text-fuchsia-700 hover:underline">all 50 states</Link> and{" "}
          <Link href="/email-lists" className="font-semibold text-fuchsia-700 hover:underline">contractor email lists by trade</Link>.
        </p>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="FAQ" title="Contractor lists: common questions">
        <dl className="mx-auto max-w-3xl divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white px-6">
          {FAQS.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="text-[15.5px] font-semibold text-slate-900">{f.q}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </SubpageSection>

      <SubpageCtaBand
        title="Your first contractor list is free"
        description="Pick a trade and a city, get owner names, verified emails and AI scores, and export in minutes."
        primaryLabel="Build my free list"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads · No credit card required"
      />
    </MarketingSiteShell>
  );
}
