import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome, MarketingHero } from "@/components/marketing/marketing-chrome";
import { MarketingPricingSection } from "@/components/marketing/marketing-pricing-section";
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

export default function PricingPage() {
  return (
    <MarketingChrome>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(MARKETING_FAQ.slice(0, 3))} />

      <MarketingHero
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
      </MarketingHero>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <MarketingPricingSection />
      </section>
    </MarketingChrome>
  );
}
