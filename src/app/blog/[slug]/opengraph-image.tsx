import { ImageResponse } from "next/og";
import { BLOG_CLUSTER_LABELS, BLOG_POSTS, getBlogPost } from "@/lib/blog-content";

export const alt = "Contractor Leads blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

/** Per-post social card so shared links and image results carry the article title. */
export default async function BlogOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const title = post?.title ?? "Agency Growth Blog";
  const label = post ? BLOG_CLUSTER_LABELS[post.cluster] : "Contractor Leads";
  const minutes = post ? `${post.readingMinutes} min read` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          background:
            "linear-gradient(135deg, #0c0820 0%, #1a1035 40%, #4a1d6a 75%, #c026d3 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #db2777 0%, #c026d3 50%, #7c3aed 100%)",
              }}
            />
            Contractor Leads
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.3)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {label}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 70 ? 46 : 54,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span>www.contractorleads.us/blog</span>
          <span>{minutes}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
