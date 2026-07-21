import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/Button";
import { KnowledgeCategoryCard } from "@/components/knowledge/KnowledgeCategoryCard";
import { KnowledgeArticleCard } from "@/components/knowledge/KnowledgeArticleCard";
import { KnowledgeSearch } from "@/components/knowledge/KnowledgeSearch";
import { KnowledgeProgressPanel } from "@/components/knowledge/KnowledgeProgressPanel";
import {
  KNOWLEDGE_ARTICLES,
  getCategoriesWithCounts,
  getPopularArticles,
  getRecentArticles
} from "@/content/knowledge";
import { IMAGES } from "@/lib/images";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Knowledge Center — Learn before you invest",
  description:
    "Practical guides, platform explanations, and financial education to help Alto Rich members make informed decisions.",
  path: "/learn"
});

export default function LearnPage() {
  const categories = getCategoriesWithCounts();
  const popular = getPopularArticles();
  const recent = getRecentArticles(6);

  return (
    <>
      <section className="gradient-hero section-pad-hero overflow-hidden">
        <div className="container-ar">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <PageHero
              eyebrow="Knowledge Center"
              title="Learn Before You Invest"
              description="Knowledge builds confidence. Explore practical guides, platform explanations, and financial education designed to help you make informed decisions."
            />
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-lg)]">
              <Image
                src={IMAGES.learn.src}
                alt={IMAGES.learn.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 512px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <KnowledgeSearch articles={KNOWLEDGE_ARTICLES} popularArticles={popular} />
        </div>
      </section>

      <section className="section-pad bg-[var(--emerald-soft)]">
        <div className="container-ar">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--radius-lg)] border border-[var(--emerald)]/20 bg-[var(--surface-raised)] p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Start here</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--heading)] sm:text-2xl">
                How Alto Rich works
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                The member journey, capital allocation approach, weekly settlements, and how to track your investment — explained clearly.
              </p>
            </div>
            <Link href="/how-it-works" className="shrink-0">
              <Button size="lg" className="gap-2">
                Read the guide
                <ArrowRight size={16} aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--heading)]">Browse by category</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Find guides organised by topic.</p>
            </div>
            <Link href="/learn/faq">
              <Button variant="outline" size="sm">
                View FAQ centre
                <ArrowRight size={14} className="ml-1" aria-hidden />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <KnowledgeCategoryCard
                key={cat.slug}
                title={cat.title}
                description={cat.description}
                icon={cat.icon}
                href={cat.href}
                articleCount={cat.articleCount}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[var(--heading)]">Popular topics</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {popular.map((article) => (
                <li key={article.slug}>
                  <KnowledgeArticleCard article={article} />
                </li>
              ))}
            </ul>
          </div>
          <KnowledgeProgressPanel />
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <h2 className="text-xl font-bold text-[var(--heading)]">Recently updated</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((article) => (
              <li key={article.slug}>
                <KnowledgeArticleCard article={article} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
