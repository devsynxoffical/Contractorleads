import Link from "next/link";
import type { AcademyArticle } from "@/lib/academy-content";
import { categoryLabel } from "@/lib/academy-content";

/** Map in-app deep links to public marketing destinations. */
function publicCta(href?: string, label?: string) {
  if (!href) return null;
  const isAppPath =
    href.startsWith("/") &&
    !href.startsWith("/blog") &&
    !href.startsWith("/industries") &&
    !href.startsWith("/pricing") &&
    !href.startsWith("/features") &&
    !href.startsWith("/about") &&
    !href.startsWith("/register") &&
    !href.startsWith("/login");

  return {
    href: isAppPath ? "/register" : href,
    label: isAppPath
      ? label?.includes("→")
        ? "Start free trial →"
        : label || "Start free trial →"
      : label || "Learn more →",
  };
}

export function BlogArticleBody({ article }: { article: AcademyArticle }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {article.sections.map((section) => {
        const cta = publicCta(section.href, section.hrefLabel);
        return (
          <section
            key={section.heading}
            className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight text-slate-900">
              {section.heading}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              {section.body}
            </p>
            {section.bullets?.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] text-slate-600">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            {section.tip ? (
              <p className="mt-3 rounded-xl border border-fuchsia-200/70 bg-fuchsia-50 px-3 py-2 text-[13px] text-fuchsia-900">
                <span className="font-semibold">Tip: </span>
                {section.tip}
              </p>
            ) : null}
            {cta ? (
              <Link
                href={cta.href}
                className="mt-4 inline-flex text-[13px] font-semibold text-fuchsia-700 hover:underline"
              >
                {cta.label}
              </Link>
            ) : null}
          </section>
        );
      })}
    </article>
  );
}

export function BlogMetaLine({ article }: { article: AcademyArticle }) {
  return (
    <p className="text-[12px] text-slate-500">
      {article.type === "blog" ? "Article" : "Guide"} ·{" "}
      {categoryLabel(article.category)} · {article.readingMinutes} min read ·
      Updated {article.updatedAt}
    </p>
  );
}
