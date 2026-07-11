export const COMPANY = {
  brand: "AltoRich",
  legalName: "ALTORICH LTD",
  companyNumber: "13579416",
  director: "Mr Karol Kempa",
  address: {
    line1: "Kemp House, 152–160 City Road",
    city: "London",
    postcode: "EC1V 2NX",
    country: "England"
  },
  addressFull: "Kemp House, 152–160 City Road, London, EC1V 2NX, England",
  domain: "altorich.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://altorich.com",
  supportEmail: "hello@altorich.com",
  phone: "+44 20 0000 0000",
  nigeriaOffice: "Lagos, Nigeria",
  currency: "NGN" as const,
  founded: "2024",
  tagline: "Wealth built with clarity. Growth designed for Nigeria."
} as const;

export const REGULATORY_DISCLOSURE =
  "Regulatory and licensing details for Nigerian operations will be published once verified and approved for public disclosure.";

/** @deprecated Use REGULATORY_DISCLOSURE */
export const REGULATORY_PLACEHOLDER = REGULATORY_DISCLOSURE;
