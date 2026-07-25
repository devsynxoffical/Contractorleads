import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome, MarketingHero } from "@/components/marketing/marketing-chrome";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Features — AI contractor lead finder for agencies",
  description:
    "Lead Finder, AI scoring, owner enrichment, Meta ads intel, Outreach Studio, pipeline CRM, email & SMS — everything agencies need to prospect home-service contractors.",
  path: "/features",
});

const FEATURES = [
  {
    title: "Lead Finder",
    body: "Search live Google Places data by trade, metro, and filters — not a static purchased list.",
  },
  {
    title: "AI lead scoring",
    body: "Every lead gets website, PPC, SEO, and marketing opportunity scores so you dial the right accounts first.",
  },
  {
    title: "Owner enrichment",
    body: "Decision-maker names scraped from the business site and cross-checked — not guessed from a pattern.",
  },
  {
    title: "Meta ads intel",
    body: "See Facebook Ads Library context before you pitch so you know if they already spend.",
  },
  {
    title: "Outreach Studio",
    body: "Generate cold email, SMS, follow-up, and call scripts per lead in one click.",
  },
  {
    title: "Pipeline CRM",
    body: "Save leads, move stages, favorite hot accounts, and keep notes without a second tool.",
  },
  {
    title: "Email + SMS",
    body: "Send from your SMTP mailbox; add Twilio SMS with the Messaging add-on for text outreach.",
  },
  {
    title: "Ask Contractor Leads",
    body: "A growth assistant that already knows your company, ICP, and goal from onboarding.",
  },
  {
    title: "Lead Map",
    body: "See contractor density by metro before you burn credits or ad budget.",
  },
  {
    title: "Integrations",
    body: "Push status changes to CRM webhooks, Slack, or GHL — and export when you need a spreadsheet.",
  },
  {
    title: "Social presence filter",
    body: "Require LinkedIn, social, and an identified owner before a lead lands in your results.",
  },
  {
    title: "Verified sources",
    body: "Google, Yelp, and live site data — blank fields beat invented phone numbers.",
  },
];

export default function FeaturesPage() {
  return (
    <MarketingChrome>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ])}
      />
      <MarketingHero
        eyebrow="Features"
        title="Contractor prospecting without the five-tab circus"
        description="Google search, AI scoring, owner contacts, ad intel, and outreach — one workspace for agencies selling into home-service trades."
      >
        <Link
          href="/register"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          Start free trial
        </Link>
      </MarketingHero>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900">
                {f.title}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </MarketingChrome>
  );
}
