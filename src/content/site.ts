import { COMPANY, REGULATORY_DISCLOSURE, REGULATORY_PLACEHOLDER } from "@/lib/company";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";

export const hero = {
  eyebrow: "Verified Platform · Monday payouts",
  title: "Earn 5% Daily | 35% weekly",
  subtitle:
    "Choose an investment sector, fund your account, and watch your investment grow through Alto Rich's guaranteed Platform Earning Model.",
  guarantee: "Guaranteed returns.",
  ctaPrimary: "Open an account",
  ctaSecondary: "See how it works"
};

export const valueProps = [
  {
    title: "Verified bank funding",
    description:
      "Every transfer is matched against real bank credits before it reaches your wallet. No mystery balances."
  },
  {
    title: "Clear settlement windows",
    description:
      "Payouts follow published schedules. You always know when requests are reviewed and processed."
  },
  {
    title: "One transparent Platform Earning Model",
    description: `Every investment earns up to ${PLATFORM_EARNING.dailyReturnPercent}% daily (${PLATFORM_EARNING.weeklyReturnPercent}% weekly equivalent) under Alto Rich's ${PLATFORM_EARNING.modelName}. Earnings auto-reinvest every Monday until you choose to stop and withdraw.`
  },
  {
    title: "Local-first operations",
    description:
      "Naira-native flows, bank transfers, and support aligned with West Africa Time."
  }
];

export const howItWorks = [
  {
    step: "01",
    title: "Create your account",
    description: "Register with your email, Nigerian phone number, and preferred investment sector."
  },
  {
    step: "02",
    title: "Verify & fund",
    description: "Transfer from any Nigerian bank and see funds in your wallet after verification."
  },
  {
    step: "03",
    title: "Allocate to a sector",
    description: "Choose Starter, Growth, Premium, or Elite — your capital is allocated while earnings follow one platform model."
  },
  {
    step: "04",
    title: "Earn on schedule",
    description: "Weekly settlements every Monday. Request payout to your bank on published windows."
  }
];

export const trustIndicators = [
  { label: "UK registered entity", value: COMPANY.legalName },
  { label: "Company number", value: COMPANY.companyNumber },
  { label: "Registered address", value: "London, England" },
  { label: "Operations hub", value: "Lagos · Member onboarding" }
];

export const sampleTestimonials = [
  {
    name: "Adaeze O.",
    role: "Civil servant · Abuja",
    quote:
      "I wanted something that felt like a real institution, not another app promising impossible returns. AltoRich’s verification process gave me peace of mind.",
    sample: true
  },
  {
    name: "Chidi M.",
    role: "Electronics trader · Computer Village, Lagos",
    quote:
      "The wallet ledger shows every naira. When my deposit was approved, I could see it immediately. That transparency matters in this market.",
    sample: true
  },
  {
    name: "Fatima B.",
    role: "Diaspora · supporting family in Kano",
    quote:
      "I fund from abroad and my sister manages payouts locally. The process is structured and documented — exactly what our family needed.",
    sample: true
  }
];

export const faqs = [
  {
    q: "Is AltoRich a registered company?",
    a: `${COMPANY.brand} is operated by ${COMPANY.legalName}, registered in England and Wales (Company No. ${COMPANY.companyNumber}). Nigerian regulatory disclosures: ${REGULATORY_PLACEHOLDER}`
  },
  {
    q: "Do you guarantee returns?",
    a: `Yes. Alto Rich uses one ${PLATFORM_EARNING.modelName} — up to ${PLATFORM_EARNING.dailyReturnPercent}% daily (${PLATFORM_EARNING.weeklyReturnPercent}% weekly equivalent), settled every Monday at 09:00 WAT. Earnings auto-reinvest until you stop your investment and withdraw.`
  },
  {
    q: "How do I deposit money?",
    a: "Transfer the exact amount to the active receiving account shown in your dashboard, then submit your transfer reference. An administrator verifies the bank credit before your wallet is updated."
  },
  {
    q: "When can I withdraw?",
    a: "Payout requests are accepted during published windows — typically Mondays and Thursdays from 8:00 AM West Africa Time. Payouts are processed after verification."
  },
  {
    q: "Who can invest?",
    a: "Verified members aged 18 and above with a valid Nigerian bank account. Additional eligibility may apply per investment sector."
  },
  {
    q: "Do different sectors pay different returns?",
    a: "No. Starter, Growth, Premium, and Elite are capital allocation sectors. Every active investment earns through Alto Rich's unified Platform Earning Model."
  }
];

export const mission = {
  title: "Our mission",
  body: "To give Nigerians a wealth platform that respects their intelligence — transparent records, honest language, and technology that works on the devices and networks they use every day."
};

export const vision = {
  title: "Our vision",
  body: "A Nigeria where everyday earners — from Port Harcourt to Kaduna — access institutional-quality wealth tools without hype, hidden fees, or predatory promises."
};

export const values = [
  {
    title: "Transparency",
    description: "Every balance comes from real ledger records. What you see is what you own."
  },
  {
    title: "Discipline",
    description: "Long-term wealth beats speculation. We favour published rules over market noise."
  },
  {
    title: "Accessibility",
    description: "Built for Nigerians using everyday phones and networks — from Lagos to Kano."
  },
  {
    title: "Integrity",
    description: "One Platform Earning Model. Published settlement windows. Verified records."
  }
];

export const leadership = [
  {
    name: COMPANY.director,
    role: "Director",
    bio: "Leads corporate governance and strategic direction for ALTORICH LTD, ensuring the platform maintains international standards while serving Nigerian members from Lagos to Abuja and beyond."
  },
  {
    name: "Nigeria Operations Team",
    role: "Member operations",
    bio: "Handles member verification, deposit reconciliation, settlement processing, and support — based in Lagos with coverage across major Nigerian cities."
  }
];

/** About page — premium content blocks */
export const aboutPage = {
  hero: {
    eyebrow: "About Alto Rich",
    title: "Building Wealth With Trust, Not Hype.",
    description:
      "Alto Rich exists to help everyday Nigerians build wealth through transparent investment sectors, published rules, and technology designed for how Nigerians actually save and invest.",
    trustItems: [
      "Transparent Records",
      "Verified Members",
      "Weekly Settlements",
      "Nigerian Focus"
    ]
  },
  story: {
    eyebrow: "Our story",
    title: "Why Alto Rich Exists",
    body: [
      "Millions of Nigerians want better ways to grow wealth — without confusing financial jargon, unrealistic promises, or hidden conditions. From traders in Lagos to civil servants in Abuja, families in Port Harcourt, Enugu, Kano, Ibadan, Benin, and Kaduna deserve tools that are clear, fair, and built for local reality.",
      "Alto Rich was created around transparency, discipline, and long-term wealth creation. One published Platform Earning Model. Verified deposits. Ledger-backed balances. Processes you can follow from your phone."
    ]
  },
  trustReasons: [
    {
      title: "Transparent transaction records",
      description: "Every naira movement is ledger-backed and visible in your account history."
    },
    {
      title: "Published member processes",
      description: "Deposits, investments, and payouts follow documented steps — no guesswork."
    },
    {
      title: "Verified identity checks",
      description: "Member verification protects the community and keeps the platform trustworthy."
    },
    {
      title: "Secure investment workflow",
      description: "Fund, allocate to a sector, and track earnings through a controlled member journey."
    },
    {
      title: "Weekly settlement schedule",
      description: "Settlements run every Monday at 09:00 WAT under the Platform Earning Model."
    },
    {
      title: "Dedicated Nigerian operations",
      description: "A local team handles verification, reconciliation, and support in West Africa Time."
    },
    {
      title: "Responsive support",
      description: "Reach us when you need clarity — from onboarding questions to payout status."
    }
  ],
  operations: [
    {
      title: "UK corporate governance",
      description: `${COMPANY.legalName} (Company No. ${COMPANY.companyNumber}) provides international corporate structure and oversight.`
    },
    {
      title: "Nigerian member operations",
      description: "Onboarding, support, and day-to-day member care are run for Nigerians, in Nigeria time."
    },
    {
      title: "Verification process",
      description: "Identity and bank details are checked before wallets and investments go live."
    },
    {
      title: "Deposit reconciliation",
      description: "Transfers are matched to real bank credits before balances are updated."
    },
    {
      title: "Settlement processing",
      description: "Weekly settlements follow the published Monday schedule — predictable and documented."
    },
    {
      title: "Compliance-first approach",
      description: REGULATORY_DISCLOSURE
    }
  ],
  timeline: [
    { label: "Founded", detail: "ALTORICH LTD established with a Nigeria-first wealth mission." },
    { label: "Platform Development", detail: "Ledger, sectors, and the Platform Earning Model engineered for local use." },
    { label: "Member Launch", detail: "Nigerian members begin verified funding and sector allocation." },
    { label: "Growth", detail: "Operations expand across major cities with clearer member journeys." },
    { label: "Future Expansion", detail: "Deeper regional coverage, tools, and wealth education for more Nigerians." }
  ],
  stats: [
    { label: "Transparent Ledger", value: "Every balance" },
    { label: "Published Rules", value: "Always visible" },
    { label: "Investment Sectors", value: "Four paths" },
    { label: "Weekly Settlements", value: "Monday 09:00" },
    { label: "Verified Members", value: "Identity-checked" }
  ],
  cta: {
    title: "Ready to Build Wealth With Confidence?",
    description:
      "Choose an investment sector, fund your account, and watch your wealth grow through Alto Rich's transparent Platform Earning Model.",
    primary: "Create Account",
    secondary: "Explore Investment Sectors"
  }
} as const;

export const branches = [
  { city: "Lagos", address: "Victoria Island · By appointment", phone: COMPANY.supportEmail },
  { city: "Abuja", address: "Central Business District · By appointment", phone: COMPANY.supportEmail },
  { city: "London", address: COMPANY.addressFull, phone: COMPANY.supportEmail }
];
