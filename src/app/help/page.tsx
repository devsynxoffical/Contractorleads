import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { HiOutlineArrowRight, HiOutlineClock, HiOutlineBookOpen } from "react-icons/hi2";
import {
  SubpageCtaBand,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import {
  ACADEMY_ARTICLES,
  ACADEMY_CATEGORIES,
  categoryLabel,
} from "@/lib/academy-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contractor Leads Help Center: Setup, Credits and Outreach",
  description:
    "Official help center and documentation for Contractor Leads. Setup guides, credit rules, email sequences, CRM integrations, and billing FAQs.",
  path: "/help",
  keywords: [
    "contractor leads help center",
    "contractor leads documentation",
    "lead finder guide",
    "contractor leads credits billing",
    "contractor outreach setup",
  ],
});

export default function HelpCenterIndexPage() {
  const articles = [...ACADEMY_ARTICLES].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <MarketingSiteShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Help Center", path: "/help" },
        ])}
      />
      <MarketingSubpageHero
        eyebrow="Help Center & Documentation"
        title="Contractor Leads Help Center"
        description="Clear setup guides, credit rules, inbox connections, and agency playbooks. Everything you need to get the most from Contractor Leads."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            Start free trial (10 leads)
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/features"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Explore features
          </Link>
        </div>
        <nav
          aria-label="Help categories"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {ACADEMY_CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-semibold text-white/75 backdrop-blur transition hover:bg-white/15 hover:text-white"
            >
              {c.label}
            </a>
          ))}
        </nav>
      </MarketingSubpageHero>

      {ACADEMY_CATEGORIES.map((cat, ci) => {
        const group = articles.filter((a) => a.category === cat.id);
        if (!group.length) return null;
        return (
          <SubpageSection
            key={cat.id}
            id={cat.id}
            tone={ci % 2 === 0 ? "light" : "tint"}
            eyebrow={`${group.length} ${group.length === 1 ? "doc" : "docs"}`}
            title={cat.label}
            description={cat.description}
          >
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((a, i) => (
                <li key={a.slug}>
                  <Reveal delay={0.04 * i}>
                    <Link href={`/help/${a.slug}`} className="group block h-full">
                      <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-fuchsia-600">
                          <span>{categoryLabel(a.category)}</span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <HiOutlineBookOpen className="h-3 w-3" />
                            Guide
                          </span>
                        </div>
                        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900">
                          {a.title}
                        </h3>
                        <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">
                          {a.summary}
                        </p>
                        <p className="mt-4 flex items-center gap-2 text-[12px] text-slate-400">
                          <HiOutlineClock className="h-3.5 w-3.5" />
                          {a.readingMinutes} min read · Last updated {a.updatedAt}
                        </p>
                      </article>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </SubpageSection>
        );
      })}

      <SubpageCtaBand
        title="Ready to start prospecting?"
        description="Every new account starts with 10 free leads on Starter — no credit card required."
        primaryLabel="Start free trial"
        secondaryHref="/features"
        secondaryLabel="Explore features"
        note="1 credit = 1 lead · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
