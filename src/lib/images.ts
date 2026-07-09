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
    src: "/images/team-nigeria.webp",
    alt: "Professionals in a modern collaborative workspace"
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
    src: "/images/investment-planning.webp",
    alt: "Financial planning documents and calculator — structured cooperative packages overview"
  },
  starter: {
    src: "/images/savings-nigeria.webp",
    alt: "Coins with a growing plant — disciplined savings and lock-plan wealth preservation"
  },
  growth: {
    src: "/images/agriculture-nigeria.webp",
    alt: "Young crop rows in golden sunlight — agricultural crowdfunding and harvest cycles"
  },
  premium: {
    src: "/images/property-lagos.webp",
    alt: "Model home and keys on a desk — land banking and rental property cooperatives"
  },
  elite: {
    src: "/images/elite-happy-money.webp",
    alt: "Happy man holding a fan of foreign banknotes — hard-currency and FX preservation programmes"
  }
} as const satisfies Record<string, ImageAsset>;

export type PackageImageKey = keyof typeof PACKAGE_IMAGES;
