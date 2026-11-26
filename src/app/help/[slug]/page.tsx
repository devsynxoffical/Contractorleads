import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from "react-icons/hi2";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  BlogArticleBody,
  BlogMetaLine,
} from "@/components/marketing/blog-article-body";
import {
  JsonLd,
  techArticleJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";
import {
  ACADEMY_ARTICLES,
  categoryLabel,
  getAcademyArticle,
  NOINDEX_HELP_SLUGS,
} from "@/lib/academy-content";
import { buildMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ACADEMY_ARTICLES.map((a) => ({ slug: a.slug }));
}

/** Search titles for the public help pages (keyword first, brand last, under 60 characters).
 *  The in-app Academy keeps the original article titles. */
const HELP_SEO_TITLES: Record<string, string> = {
  "welcome-to-contractor-leads": "Getting Started with Contractor Leads: Quick Start Guide",
  "setup-hub-complete-walkthrough": "Setup Hub Walkthrough: Email, API and CRM | Contractor Leads",
  "how-to-use-lead-finder": "How to Use Lead Finder: Step by Step | Contractor Leads",
  "reading-lead-scores-and-enrichment": "Lead Scores Explained: Hot, Warm, Nurture | Contractor Leads",
  "lead-map-and-exports": "Lead Map and CSV or Excel Exports | Contractor Leads Help",
  "hot-leads-saved-leads-pipeline": "Hot Leads, Saved Leads and Pipeline CRM | Contractor Leads",
  "pipeline-playbook-closing-contractors": "Closing Contractor Deals: Pipeline Playbook for Agencies",
  "email-smtp-inbox-sequences": "Email Setup: SMTP, Inbox and Sequences | Contractor Leads",
  "gmail-app-password-setup": "Gmail App Password Setup for SMTP (Step by Step)",
  "plans-credits-billing": "Plans, Credits and Billing Explained | Contractor Leads",
  "troubleshooting-common-errors": "Troubleshooting Common Errors and Fixes | Contractor Leads",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getAcademyArticle(slug);
  if (!article) return {};
  return buildMetadata({
    title: HELP_SEO_TITLES[article.slug] ?? `${article.title} | Help Center`,
    description: article.summary,
    path: `/help/${article.slug}`,
    keywords: [
      ...article.tags,
      "contractor leads help",
      "contractor leads tutorial",
      categoryLabel(article.category),
    ],
    type: "article",
    publishedTime: article.updatedAt,
    modifiedTime: article.updatedAt,
    noIndex: NOINDEX_HELP_SLUGS.has(article.slug),
  });
}

export default async function HelpArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = getAcademyArticle(slug);
  if (!article) notFound();

  const related = ACADEMY_ARTICLES.filter(
    (a) => a.category === article.category && a.slug !== article.slug,
  ).slice(0, 3);

  return (
    <MarketingSiteShell>
      <JsonLd
        data={techArticleJsonLd({
          title: article.title,
          description: article.summary,
          path: `/help/${article.slug}`,
          datePublished: article.updatedAt,
          keywords: article.tags,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Help Center", path: "/help" },
          { name: article.title, path: `/help/${article.slug}` },
        ])}
      />

      <header className="relative overflow-hidden border-b border-white/10 bg-[#07040f] py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(168,85,247,0.35), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
            Help Center
          </Link>
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-fuchsia-400">
            Guide · {categoryLabel(article.category)}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] font-semibold tracking-tight text-white">
            {article.title}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/65">
            {article.summary}
          </p>
          <div className="mt-5 text-white/50">
            <BlogMetaLine article={article} />
          </div>
        </div>
      </header>

      <div className="bg-white px-5 py-14 sm:px-8">
        <BlogArticleBody article={article} />
      </div>

      {related.length ? (
        <SubpageSection
          tone="tint"
          eyebrow="Keep reading"
          title="Related help docs"
          description="More guides from this category."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <li key={r.slug}>
                <Reveal delay={0.05 * i}>
                  <Link href={`/help/${r.slug}`} className="group block h-full">
                    <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                      <h3 className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900">
                        {r.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-600">
                        {r.summary}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-700">
                        Read guide
                        <HiOutlineArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </article>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </SubpageSection>
      ) : null}

      <SubpageCtaBand
        title="Put this into practice"
        description="Run a real Lead Finder search, score contractors, and start your outreach today."
        primaryLabel="Start free trial (10 leads)"
        secondaryHref="/help"
        secondaryLabel="Browse Help Center"
        note="1 credit = 1 lead · No credit card required"
      />
    </MarketingSiteShell>
  );
}
