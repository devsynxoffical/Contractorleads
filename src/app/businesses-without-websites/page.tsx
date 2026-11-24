import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand, SubpageSection } from "@/components/marketing/marketing-subpage";
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

const PATH = "/businesses-without-websites";

export const metadata: Metadata = buildMetadata({
  title: "Find Businesses Without Websites: Local Leads for Web Design",
  description:
    "Find businesses without websites in any US city. Search by trade, see contact details and pitch web design in minutes. Your first list is free.",
  path: PATH,
  keywords: [
    "businesses without websites",
    "find businesses without websites",
    "local businesses without websites",
    "businesses with no website",
    "web design leads",
    "leads for web designers",
  ],
});

const STEPS = [
  {
    icon: HiOutlineMagnifyingGlass,
    title: "Search a trade and city",
    text: "Pick a trade such as landscaping, painting or cleaning, and a city or state. Contractor Leads pulls every business Google lists there.",
  },
  {
    icon: HiOutlineFunnel,
    title: "Spot the ones with no site",
    text: "Each lead is marked No website or Website found. Businesses with a site get a website and SEO score, so weak sites stand out too.",
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: "Pitch the owner",
    text: "Use the owner's name, phone and verified email where available, and open with what customers see when they search for the business today.",
  },
];

const ANSWERS = [
  {
    q: "How do I find businesses without websites?",
    a: (
      <>
        <p>
          By hand: search Google Maps for a trade and city, open each listing and note the ones with no website
          link. Confirm the business is active (recent reviews, a working phone) before you pitch.
        </p>
        <p>
          At scale: build the list in Contractor Leads. Every business in the search is marked No website or Website
          found, with owner and contact details added, so you skip the clicking.
        </p>
      </>
    ),
  },
  {
    q: "Which businesses most often have no website?",
    a: (
      <p>
        Owner-operated trades that win work by referral: landscaping, painting, cleaning, concrete, fencing and
        handyman-style home improvement companies. Newer businesses and those that rely on a Facebook page are also
        common. Check a few cities before you choose a niche.
      </p>
    ),
  },
  {
    q: "Is a business with no website a good lead?",
    a: (
      <p>
        Only if it is active and earning. A listing with recent reviews and a steady rating shows a business that has
        customers but is losing the ones who search online. A listing with no reviews in two years may be closed.
      </p>
    ),
  },
  {
    q: "What should I say in the first message?",
    a: (
      <p>
        Lead with what you saw, not with your service: &ldquo;I searched for painters in your town and your business
        shows reviews but no website, so customers cannot see your work or prices.&rdquo; Then offer one clear next
        step. Our <Link href="/blog/how-to-find-businesses-without-websites" className="font-semibold text-fuchsia-700 hover:underline">full guide</Link> has templates.
      </p>
    ),
  },
];

const COMPARE = {
  headers: ["", "Manual Google Maps search", "Contractor Leads"],
  rows: [
    ["Time for 100 businesses", "Hours of clicking", "Minutes"],
    ["No website flag", "You check each listing", "Marked on every lead"],
    ["Owner name", false, "Where it can be verified"],
    ["Verified email", false, true],
    ["Score for weak websites", false, true],
    ["Export to CSV or CRM", false, true],
  ] as Array<[string, ...Array<boolean | string>]>,
};

const FAQS = [
  {
    q: "How do I find businesses without websites near me?",
    a: "Search your city and a trade in Contractor Leads, then look for the No website label on each result. You get a ready list of local prospects with phone numbers and addresses.",
  },
  {
    q: "Is there a businesses without websites finder?",
    a: "Yes. Contractor Leads works as one: it shows website status on every listing, so you can pick out the businesses without a site.",
  },
  {
    q: "How many US businesses do not have a website?",
    a: "Many small local service businesses still rely on Google Maps or Facebook only. Search any city in the tool to see the real count for your trade.",
  },
  {
    q: "How do I pitch a business that has no website?",
    a: "Keep it short, mention their reviews, and show a simple mockup of what their site could look like. A clear monthly price works better than a long proposal.",
  },
  {
    q: "Is the first list really free?",
    a: "Yes. Your first list (10 leads) is free and no credit card is required.",
  },
  {
    q: "How do I find clients for web design?",
    a: "Look for local businesses that have customers but a missing or weak website. Search a trade and city, keep the ones with recent reviews and no website or a low website score, then call or email the owner about what customers see today and offer a simple site at a clear monthly price.",
  },
];

export default function BusinessesWithoutWebsitesPage() {
  const trades = TRADE_PAGES.map((t) => ({ slug: t.slug, name: t.name }));
  const states = SEO_REGIONS.map((r) => ({
    slug: r.slug,
    name: r.name,
    code: r.code,
    cities: topCitiesForState(r.code).slice(0, 4),
  }));
  const defaultTrade = trades.some((t) => t.slug === "landscaping") ? "landscaping" : trades[0].slug;

  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Businesses without websites", path: PATH },
          ]),
          webPageJsonLd({
            name: "Find businesses without websites",
            description: "Find local businesses without a website by trade and city, with owner names and verified emails.",
            path: PATH,
            dateModified: pageUpdated(PATH),
            speakable: true,
          }),
          faqPageJsonLd(FAQS, PATH),
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to find businesses without websites",
            step: STEPS.map((st, i) => ({ "@type": "HowToStep", position: i + 1, name: st.title, text: st.text })),
          },
        ]}
      />

      <MarketingSubpageHero
        eyebrow="Leads for web designers and agencies"
        title="Find businesses without websites in any city"
        description="Search a trade and a city, and every business comes back marked No website or Website found, with the owner's name and contact details. Built for agencies that sell websites, SEO and ads."
      >
        <HeroChecks items={["No website flag on every lead", "Owner names", "Verified emails", "10 free leads"]} />
      </MarketingSubpageHero>

      <section className="relative bg-gradient-to-b from-violet-50/70 via-white to-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ContractorListBuilder
            trades={trades}
            states={states}
            defaultTrade={defaultTrade}
            heading="Where do you want to find businesses without websites?"
            listTemplate="{trade} businesses in {place}"
            example="no-website"
          />
        </div>
      </section>

      <SubpageSection tone="soft" eyebrow="Quick answer" title="What is the fastest way to find businesses without websites?">
        <QuickAnswer>
          Search Google Maps for a trade and a city and keep the listings with no website link, then confirm each one
          is active from its recent reviews. That works for a few dozen. For hundreds, Contractor Leads pulls every
          business in the area, marks each one No website or Website found, and adds the owner&apos;s name and
          verified email, so you can start outreach the same day.
        </QuickAnswer>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="How it works" title="From search to first pitch in three steps">
        <StepCards steps={STEPS} />
      </SubpageSection>

      <SubpageSection tone="tint" eyebrow="Product" title="Search, score and save in one place">
        <ProductProof caption="The Contractor Leads dashboard: run a search by trade and area, then review, save and export the leads." />
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="Answers" title="Businesses without websites: what agencies ask">
        <AnswerBlocks items={ANSWERS} />
      </SubpageSection>

      <SubpageSection tone="soft" eyebrow="Compare" title="Manual search vs Contractor Leads">
        <CompareTable headers={COMPARE.headers} rows={COMPARE.rows} />
        <p className="mx-auto mt-4 max-w-4xl text-[13px] text-slate-500">
          Also useful:{" "}
          <Link href="/google-maps-scraper" className="font-semibold text-fuchsia-700 hover:underline">
            Google Maps scraper for agencies
          </Link>
          ,{" "}
          <Link href="/contractor-list" className="font-semibold text-fuchsia-700 hover:underline">
            free contractor list
          </Link>{" "}
          and{" "}
          <Link href="/local-business-email-list" className="font-semibold text-fuchsia-700 hover:underline">
            local business email list
          </Link>
          .
        </p>
      </SubpageSection>

      <SubpageSection tone="light" eyebrow="FAQ" title="Finding businesses without websites: common questions">
        <FaqList faqs={FAQS} />
      </SubpageSection>

      <SubpageCtaBand
        title="Find your first 10 businesses without websites free"
        description="Pick a trade and a city, see which businesses have no website, and reach the owner."
        primaryLabel="Find businesses free"
        secondaryHref="/pricing"
        secondaryLabel="View plans"
        note="10 free leads · No credit card required"
      />
    </MarketingSiteShell>
  );
}
