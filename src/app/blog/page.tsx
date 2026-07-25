import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome, MarketingHero } from "@/components/marketing/marketing-chrome";
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
    <MarketingChrome>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <MarketingHero
        eyebrow="Blog & guides"
        title="How agencies find and close contractor leads"
        description="Step-by-step guides from the Contractor Leads Academy — Lead Finder, scoring, email sequences, pipeline, billing, and AI workflows."
      >
        <Link
          href="/register"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          Start free trial
        </Link>
      </MarketingHero>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {ACADEMY_CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-full border border-violet-100 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-fuchsia-300"
            >
              {c.label}
            </a>
          ))}
        </div>

        {ACADEMY_CATEGORIES.map((cat) => {
          const group = articles.filter((a) => a.category === cat.id);
          if (!group.length) return null;
          return (
            <div key={cat.id} id={cat.id} className="mb-12 scroll-mt-24">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
                {cat.label}
              </h2>
              <p className="mt-1 text-[14px] text-slate-500">{cat.description}</p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {group.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/blog/${a.slug}`}
                      className="block h-full rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-fuchsia-300 hover:shadow-md"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-fuchsia-600">
                        {a.type === "blog" ? "Article" : "Guide"} ·{" "}
                        {categoryLabel(a.category)}
                      </p>
                      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[17px] font-semibold text-slate-900">
                        {a.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-slate-600">
                        {a.summary}
                      </p>
                      <p className="mt-3 text-[12px] text-slate-400">
                        {a.readingMinutes} min · Updated {a.updatedAt}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </MarketingChrome>
  );
}
