/** Local optimized imagery — Nigerian-focused, self-hosted */

export type ImageAsset = {
  src: string;
  alt: string;
};

export const IMAGES = {
  hero: {
    src: "/images/hero-lagos.webp",
    alt: "Lagos business district skyline at golden hour — a modern investment backdrop"
  },
  about: {
    src: "/brand/about.webp",
    alt: "Alto Rich members and operations — building wealth across Nigeria"
  },
  plans: {
    src: "/images/investment-planning.webp",
    alt: "Entrepreneur reviewing investment plans on a laptop"
  },
  savings: {
    src: "/images/savings-nigeria.webp",
    alt: "Structured savings and financial planning for everyday households"
  },
  sme: {
    src: "/images/sme-nigeria.webp",
    alt: "Small business team in a strategy meeting"
  },
  agriculture: {
    src: "/images/agriculture-nigeria.webp",
    alt: "Agriculture and cooperative farming investment"
  },
  property: {
    src: "/images/property-lagos.webp",
    alt: "Modern residential and commercial property development"
  },
  businessFunding: {
    src: "/images/business-funding.webp",
    alt: "Business owner accessing growth capital"
  },
  learn: {
    src: "/images/financial-education.webp",
    alt: "Financial literacy and investment education"
  }
} as const;

/** Package imagery — one distinct visual per Alto tier */
export const PACKAGE_IMAGES = {
  all: {
    src: "/images/growth.webp",
    alt: "AltoRich investment packages — structured cooperative wealth across four tiers"
  },
  starter: {
    src: "/images/starter.webp",
    alt: "Alto Starter — disciplined savings and high-yield lock plans"
  },
  growth: {
    src: "/images/growth.webp",
    alt: "Alto Growth — agricultural crowdfunding and seasonal harvest cycles"
  },
  premium: {
    src: "/images/premium.webp",
    alt: "Alto Premium — land banking and rental property cooperatives"
  },
  elite: {
    src: "/images/elite.webp",
    alt: "Alto Elite — hard-currency and FX preservation programmes"
  }
} as const satisfies Record<string, ImageAsset>;

export type PackageImageKey = keyof typeof PACKAGE_IMAGES;
