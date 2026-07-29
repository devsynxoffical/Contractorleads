import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { SubpageCtaBand } from "@/components/marketing/marketing-subpage";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { TRADE_PAGES, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor leads by trade — roofing, HVAC, plumbing & more",
  description:
    "Browse verified contractor lead verticals for agencies: roofing, HVAC, plumbing, electrical, solar, landscaping, remodeling, and more home-service trades.",
  path: "/trades",
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
          { name: "Trades", path: "/trades" },
        ])}
      />
      <MarketingSubpageHero
        eyebrow="Trades"
        title="Contractor leads for every home-service vertical"
        description="Agencies sell into specific trades. Jump into the vertical you pitch — each page is built around how that market buys marketing."
      />

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRADE_PAGES.map((t) => (
            <Link
              key={t.slug}
              href={`/trades/${t.slug}`}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900">
                {t.name}
              </h2>
              <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-slate-600">
                {t.description}
              </p>
              <span className="mt-4 inline-block text-[13px] font-semibold text-fuchsia-700">
                View {t.name} leads →
              </span>
            </Link>
          ))}
        </div>
      </section>

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
