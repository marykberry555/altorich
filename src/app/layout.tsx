import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/lib/company";
import { ICONS } from "@/lib/brand";
import { themeInitScript } from "@/lib/theme";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SmartsuppProvider } from "@/components/chat/SmartsuppProvider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { AppBootstrapLoader } from "@/components/brand/AppBootstrapLoader";
import { ServiceWorkerCleanup } from "@/components/pwa/ServiceWorkerCleanup";
import { ChunkLoadRecovery } from "@/components/pwa/ChunkLoadRecovery";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { getBuildId } from "@/lib/build-id";
import { PRIVATE_SITE_ROBOTS } from "@/lib/security/bot-block";
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
  robots: PRIVATE_SITE_ROBOTS,
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
    title: `${COMPANY.brand}`,
    description: COMPANY.tagline,
    url: COMPANY.siteUrl,
    siteName: COMPANY.brand,
    locale: "en_NG",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: COMPANY.brand,
    description: COMPANY.tagline
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#064e3b" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" }
  ],
  colorScheme: "light dark",
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const buildId = getBuildId();

  return (
    <html lang="en-NG" className={`${jakarta.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <meta name="altorich-build-id" content={buildId} />
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="antialiased">
        <ServiceWorkerCleanup />
        <ChunkLoadRecovery buildId={buildId} />
        <PwaProvider>
          <AppBootstrapLoader />
          <ThemeProvider>
            {children}
            <SocialProofToasts />
            <SmartsuppProvider />
            <OfflineIndicator />
          </ThemeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
