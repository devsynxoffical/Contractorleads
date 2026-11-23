import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineBuildingStorefront,
  HiOutlineCheckBadge,
  HiOutlineCloudArrowDown,
} from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageLinkGrid, SubpageSection } from "@/components/marketing/marketing-subpage";
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
import { SEO_REGIONS, TRADE_PAGES, buildMetadata } from "@/lib/seo";
import { topCitiesForState } from "@/lib/state-profiles";
import { pageUpdated } from "@/lib/page-dates";

const PATH = "/local-business-email-list";

export const metadata: Metadata = buildMetadata({
  title: "Local Business Email List: Verified B2B Emails by City",
  description:
    "Build a local business email list by city and business type: home-service companies, agencies and e-commerce brands, with owners and verified emails. 10 free.",
  path: PATH,
  keywords: [
    "local business email list",
    "business email list",
    "small business email list",
    "local business leads",
    "b2b email list by city",
    "local business database",
  ],
});

const STEPS = [
  {
    icon: HiOutlineBuildingStorefront,
    title: "Pick a business type and city",
    text: "Choose one of 18 home-service trades, marketing agencies or e-commerce brands, then a city or state.",
  },
  {
    icon: HiOutlineCheckBadge,
    title: "Get owners and verified emails",
    text: "Each business gets its phone, website, Google rating, the owner where it can be matched, and an email labelled safe, catch-all, role-based or invalid.",
  },
  {
    icon: HiOutlineCloudArrowDown,
    title: "Export and start outreach",
    text: "Download CSV or Excel, send to GoHighLevel, HubSpot or Zapier, or write each first email from the business's own audit.",
  },
];

const ANSWERS = [
  {
    q: "What is a local business email list?",
    a: (
      <p>
        A list of businesses in a specific city or area with a contact email for each, used for B2B outreach by
        agencies, software companies and suppliers. The useful ones reach the owner, not a shared info@ inbox, and
        are checked before you send.
      </p>
    ),
  },
  {
    q: "Which local businesses can I build a list for?",
    a: (
      <p>
        Contractor Leads covers 18 home-service trades (roofing, HVAC, plumbing, electrical, landscaping, cleaning
        and more), plus marketing agencies and e-commerce brands. It is built for agencies that sell to these
        businesses. It does not cover every category, such as restaurants, dentists or law firms.
      </p>
    ),
  },
  {
    q: "How is this different from a business email list I can buy?",
    a: (
      <p>
        A bought business email list is compiled in advance and sold per list. Here the list is built from live
        Google data when you search, so new businesses appear and closed ones drop out, and each lead carries scores
        for its website, SEO and ads that tell you what to pitch.
      </p>
    ),
  },
  {
    q: "How do I keep emails out of spam?",
    a: (
      <p>
        Send only to addresses marked safe, from a warmed-up mailbox, in small daily batches, with a postal address
        and an opt-out. Read the{" "}
        <Link href="/blog/can-spam-cold-email-contractors" className="font-semibold text-fuchsia-700 hover:underline">
          CAN-SPAM guide
        </Link>{" "}
        before your first send.
      </p>
    ),
  },
];

const COMPARE = {
  headers: ["", "Bought business email list", "Contractor Leads"],
  rows: [
    ["Built for your exact city", "Seller's regions", true],
    ["Fresh when you send", false, true],
    ["Owner names", "Sometimes", "Where they can be verified"],
    ["Email verification status", "Rarely", "On every email"],
    ["Website, SEO and ads scores", false, true],
    ["Pay per lead you keep", false, true],
  ] as Array<[string, ...Array<boolean | string>]>,
};

const FAQS = [
  {
    q: "Do you sell a local business email list?",
    a: "No pre-made lists. You build your own from live Google data for the business type and area you choose. Your first 10 leads are free, then plans start at $19.99 a month for 750 credits; one credit equals one lead.",
  },
  {
    q: "Which countries are covered?",
    a: "All 50 US states, plus Canada, the UK, Australia and New Zealand.",
  },
  {
    q: "Can I build an email list of marketing agencies or e-commerce brands?",
    a: "Yes. Besides the 18 home-service trades, Contractor Leads has search presets for marketing agencies (digital, SEO, advertising and web design agencies) and e-commerce brands (online stores and direct-to-consumer brands).",
  },
  {
    q: "Are the emails verified?",
    a: "Every email is labelled safe, catch-all, role-based or invalid before export. Safe addresses are the ones to send to first.",
  },
  {
    q: "Can I export the list?",
    a: "Yes, to CSV or Excel, or straight to GoHighLevel, HubSpot or Zapier.",
  },
];

export default function LocalBusinessEmailListPage() {
  const trades = [
    ...TRADE_PAGES.map((t) => ({ slug: t.slug, name: t.name })),
    { slug: "agency-owners", name: "Marketing agency" },
    { slug: "ecommerce-brands", name: "E-commerce brand" },
  ];
  const states = SEO_REGIONS.map((r) => ({
    slug: r.slug,
    name: r.name,
    code: r.code,
    cities: topCitiesForState(r.code).slice(0, 4),
  }));
  const tradeLinks = TRADE_PAGES.map((t) => ({ href: `/industries/${t.slug}`, label: t.name }));

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Local business email list", path: PATH },
          ]),
          webPageJsonLd({
            name: "Local business email list builder",
            description: "Build a local business email list by city and business type, with owner names and verified emails.",
            path: PATH,
            dateModified: pageUpdated(PATH),
            speakable: true,
          }),
          faqPageJsonLd(FAQS, PATH),
        ]}
      />

      <MarketingSubpageHero
        eyebrow="Local business email list"
        title="A local business email list for any city"
        description="Home-service companies, marketing agencies and e-commerce brands, pulled live from Google with owner names and verified emails. Built for agencies doing B2B outreach."
      >
        <HeroChecks items={["20 business types", "US, CA, UK, AU, NZ", "Verified emails", "10 free leads"]} />
      </MarketingSubpageHero>

      <section className="relative bg-gradient-to-b from-violet-50/70 via-white to-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ContractorListBuilder
            trades={trades}
            states={states}
            defaultTrade="plumbing"
            heading="Which local businesses do you sell to?"
            tradeLabel="Business type"
            listTemplate="{trade} email list: {place}"
          />
        </div>
      </section>

      <SubpageSection tone="soft" eyebrow="Quick answer" title="How do I get a local business email list?">
        <QuickAnswer>
          Choose the type of business and the city, then build the list from live data instead of buying an old one.
          Contractor Leads pulls the businesses Google lists in that area, adds the owner&apos;s name where it can be
          verified and an email labelled safe, catch-all, role-based or invalid, and lets you export to CSV, Excel or
          your CRM. It covers 18 home-service trades, marketing agencies and e-commerce brands.
        </QuickAnswer>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="How it works" title="Build a business email list in three steps">
        <StepCards steps={STEPS} />
      </SubpageSection>

      <SubpageSection tone="tint" eyebrow="Product" title="Every list lives in your workspace">
        <ProductProof caption="The Contractor Leads dashboard: quick lead search by business type and area, with saved leads and exports." />
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="Answers" title="Local business email lists, explained">
        <AnswerBlocks items={ANSWERS} />
      </SubpageSection>

      <SubpageSection tone="soft" eyebrow="Compare" title="Bought business email list vs Contractor Leads">
        <CompareTable headers={COMPARE.headers} rows={COMPARE.rows} />
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="Business types" title="Local business lists by trade">
        <SubpageLinkGrid items={tradeLinks} columns={4} />
        <p className="mt-5 text-center text-[13.5px] text-slate-600">
          Selling to contractors only? Use the{" "}
          <Link href="/contractor-email-list" className="font-semibold text-fuchsia-700 hover:underline">
            contractor email list
          </Link>
          . Selling websites? Find{" "}
          <Link href="/businesses-without-websites" className="font-semibold text-fuchsia-700 hover:underline">
            businesses without websites
          </Link>
          .
        </p>
      </SubpageSection>

      <SubpageSection tone="soft" eyebrow="FAQ" title="Local business email list: common questions">
        <FaqList faqs={FAQS} />
      </SubpageSection>

      <SubpageCtaBand
        title="Build your local business email list free"
        description="Pick a business type and a city, get owners and verified emails, and export. Your first 10 leads are free."
        primaryLabel="Build my list free"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads · No credit card required"
      />
    </MarketingSiteShell>
  );
}
