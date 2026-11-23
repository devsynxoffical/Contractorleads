import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowRight,
  HiOutlineEnvelopeOpen,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageSection, SubpageStats } from "@/components/marketing/marketing-subpage";
import { ContractorListBuilder } from "@/components/marketing/contractor-list-builder";
import {
  AnswerBlocks,
  CompareTable,
  FaqList,
  HeroChecks,
  ProductProof,
  QuickAnswer,
  StepCards,
} from "@/components/marketing/keyword-page-parts";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd, webPageJsonLd } from "@/components/seo/json-ld";
import { EMAIL_LIST_TRADES } from "@/lib/email-list-pages";
import { SEO_REGIONS, TRADE_PAGES, buildMetadata } from "@/lib/seo";
import { topCitiesForState } from "@/lib/state-profiles";
import { pageUpdated } from "@/lib/page-dates";

const PATH = "/contractor-email-list";

export const metadata: Metadata = buildMetadata({
  title: "Contractors Email List: Verified Construction Company Emails",
  description:
    "Build a contractors email list for any trade and city, verified before export. General contractor, roofing and HVAC lists. First list free.",
  path: PATH,
  keywords: [
    "contractors email list",
    "contractor email list",
    "construction company email list",
    "construction contractor email list",
    "contractor mailing list",
    "home service contractor email list",
  ],
});

const STEPS = [
  {
    icon: HiOutlineAdjustmentsHorizontal,
    title: "Choose trade and area",
    text: "Pick roofing, HVAC, general contractors or any of 18 trades, then a city, state or radius. The businesses come from live Google data on the day you search.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Owners and verified emails",
    text: "Each company gets the owner or decision-maker where it can be matched, and every email is labelled safe, catch-all, role-based or invalid.",
  },
  {
    icon: HiOutlineEnvelopeOpen,
    title: "Export or send",
    text: "Download CSV or Excel, push to your CRM, or write the first email from each company's own website and ads audit.",
  },
];

const ANSWERS = [
  {
    q: "What is in a contractor email list?",
    a: (
      <p>
        Business name, address, phone and website from Google; the owner or decision-maker where it can be matched;
        the email with its verification status; Google rating and review count; AI scores for website, SEO, ads and
        marketing; and whether the company runs Meta ads. Fields that cannot be confirmed are left blank, not guessed.
      </p>
    ),
  },
  {
    q: "Where do construction company emails come from?",
    a: (
      <p>
        From the company&apos;s own public footprint: its Google Business Profile, its website, and public business
        sources. Contractor Leads looks up the domain, finds the most likely owner address, then runs it through email verification before you
        export.
      </p>
    ),
  },
  {
    q: "Why build a list instead of buying one?",
    a: (
      <p>
        A bought contractors email list is a snapshot. Contractors change owners, close and switch providers, so old
        lists bounce, and bounces hurt the inbox placement of every email you send after. A built list reflects the
        market the day you send.
      </p>
    ),
  },
  {
    q: "How many emails should I send per day?",
    a: (
      <p>
        From a new, warmed-up mailbox, start around 20 to 30 a day and grow slowly. Send only to addresses marked safe
        in your first campaign. Our <Link href="/blog/email-warmup-for-cold-email" className="font-semibold text-fuchsia-700 hover:underline">email warmup guide</Link> covers the ramp.
      </p>
    ),
  },
];

const COMPARE = {
  headers: ["", "Bought contractor list", "Contractor Leads"],
  rows: [
    ["Freshness", "Compiled before you bought it", "Pulled live when you search"],
    ["Area", "Seller's regions", "Any city, state or radius"],
    ["Owner names", "Often missing", "Added where they can be verified"],
    ["Email checks", "Rarely re-checked", "Safe, catch-all, role or invalid on every email"],
    ["Marketing-gap scores", false, true],
    ["Price", "Per list, up front", "1 credit per lead; 10 free to start"],
  ] as Array<[string, ...Array<boolean | string>]>,
};

const FAQS = [
  {
    q: "Where can I get a general contractor email list?",
    a: "Build one in Contractor Leads by searching general contractors in your target city or state. Emails are verified before export.",
  },
  {
    q: "Is it legal to email contractors?",
    a: "In the US, B2B cold email is allowed under CAN-SPAM if you use a real sender, an honest subject line, your address and a working unsubscribe link.",
  },
  {
    q: "Do you have a roofing contractor email list?",
    a: "Yes. Search roofing contractors in any city to build a fresh roofing list.",
  },
  {
    q: "How much does a contractor email list cost?",
    a: "Each lead costs one credit. Plans start from $19.99 a month, and your first list (10 leads) is free.",
  },
  {
    q: "How is this different from a contractor contact list template?",
    a: "A template is an empty sheet. Contractor Leads fills it with real, verified contractor contacts.",
  },
];

export default function ContractorEmailListPage() {
  const trades = TRADE_PAGES.map((t) => ({ slug: t.slug, name: t.name }));
  const states = SEO_REGIONS.map((r) => ({
    slug: r.slug,
    name: r.name,
    code: r.code,
    cities: topCitiesForState(r.code).slice(0, 4),
  }));
  const tradeLists = EMAIL_LIST_TRADES.map((t) => ({ href: `/email-lists/${t.slug}`, label: `${t.name} email list` }));

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contractor email list", path: PATH },
          ]),
          webPageJsonLd({
            name: "Contractors email list builder",
            description: "Build a contractor or construction company email list by trade and area, with owner names and verified emails.",
            path: PATH,
            dateModified: pageUpdated(PATH),
            speakable: true,
          }),
          faqPageJsonLd(FAQS, PATH),
        ]}
      />

      <MarketingSubpageHero
        eyebrow="Contractor email list"
        title="Contractors email list, built fresh and verified"
        description="Roofers, HVAC companies, plumbers, general contractors and 14 more trades. Owner names where they can be confirmed, and every email checked before it reaches your campaign."
      >
        <HeroChecks items={["18 trades", "Any US city or state", "Verified emails", "10 free leads"]} />
      </MarketingSubpageHero>

      <section className="relative bg-gradient-to-b from-violet-50/70 via-white to-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ContractorListBuilder
            trades={trades}
            states={states}
            heading="Which contractor email list do you need?"
            listTemplate="{trade} email list: {place}"
          />
        </div>
      </section>

      <SubpageSection tone="soft" eyebrow="Quick answer" title="Where can I get a contractors email list?">
        <QuickAnswer>
          You can buy a pre-made contractors email list or build one from live data. Contractor Leads builds it:
          choose a trade and an area, and it pulls the contractors listed on Google there, finds owner names and
          emails, and labels every address safe, catch-all, role-based or invalid before you export to CSV or Excel.
          Your first 10 leads are free.
        </QuickAnswer>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="How it works" title="From trade to verified email list in three steps">
        <StepCards steps={STEPS} />
      </SubpageSection>

      <SubpageSection tone="tint" eyebrow="Product" title="Your list, inside the app">
        <ProductProof caption="The Contractor Leads dashboard: search a trade and area, then save, score and export the leads." />
        <div className="mx-auto mt-8 max-w-4xl">
          <SubpageStats
            items={[
              { value: "18", label: "contractor trades" },
              { value: "4", label: "email statuses: safe, catch-all, role, invalid" },
              { value: "0-100", label: "scores for website, SEO and ads" },
              { value: "10", label: "free leads, no credit card" },
            ]}
          />
        </div>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="Answers" title="Contractor email lists, explained">
        <AnswerBlocks items={ANSWERS} />
      </SubpageSection>

      <SubpageSection tone="soft" eyebrow="Compare" title="Bought contractor list vs built in Contractor Leads">
        <CompareTable headers={COMPARE.headers} rows={COMPARE.rows} />
        <p className="mx-auto mt-4 max-w-4xl text-[13px] text-slate-500">
          More detail:{" "}
          <Link href="/blog/buy-vs-build-contractor-email-list" className="font-semibold text-fuchsia-700 hover:underline">
            buy or build a contractor email list
          </Link>{" "}
          and{" "}
          <Link href="/blog/can-spam-cold-email-contractors" className="font-semibold text-fuchsia-700 hover:underline">
            CAN-SPAM for contractor outreach
          </Link>
          .
        </p>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="By trade" title="Email lists for each contractor trade">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tradeLists.map((p) => (
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
          Other trades are in the builder above. Need more than contractors? See the{" "}
          <Link href="/local-business-email-list" className="font-semibold text-fuchsia-700 hover:underline">
            local business email list
          </Link>{" "}
          or the{" "}
          <Link href="/contractor-email-finder" className="font-semibold text-fuchsia-700 hover:underline">
            contractor email finder
          </Link>
          .
        </p>
      </SubpageSection>

      <SubpageSection tone="soft" eyebrow="FAQ" title="Contractor email list: common questions">
        <FaqList faqs={FAQS} />
      </SubpageSection>

      <SubpageCtaBand
        title="Build your contractors email list free"
        description="Pick a trade and an area, get owners and verified emails, and export. Your first 10 leads are free."
        primaryLabel="Build my email list"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads · No credit card required"
      />
    </MarketingSiteShell>
  );
}
