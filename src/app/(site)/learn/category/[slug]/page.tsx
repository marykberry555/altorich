import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/Button";
import { KnowledgeArticleCard } from "@/components/knowledge/KnowledgeArticleCard";
import { KnowledgeIcon } from "@/components/knowledge/KnowledgeIcon";
import {
  getArticlesByCategory,
  getKnowledgeCategory,
  POLICY_LINKS,
  KNOWLEDGE_CATEGORIES
} from "@/content/knowledge";
import type { KnowledgeCategorySlug } from "@/content/knowledge/types";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { Card } from "@/components/ui/Card";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return KNOWLEDGE_CATEGORIES.filter((c) => c.slug !== "faq").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = getKnowledgeCategory(slug as KnowledgeCategorySlug);
  if (!category) return {};
  return buildMetadata({
    title: `${category.title} — Knowledge Center`,
    description: category.description,
    path: `/learn/category/${slug}`
  });
}

export default async function KnowledgeCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getKnowledgeCategory(slug as KnowledgeCategorySlug);
  if (!category) notFound();

  const articles = getArticlesByCategory(slug as KnowledgeCategorySlug);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Knowledge Center", path: "/learn" },
    { name: category.title, path: `/learn/category/${slug}` }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <section className="gradient-hero section-pad-hero">
        <div className="container-ar">
          <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--emerald)]">
            <ArrowLeft size={14} aria-hidden />
            Knowledge Center
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--emerald)]/10 text-[var(--emerald)]">
              <KnowledgeIcon name={category.icon} size={28} />
            </span>
            <PageHero eyebrow={category.title} title={category.title} description={category.description} />
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          {slug === "policies" ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {POLICY_LINKS.map((policy) => (
                <li key={policy.href}>
                  <Link href={policy.href}>
                    <Card variant="elevated" className="transition hover:border-[var(--emerald)]/40">
                      <h3 className="font-semibold text-[var(--heading)]">{policy.title}</h3>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">{policy.description}</p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-semibold text-[var(--heading)]">No articles in this category yet.</p>
              <Link href="/learn" className="mt-4 inline-block">
                <Button variant="outline">Back to Knowledge Center</Button>
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <li key={article.slug}>
                  <KnowledgeArticleCard article={article} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
