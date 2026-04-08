import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Instrument_Serif, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavProgress } from "@/components/nav-progress";
import { OrganizationSchema, WebSiteSchema } from "@/components/json-ld";
import "./globals.css";

const GA_ID = "G-XB7714S0QN";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TapWater.uk — Is Your Tap Water Safe?",
    template: "%s | TapWater.uk",
  },
  description:
    "Free water quality reports for every UK postcode. Check PFAS, lead, nitrate and more near you. Based on official monitoring data.",
  metadataBase: new URL("https://www.tapwater.uk"),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  other: {
    "impact-site-verification": "e18f3561-3822-4c00-942c-d4622f421149",
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "TapWater.uk",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TapWater.uk — UK Water Quality Data",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} ${spaceMono.variable}`}
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/news/rss.xml"
          title="TapWater.uk Water Incident News"
        />
      </head>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="gtag-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <body className="min-h-screen flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--color-btn)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <NavProgress />
        <Header />
        <OrganizationSchema />
        <WebSiteSchema />
        <main id="main-content" className="flex-1 pb-24 sm:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
