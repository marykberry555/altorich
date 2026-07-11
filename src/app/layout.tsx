import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/lib/company";
import { BRAND, ICONS } from "@/lib/brand";
import { themeInitScript } from "@/lib/theme";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SmartsuppProvider } from "@/components/chat/SmartsuppProvider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { AppBootstrapLoader } from "@/components/brand/AppBootstrapLoader";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PwaUpdateToast } from "@/components/pwa/PwaUpdateToast";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { SocialProofToasts } from "@/components/social/SocialProofToasts";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const ogImage = `${COMPANY.siteUrl}${BRAND.og.default}`;

export const metadata: Metadata = {
  title: {
    default: `${COMPANY.brand} — Premium wealth platform`,
    template: `%s · ${COMPANY.brand}`
  },
  description: `${COMPANY.brand} by ${COMPANY.legalName} — transparent cooperative wealth, investment plans, and verified member records.`,
  metadataBase: new URL(COMPANY.siteUrl),
  applicationName: COMPANY.brand,
  authors: [{ name: COMPANY.legalName }],
  creator: COMPANY.brand,
  publisher: COMPANY.legalName,
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: ICONS.favicon16Light, sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: ICONS.favicon16Dark, sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: ICONS.favicon32Light, sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: ICONS.favicon32Dark, sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" }
    ],
    apple: [{ url: ICONS.appleTouch, sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: ICONS.mask, color: "#064e3b" }]
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: `${COMPANY.brand} — Premium wealth platform`,
    description: COMPANY.tagline,
    url: COMPANY.siteUrl,
    siteName: COMPANY.brand,
    locale: "en_NG",
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: `${COMPANY.brand} logo` }]
  },
  twitter: {
    card: "summary_large_image",
    title: COMPANY.brand,
    description: COMPANY.tagline,
    images: [ogImage]
  },
  other: {
    "msapplication-TileColor": "#064e3b",
    "msapplication-config": "/browserconfig.xml",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": COMPANY.brand
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#064e3b" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" }
  ],
  colorScheme: "light dark",
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" className={`${jakarta.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <PwaProvider>
          <AppBootstrapLoader />
          <ThemeProvider>
            {children}
            <SocialProofToasts />
            <SmartsuppProvider />
            <OfflineIndicator />
            <InstallPrompt />
            <PwaUpdateToast />
          </ThemeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
