import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { MarketingPricingSection } from "@/components/marketing/marketing-pricing-section";
import { SubpageCtaBand, SubpageSection } from "@/components/marketing/marketing-subpage";
import { getMarketingPlansLive } from "@/components/marketing/marketing-plans-data";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor Leads Pricing: Plans for Agencies",
  description:
    "Compare Contractor Leads plans for agencies. Start free with 10 leads, then $19 to $99/mo. 1 credit = 1 lead, AI scoring and outreach tools included.",
  path: "/pricing",
  keywords: [
    "contractor leads pricing",
    "agency lead finder plans",
    "verified contractor leads cost",
    "home service lead generation software",
  ],
});

const PRICING_FAQS = [
  {
    q: "Is there a free plan or trial?",
    a: "Yes. Every new account receives 10 free scored leads on Starter with zero credit card required. You can search live Google Places data, view AI scores, test owner enrichment, and export to Excel before subscribing.",
  },
  {
    q: "How do credits work?",
    a: "One credit equals one lead. Starter includes 500 credits a month ($19/mo), Growth includes 2,000 credits ($49/mo), and Agency includes 5,000 credits ($99/mo). The AI assistant and outreach generation use credits as listed on the pricing breakdown.",
  },
  {
    q: "Do you offer an annual billing discount?",
    a: "Yes. Annual subscriptions receive up to a 25% discount, bringing Starter down to $14/month, Growth to $39/month, and Agency to $79/month.",
  },
  {
    q: "Can I cancel or change my plan anytime?",
    a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time directly inside your account billing settings. You keep access to all exported leads and saved lists.",
  },
  {
    q: "What is included in the Enterprise plan?",
    a: "Enterprise seats are custom-tailored for high-volume agencies, franchises, and call centers requiring custom API webhooks, multi-user role management, dedicated onboarding, and priority proxy infrastructure.",
  },
];

/** Live admin prices — do not prerender at build (DB not available on Railway). */
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await getMarketingPlansLive();

  return (
    <MarketingSiteShell>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(PRICING_FAQS)} />

      <MarketingSubpageHero
        eyebrow="Transparent Plans"
        title="Plans built for contractor outreach desks"
        description="Pick the seat that matches how many searches and closers you run. Start free with 10 leads, prove ROI, and scale your outbound engine."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/features"
            className="rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700"
          >
            See all features
          </Link>
          <Link
            href="/google-maps-scraper"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur hover:bg-white/20"
          >
            Compare Google Maps Scraper
          </Link>
        </div>
      </MarketingSubpageHero>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <MarketingPricingSection plans={plans} />
      </section>

      {/* Pricing FAQs Section */}
      <SubpageSection
        tone="light"
        eyebrow="Questions & Billing"
        title="Frequently asked questions about pricing"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {PRICING_FAQS.map((faq, idx) => (
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
        title="Start free, upgrade when you're closing"
        description="Every plan includes AI scoring, owner enrichment, and Outreach Studio. Begin on Starter with 10 free leads and no card."
        primaryLabel="Create your account"
        secondaryHref="/features"
        secondaryLabel="See all features"
        note="1 credit = 1 lead · No credit card required · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
