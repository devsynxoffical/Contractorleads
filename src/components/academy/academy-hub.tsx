"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ACADEMY_ARTICLES,
  ACADEMY_CATEGORIES,
  ACADEMY_FAQS,
  categoryLabel,
  searchAcademy,
  type AcademyArticle,
  type AcademyCategoryId,
  type AcademyFaq,
} from "@/lib/academy-content";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineNewspaper,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";

function ArticleCard({ article }: { article: AcademyArticle }) {
  return (
    <Link
      href={`/academy/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-brand-200 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {article.type === "blog" ? (
          <HiOutlineNewspaper className="h-3.5 w-3.5 text-brand-500" />
        ) : (
          <HiOutlineBookOpen className="h-3.5 w-3.5 text-brand-500" />
        )}
        {article.type} · {categoryLabel(article.category)}
      </div>
      <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-ink group-hover:text-brand-700">
        {article.title}
      </h3>
      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">
        {article.summary}
      </p>
      <p className="mt-3 text-[12px] text-ink-faint">
        {article.readingMinutes} min read
      </p>
    </Link>
  );
}

function FaqItem({ faq }: { faq: AcademyFaq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-[14px] font-semibold text-ink">{faq.question}</span>
        <span className="mt-0.5 text-ink-faint">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="pb-4">
          <p className="text-[13px] leading-relaxed text-ink-muted">{faq.answer}</p>
          {faq.relatedSlugs?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {faq.relatedSlugs.map((slug) => {
                const a = ACADEMY_ARTICLES.find((x) => x.slug === slug);
                if (!a) return null;
                return (
                  <Link
                    key={slug}
                    href={`/academy/${slug}`}
                    className="text-[12px] font-semibold text-brand-600 hover:underline"
                  >
                    {a.title} →
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AcademyHub() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AcademyCategoryId | "all">("all");

  const { articles, faqs } = useMemo(() => searchAcademy(query), [query]);

  const filteredArticles = useMemo(() => {
    if (category === "all") return articles;
    return articles.filter((a) => a.category === category);
  }, [articles, category]);

  const filteredFaqs = useMemo(() => {
    if (category === "all") return faqs;
    return faqs.filter((f) => f.category === category);
  }, [faqs, category]);

  const guides = filteredArticles.filter((a) => a.type === "guide");
  const blogs = filteredArticles.filter((a) => a.type === "blog");

  return (
    <div className="page-pad space-y-8">
      <PageHeader
        eyebrow="Academy"
        title="Learn Contractor Leads"
        description="Guides, FAQs, and playbooks so your team can use the product without waiting on admin. Search anything — Lead Finder, email, credits, referrals, and more."
        actions={
          <button
            type="button"
            className="rounded-xl border border-border bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold text-ink hover:border-brand-200"
            onClick={() => {
              void fetch("/api/user/product-tour", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reset: true }),
              }).finally(() => {
                window.dispatchEvent(
                  new Event("leadflow:replay-product-tour"),
                );
              });
            }}
          >
            Replay product tour
          </button>
        }
      />

      <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
        <label className="block text-[12px] font-medium text-ink-muted">
          Search Academy
          <input
            className="saas-input mt-1.5"
            placeholder="e.g. credits, SMTP, Hot leads, webhooks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
              category === "all"
                ? "bg-ink text-[var(--canvas)] dark:bg-brand-500 dark:text-white"
                : "border border-border bg-[var(--input-bg)] text-ink-muted hover:text-ink",
            )}
          >
            All
          </button>
          {ACADEMY_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                category === c.id
                  ? "bg-ink text-[var(--canvas)] dark:bg-brand-500 dark:text-white"
                  : "border border-border bg-[var(--input-bg)] text-ink-muted hover:text-ink",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-[var(--surface)] px-4 py-3.5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            <HiOutlineBookOpen className="h-3.5 w-3.5" /> Guides
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {ACADEMY_ARTICLES.filter((a) => a.type === "guide").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface)] px-4 py-3.5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            <HiOutlineNewspaper className="h-3.5 w-3.5" /> Blogs
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {ACADEMY_ARTICLES.filter((a) => a.type === "blog").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-[var(--surface)] px-4 py-3.5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            <HiOutlineQuestionMarkCircle className="h-3.5 w-3.5" /> FAQs
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {ACADEMY_FAQS.length}
          </p>
        </div>
      </div>

      {category === "all" && !query ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
            <HiOutlineAcademicCap className="h-5 w-5 text-brand-500" />
            Browse by topic
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ACADEMY_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className="rounded-2xl border border-border bg-[var(--surface)] p-4 text-left transition hover:border-brand-200"
              >
                <p className="text-[14px] font-semibold text-ink">{c.label}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                  {c.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-ink">
          Guides
          <span className="ml-2 text-[12px] font-medium text-ink-faint">
            {guides.length}
          </span>
        </h2>
        {guides.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {guides.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">No guides match this filter.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-ink">
          Blogs & playbooks
          <span className="ml-2 text-[12px] font-medium text-ink-faint">
            {blogs.length}
          </span>
        </h2>
        {blogs.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {blogs.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">No blogs match this filter.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-[15px] font-semibold text-ink">
          FAQs
          <span className="ml-2 text-[12px] font-medium text-ink-faint">
            {filteredFaqs.length}
          </span>
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Quick answers for the questions teams usually ask admins.
        </p>
        <div className="mt-2">
          {filteredFaqs.length ? (
            filteredFaqs.map((f) => <FaqItem key={f.id} faq={f} />)
          ) : (
            <p className="py-4 text-sm text-ink-faint">No FAQs match.</p>
          )}
        </div>
      </section>
    </div>
  );
}
