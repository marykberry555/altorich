import { KnowledgeArticleView } from "@/components/knowledge/KnowledgeArticleView";
import { getKnowledgeArticle, KNOWLEDGE_ARTICLES } from "@/content/knowledge";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

const RESERVED = new Set(["faq", "how-it-works", "help", "category", "search"]);

export function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (RESERVED.has(slug)) return {};
  const article = getKnowledgeArticle(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.description,
    path: article.path,
    type: "article"
  });
}

export default async function LearnArticlePage({ params }: Props) {
  const { slug } = await params;

  if (slug === "help" || slug === "faq") redirect("/learn/faq");
  if (slug === "how-it-works") redirect("/how-it-works");
  if (slug === "category") redirect("/learn");
  if (slug === "search") redirect("/learn");

  const article = getKnowledgeArticle(slug);
  const breadcrumb = article
    ? breadcrumbJsonLd([
        { name: "Knowledge Center", path: "/learn" },
        { name: article.category, path: `/learn/category/${article.categorySlug}` },
        { name: article.title, path: article.path }
      ])
    : null;
  const jsonLd = article
    ? articleJsonLd({
        title: article.title,
        description: article.description,
        path: article.path,
        datePublished: article.lastUpdated
      })
    : null;

  return (
    <>
      {breadcrumb ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} /> : null}
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <KnowledgeArticleView slug={slug} />
    </>
  );
}
