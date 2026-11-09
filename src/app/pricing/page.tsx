import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { MarketingPricingSection } from "@/components/marketing/marketing-pricing-section";
import { MarketingComparison } from "@/components/marketing/marketing-comparison";
import { SubpageCtaBand, SubpageSection } from "@/components/marketing/marketing-subpage";
import { formatPlanPrice, getMarketingPlansLive } from "@/components/marketing/marketing-plans-data";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor Leads Pricing: Find Leads From $19.99/mo",
  description:
    "Find contractor leads from $19.99 a month: 1 credit = 1 lead with owner names, verified emails and AI scores. Start with 10 free leads, no card.",
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
    q: "How much does Contractor Leads cost?",
    a: "Plans start at $19.99 a month for 500 credits (Starter), then $49 for 2,000 credits (Growth) and $99 for 5,000 credits (Agency). One credit equals one lead, so the cost per lead falls from about 4 cents to 2 cents as you move up. Every new account starts with 10 free leads.",
  },
  {
    q: "Which plan should I choose?",
    a: "Pick by how many leads you contact each month. Freelancers and small agencies testing one or two trades usually start on Starter. Agencies running daily outbound across several markets fit Growth, and teams with several callers or high-volume campaigns fit Agency. You can change plans at any time, so start small and upgrade when replies justify it.",
  },
  {
    q: "Is there a free plan or trial?",
    a: "Yes. Every new account receives 10 free scored leads on Starter with zero credit card required. You can search live Google Places data, view AI scores, test owner enrichment, and export to Excel before subscribing.",
  },
  {
    q: "How do credits work?",
    a: "One credit equals one lead. Starter includes 500 credits a month ($19.99/mo), Growth includes 2,000 credits ($49/mo), and Agency includes 5,000 credits ($99/mo). The AI assistant and outreach generation use credits as listed on the pricing breakdown.",
  },
  {
    q: "Do you offer an annual billing discount?",
    a: "Yes. Annual subscriptions save up to 25%: Starter works out to $15/month, Growth to $39/month, and Agency to $79/month when billed annually.",
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
  // Cost-per-lead rows from the live prices, so the table never drifts from the plan cards.
  const perLeadRows = plans.flatMap((p) =>
    p.priceMonthly && p.leadsIncluded
      ? [{ id: p.id, name: p.name, monthly: p.priceMonthly, leads: p.leadsIncluded, annual: p.priceAnnualMonthly }]
      : [],
  );

  return (
    <MarketingSiteShell>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(PRICING_FAQS, "/pricing")} />

      <MarketingSubpageHero
        eyebrow="Transparent Plans"
        title="Contractor Leads pricing: plans from $19.99"
        description="Pick the plan that matches how many leads you contact each month. Start free with 10 leads, prove ROI, and scale your outbound engine."
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

      {/* Quick answer */}
      <section className="mx-auto max-w-3xl px-5 pt-14 sm:px-8">
        <div className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900 sm:text-[22px]">
            How much does Contractor Leads cost?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            Contractor Leads costs from $19.99 a month for 500 lead credits, and every new account
            gets 10 free leads with no credit card. One credit is one lead, and each lead includes
            live Google data, an owner name where available, AI scores and outreach scripts. Larger
            plans lower the cost per lead to about 2 cents.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <MarketingPricingSection plans={plans} />
      </section>

      {/* Cost per lead, calculated from the live plan prices above */}
      <SubpageSection
        tone="light"
        eyebrow="Cost per lead"
        title="What each lead costs on every plan"
        description="Calculated from the current plan prices and monthly credits. One credit equals one lead."
      >
        <div className="mx-auto max-w-3xl overflow-x-auto rounded-2xl border border-violet-100 bg-white shadow-xs">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead className="bg-violet-50 text-[12px] uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Monthly price</th>
                <th className="px-4 py-3 font-semibold">Leads a month</th>
                <th className="px-4 py-3 font-semibold">Cost per lead</th>
                <th className="px-4 py-3 font-semibold">Billed annually</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-50 text-slate-700">
              {perLeadRows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-4 py-3">${formatPlanPrice(r.monthly)}</td>
                  <td className="px-4 py-3">{r.leads.toLocaleString()}</td>
                  <td className="px-4 py-3">${(r.monthly / r.leads).toFixed(3)}</td>
                  <td className="px-4 py-3">
                    {r.annual ? `$${(r.annual / r.leads).toFixed(3)} per lead` : "Not offered"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center text-[13px] text-slate-500">
          For what contractors themselves pay for homeowner leads, see our{" "}
          <Link href="/blog/how-much-do-contractor-leads-cost" className="font-semibold text-fuchsia-700 hover:underline">
            contractor lead cost benchmarks
          </Link>
          . Comparing tools? See{" "}
          <Link href="/alternatives" className="font-semibold text-fuchsia-700 hover:underline">
            Apollo, Hunter and Prospeo alternatives
          </Link>{" "}
          or the{" "}
          <Link href="/contractor-email-finder" className="font-semibold text-fuchsia-700 hover:underline">
            contractor email finder
          </Link>
          .
        </p>
      </SubpageSection>

      {/* The difference: what every plan includes vs lists and scrapers */}
      <MarketingComparison />

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
