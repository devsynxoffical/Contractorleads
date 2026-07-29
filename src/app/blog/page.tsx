import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import { HiOutlineArrowRight, HiOutlineClock } from "react-icons/hi2";
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
  title: "Blog & guides — contractor lead generation for agencies",
  description:
    "Guides on Lead Finder, AI scoring, email outreach, pipeline CRM, credits, and agency workflows for selling to home-service contractors.",
  path: "/blog",
  keywords: [
    "contractor leads blog",
    "agency lead generation guides",
    "how to find contractor leads",
    "contractor outreach playbook",
  ],
});

export default function BlogIndexPage() {
  const articles = [...ACADEMY_ARTICLES].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <MarketingSiteShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <MarketingSubpageHero
        eyebrow="Blog & guides"
        title="How agencies find and close contractor leads"
        description="Step-by-step guides from the Contractor Leads Academy — Lead Finder, scoring, email sequences, pipeline, billing, and AI workflows."
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
            Explore features
          </Link>
        </div>
        <nav
          aria-label="Article categories"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {ACADEMY_CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-white/75 backdrop-blur transition hover:bg-white/15 hover:text-white"
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
            eyebrow={`${group.length} ${group.length === 1 ? "guide" : "guides"}`}
            title={cat.label}
            description={cat.description}
          >
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((a, i) => (
                <li key={a.slug}>
                  <Reveal delay={0.04 * i}>
                    <Link href={`/blog/${a.slug}`} className="group block h-full">
                      <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-fuchsia-600">
                          {a.type === "blog" ? "Article" : "Guide"} ·{" "}
                          {categoryLabel(a.category)}
                        </p>
                        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900">
                          {a.title}
                        </h3>
                        <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">
                          {a.summary}
                        </p>
                        <p className="mt-4 flex items-center gap-2 text-[12px] text-slate-400">
                          <HiOutlineClock className="h-3.5 w-3.5" />
                          {a.readingMinutes} min · Updated {a.updatedAt}
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
        title="Put the playbooks to work"
        description="Reading is step one. Run a real search, score a real list, and send your first sequence today."
        primaryLabel="Start free trial"
        secondaryHref="/features"
        secondaryLabel="Explore features"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
