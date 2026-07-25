import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { SEO, seoBaseUrl } from "@/lib/seo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL(seoBaseUrl()),
  title: {
    default: SEO.defaultTitle,
    template: SEO.titleTemplate,
  },
  description: SEO.defaultDescription,
  keywords: [...SEO.keywords],
  applicationName: SEO.siteName,
  authors: [{ name: SEO.siteName, url: seoBaseUrl() }],
  creator: SEO.siteName,
  publisher: SEO.siteName,
  category: "business software",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: SEO.locale,
    url: seoBaseUrl(),
    siteName: SEO.siteName,
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: seoBaseUrl(),
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0820" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} h-full`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className="min-h-full font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider initialTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  );
}
