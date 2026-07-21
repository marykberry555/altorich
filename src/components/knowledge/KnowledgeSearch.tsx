"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { KnowledgeArticle } from "@/content/knowledge/types";
import type { KnowledgeCategorySlug } from "@/content/knowledge/types";
import { KnowledgeArticleCard } from "./KnowledgeArticleCard";
import { cn } from "@/lib/utils";

type Props = {
  articles: KnowledgeArticle[];
  popularArticles: KnowledgeArticle[];
  placeholder?: string;
  showResultsInline?: boolean;
};

export function KnowledgeSearch({
  articles,
  popularArticles,
  placeholder = "Search guides, topics, and keywords…",
  showResultsInline = true
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<KnowledgeCategorySlug | "all">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (category !== "all" && article.categorySlug !== category) return false;
      if (!q) return false;
      return (
        article.title.toLowerCase().includes(q) ||
        article.description.toLowerCase().includes(q) ||
        article.keywords.some((k) => k.includes(q)) ||
        article.category.toLowerCase().includes(q)
      );
    });
  }, [articles, query, category]);

  const categories = useMemo(() => {
    const slugs = new Set(articles.map((a) => a.categorySlug));
    return Array.from(slugs);
  }, [articles]);

  const showEmpty = query.trim().length > 0 && results.length === 0;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--text-subtle)]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search knowledge center"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] py-3.5 pl-12 pr-12 text-sm text-[var(--heading)] shadow-[var(--shadow-sm)] transition focus:border-[var(--emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald)]/20"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--text-subtle)] hover:bg-[var(--gray-100)]"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <FilterChip active={category === "all"} onClick={() => setCategory("all")} label="All" />
        {categories.map((slug) => (
          <FilterChip
            key={slug}
            active={category === slug}
            onClick={() => setCategory(slug)}
            label={slug.replace(/-/g, " ")}
          />
        ))}
      </div>

      {showResultsInline && query.trim() ? (
        <div aria-live="polite">
          {results.length > 0 ? (
            <>
              <p className="text-sm text-[var(--text-muted)]">
                {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((article) => (
                  <li key={article.slug}>
                    <KnowledgeArticleCard article={article} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {showEmpty ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center">
              <p className="font-semibold text-[var(--heading)]">No results found</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Try different keywords or browse popular topics below.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {popularArticles.slice(0, 4).map((a) => (
                  <li key={a.slug}>
                    <Link href={a.path} className="text-sm font-semibold text-[var(--emerald)] hover:underline">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold capitalize transition",
        active
          ? "border-[var(--emerald)] bg-[var(--emerald)]/10 text-[var(--emerald)]"
          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--emerald)]/40"
      )}
    >
      {label}
    </button>
  );
}
