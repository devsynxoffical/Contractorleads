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
  blogPostingJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";
import {
  ACADEMY_ARTICLES,
  categoryLabel,
  getAcademyArticle,
} from "@/lib/academy-content";
import { buildMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ACADEMY_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getAcademyArticle(slug);
  if (!article) return {};
  return buildMetadata({
    title: `${article.title} | Contractor Leads Blog`,
    description: article.summary,
    path: `/blog/${article.slug}`,
    keywords: [
      ...article.tags,
      "contractor leads",
      categoryLabel(article.category),
    ],
  });
}

export default async function BlogArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = getAcademyArticle(slug);
  if (!article) notFound();

  const related = ACADEMY_ARTICLES.filter(
    (a) => a.category === article.category && a.slug !== article.slug,
  ).slice(0, 3);

  return (
    <MarketingSiteShell>
      <JsonLd
        data={blogPostingJsonLd({
          title: article.title,
          description: article.summary,
          path: `/blog/${article.slug}`,
          datePublished: article.updatedAt,
          keywords: article.tags,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: article.title, path: `/blog/${article.slug}` },
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
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
            All guides
          </Link>
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-fuchsia-400">
            {article.type === "blog" ? "Article" : "Guide"} ·{" "}
            {categoryLabel(article.category)}
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
          title="Related guides"
          description="More from this part of the Academy."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => (
              <li key={r.slug}>
                <Reveal delay={0.05 * i}>
                  <Link href={`/blog/${r.slug}`} className="group block h-full">
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
        description="Start a free trial and run your first Lead Finder search with AI scoring — no card required."
        primaryLabel="Start free trial"
        secondaryHref="/blog"
        secondaryLabel="Browse all guides"
        note="10 free leads on Starter · No credit card required"
      />
    </MarketingSiteShell>
  );
}
