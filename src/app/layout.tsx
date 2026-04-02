import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Instrument_Serif, Space_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
    "Free water quality reports for every UK postcode. Check PFAS, lead, nitrate and more contaminants near you. Based on official Environment Agency monitoring data.",
  metadataBase: new URL("https://tapwater.uk"),
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "TapWater.uk",
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
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <OrganizationSchema />
        <WebSiteSchema />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
