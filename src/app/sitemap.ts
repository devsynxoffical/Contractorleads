import type { MetadataRoute } from "next";
import { ACADEMY_ARTICLES } from "@/lib/academy-content";
import { absoluteUrl, SEO_REGIONS, TRADE_PAGES } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/features", changeFrequency: "monthly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/enterprise/book", changeFrequency: "monthly", priority: 0.75 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.9 },
    { path: "/trades", changeFrequency: "weekly", priority: 0.85 },
    { path: "/register", changeFrequency: "monthly", priority: 0.8 },
    { path: "/login", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  ];

  const tradeRegionRoutes = TRADE_PAGES.flatMap((t) =>
    SEO_REGIONS.map((r) => ({
      url: absoluteUrl(`/trades/${t.slug}/${r.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  );

  return [
    ...staticRoutes.map((r) => ({
      url: absoluteUrl(r.path),
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...ACADEMY_ARTICLES.map((a) => ({
      url: absoluteUrl(`/blog/${a.slug}`),
      lastModified: new Date(a.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...TRADE_PAGES.map((t) => ({
      url: absoluteUrl(`/trades/${t.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...tradeRegionRoutes,
  ];
}
