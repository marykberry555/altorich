import { PACKAGE_IMAGES } from "@/lib/images";

export type PackageSlug = "starter" | "growth" | "premium" | "elite";

export type PackageContent = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  heroHeadline: string;
  heroDescription: string;
  image: { src: string; alt: string };
  howItWorks: { step: string; title: string; description: string }[];
  benefits: { title: string; description: string }[];
  accessSteps: { step: string; title: string; description: string }[];
};

export const packages: Record<PackageSlug, PackageContent> = {
  starter: {
    slug: "starter",
    title: "Alto Starter",
    subtitle: "High-Yield Savings & Fintech Lock Plans",
    heroHeadline: "Shield your capital from inflation with disciplined digital lock plans.",
    heroDescription:
      "Alto Starter is your entry point into structured wealth preservation — fixed-term cooperative savings pools that keep your money working while life stays predictable. Lock funds securely, track performance in your dashboard, and receive consistent payouts on published cycles once you are verified.",
    image: PACKAGE_IMAGES.starter,
    howItWorks: [
      {
        step: "01",
        title: "Choose your lock duration",
        description:
          "After signing in, select a Starter pool that matches your liquidity needs — from short disciplined cycles to longer lock windows designed for steady accumulation."
      },
      {
        step: "02",
        title: "Allocate from your Alto Wallet",
        description:
          "Funds move from your verified wallet balance into a dedicated Starter pool. Every allocation is recorded on your auditable ledger with a clear reference."
      },
      {
        step: "03",
        title: "Earn through structured cycles",
        description:
          "Your pool accrues yield across the cooperative cycle. Payouts and running balances are visible only inside your authenticated dashboard — never on public pages."
      },
      {
        step: "04",
        title: "Reinvest or withdraw on schedule",
        description:
          "At cycle completion, choose to roll into the next pool, move funds to your available balance, or follow published withdrawal windows for bank payout."
      }
    ],
    benefits: [
      {
        title: "Inflation hedging",
        description: "Fixed-term locks help your naira retain purchasing power compared to idle cash in low-yield accounts."
      },
      {
        title: "Capital discipline",
        description: "Lock plans reduce impulse spending by separating goal-based savings from everyday wallet balances."
      },
      {
        title: "Transparent ledger",
        description: "Every deposit, allocation, and payout is traceable in your member dashboard with timestamps and references."
      },
      {
        title: "Low complexity",
        description: "The simplest Alto tier — ideal for first-time members building a savings habit with institutional-grade records."
      }
    ],
    accessSteps: [
      {
        step: "01",
        title: "Complete KYC verification",
        description: "Upload identity documents and verify your phone number so AltoRich can activate wallet and payout features."
      },
      {
        step: "02",
        title: "Fund your Alto Wallet",
        description: "Transfer via local bank or supported card channels. Deposits are reconciled before funds appear in your ledger."
      },
      {
        step: "03",
        title: "Activate a Starter pool",
        description: "Sign in, open Packages, and select your preferred duration pool. Yields and balances display only in your account."
      }
    ]
  },
  growth: {
    slug: "growth",
    title: "Alto Growth",
    subtitle: "Agricultural Crowdfunding & Processing",
    heroHeadline: "Grow wealth in step with real harvest cycles and local food production.",
    heroDescription:
      "Alto Growth connects your capital to seasonal crop production, poultry programmes, and agro-processing operations across verified partner networks. Payouts align with harvest and processing milestones — so your returns follow tangible agricultural output, not abstract promises.",
    image: PACKAGE_IMAGES.growth,
    howItWorks: [
      {
        step: "01",
        title: "Pool capital into agro cycles",
        description:
          "Verified members allocate wallet funds into active agricultural pools — each tied to documented production seasons and partner offtake agreements."
      },
      {
        step: "02",
        title: "Deploy across the value chain",
        description:
          "Capital supports inputs, labour, logistics, and processing stages. Operational updates are summarised in your dashboard across the cycle."
      },
      {
        step: "03",
        title: "Harvest-aligned settlements",
        description:
          "As crops are sold or processed goods are delivered, cooperative settlements are scheduled against real milestones — visible in your portfolio view."
      },
      {
        step: "04",
        title: "Reinvest or diversify",
        description:
          "Completed cycles can roll into the next season or shift to another Alto tier as your risk appetite and goals evolve."
      }
    ],
    benefits: [
      {
        title: "Real-economy backing",
        description: "Agro cycles are anchored to physical production — poultry, grains, and processing — not synthetic yield models."
      },
      {
        title: "Food security impact",
        description: "Your participation supports local farmers and aggregators strengthening Nigeria's agricultural supply chain."
      },
      {
        title: "Seasonal clarity",
        description: "Each pool publishes its production window and settlement rhythm so you know when capital is deployed and when reviews occur."
      },
      {
        title: "Portfolio diversification",
        description: "A natural step above savings locks — adding productive assets while staying inside AltoRich's verified cooperative framework."
      }
    ],
    accessSteps: [
      {
        step: "01",
        title: "Complete KYC verification",
        description: "Identity and address checks unlock agricultural pool participation and regulated payout channels."
      },
      {
        step: "02",
        title: "Fund your Alto Wallet",
        description: "Secure bank transfer or card funding ensures your allocation is backed by verified naira credits."
      },
      {
        step: "03",
        title: "Select a Growth pool",
        description: "Browse active agro cycles in your dashboard, review season details, and activate your preferred programme."
      }
    ]
  },
  premium: {
    slug: "premium",
    title: "Alto Premium",
    subtitle: "Real Estate — Land & Property Banking",
    heroHeadline: "Anchor your wealth in land banking and income-generating property cooperatives.",
    heroDescription:
      "Alto Premium positions members in Nigeria's most trusted long-term asset class. Participate in cooperative land banking within fast-growing commercial corridors, or co-own short-let and rental developments engineered for stable cash flow and documented exit windows.",
    image: PACKAGE_IMAGES.premium,
    howItWorks: [
      {
        step: "01",
        title: "Join a property cooperative pool",
        description:
          "After verification, allocate capital into land banking or rental development pools — each with defined tenure, documentation standards, and governance rules."
      },
      {
        step: "02",
        title: "Title and documentation review",
        description:
          "AltoRich works with verified partners to maintain survey records, cooperative agreements, and milestone reporting accessible from your member file."
      },
      {
        step: "03",
        title: "Income and appreciation tracking",
        description:
          "Rental income and valuation updates flow through your dashboard on published schedules. Sensitive figures remain behind authentication."
      },
      {
        step: "04",
        title: "Structured exit windows",
        description:
          "Pools define clear maturity or resale windows so members understand liquidity timelines before committing capital."
      }
    ],
    benefits: [
      {
        title: "Tangible asset security",
        description: "Land and built property provide a physical store of value that historically resists local currency erosion."
      },
      {
        title: "Cash-flow options",
        description: "Select pools emphasise rental income; others focus on land appreciation in growth corridors — match your goal."
      },
      {
        title: "Cooperative scale",
        description: "Pool buying power opens institutional-grade opportunities that individual investors rarely access alone."
      },
      {
        title: "Documented governance",
        description: "Tenure, partner identity, and exit rules are recorded before activation — no hidden lock-in surprises."
      }
    ],
    accessSteps: [
      {
        step: "01",
        title: "Complete KYC verification",
        description: "Enhanced identity checks apply to property pools to satisfy cooperative and regulatory standards."
      },
      {
        step: "02",
        title: "Fund your Alto Wallet",
        description: "Transfer verified naira into your wallet before selecting a Premium pool allocation."
      },
      {
        step: "03",
        title: "Activate a Premium pool",
        description: "Review land banking or rental programmes in your dashboard and commit to your chosen duration pool."
      }
    ]
  },
  elite: {
    slug: "elite",
    title: "Alto Elite",
    subtitle: "Foreign Exchange — USD & Hard Currency Assets",
    heroHeadline: "Preserve purchasing power with dollar-denominated and global asset exposure.",
    heroDescription:
      "Alto Elite is designed for members who prioritise capital preservation against naira depreciation. Access fractional global equities, stable digital assets, and hard-currency programmes with real-time FX tracking and priority performance reviews — all within AltoRich's audited cooperative structure.",
    image: PACKAGE_IMAGES.elite,
    howItWorks: [
      {
        step: "01",
        title: "Select a hard-currency programme",
        description:
          "Verified members choose from USD-linked pools, stablecoin treasury programmes, or global equity baskets — each with defined risk disclosures."
      },
      {
        step: "02",
        title: "FX conversion at published rates",
        description:
          "Naira wallet balances convert at administrator-published exchange rates visible in your dashboard before you confirm allocation."
      },
      {
        step: "03",
        title: "Dual-currency tracking",
        description:
          "Portfolio views show naira equivalent and hard-currency positions side by side, with live ticker updates during active cycles."
      },
      {
        step: "04",
        title: "Priority settlement review",
        description:
          "Elite pools receive expedited payout processing within published Monday windows and dedicated support escalation."
      }
    ],
    benefits: [
      {
        title: "Currency depreciation hedge",
        description: "Hard-currency exposure helps protect long-term wealth when local purchasing power weakens."
      },
      {
        title: "Global diversification",
        description: "Participate in international asset themes without managing foreign brokerage accounts independently."
      },
      {
        title: "Real-time performance",
        description: "Authenticated dashboards display cycle progress, FX rates, and accrued value without public price leakage."
      },
      {
        title: "Highest tier privileges",
        description: "Priority reviews, dual-currency reporting, and access to AltoRich's most sophisticated cooperative programmes."
      }
    ],
    accessSteps: [
      {
        step: "01",
        title: "Complete KYC verification",
        description: "Full identity verification and enhanced due diligence unlock Elite FX and crypto-linked programmes."
      },
      {
        step: "02",
        title: "Fund your Alto Wallet",
        description: "Fund via bank transfer or supported channels. Crypto allocations use published admin exchange rates at activation."
      },
      {
        step: "03",
        title: "Activate an Elite pool",
        description: "Sign in to view available hard-currency programmes, select duration, and confirm your allocation securely."
      }
    ]
  }
};

export const packageList: PackageContent[] = [
  packages.starter,
  packages.growth,
  packages.premium,
  packages.elite
];

export function getPackage(slug: string): PackageContent | null {
  if (slug in packages) return packages[slug as PackageSlug];
  return null;
}
