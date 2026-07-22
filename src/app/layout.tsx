import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/lib/company";
import { ICONS } from "@/lib/brand";
import { themeInitScript } from "@/lib/theme";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { AppBootstrapLoader } from "@/components/brand/AppBootstrapLoader";
import { ServiceWorkerCleanup } from "@/components/pwa/ServiceWorkerCleanup";
import { ChunkLoadRecovery } from "@/components/pwa/ChunkLoadRecovery";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { GlobalCrashReporter } from "@/components/errors/GlobalCrashReporter";
import { getBuildId } from "@/lib/build-id";
import { PRIVATE_SITE_ROBOTS } from "@/lib/security/bot-block";
import {
  defaultOpenGraphImages,
  defaultSocialMetadata,
  organizationJsonLd,
  SOCIAL_SHARE_DESCRIPTION,
  SOCIAL_SHARE_TITLE,
  websiteJsonLd
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { LiveActivityFeed } from "@/components/social/LiveActivityFeed";
import { ReferralAttributionCapture } from "@/components/referral/ReferralAttributionCapture";

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
    default: SOCIAL_SHARE_TITLE,
    template: `%s · ${SOCIAL_SHARE_TITLE}`
  },
  description: SOCIAL_SHARE_DESCRIPTION,
  metadataBase: new URL(COMPANY.siteUrl),
  applicationName: SOCIAL_SHARE_TITLE,
  authors: [{ name: COMPANY.legalName }],
  creator: SOCIAL_SHARE_TITLE,
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
    ...defaultSocialMetadata.openGraph,
    images: defaultOpenGraphImages
  },
  twitter: defaultSocialMetadata.twitter,
  other: {
    "msapplication-TileColor": "#064e3b",
    "msapplication-config": "/browserconfig.xml",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": SOCIAL_SHARE_TITLE
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
        <GlobalCrashReporter />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <PwaProvider>
          <AppBootstrapLoader />
          <ThemeProvider>
            <ReferralAttributionCapture />
            {children}
            <LiveActivityFeed />
            <OfflineIndicator />
          </ThemeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
