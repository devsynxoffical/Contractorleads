import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { MarketingSiteShell } from "@/components/marketing/marketing-site-shell";
import {
  SubpageCtaBand,
  SubpageSection,
} from "@/components/marketing/marketing-subpage";
import { Reveal } from "@/components/marketing/marketing-ui";
import {
  JsonLd,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from "@/components/seo/json-ld";
import { BLOG_CLUSTER_LABELS, BLOG_POSTS, blogWordCount, getBlogPost } from "@/lib/blog-content";
import { buildMetadata, getTradeBySlug } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.titleTag,
    description: post.metaDescription,
    path: `/blog/${post.slug}`,
    keywords: [post.primaryKeyword, ...post.secondaryKeywords],
    type: "article",
    publishedTime: post.publishedDate,
    modifiedTime: post.updatedDate,
    authors: [post.author.name],
    ogImage: `/blog/${post.slug}/opengraph-image`,
  });
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const sameCluster = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.cluster === post.cluster,
  );
  const others = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.cluster !== post.cluster,
  );
  const related = [...sameCluster, ...others].slice(0, 3);
  const industries = (post.relatedIndustries ?? [])
    .map((slug) => getTradeBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <MarketingSiteShell>
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description: post.metaDescription,
          path: `/blog/${post.slug}`,
          datePublished: post.publishedDate,
          dateModified: post.updatedDate,
          keywords: [post.primaryKeyword, ...post.secondaryKeywords],
          image: `/blog/${post.slug}/opengraph-image`,
          author: { name: post.author.name, url: "/about", image: post.author.image },
          wordCount: blogWordCount(post),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      {post.faqs.length > 0 && <JsonLd data={faqPageJsonLd(post.faqs)} />}

      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-white/10 bg-[#07040f] py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(168,85,247,0.35), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
            Agency Growth Blog
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <span className="rounded-full bg-fuchsia-500/20 border border-fuchsia-400/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fuchsia-300">
              {post.type === "pillar" ? "Flagship Pillar" : BLOG_CLUSTER_LABELS[post.cluster]}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-white/50">
              <HiOutlineClock className="h-3.5 w-3.5" />
              {post.readingMinutes} min read · Updated{" "}
              <time dateTime={post.updatedDate}>{post.updatedDate}</time>
            </span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.85rem)] font-bold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-[16px] leading-relaxed text-white/70">
            {post.summary}
          </p>

          {/* Author Badge */}
          <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.author.image}
              alt={post.author.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover border border-violet-400/30"
            />
            <div>
              <p className="text-[13px] font-semibold text-white">{post.author.name}</p>
              <p className="text-[11px] text-white/50">{post.author.role}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 space-y-10">
        {/* Direct Answer Box (AEO Optimization for Featured Snippets) */}
        <section className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/40 p-6 sm:p-8 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-700">
            Direct Answer (Quick Summary)
          </p>
          <p className="mt-3 text-[16px] leading-relaxed text-slate-800 font-medium">
            {post.directAnswer}
          </p>
        </section>

        {/* Mid-Article CTA Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-violet-200 bg-[#faf8fc] p-5 shadow-xs">
          <div>
            <p className="text-[14px] font-bold text-slate-900">
              Find contractors ready for outreach in your city
            </p>
            <p className="text-[12px] text-slate-500">
              Live Google Places data, owner names & AI lead scores.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-[13px] font-semibold text-white hover:bg-slate-800 transition"
          >
            Get 10 free leads
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Content Sections */}
        {post.sections.map((section, idx) => (
          <section key={idx} className="space-y-4">
            {section.level === 3 ? (
              <h3 className="font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900 pt-2">
                {section.heading}
              </h3>
            ) : (
              <h2 className="font-[family-name:var(--font-display)] text-[24px] font-bold text-slate-900 border-b border-slate-100 pb-3 pt-4">
                {section.heading}
              </h2>
            )}

            <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">
              {section.body}
            </p>

            {section.callout && (
              <div className="rounded-2xl border border-violet-200/80 bg-violet-50/50 p-5 space-y-2">
                <p className="text-[13px] font-bold text-violet-900">{section.callout.title}</p>
                <p className="text-[14px] leading-relaxed text-violet-950 whitespace-pre-line font-mono text-[13px]">
                  {section.callout.text}
                </p>
              </div>
            )}

            {section.bullets && section.bullets.length > 0 && (
              <ul className="space-y-2.5 pt-1">
                {section.bullets.map((b, bi) => (
                  <li key={bi} className="flex items-start gap-2.5 text-[14.5px] text-slate-700 leading-relaxed">
                    <HiOutlineCheckCircle className="h-5 w-5 text-fuchsia-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 my-4 shadow-2xs">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-bold uppercase tracking-wider text-slate-700">
                      {section.table.headers.map((h, hi) => (
                        <th key={hi} className="py-2.5 px-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {section.table.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-slate-50/50 transition">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`py-3 px-3 text-slate-700 ${ci === 0 ? "font-semibold text-slate-900" : ""}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {/* FAQs */}
        {post.faqs.length > 0 && (
          <section className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {post.faqs.map((faq, fi) => (
                <div key={fi} className="border-b border-slate-100 pb-4 last:border-none last:pb-0">
                  <h3 className="font-semibold text-slate-900 text-[15px]">{faq.q}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Prospect-this-trade cross links */}
        {industries.length > 0 && (
          <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/40 p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-700">
              Put it to work
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[20px] font-bold text-slate-900">
              Find the contractors this guide is about
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {industries.map((t) => (
                <Link
                  key={t.slug}
                  href={`/industries/${t.slug}`}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-4 transition hover:border-fuchsia-300 hover:shadow-md"
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-slate-900 group-hover:text-fuchsia-700">
                      {t.headline}
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-relaxed text-slate-600">
                      {t.description}
                    </span>
                  </span>
                  <HiOutlineArrowRight className="mt-1 h-4 w-4 shrink-0 text-fuchsia-600 transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Author Bio Box */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 flex flex-col sm:flex-row items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.image}
            alt={post.author.name}
            width={72}
            height={72}
            className="h-16 w-16 rounded-2xl object-cover shrink-0 border border-violet-200"
          />
          <div className="text-center sm:text-left">
            <p className="text-[14px] font-bold text-slate-900">{post.author.name}</p>
            <p className="text-[12px] text-fuchsia-700 font-semibold">{post.author.role}</p>
            <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{post.author.bio}</p>
            <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 text-[12px]">
              <Link href="/about" className="font-semibold text-slate-700 hover:text-fuchsia-700">
                About Contractor Leads →
              </Link>
              <span>·</span>
              <a
                href="https://www.linkedin.com/company/contractorleads"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0A66C2] hover:underline"
              >
                LinkedIn Profile
              </a>
            </div>
          </div>
        </section>
      </article>

      {/* Related Cluster Articles */}
      {related.length > 0 && (
        <SubpageSection
          tone="tint"
          eyebrow="Keep Reading"
          title="Related Agency Guides"
          description="More playbooks and data benchmarks from this topic cluster."
        >
          <ul className="grid gap-4 sm:grid-cols-3">
            {related.map((r, i) => (
              <li key={r.slug}>
                <Reveal delay={0.05 * i}>
                  <Link href={`/blog/${r.slug}`} className="group block h-full">
                    <article className="flex h-full flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition group-hover:border-fuchsia-300 group-hover:shadow-md">
                      <h3 className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-slate-900 group-hover:text-fuchsia-700 transition">
                        {r.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-600">
                        {r.summary}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-fuchsia-700">
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
      )}

      <SubpageCtaBand
        title="Start prospecting contractor leads today"
        description="Pick a trade, pick a city, and watch Contractor Leads score live businesses in seconds. 10 free leads on Starter."
        primaryLabel="Start free trial (10 leads)"
        secondaryHref="/pricing"
        secondaryLabel="View all plans"
        note="1 credit = 1 lead · No credit card required"
      />
    </MarketingSiteShell>
  );
}
