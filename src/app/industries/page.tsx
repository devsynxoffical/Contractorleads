import type { Metadata } from "next";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";
import {
  MarketingSiteShell,
  MarketingSubpageHero,
} from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
  SubpageStats,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { TIER_ONE_COUNTRIES } from "@/lib/constants";
import { SEO_REGIONS, TRADE_PAGES, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor leads by trade — roofing, HVAC, plumbing & more",
  description:
    "Browse verified contractor lead verticals for agencies: roofing, HVAC, plumbing, electrical, solar, landscaping, remodeling, and more home-service trades.",
  path: "/industries",
  keywords: [
    "contractor leads by industry",
    "roofing contractor leads",
    "HVAC contractor leads",
    "plumbing contractor leads",
    "home service lead generation",
  ],
});

export default function TradesIndexPage() {
  return (
    <MarketingSiteShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ])}
      />
      <MarketingSubpageHero
        eyebrow="Industries"
        title="Contractor leads for every home-service vertical"
        description="Agencies sell into specific trades. Jump into the vertical you pitch — each page is built around how that market buys marketing."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            Start free trial
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/features"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            See how it works
          </Link>
        </div>
      </MarketingSubpageHero>

      <SubpageSection tone="tint">
        <SubpageStats
          items={[
            { value: `${TRADE_PAGES.length}`, label: "Home-service verticals" },
            { value: `${SEO_REGIONS.length}`, label: "US state landing pages" },
            {
              value: `${TIER_ONE_COUNTRIES.length}`,
              label: "Countries you can prospect",
            },
            { value: "Live", label: "Google & Yelp data at search time" },
          ]}
        />
      </SubpageSection>

      <SubpageSection
        tone="light"
        eyebrow="Browse"
        title="Pick the vertical you pitch"
        description="Each trade page covers why that market buys marketing, what data comes back on every lead, and state-level landers for local outreach."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRADE_PAGES.map((t, i) => (
            <Reveal key={t.slug} delay={0.04 * i}>
              <Link href={`/industries/${t.slug}`} className="group block h-full">
                <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                  <h2 className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900">
                    {t.name}
                  </h2>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">
                    {t.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-700">
                    View {t.name} leads
                    <HiOutlineArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="Pick a trade and pull your first scored list"
        description="Search live business data in any of these verticals across the US, Canada, the UK, Australia, and New Zealand."
        primaryLabel="Start free trial"
        secondaryHref="/features"
        secondaryLabel="See how it works"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
