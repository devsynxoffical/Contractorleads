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
      } https://js.stripe.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
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
