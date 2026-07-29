import type { Metadata } from "next";
import Script from "next/script";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { SEO, seoBaseUrl } from "@/lib/seo";
import "./globals.css";
import { MetaPixelTracker } from "@/components/pixel/meta-pixel-tracker";

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
    site: SEO.twitterHandle,
    creator: SEO.twitterHandle,
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "TyqXl7_dlFkiT-2tH8-iodrv1XIdFCXk349h199738Y",
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
  const metaPixelId =
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    "1652137686625875";

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} h-full`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
            `,
          }}
        />
      </head>
      <body
        className="min-h-full font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider initialTheme="light">{children}</ThemeProvider>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
          />
        </noscript>
        <MetaPixelTracker />
      </body>
    </html>
  );
}
