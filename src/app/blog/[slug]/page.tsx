import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
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

      <div className="border-b border-violet-100 bg-gradient-to-b from-[#fdf2f8] to-[#faf8fc] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Link
            href="/blog"
            className="text-[13px] font-semibold text-fuchsia-700 hover:underline"
          >
            ← All guides
          </Link>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-fuchsia-600">
            {article.type === "blog" ? "Article" : "Guide"} ·{" "}
            {categoryLabel(article.category)}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] font-semibold tracking-tight text-slate-900">
            {article.title}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {article.summary}
          </p>
          <div className="mt-4">
            <BlogMetaLine article={article} />
          </div>
        </div>
      </div>

      <div className="px-5 py-12 sm:px-8">
        <BlogArticleBody article={article} />

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 p-6 text-center text-white sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Put this into practice
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-white/85">
            Start a free trial and run your first Lead Finder search with AI
            scoring — no card required.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-fuchsia-700"
          >
            Start free trial
          </Link>
        </div>

        {related.length ? (
          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-slate-900">
              Related guides
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="block rounded-xl border border-violet-100 bg-white px-4 py-3 text-[14px] font-semibold text-slate-800 hover:border-fuchsia-300"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </MarketingSiteShell>
  );
}
