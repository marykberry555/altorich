"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import {
  getKnowledgeArticle,
  getRelatedArticles,
  getAdjacentArticles
} from "@/content/knowledge";
import { IMAGES } from "@/lib/images";
import { KnowledgeBlockRenderer } from "./KnowledgeBlockRenderer";
import { KnowledgeArticleCard } from "./KnowledgeArticleCard";
import { KnowledgeBookmarkButton, useKnowledgeStorage } from "./KnowledgeBookmarkButton";
import { StatusChip } from "@/components/financial/StatusChip";

const difficultyLabel = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
} as const;

export function KnowledgeArticleView({ slug }: { slug: string }) {
  const article = getKnowledgeArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(slug, 3);
  const { previous, next } = getAdjacentArticles(slug);
  const { markRead } = useKnowledgeStorage(slug);

  useEffect(() => {
    markRead();
  }, [markRead]);

  return (
    <article className="section-pad">
      <div className="container-ar">
        <nav className="text-sm text-[var(--text-subtle)]" aria-label="Breadcrumb">
          <Link href="/learn" className="hover:text-[var(--emerald)]">
            Knowledge Center
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/learn/category/${article.categorySlug}`} className="hover:text-[var(--emerald)]">
            {article.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--text-muted)]">{article.title}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--emerald)]">{article.category}</span>
            <StatusChip label={difficultyLabel[article.difficulty]} variant="outline" />
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--heading)] md:text-4xl">{article.title}</h1>
          <p className="mt-4 text-lg text-[var(--text-muted)]">{article.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--text-subtle)]">
            <span className="inline-flex items-center gap-1">
              <Clock size={14} aria-hidden />
              {article.readMinutes} min read
            </span>
            {article.lastUpdated ? <span>Updated {new Date(article.lastUpdated).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</span> : null}
          </div>
          <div className="mt-4">
            <KnowledgeBookmarkButton slug={slug} />
          </div>
        </header>

        <div className="relative mt-10 aspect-[21/9] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
          <Image
            src={IMAGES.learn.src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
          />
        </div>

        <div className="prose-ar mx-auto mt-12 max-w-3xl">
          {article.sections.map((section) => (
            <section key={section.heading} className="mb-10">
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {section.blocks ? <KnowledgeBlockRenderer blocks={section.blocks} /> : null}
            </section>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-6">
          <p className="text-sm text-[var(--text-muted)]">
            This content is for informational purposes only and should not be interpreted as personalised financial advice.
            Review plan terms and{" "}
            <Link href="/legal/risk" className="font-medium text-[var(--emerald)] hover:underline">
              risk disclosures
            </Link>{" "}
            before making investment decisions.
          </p>
        </div>

        <nav className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 sm:flex-row sm:justify-between" aria-label="Article navigation">
          {previous ? (
            <Link
              href={previous.path}
              className="group flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm transition hover:border-[var(--emerald)]/40"
            >
              <ArrowLeft size={16} className="text-[var(--text-subtle)]" aria-hidden />
              <div>
                <p className="text-xs text-[var(--text-subtle)]">Previous guide</p>
                <p className="font-semibold text-[var(--heading)] group-hover:text-[var(--emerald)]">{previous.title}</p>
              </div>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.path}
              className="group flex items-center justify-end gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-right transition hover:border-[var(--emerald)]/40 sm:ml-auto"
            >
              <div>
                <p className="text-xs text-[var(--text-subtle)]">Next guide</p>
                <p className="font-semibold text-[var(--heading)] group-hover:text-[var(--emerald)]">{next.title}</p>
              </div>
              <ArrowRight size={16} className="text-[var(--text-subtle)]" aria-hidden />
            </Link>
          ) : null}
        </nav>

        {related.length > 0 ? (
          <section className="mx-auto mt-16 max-w-5xl" aria-labelledby="related-articles">
            <h2 id="related-articles" className="text-xl font-bold text-[var(--heading)]">
              Related articles
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {related.map((a) => (
                <li key={a.slug}>
                  <KnowledgeArticleCard article={a} compact />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}

import { KNOWLEDGE_ARTICLES } from "@/content/knowledge";

export function generateKnowledgeStaticParams() {
  return KNOWLEDGE_ARTICLES.map((a) => ({ slug: a.slug }));
}
