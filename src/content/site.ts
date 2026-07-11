import { COMPANY, REGULATORY_PLACEHOLDER } from "@/lib/company";
import { PACKAGE_ROI_RANGE } from "@/lib/packages/package-config";

export const hero = {
  eyebrow: "Built for Nigeria · WAT-aligned payouts",
  title: "Build long-term wealth with Alto Rich — Nigeria's modern digital investment platform.",
  subtitle:
    "For salary earners, entrepreneurs, and diaspora investors. Verified bank deposits, transparent ledgers, and payouts every Monday at 09:00 WAT.",
  guarantee: "Returns are guaranteed.",
  ctaPrimary: "Get started",
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
    title: "Guaranteed weekly returns",
    description: `Published weekly ROI tiers from ${PACKAGE_ROI_RANGE.minPercent}% to ${PACKAGE_ROI_RANGE.maxPercent}%. Earnings auto-reinvest every Monday until you choose to stop and withdraw.`
  },
  {
    title: "Local-first operations",
    description:
      "Naira-native flows, bank transfers, and support aligned with West Africa Time."
  }
];

export const howItWorks = [
  { step: "01", title: "Create your account", description: "Register with your email, Nigerian phone number, and preferred investment package." },
  { step: "02", title: "Verify & fund", description: "Transfer from any Nigerian bank and see funds in your wallet after verification." },
  { step: "03", title: "Activate your plan", description: "Choose Alto Starter, Growth, Premium, or Elite — track everything in your dashboard." },
  { step: "04", title: "Earn on schedule", description: "Weekly settlements every Monday. Request payout to your bank on published windows." }
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
    a: `Yes. Alto Rich packages publish guaranteed weekly returns from ${PACKAGE_ROI_RANGE.minPercent}% to ${PACKAGE_ROI_RANGE.maxPercent}%, paid every Monday at 09:00 WAT. Earnings auto-reinvest until you stop your investment and withdraw.`
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
  { title: "Accessibility", description: "Entry from ₦20,000. Mobile-first. WAT support hours." },
  { title: "Integrity", description: "Guaranteed weekly returns with transparent ledgers and published Monday payout windows." }
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
