import { COMPANY, REGULATORY_PLACEHOLDER } from "@/lib/company";
import { PACKAGE_IMAGES } from "@/lib/images";

export const hero = {
  eyebrow: "Built for Nigeria · WAT-aligned payouts",
  title: "Grow your naira with clarity — earn 12% to 40% weekly.",
  subtitle:
    "For salary earners, entrepreneurs, and diaspora investors. Verified bank deposits, transparent ledgers, and payouts every Monday at 09:00 WAT.",
  ctaPrimary: "Open your account",
  ctaSecondary: "See how it works"
};

export const valueProps = [
  {
    title: "Verified contributions",
    description:
      "Every deposit is matched against real bank credits before it touches your wallet. No mystery balances."
  },
  {
    title: "Clear settlement windows",
    description:
      "Withdrawals follow published schedules. You always know when payouts are reviewed and processed."
  },
  {
    title: "Honest projections",
    description:
      "We document cooperative performance — we never promise guaranteed daily returns or casino-style yields."
  },
  {
    title: "Local-first operations",
    description:
      "Naira-native flows, bank transfers, and support aligned with West Africa Time."
  }
];

export const investmentCategories = [
  {
    slug: "starter",
    title: "Alto Starter",
    subtitle: "High-Yield Savings & Fintech Lock Plans",
    description:
      "Disciplined, fixed-term digital cooperative plans designed to shield your capital from daily inflation. Lock your funds securely into high-yield savings pools with consistent payouts visible directly in your dashboard upon login.",
    href: "/packages/starter",
    icon: "piggy",
    image: PACKAGE_IMAGES.starter
  },
  {
    slug: "growth",
    title: "Alto Growth",
    subtitle: "Agricultural Crowdfunding & Processing",
    description:
      "Direct access to seasonal crop production, poultry cycles, and agro-processing operations. Benefit from structured agro-cycles that align payouts precisely with real-world harvest timelines while actively supporting local food security.",
    href: "/packages/growth",
    icon: "leaf",
    image: PACKAGE_IMAGES.growth
  },
  {
    slug: "premium",
    title: "Alto Premium",
    subtitle: "Real Estate (Land & Property Banking)",
    description:
      "Position your wealth in Nigeria's ultimate security asset. Participate in cooperative land banking within fast-growing commercial hubs and co-own premium short-let or rental developments optimized for stable cash flow.",
    href: "/packages/premium",
    icon: "home",
    image: PACKAGE_IMAGES.premium
  },
  {
    slug: "elite",
    title: "Alto Elite",
    subtitle: "Foreign Exchange (USD & Hard Currency Assets)",
    description:
      "Total capital preservation against local currency depreciation. Access fractional global stocks, stablecoins, and high-yield, dollar-denominated assets with real-time currency tracking and priority performance reviews.",
    href: "/packages/elite",
    icon: "briefcase",
    image: PACKAGE_IMAGES.elite
  }
];

export const howItWorks = [
  { step: "01", title: "Create your account", description: "Register with your email, Nigerian phone number, and preferred investment package." },
  { step: "02", title: "Verify & fund", description: "Complete KYC, transfer from any Nigerian bank, and see funds in your wallet ledger." },
  { step: "03", title: "Activate your plan", description: "Choose Alto Starter, Growth, Premium, or Elite — track everything in your dashboard." },
  { step: "04", title: "Earn on schedule", description: "Weekly settlements every Monday. Withdraw to your bank on published windows." }
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
      "I fund from abroad and my sister manages withdrawals locally. The process is structured and documented — exactly what our family needed.",
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
    a: "No. Projected figures on investment plans are cooperative estimates based on documented pool performance. Actual distributions depend on verified earnings and admin-approved settlements."
  },
  {
    q: "How do I deposit money?",
    a: "Transfer the exact amount to the active receiving account shown in your dashboard, then submit your transfer reference. An administrator verifies the bank credit before your wallet is updated."
  },
  {
    q: "When can I withdraw?",
    a: "Withdrawal requests are accepted during published windows — typically Mondays and Thursdays from 8:00 AM West Africa Time. Payouts are processed after bank verification."
  },
  {
    q: "Who can invest?",
    a: "Verified members aged 18 and above with a valid Nigerian bank account. Additional eligibility may apply per product."
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
  { title: "Transparency", description: "Every balance is ledger-derived. Every rule is published." },
  { title: "Discipline", description: "Cooperative structures, not speculation." },
  { title: "Accessibility", description: "Entry from ₦3,000. Mobile-first. WAT support hours." },
  { title: "Integrity", description: "We say no to guaranteed-return marketing." }
];

export const leadership = [
  {
    name: COMPANY.director,
    role: "Director",
    bio: "Leads corporate governance and strategic direction for ALTORICH LTD, ensuring the platform maintains international standards while serving Nigerian members."
  },
  {
    name: "Operations Team",
    role: "Nigeria operations",
    bio: "Member verification, deposit reconciliation, and payout processing — based in Lagos with coverage across major Nigerian cities."
  }
];

export const branches = [
  { city: "Lagos", address: "Victoria Island · By appointment", phone: COMPANY.supportEmail },
  { city: "Abuja", address: "Central Business District · By appointment", phone: COMPANY.supportEmail },
  { city: "London", address: COMPANY.addressFull, phone: COMPANY.supportEmail }
];
