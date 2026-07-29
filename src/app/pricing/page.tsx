import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { MarketingPricingSection } from "@/components/marketing/marketing-pricing-section";
import { SubpageCtaBand } from "@/components/marketing/marketing-subpage";
import { getMarketingPlansLive } from "@/components/marketing/marketing-plans-data";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from "@/components/seo/json-ld";
import { MARKETING_FAQ, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pricing — contractor lead plans for agencies",
  description:
    "Compare Contractor Leads plans for agencies. Start free with trial credits — Starter, Growth, and Agency seats with AI scoring and outreach tools.",
  path: "/pricing",
  keywords: [
    "contractor leads pricing",
    "agency lead finder plans",
    "verified contractor leads cost",
    "home service lead generation software",
  ],
});

/** Live admin prices — do not prerender at build (DB not available on Railway). */
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await getMarketingPlansLive();

  return (
    <MarketingSiteShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(MARKETING_FAQ.slice(0, 3))} />

      <MarketingSubpageHero
        eyebrow="Pricing"
        title="Plans built for contractor outreach desks"
        description="Pick the seat that matches how many searches and closers you run. Logged-in? You’ll see your current plan and upgrade into billing — not signup."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/features"
            className="rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700"
          >
            See features
          </Link>
        </div>
      </MarketingSubpageHero>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <MarketingPricingSection plans={plans} />
      </section>

      <SubpageCtaBand
        title="Start free, upgrade when you're closing"
        description="Every plan includes AI scoring, owner enrichment, and Outreach Studio. Begin on Starter with 10 free leads and no card."
        primaryLabel="Create your account"
        secondaryHref="/features"
        secondaryLabel="See all features"
        note="No credit card required · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
