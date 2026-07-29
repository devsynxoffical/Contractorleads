import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Next.js needs 'unsafe-inline' for its bootstrap/style injection, and
    // 'unsafe-eval' only in dev for React Refresh.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${
        process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"
      } https://js.stripe.com https://connect.facebook.net https://www.googletagmanager.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://www.facebook.com https://graph.facebook.com https://www.googletagmanager.com https://www.google-analytics.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://www.googletagmanager.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

// Must resolve to the same value at build time and at runtime, or the client
// and server deployment IDs never match. Railway sets this in both phases.
const deploymentId =
  process.env.NEXT_DEPLOYMENT_ID?.trim() ||
  process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
  undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Without this, a tab holding assets from an older build navigates against the
  // new server and fails instead of reloading.
  deploymentId,
  async redirects() {
    return [
      { source: "/trades", destination: "/industries", permanent: true },
      { source: "/trades/:slug", destination: "/industries/:slug", permanent: true },
      {
        source: "/trades/:slug/:region",
        destination: "/industries/:slug/:region",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Keep Prisma engine files in the standalone trace for cPanel Node hosting
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/.prisma/**/*",
      "./node_modules/@prisma/client/**/*",
      "./prisma/**/*",
    ],
  },
};

export default nextConfig;
