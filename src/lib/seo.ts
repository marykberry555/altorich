import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import { BRAND } from "@/lib/brand";

const siteUrl = COMPANY.siteUrl;
const ogImage = `${siteUrl}${BRAND.og.default}`;

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
  const image = page.image ?? ogImage;

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
      images: [{ url: image, width: 1200, height: 630, alt: `${COMPANY.brand} — ${page.title}` }]
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
