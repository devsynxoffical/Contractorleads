import type { Metadata } from "next";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineFire,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import { MarketingSiteShell, MarketingSubpageHero } from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { BLOG_POSTS } from "@/lib/blog-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Agency Growth Blog: Selling Marketing to Contractors",
  description:
    "Playbooks, benchmarks, and guides for marketing agencies, media buyers, and sales teams that sell to home-service contractors.",
  path: "/blog",
  keywords: [
    "agency growth blog",
    "contractor lead generation",
    "local service ads for agencies",
    "agency lead generation",
    "roofing marketing",
    "hvac marketing",
  ],
});

export default function BlogIndexPage() {
  const pillars = BLOG_POSTS.filter((p) => p.type === "pillar");
  const clusters = BLOG_POSTS.filter((p) => p.type === "cluster");

  return (
    <MarketingSiteShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />

      <MarketingSubpageHero
        eyebrow="Agency Growth Playbooks"
        title="Agency Growth Blog: Selling Marketing to Contractors"
        description="Data-driven guides, pricing blueprints, and outreach playbooks for agencies and media buyers that sell to home-service contractors."
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
            href="/help"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Product Documentation & Help Center
          </Link>
        </div>
      </MarketingSubpageHero>

      {/* Flagship Pillars Section */}
      <SubpageSection
        tone="tint"
        eyebrow="Core Pillars"
        title="Flagship Agency Playbooks"
        description="Comprehensive, step-by-step masterclasses covering client acquisition and Google Local Service Ads management."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.slug} delay={0.06 * i}>
              <Link href={`/blog/${pillar.slug}`} className="group block h-full">
                <article className="flex h-full flex-col rounded-3xl border-2 border-violet-200/80 bg-white p-6 sm:p-8 shadow-sm transition hover:border-fuchsia-400 hover:shadow-lg">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-fuchsia-600">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 px-2.5 py-0.5 text-fuchsia-700">
                      <HiOutlineFire className="h-3.5 w-3.5" />
                      Pillar Guide
                    </span>
                    <span className="text-slate-400">{pillar.readingMinutes} min read</span>
                  </div>

                  <h2 className="mt-4 font-[family-name:var(--font-display)] text-[22px] font-bold text-slate-900 group-hover:text-fuchsia-700 transition">
                    {pillar.title}
                  </h2>

                  <p className="mt-3 flex-1 text-[14px] leading-relaxed text-slate-600">
                    {pillar.directAnswer}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[13px]">
                    <span className="font-semibold text-fuchsia-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      Read full pillar guide →
                    </span>
                    {pillar.video && (
                      <span className="inline-flex items-center gap-1 text-slate-500 text-[12px]">
                        <HiOutlineVideoCamera className="h-4 w-4 text-rose-500" />
                        Video included
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      {/* Cluster Guides Section */}
      <SubpageSection
        tone="light"
        eyebrow="Tactical Guides"
        title="Contractor Marketing & Outreach Playbooks"
        description="Targeted checklists, pricing formulas, and niche strategies for roofing, HVAC, paid ads, and cold outreach."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clusters.map((post, i) => (
            <Reveal key={post.slug} delay={0.04 * i}>
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="text-fuchsia-600">
                      {post.cluster === "lsa" ? "Local Ads & Search" : "Agency Growth"}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <HiOutlineClock className="h-3.5 w-3.5" />
                      {post.readingMinutes} min
                    </span>
                  </div>

                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900 group-hover:text-fuchsia-700 transition">
                    {post.title}
                  </h3>

                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">
                    {post.summary}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-[12px] text-slate-400 border-t border-slate-50 pt-3">
                    <span>Keyword: {post.primaryKeyword}</span>
                    <span className="font-semibold text-fuchsia-700">Read guide →</span>
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>
      </SubpageSection>

      <SubpageCtaBand
        title="Put these playbooks into practice"
        description="Sign up in 30 seconds and run your first scored contractor search — 10 free leads on Starter, no credit card required."
        primaryLabel="Start free trial (10 leads)"
        secondaryHref="/features"
        secondaryLabel="Explore features"
        note="1 credit = 1 lead · Cancel anytime"
      />
    </MarketingSiteShell>
  );
}
