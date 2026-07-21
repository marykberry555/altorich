import { COMPANY } from "@/lib/company";

export type LeadershipResponsibility = {
  label: string;
};

export type ExecutiveProfile = {
  id: string;
  slug: string;
  name: string;
  title: string;
  office: string;
  imageSlug: string;
  isFounder?: boolean;
  responsibilities: string[];
  leadershipPhilosophy: string;
  operationalFocus: string;
  strategicPriorities: string[];
  roleAtAltoRich: string;
  message: string;
  quote: string;
  /** Short intro for homepage / preview cards */
  intro: string;
};

export type LeadershipPrinciple = {
  title: string;
  description: string;
};

export type GovernancePillar = {
  title: string;
  description: string;
};

export type OfficeLocation = {
  city: string;
  country: string;
  role: string;
  purpose: string;
  responsibilities: string[];
  supportCoverage: string;
  address: string;
};

export type TimelineMilestone = {
  label: string;
  detail: string;
};

export const LEADERSHIP_PAGE = {
  path: "/company/leadership",
  hero: {
    eyebrow: "Leadership & Governance",
    title: "Leadership That Inspires Confidence",
    description:
      "Alto Rich is led by executives who combine international corporate discipline with a Nigeria-first commitment to members. Our leadership team prioritises transparency, operational excellence, and responsible stewardship of member trust."
  },
  founderMessage: {
    eyebrow: "Founder's Message",
    title: "A letter from our Founder",
    signature: "Karol Kemp",
    signatureTitle: "Founder & Chief Executive Officer",
    paragraphs: [
      "Alto Rich exists because everyday Nigerians deserve a wealth platform built on clarity — not confusion. Too many people have been asked to commit their savings without understanding how money moves, when earnings settle, or who stands behind the operation. We set out to change that.",
      "Our mission is straightforward: help members build wealth through transparent investment sectors, published rules, and technology designed for how Nigerians actually save and invest. Every product decision, every operational process, and every communication channel is evaluated against one question — does this serve our members with honesty and respect?",
      "We think in years, not weeks. Sustainable growth comes from operational discipline — verified onboarding, reconciled deposits, predictable settlement windows, and internal accountability at every level. Short-term hype erodes trust; long-term thinking protects it.",
      "Transparency is not a marketing word for us. It is how we operate. Members can see their balances, understand settlement timing, and reach a team that takes responsibility for resolving issues. We hold ourselves to the same standard we ask of our platform: clear records, consistent processes, and no surprises.",
      "Thank you for placing your confidence in Alto Rich. We do not take that lightly. Our leadership team — in London, Lagos, Abuja, and Port Harcourt — is united in one commitment: responsible stewardship of member trust, every day.",
      "With appreciation,"
    ]
  },
  executiveSection: {
    eyebrow: "Executive Leadership",
    title: "Experienced leaders, aligned on member trust",
    description:
      "Our executive team brings together international governance, operational excellence, regional business development, and institutional relationship management — each role designed to strengthen how Alto Rich serves members across Nigeria."
  },
  principlesSection: {
    eyebrow: "Leadership Principles",
    title: "Principles that guide every decision",
    description:
      "These principles are not slogans. They shape how we design products, process settlements, respond to members, and hold ourselves accountable."
  },
  governanceSection: {
    eyebrow: "Corporate Governance",
    title: "Governance built for accountability",
    description:
      "Alto Rich operates under a governance framework that separates strategic oversight from day-to-day operations, with clear controls at every level."
  },
  footprintSection: {
    eyebrow: "Operational Footprint",
    title: "Four offices, one standard of service",
    description:
      "Our leadership team is distributed across the United Kingdom and Nigeria — each office serving a defined purpose in how Alto Rich operates and supports members."
  },
  timelineSection: {
    eyebrow: "Leadership Timeline",
    title: "Building with intention",
    description:
      "Alto Rich has grown through deliberate milestones — each step strengthening the platform, operations, and member experience."
  },
  commitmentSection: {
    eyebrow: "Our Commitment",
    title: "What leadership stands behind",
    description:
      "Every member interaction, settlement cycle, and operational decision reflects these enduring commitments."
  }
} as const;

export const EXECUTIVES: ExecutiveProfile[] = [
  {
    id: "karol-kemp",
    slug: "karol-kemp",
    name: "Karol Kemp",
    title: "Founder & Chief Executive Officer",
    office: "London, United Kingdom",
    imageSlug: "karol-kemp",
    isFounder: true,
    intro:
      "Sets strategic direction and corporate governance for Alto Rich, ensuring international standards guide every decision that affects members.",
    responsibilities: [
      "Corporate strategy and vision",
      "Board-level governance and oversight",
      "International corporate structure",
      "Regulatory alignment and disclosure",
      "Executive leadership and culture"
    ],
    leadershipPhilosophy:
      "Leadership means taking responsibility before taking credit. Decisions should be explainable, records should be verifiable, and members should never be left guessing about how their platform works.",
    operationalFocus:
      "Establishing the governance standards, financial oversight practices, and strategic direction that allow Nigerian operations to scale without compromising member trust.",
    strategicPriorities: [
      "Long-term platform sustainability",
      "Transparent member communication",
      "International corporate discipline",
      "Responsible growth over rapid expansion"
    ],
    roleAtAltoRich:
      "As Founder and CEO, Karol Kemp provides the strategic anchor for Alto Rich — defining the company's mission, overseeing corporate governance through ALTORICH LTD, and ensuring that every operational layer serves the member-first culture the platform was built on.",
    message:
      "We built Alto Rich because Nigerians deserve better than opaque promises. My role is to ensure that every layer of this organisation — from corporate governance to weekly settlements — operates with the transparency and discipline our members expect.",
    quote:
      "Trust is earned through consistency, not campaigns. Every settlement cycle is an opportunity to prove we mean what we say."
  },
  {
    id: "olaniyi-adeyemo",
    slug: "olaniyi-adeyemo",
    name: "Olaniyi Adeyemo",
    title: "Executive Director, Operations & Member Success",
    office: "Lagos, Nigeria",
    imageSlug: "olaniyi-adeyemo",
    intro:
      "Leads day-to-day operations and member success from Lagos — ensuring every member receives consistent, professional service across the platform.",
    responsibilities: [
      "Operational Excellence",
      "Member Success",
      "Business Operations",
      "Service Quality",
      "Platform Growth"
    ],
    leadershipPhilosophy:
      "Operations are where trust is tested daily. Every verification, every reconciliation, and every support interaction is a chance to show members that the platform works as promised.",
    operationalFocus:
      "Building reliable operational workflows — from member onboarding and deposit reconciliation to settlement processing and support resolution — that scale with member growth.",
    strategicPriorities: [
      "Consistent service quality across all touchpoints",
      "Efficient operational workflows",
      "Member satisfaction and retention",
      "Platform reliability and uptime"
    ],
    roleAtAltoRich:
      "Olaniyi Adeyemo oversees the operational engine of Alto Rich in Nigeria. From Lagos, he leads the teams responsible for member verification, deposit reconciliation, settlement processing, and day-to-day member support — ensuring that the platform's published rules translate into reliable member experiences.",
    message:
      "Members interact with Alto Rich through operations — not strategy documents. My focus is making sure every touchpoint — onboarding, deposits, settlements, and support — works reliably and respectfully.",
    quote:
      "Operational excellence is not perfection — it is consistency. Members should know what to expect, and we should deliver it every time."
  },
  {
    id: "tamunotonye-peterside",
    slug: "tamunotonye-peterside",
    name: "Tamunotonye Peterside",
    title: "Regional Director, Business Development & Strategic Partnerships",
    office: "Port Harcourt, Nigeria",
    imageSlug: "tamunotonye-peterside",
    intro:
      "Drives business development and strategic partnerships from Port Harcourt — expanding Alto Rich's reach across the South-South and building corporate relationships.",
    responsibilities: [
      "South-South Operations",
      "Strategic Partnerships",
      "Business Development",
      "Corporate Relationships",
      "Regional Expansion"
    ],
    leadershipPhilosophy:
      "Growth should be purposeful. Every partnership and every regional initiative must strengthen the platform's ability to serve members — not distract from it.",
    operationalFocus:
      "Identifying and cultivating strategic partnerships, corporate relationships, and regional expansion opportunities that align with Alto Rich's member-first mission and operational standards.",
    strategicPriorities: [
      "South-South regional presence",
      "Corporate and institutional partnerships",
      "Sustainable business development",
      "Community engagement and trust-building"
    ],
    roleAtAltoRich:
      "Tamunotonye Peterside leads business development and strategic partnerships from Port Harcourt, with responsibility for South-South operations and regional expansion. He works to build the corporate relationships and community presence that allow Alto Rich to reach members across the Niger Delta and beyond.",
    message:
      "Regional growth is about presence and partnership — being where members are and building relationships that strengthen the platform's foundation.",
    quote:
      "Every partnership we pursue must pass one test: does it make Alto Rich more trustworthy and more accessible for members?"
  },
  {
    id: "abubakar-nasir",
    slug: "abubakar-nasir",
    name: "Abubakar Nasir",
    title: "Regional Director, Government & Institutional Relations",
    office: "Abuja, Nigeria",
    imageSlug: "abubakar-nasir",
    intro:
      "Manages government and institutional relations from Abuja — building the regulatory and institutional foundations that support Alto Rich's long-term operations.",
    responsibilities: [
      "Government Relations",
      "Institutional Partnerships",
      "Abuja Operations",
      "Strategic Development",
      "Corporate Engagement"
    ],
    leadershipPhilosophy:
      "Institutional trust is built through engagement, not avoidance. Transparent dialogue with regulators and institutional partners creates the foundation for sustainable operations.",
    operationalFocus:
      "Managing government relations, institutional partnerships, and Abuja-based operations — ensuring Alto Rich maintains constructive engagement with the regulatory and institutional landscape.",
    strategicPriorities: [
      "Constructive regulatory engagement",
      "Institutional partnership development",
      "Abuja operational presence",
      "Compliance-first institutional culture"
    ],
    roleAtAltoRich:
      "Abubakar Nasir leads government and institutional relations from Abuja, managing the platform's engagement with regulatory bodies, institutional partners, and the policy environment that shapes financial services in Nigeria. His work ensures Alto Rich operates with transparency and compliance at the institutional level.",
    message:
      "Institutional relationships require patience, clarity, and consistency. My role is to ensure Alto Rich engages constructively with the institutions and regulators that shape our operating environment.",
    quote:
      "Compliance is not a checkbox — it is a culture. We engage with institutions the same way we engage with members: openly and responsibly."
  }
];

export const LEADERSHIP_PRINCIPLES: LeadershipPrinciple[] = [
  {
    title: "Integrity",
    description: "One Platform Earning Model, published settlement windows, and verified records — no exceptions, no hidden terms."
  },
  {
    title: "Transparency",
    description: "Members see their balances, understand settlement timing, and can reach a team that takes responsibility."
  },
  {
    title: "Accountability",
    description: "Clear ownership at every level — from executive decisions to settlement processing and member support."
  },
  {
    title: "Operational Excellence",
    description: "Reliable workflows for onboarding, reconciliation, settlements, and support that scale with member growth."
  },
  {
    title: "Innovation",
    description: "Technology designed for how Nigerians save and invest — not imported templates that ignore local needs."
  },
  {
    title: "Discipline",
    description: "Published rules, predictable schedules, and internal controls that protect member funds and platform integrity."
  },
  {
    title: "Member-First Culture",
    description: "Every product decision and operational process is evaluated against one question: does this serve our members?"
  },
  {
    title: "Responsible Growth",
    description: "Sustainable expansion that strengthens operations before scaling — never growth at the expense of member trust."
  },
  {
    title: "Continuous Improvement",
    description: "Regular review of processes, feedback loops, and operational metrics to identify and resolve issues proactively."
  },
  {
    title: "Long-Term Thinking",
    description: "Decisions evaluated in years, not weeks — because member trust is built over time and lost in moments."
  }
];

export const GOVERNANCE_PILLARS: GovernancePillar[] = [
  {
    title: "Decision Making",
    description:
      "Strategic decisions flow from the CEO and executive team, with clear separation between corporate governance (London) and operational execution (Nigeria). Major platform changes follow documented review processes."
  },
  {
    title: "Financial Oversight",
    description:
      "Member funds are tracked through a transparent ledger. Deposits are reconciled against real bank credits before balances update. Settlement processing follows the published Monday schedule."
  },
  {
    title: "Risk Awareness",
    description:
      "Operational and financial risks are identified, documented, and managed through internal controls — from verification requirements to settlement safeguards and withdrawal processing windows."
  },
  {
    title: "Operational Controls",
    description:
      "Standardised workflows govern onboarding, deposit matching, settlement execution, and support resolution — with audit trails that support internal review and accountability."
  },
  {
    title: "Internal Accountability",
    description:
      "Clear role definitions, reporting lines, and escalation paths ensure that issues are owned, tracked, and resolved — not passed between teams."
  },
  {
    title: "Business Continuity",
    description:
      "Distributed leadership across four offices ensures operational resilience. Platform infrastructure and member data are protected through established security practices."
  },
  {
    title: "Ethical Culture",
    description:
      "Leadership promotes a culture where transparency, honesty, and member respect are non-negotiable — from executive communications to frontline support interactions."
  },
  {
    title: "Member Protection",
    description:
      "Verification requirements, published terms, settlement transparency, and accessible support channels work together to protect member interests at every stage."
  }
];

export const OFFICE_LOCATIONS: OfficeLocation[] = [
  {
    city: "London",
    country: "United Kingdom",
    role: "Corporate headquarters",
    purpose: "International corporate governance, strategic direction, and regulatory alignment for ALTORICH LTD.",
    responsibilities: [
      "Corporate governance and board oversight",
      "Strategic direction and executive leadership",
      "International regulatory alignment",
      "Financial oversight and corporate structure"
    ],
    supportCoverage: "Corporate enquiries, international partnerships, and governance matters.",
    address: COMPANY.addressFull
  },
  {
    city: "Lagos",
    country: "Nigeria",
    role: "Operations hub",
    purpose: "Central hub for member operations, verification, reconciliation, settlement processing, and day-to-day support.",
    responsibilities: [
      "Member onboarding and verification",
      "Deposit reconciliation",
      "Settlement processing",
      "Member support and success"
    ],
    supportCoverage: "Primary member support channel — onboarding, deposits, withdrawals, and account enquiries.",
    address: "Victoria Island · By appointment"
  },
  {
    city: "Abuja",
    country: "Nigeria",
    role: "Institutional relations",
    purpose: "Government relations, institutional partnerships, and regulatory engagement in Nigeria's capital.",
    responsibilities: [
      "Government and regulatory engagement",
      "Institutional partnership development",
      "Policy environment monitoring",
      "Corporate institutional representation"
    ],
    supportCoverage: "Institutional enquiries, government relations, and Abuja-region member support.",
    address: "Central Business District · By appointment"
  },
  {
    city: "Port Harcourt",
    country: "Nigeria",
    role: "Regional development",
    purpose: "South-South operations, business development, strategic partnerships, and regional member engagement.",
    responsibilities: [
      "South-South regional operations",
      "Business development and partnerships",
      "Corporate relationship management",
      "Regional member engagement"
    ],
    supportCoverage: "South-South regional support, partnership enquiries, and corporate relationships.",
    address: "By appointment"
  }
];

export const LEADERSHIP_TIMELINE: TimelineMilestone[] = [
  {
    label: "Foundation",
    detail: `${COMPANY.legalName} established with a Nigeria-first wealth mission and international corporate structure.`
  },
  {
    label: "Platform Development",
    detail: "Ledger architecture, investment sectors, and the Platform Earning Model engineered for transparent member use."
  },
  {
    label: "Operational Build",
    detail: "Verification workflows, deposit reconciliation, and settlement processing established for reliable member operations."
  },
  {
    label: "Member Launch",
    detail: "Nigerian members begin verified funding and sector allocation through a published, transparent platform."
  },
  {
    label: "Regional Expansion",
    detail: "Leadership presence established across Lagos, Abuja, and Port Harcourt to serve members nationwide."
  },
  {
    label: "Continued Growth",
    detail: "Ongoing investment in operational excellence, member tools, and wealth education for more Nigerians."
  }
];

export const LEADERSHIP_COMMITMENTS = [
  {
    title: "Transparency",
    detail: "Published rules, visible balances, and open communication about how the platform operates and settles earnings."
  },
  {
    title: "Continuous Improvement",
    detail: "Regular review of operational processes, member feedback, and platform performance to identify and resolve issues proactively."
  },
  {
    title: "Professional Service",
    detail: "Consistent, respectful member interactions across every channel — from onboarding to settlement and support."
  },
  {
    title: "Operational Excellence",
    detail: "Reliable workflows for verification, reconciliation, settlements, and support that members can depend on."
  },
  {
    title: "Long-Term Relationships",
    detail: "Building wealth is a journey. We design every interaction to support members over years, not transactions over days."
  }
];

/** Featured executives for homepage and about preview */
export const LEADERSHIP_PREVIEW = EXECUTIVES;

export function getExecutiveBySlug(slug: string): ExecutiveProfile | undefined {
  return EXECUTIVES.find((e) => e.slug === slug);
}

export function getFounder(): ExecutiveProfile {
  return EXECUTIVES.find((e) => e.isFounder)!;
}
