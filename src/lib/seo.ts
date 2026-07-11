import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import { BRAND, ICONS } from "@/lib/brand";

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
    alt: `${COMPANY.brand} logo`
  },
  square: {
    url: ogSquareImage,
    width: 512,
    height: 512,
    alt: `${COMPANY.brand} icon`
  }
} as const;

/** Provide both assets so platforms pick the best fit automatically. */
export const defaultOpenGraphImages = [OG_IMAGES.wide, OG_IMAGES.square];

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
  const image = page.image ?? ogWideImage;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    robots: page.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: COMPANY.brand,
      locale: "en_NG",
      type: page.type ?? "website",
      images: page.image
        ? [{ url: image, width: 1200, height: 630, alt: `${COMPANY.brand} — ${page.title}` }]
        : defaultOpenGraphImages
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image]
    }
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.brand,
    legalName: COMPANY.legalName,
    url: siteUrl,
    logo: `${siteUrl}${BRAND.logo.light}`,
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
    name: COMPANY.brand,
    url: siteUrl,
    description: COMPANY.tagline,
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
    description: input.description,
    url: `${siteUrl}${input.path}`,
    datePublished: input.datePublished ?? COMPANY.founded,
    author: { "@type": "Organization", name: COMPANY.brand },
    publisher: {
      "@type": "Organization",
      name: COMPANY.brand,
      logo: { "@type": "ImageObject", url: `${siteUrl}${BRAND.logo.light}` }
    }
  };
}
