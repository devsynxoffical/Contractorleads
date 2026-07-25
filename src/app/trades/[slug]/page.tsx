import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingChrome, MarketingHero } from "@/components/marketing/marketing-chrome";
import {
  JsonLd,
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
} from "@/components/seo/json-ld";
import {
  TRADE_PAGES,
  buildMetadata,
  getTradeBySlug,
} from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TRADE_PAGES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trade = getTradeBySlug(slug);
  if (!trade) return {};
  return buildMetadata({
    title: trade.headline,
    description: trade.description,
    path: `/trades/${trade.slug}`,
    keywords: trade.keywords,
  });
}

export default async function TradePage({ params }: Params) {
  const { slug } = await params;
  const trade = getTradeBySlug(slug);
  if (!trade) notFound();

  return (
    <MarketingChrome>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Trades", path: "/trades" },
          { name: trade.name, path: `/trades/${trade.slug}` },
        ])}
      />

      <MarketingHero
        eyebrow={`${trade.name} leads`}
        title={trade.headline}
        description={trade.description}
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Find {trade.name} leads free
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700"
          >
            View plans
          </Link>
        </div>
      </MarketingHero>

      <section className="mx-auto max-w-3xl space-y-8 px-5 py-16 text-[15px] leading-relaxed text-slate-600 sm:px-8">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            Why agencies pitch {trade.name.toLowerCase()} contractors
          </h2>
          <p className="mt-3">{trade.angle}</p>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            What you get on every lead
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Live Google / Yelp business data — not a brokered dump</li>
            <li>Phone, website, ratings, and review signals when available</li>
            <li>Owner / decision-maker enrichment from the company site</li>
            <li>AI opportunity scores for website, PPC, SEO, and marketing fit</li>
            <li>Cold email, SMS, and call scripts from Outreach Studio</li>
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
            Related trades
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TRADE_PAGES.filter((t) => t.slug !== trade.slug)
              .slice(0, 6)
              .map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/trades/${t.slug}`}
                    className="inline-flex rounded-full border border-violet-100 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:border-fuchsia-300"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </MarketingChrome>
  );
}
