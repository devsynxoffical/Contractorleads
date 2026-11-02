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
} from "@/components/marketing/marketing-subpage";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/components/seo/json-ld";
import { ALL_FAQS, FAQ_GROUPS } from "@/lib/faq-content";
import { BLOG_POSTS } from "@/lib/blog-content";

/** Guides that go deeper on each FAQ topic (internal links for readers and crawlers). */
const GROUP_GUIDES: Record<string, string[]> = {
  product: ["how-to-get-contractor-leads", "best-contractor-lead-generation-companies"],
  data: ["google-maps-lead-generation", "how-to-find-business-owner-name"],
  pricing: ["how-much-do-contractor-leads-cost", "pay-per-lead-for-contractors"],
  outreach: ["cold-email-for-agencies", "cold-email-subject-lines-for-contractors", "cold-calling-contractors-script"],
  integrations: ["agency-lead-generation"],
  affiliates: ["how-to-get-clients-for-marketing-agency"],
};
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor Leads FAQ: Pricing, Data, Email and Affiliates",
  description:
    "Plain-language answers about Contractor Leads: what it is, where the data comes from, how credits and pricing work, email and SMS sending, integrations and the affiliate program.",
  path: "/faq",
  keywords: [
    "contractor leads faq",
    "contractor leads pricing questions",
    "contractor leads data source",
    "contractor leads affiliate program",
    "how does contractor leads work",
  ],
});

export default function FaqPage() {
  return (
    <MarketingSiteShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqPageJsonLd(ALL_FAQS),
        ]}
      />
      <MarketingSubpageHero
        eyebrow="Frequently asked questions"
        title="Straight answers about Contractor Leads"
        description="Every answer is written to stand on its own, so you can read one question or the whole page. If something is missing, email hello@contractorleads.us."
      >
        <nav
          aria-label="FAQ sections"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {FAQ_GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-semibold text-white/75 backdrop-blur transition hover:bg-white/15 hover:text-white"
            >
              {g.title}
            </a>
          ))}
        </nav>
      </MarketingSubpageHero>

      {FAQ_GROUPS.map((group, gi) => (
        <SubpageSection
          key={group.id}
          id={group.id}
          tone={gi % 2 === 0 ? "light" : "tint"}
          eyebrow={`${group.items.length} ${group.items.length === 1 ? "question" : "questions"}`}
          title={group.title}
        >
          <dl className="mx-auto max-w-3xl space-y-3">
            {group.items.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
              >
                <dt className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900">
                  {item.q}
                </dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>
          {(GROUP_GUIDES[group.id] ?? []).length > 0 && (
            <p className="mx-auto mt-4 max-w-3xl text-[13px] text-slate-600">
              Go deeper:{" "}
              {(GROUP_GUIDES[group.id] ?? [])
                .map((slug) => BLOG_POSTS.find((p) => p.slug === slug))
                .filter((p): p is NonNullable<typeof p> => Boolean(p))
                .map((p, i, arr) => (
                  <span key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className="font-semibold text-fuchsia-700 hover:underline">
                      {p.title}
                    </Link>
                    {i < arr.length - 1 ? " · " : ""}
                  </span>
                ))}
            </p>
          )}
        </SubpageSection>
      ))}

      <SubpageSection
        tone="light"
        align="center"
        eyebrow="More"
        title="Still have a question?"
        description="The help center covers setup step by step, and the blog covers how agencies sell to contractors."
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-fuchsia-300"
          >
            Help center <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-fuchsia-300"
          >
            Agency playbooks <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="See it on your own market"
        description="Pick a trade and a city, and get 10 live, scored leads free."
        primaryLabel="Start free (10 leads)"
        secondaryHref="/pricing"
        secondaryLabel="See pricing"
        note="No credit card required · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
