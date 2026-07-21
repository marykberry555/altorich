import type { KnowledgeCategorySlug } from "./types";

export type KnowledgeCategory = {
  slug: KnowledgeCategorySlug;
  title: string;
  description: string;
  icon: string;
  href: string;
};

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Step-by-step guides from registration to your first investment and withdrawal.",
    icon: "Rocket",
    href: "/learn/category/getting-started"
  },
  {
    slug: "platform-guides",
    title: "Platform Guides",
    description: "How deposits, settlements, notifications, and your dashboard work on Alto Rich.",
    icon: "Compass",
    href: "/learn/category/platform-guides"
  },
  {
    slug: "investment-basics",
    title: "Investment Basics",
    description: "Foundational concepts — risk, returns, diversification, and responsible investing.",
    icon: "TrendingUp",
    href: "/learn/category/investment-basics"
  },
  {
    slug: "financial-planning",
    title: "Financial Planning",
    description: "Budgeting, emergency funds, long-term goals, and building disciplined habits.",
    icon: "PiggyBank",
    href: "/learn/category/financial-planning"
  },
  {
    slug: "security",
    title: "Security Academy",
    description: "Protect your account, recognise phishing, and practise safe banking online.",
    icon: "Shield",
    href: "/learn/category/security"
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    description: "Searchable answers on accounts, funding, withdrawals, bonuses, and referrals.",
    icon: "HelpCircle",
    href: "/learn/faq"
  },
  {
    slug: "announcements",
    title: "Announcements",
    description: "Platform updates, maintenance windows, and where to find official communications.",
    icon: "Megaphone",
    href: "/learn/category/announcements"
  },
  {
    slug: "policies",
    title: "Policies",
    description: "Terms, privacy, risk disclosure, AML/KYC, and regulatory information.",
    icon: "Scale",
    href: "/learn/category/policies"
  }
];

export function getKnowledgeCategory(slug: KnowledgeCategorySlug) {
  return KNOWLEDGE_CATEGORIES.find((c) => c.slug === slug);
}

export const POPULAR_TOPIC_SLUGS = [
  "creating-account",
  "funding-wallet",
  "how-deposits-work",
  "monday-settlements",
  "withdrawals-guide",
  "investment-basics",
  "phishing-awareness",
  "welcome-bonus-guide"
] as const;
