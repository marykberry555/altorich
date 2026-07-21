import { LEARN_ARTICLES } from "@/content/learn";
import type { KnowledgeArticle, KnowledgeCategorySlug } from "./types";
import { GETTING_STARTED_ARTICLES } from "./getting-started";
import { PLATFORM_GUIDE_ARTICLES } from "./platform-guides";
import { SECURITY_ARTICLES } from "./security";
import { KNOWLEDGE_CATEGORIES, POPULAR_TOPIC_SLUGS } from "./categories";

const CATEGORY_MAP: Record<string, KnowledgeCategorySlug> = {
  Foundations: "investment-basics",
  Saving: "financial-planning",
  Personal: "financial-planning",
  Wealth: "financial-planning",
  Business: "investment-basics",
  Reference: "platform-guides"
};

function migrateLearnArticle(article: (typeof LEARN_ARTICLES)[number]): KnowledgeArticle {
  const categorySlug = CATEGORY_MAP[article.category] ?? "investment-basics";
  return {
    slug: article.slug,
    path: article.path,
    title: article.title,
    description: article.description,
    category: article.category,
    categorySlug,
    keywords: [article.slug.replace(/-/g, " "), article.category.toLowerCase()],
    readMinutes: article.readMinutes,
    difficulty: "beginner",
    lastUpdated: "2026-06-01",
    relatedSlugs: LEARN_ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category)
      .slice(0, 3)
      .map((a) => a.slug),
    sections: article.sections.map((s) => ({
      heading: s.heading,
      paragraphs: s.paragraphs
    }))
  };
}

const EXTRA_FINANCIAL_ARTICLES: KnowledgeArticle[] = [
  {
    slug: "emergency-funds",
    path: "/learn/emergency-funds",
    title: "Building an Emergency Fund",
    description: "Why liquidity matters before investing and how much to set aside for unexpected expenses.",
    category: "Financial Planning",
    categorySlug: "financial-planning",
    keywords: ["emergency", "savings", "buffer", "liquidity"],
    readMinutes: 5,
    difficulty: "beginner",
    lastUpdated: "2026-07-01",
    relatedSlugs: ["saving-strategies", "budgeting-basics", "investment-basics"],
    sections: [
      {
        heading: "What is an emergency fund?",
        paragraphs: [
          "An emergency fund covers essential expenses when income stops or unexpected costs arise — medical bills, job loss, or urgent repairs. It prevents you from selling investments at the wrong time."
        ]
      },
      {
        heading: "How much to save",
        paragraphs: [
          "A common starting point is three to six months of essential expenses. Begin with a smaller target — one month — and build gradually."
        ],
        blocks: [{ type: "tip", text: "Keep emergency funds in accessible savings separate from long-term investments." }]
      }
    ]
  },
  {
    slug: "budgeting-basics",
    path: "/learn/budgeting-basics",
    title: "Budgeting Basics",
    description: "A simple framework for tracking income, expenses, and investment contributions.",
    category: "Financial Planning",
    categorySlug: "financial-planning",
    keywords: ["budget", "expenses", "income", "planning"],
    readMinutes: 6,
    difficulty: "beginner",
    lastUpdated: "2026-07-01",
    relatedSlugs: ["financial-literacy", "saving-strategies", "setting-financial-goals"],
    sections: [
      {
        heading: "The 50/30/20 starting point",
        paragraphs: [
          "Allocate roughly 50% to needs, 30% to wants, and 20% to savings and investments. Adjust ratios to your reality — the goal is awareness, not perfection."
        ]
      }
    ]
  },
  {
    slug: "setting-financial-goals",
    path: "/learn/setting-financial-goals",
    title: "Setting Financial Goals",
    description: "Define short, medium, and long-term targets that guide your saving and investing decisions.",
    category: "Financial Planning",
    categorySlug: "financial-planning",
    keywords: ["goals", "planning", "targets", "timeline"],
    readMinutes: 5,
    difficulty: "beginner",
    lastUpdated: "2026-07-01",
    relatedSlugs: ["wealth-building", "retirement-planning", "budgeting-basics"],
    sections: [
      {
        heading: "SMART goals",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Specific", description: "Define exactly what you want — e.g. ₦500,000 education fund." },
              { title: "Measurable", description: "Track progress with numbers and dates." },
              { title: "Achievable", description: "Set targets your income can realistically support." },
              { title: "Time-bound", description: "Assign deadlines to create accountability." }
            ]
          }
        ]
      }
    ]
  },
  {
    slug: "compounding-explained",
    path: "/learn/compounding-explained",
    title: "Understanding Compounding",
    description: "How reinvested returns grow over time — explained without promises or guarantees.",
    category: "Investment Basics",
    categorySlug: "investment-basics",
    keywords: ["compounding", "growth", "returns", "time"],
    readMinutes: 5,
    difficulty: "intermediate",
    lastUpdated: "2026-07-01",
    relatedSlugs: ["investment-basics", "wealth-building", "understanding-earnings"],
    sections: [
      {
        heading: "The concept",
        paragraphs: [
          "Compounding means earning returns on both your original amount and on previously accumulated returns. Over long periods, disciplined reinvestment can significantly increase total value — though actual results depend on rates, duration, and market conditions."
        ],
        blocks: [
          {
            type: "warning",
            text: "Past patterns do not guarantee future results. Always review plan terms and risk disclosures."
          }
        ]
      }
    ]
  },
  {
    slug: "responsible-investing",
    path: "/learn/responsible-investing",
    title: "Responsible Investing",
    description: "Questions to ask before committing capital — alignment, risk, and due diligence.",
    category: "Investment Basics",
    categorySlug: "investment-basics",
    keywords: ["responsible", "due diligence", "risk", "discipline"],
    readMinutes: 6,
    difficulty: "intermediate",
    lastUpdated: "2026-07-01",
    relatedSlugs: ["investment-risk", "investment-basics", "financial-literacy"],
    sections: [
      {
        heading: "Before you invest",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Understand the product", description: "Read terms, settlement schedule, and risk disclosure." },
              { title: "Assess your timeline", description: "Match investment duration to when you need the money." },
              { title: "Invest only what you can afford", description: "Never commit funds needed for essentials or emergencies." },
              { title: "Diversify thoughtfully", description: "Spread exposure rather than concentrating in one channel." }
            ]
          }
        ]
      }
    ]
  },
  {
    slug: "platform-announcements",
    path: "/learn/platform-announcements",
    title: "Platform Announcements & Updates",
    description: "Where to find official Alto Rich communications, maintenance notices, and programme changes.",
    category: "Announcements",
    categorySlug: "announcements",
    keywords: ["announcements", "updates", "maintenance", "news"],
    readMinutes: 4,
    difficulty: "beginner",
    lastUpdated: "2026-07-01",
    relatedSlugs: ["notifications-guide", "dashboard-guide"],
    sections: [
      {
        heading: "Official channels",
        paragraphs: [
          "Alto Rich publishes updates through in-app notifications, email to verified addresses, and the Transparency Center. Maintenance windows are announced in advance when possible."
        ],
        blocks: [
          {
            type: "tip",
            text: "Bookmark /status for real-time platform status and /company/transparency for operational metrics."
          }
        ]
      }
    ]
  }
];

const migratedLearn = LEARN_ARTICLES.map(migrateLearnArticle);

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  ...GETTING_STARTED_ARTICLES,
  ...PLATFORM_GUIDE_ARTICLES,
  ...SECURITY_ARTICLES,
  ...EXTRA_FINANCIAL_ARTICLES,
  ...migratedLearn.filter((a) => {
    const newer = [...GETTING_STARTED_ARTICLES, ...PLATFORM_GUIDE_ARTICLES, ...SECURITY_ARTICLES, ...EXTRA_FINANCIAL_ARTICLES];
    return !newer.some((n) => n.slug === a.slug);
  })
];

export function getKnowledgeArticle(slug: string) {
  return KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: KnowledgeCategorySlug) {
  if (categorySlug === "faq") return [];
  if (categorySlug === "policies") return [];
  return KNOWLEDGE_ARTICLES.filter((a) => a.categorySlug === categorySlug);
}

export function countArticlesByCategory(categorySlug: KnowledgeCategorySlug) {
  if (categorySlug === "faq") return 20;
  if (categorySlug === "policies") return 5;
  return getArticlesByCategory(categorySlug).length;
}

export function getRelatedArticles(slug: string, limit = 3) {
  const article = getKnowledgeArticle(slug);
  if (!article) return [];
  const related = article.relatedSlugs
    .map((s) => getKnowledgeArticle(s))
    .filter(Boolean) as KnowledgeArticle[];
  if (related.length >= limit) return related.slice(0, limit);
  const sameCategory = KNOWLEDGE_ARTICLES.filter(
    (a) => a.categorySlug === article.categorySlug && a.slug !== slug && !related.some((r) => r.slug === a.slug)
  );
  return [...related, ...sameCategory].slice(0, limit);
}

export function getAdjacentArticles(slug: string) {
  const categoryArticles = KNOWLEDGE_ARTICLES.filter((a) => {
    const current = getKnowledgeArticle(slug);
    return current && a.categorySlug === current.categorySlug;
  });
  const idx = categoryArticles.findIndex((a) => a.slug === slug);
  return {
    previous: idx > 0 ? categoryArticles[idx - 1] : null,
    next: idx >= 0 && idx < categoryArticles.length - 1 ? categoryArticles[idx + 1] : null
  };
}

export function searchKnowledge(query: string, categorySlug?: KnowledgeCategorySlug | "all") {
  const q = query.trim().toLowerCase();
  return KNOWLEDGE_ARTICLES.filter((article) => {
    if (categorySlug && categorySlug !== "all" && article.categorySlug !== categorySlug) return false;
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.description.toLowerCase().includes(q) ||
      article.category.toLowerCase().includes(q) ||
      article.keywords.some((k) => k.includes(q)) ||
      article.sections.some(
        (s) =>
          s.heading.toLowerCase().includes(q) ||
          s.paragraphs?.some((p) => p.toLowerCase().includes(q))
      )
    );
  });
}

export function getPopularArticles() {
  return POPULAR_TOPIC_SLUGS.map((slug) => getKnowledgeArticle(slug)).filter(Boolean) as KnowledgeArticle[];
}

export function getRecentArticles(limit = 6) {
  return [...KNOWLEDGE_ARTICLES]
    .sort((a, b) => (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? ""))
    .slice(0, limit);
}

export function getCategoriesWithCounts() {
  return KNOWLEDGE_CATEGORIES.map((cat) => ({
    ...cat,
    articleCount: countArticlesByCategory(cat.slug)
  }));
}

export const POLICY_LINKS = [
  { title: "Terms of Service", href: "/legal/terms", description: "Member agreement and platform rules." },
  { title: "Privacy Policy", href: "/legal/privacy", description: "How we collect, use, and protect your data." },
  { title: "Risk Disclosure", href: "/legal/risk", description: "Investment risks and member responsibilities." },
  { title: "AML Policy", href: "/legal/aml", description: "Anti-money laundering compliance." },
  { title: "KYC Policy", href: "/legal/kyc", description: "Identity verification requirements." }
];

/** @deprecated Use getKnowledgeArticle */
export function getLearnArticle(slug: string) {
  return getKnowledgeArticle(slug);
}

export { KNOWLEDGE_CATEGORIES, getKnowledgeCategory, POPULAR_TOPIC_SLUGS } from "./categories";
