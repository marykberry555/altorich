/** @deprecated Use KnowledgeArticleView from @/components/knowledge/KnowledgeArticleView */
export {
  KnowledgeArticleView as LearnArticleView,
  generateKnowledgeStaticParams as generateLearnStaticParams
} from "@/components/knowledge/KnowledgeArticleView";

import { getKnowledgeArticle } from "@/content/knowledge";
import { buildMetadata } from "@/lib/seo";

export function generateLearnMetadata(slug: string) {
  const article = getKnowledgeArticle(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.description,
    path: article.path,
    type: "article"
  });
}
