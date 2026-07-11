import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import { BRAND, ICONS } from "@/lib/brand";
import { PRIVATE_SITE_ROBOTS } from "@/lib/security/bot-block";

export { PRIVATE_SITE_ROBOTS };

/** Canonical social sharing copy — used across OG, Twitter, and JSON-LD. */
export const SOCIAL_SHARE_TITLE = "Alto Rich";
export const SOCIAL_SHARE_DESCRIPTION = "Grow your naira with clarity — earn 15% to 30% weekly.";

const siteUrl = COMPANY.siteUrl;

/** Wide logo for Facebook, LinkedIn, X (summary_large_image). */
const ogWideImage = `${siteUrl}${BRAND.og.default}`;
/** Square icon for WhatsApp, Telegram, Messenger, Slack, Discord, Signal. */
const ogSquareImage = `${siteUrl}${ICONS.android512}`;

export const OG_IMAGES = {
  wide: {
    url: ogWideImage,
    width: 1200,
    height: 630,
    alt: SOCIAL_SHARE_TITLE
  },
  square: {
    url: ogSquareImage,
    width: 512,
    height: 512,
    alt: SOCIAL_SHARE_TITLE
  }
} as const;

/** Provide both assets so platforms pick the best fit automatically. */
export const defaultOpenGraphImages = [OG_IMAGES.wide, OG_IMAGES.square];

export const defaultSocialMetadata = {
  title: SOCIAL_SHARE_TITLE,
  description: SOCIAL_SHARE_DESCRIPTION,
  openGraph: {
    title: SOCIAL_SHARE_TITLE,
    description: SOCIAL_SHARE_DESCRIPTION,
    url: siteUrl,
    siteName: SOCIAL_SHARE_TITLE,
    locale: "en_NG",
    type: "website" as const,
    images: defaultOpenGraphImages
  },
  twitter: {
    card: "summary_large_image" as const,
    title: SOCIAL_SHARE_TITLE,
    description: SOCIAL_SHARE_DESCRIPTION,
    images: [ogWideImage, ogSquareImage]
  }
};

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
};

export function buildMetadata(page: PageSeo): Metadata {
  const url = `${siteUrl}${page.path}`;

  return {
    title: page.title,
    description: SOCIAL_SHARE_DESCRIPTION,
    alternates: { canonical: url },
    robots: PRIVATE_SITE_ROBOTS,
    openGraph: {
      ...defaultSocialMetadata.openGraph,
      url,
      type: page.type ?? "website"
    },
    twitter: {
      ...defaultSocialMetadata.twitter
    }
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SOCIAL_SHARE_TITLE,
    legalName: COMPANY.legalName,
    url: siteUrl,
    logo: `${siteUrl}${BRAND.logo.light}`,
    description: SOCIAL_SHARE_DESCRIPTION,
    email: COMPANY.supportEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.line1,
      addressLocality: COMPANY.address.city,
      postalCode: COMPANY.address.postcode,
      addressCountry: COMPANY.address.country
    },
    sameAs: []
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SOCIAL_SHARE_TITLE,
    url: siteUrl,
    description: SOCIAL_SHARE_DESCRIPTION,
    publisher: { "@type": "Organization", name: COMPANY.legalName }
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`
    }))
  };
}

export function articleJsonLd(input: { title: string; description: string; path: string; datePublished?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: SOCIAL_SHARE_DESCRIPTION,
    url: `${siteUrl}${input.path}`,
    datePublished: input.datePublished ?? COMPANY.founded,
    author: { "@type": "Organization", name: SOCIAL_SHARE_TITLE },
    publisher: {
      "@type": "Organization",
      name: SOCIAL_SHARE_TITLE,
      logo: { "@type": "ImageObject", url: `${siteUrl}${BRAND.logo.light}` }
    }
  };
}
