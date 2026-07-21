export type KnowledgeCategorySlug =
  | "getting-started"
  | "platform-guides"
  | "investment-basics"
  | "financial-planning"
  | "security"
  | "faq"
  | "announcements"
  | "policies";

export type KnowledgeDifficulty = "beginner" | "intermediate" | "advanced";

export type KnowledgeBlock =
  | { type: "paragraph"; text: string }
  | { type: "steps"; items: { title: string; description: string }[] }
  | { type: "tip"; text: string; title?: string }
  | { type: "warning"; text: string; title?: string }
  | { type: "best-practice"; text: string; title?: string }
  | { type: "flow"; title?: string; steps: string[] };

export type KnowledgeSection = {
  heading: string;
  paragraphs?: string[];
  blocks?: KnowledgeBlock[];
};

export type KnowledgeArticle = {
  slug: string;
  path: string;
  title: string;
  description: string;
  category: string;
  categorySlug: KnowledgeCategorySlug;
  keywords: string[];
  readMinutes: number;
  difficulty: KnowledgeDifficulty;
  lastUpdated?: string;
  relatedSlugs: string[];
  sections: KnowledgeSection[];
};

export type FaqCategorySlug =
  | "account"
  | "deposits"
  | "withdrawals"
  | "investments"
  | "welcome-bonus"
  | "referrals"
  | "security"
  | "technical";

export type KnowledgeFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategorySlug;
  keywords?: string[];
};
