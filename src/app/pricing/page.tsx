import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome, MarketingHero } from "@/components/marketing/marketing-chrome";
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

const PLANS = [
  {
    name: "Starter",
    blurb: "Prove the workflow on a small desk before you scale seats.",
    points: [
      "Lead Finder searches with AI scoring",
      "Saved leads + pipeline CRM",
      "Ask Contractor Leads assistant",
      "Email outreach from your SMTP",
    ],
  },
  {
    name: "Growth",
    blurb: "Built for agencies running outbound every week.",
    points: [
      "Higher monthly credits",
      "Hot leads + map density",
      "Owner enrichment + Meta ads intel",
      "Outreach Studio scripts",
    ],
    featured: true,
  },
  {
    name: "Agency",
    blurb: "Teams, exports, and volume when multiple closers share one pool.",
    points: [
      "Team seats & client reports",
      "Highest credit allotment",
      "API + CRM webhook access",
      "Priority support path",
    ],
  },
];

export default function PricingPage() {
  return (
    <MarketingChrome>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ])} />
      <JsonLd data={faqPageJsonLd(MARKETING_FAQ.slice(0, 3))} />

      <MarketingHero
        eyebrow="Pricing"
        title="Plans built for contractor outreach desks"
        description="Pick the seat that matches how many searches and closers you run. Start with free trial credits — no card required."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm"
          >
            Start free trial
          </Link>
          <Link
            href="/features"
            className="rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700"
          >
            See features
          </Link>
        </div>
      </MarketingHero>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                plan.featured
                  ? "border-fuchsia-300 ring-2 ring-fuchsia-100"
                  : "border-violet-100"
              }`}
            >
              {plan.featured ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fuchsia-600">
                  Most popular
                </p>
              ) : null}
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-900">
                {plan.name}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                {plan.blurb}
              </p>
              <ul className="mt-5 space-y-2 text-[14px] text-slate-700">
                {plan.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-fuchsia-600">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-6 inline-flex rounded-full bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white"
              >
                Get started
              </Link>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-[13px] text-slate-500">
          Messaging add-on unlocks bulk email and SMS. Exact credit allotments
          and seat prices are shown in-app at checkout.
        </p>
      </section>
    </MarketingChrome>
  );
}
