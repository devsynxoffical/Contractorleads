import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ACADEMY_ARTICLES,
  categoryLabel,
  getAcademyArticle,
} from "@/lib/academy-content";
import { PageHeader } from "@/components/layout/page-header";

export function generateStaticParams() {
  return ACADEMY_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function AcademyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getAcademyArticle(slug);
  if (!article) notFound();

  const related = ACADEMY_ARTICLES.filter(
    (a) => a.category === article.category && a.slug !== article.slug,
  ).slice(0, 3);

  return (
    <div className="page-pad">
      <div className="mb-4">
        <Link
          href="/academy"
          className="text-[13px] font-semibold text-brand-600 hover:underline"
        >
          ← Back to Academy
        </Link>
      </div>

      <PageHeader
        eyebrow={`${article.type === "blog" ? "Blog" : "Guide"} · ${categoryLabel(article.category)}`}
        title={article.title}
        description={article.summary}
      />

      <p className="mb-6 text-[12px] text-ink-faint">
        {article.readingMinutes} min read · Updated {article.updatedAt}
      </p>

      <article className="mx-auto max-w-3xl space-y-6">
        {article.sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"
          >
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">
              {section.heading}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              {section.body}
            </p>
            {section.bullets?.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] text-ink-muted">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            {section.tip ? (
              <p className="mt-3 rounded-xl border border-brand-200/60 bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
                <span className="font-semibold">Tip: </span>
                {section.tip}
              </p>
            ) : null}
            {section.href ? (
              <Link
                href={section.href}
                className="mt-4 inline-flex text-[13px] font-semibold text-brand-600 hover:underline"
              >
                {section.hrefLabel || "Open in app →"}
              </Link>
            ) : null}
          </section>
        ))}

        {related.length ? (
          <section className="border-t border-border pt-6">
            <h3 className="text-[14px] font-semibold text-ink">
              Related in {categoryLabel(article.category)}
            </h3>
            <ul className="mt-3 space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/academy/${r.slug}`}
                    className="text-[13px] font-semibold text-brand-600 hover:underline"
                  >
                    {r.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  );
}
