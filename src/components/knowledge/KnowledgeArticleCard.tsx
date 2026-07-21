import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { KnowledgeArticle, KnowledgeDifficulty } from "@/content/knowledge/types";
import { StatusChip } from "@/components/financial/StatusChip";

type Props = {
  article: KnowledgeArticle;
  compact?: boolean;
};

const difficultyLabel: Record<KnowledgeDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

const difficultyVariant = {
  beginner: "emerald" as const,
  intermediate: "gold" as const,
  advanced: "navy" as const
};

export function KnowledgeArticleCard({ article, compact }: Props) {
  return (
    <Link href={article.path} className="group block h-full">
      <Card
        variant="elevated"
        padding={compact ? "md" : "md"}
        className="flex h-full flex-col transition hover:border-[var(--emerald)]/30 hover:shadow-[var(--shadow-md)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--emerald)]">{article.category}</span>
          <StatusChip label={difficultyLabel[article.difficulty]} variant={difficultyVariant[article.difficulty]} />
        </div>
        <h3 className="mt-2 font-semibold text-[var(--heading)] group-hover:text-[var(--emerald)]">{article.title}</h3>
        {!compact ? <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">{article.description}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[var(--text-subtle)]">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} aria-hidden />
            {article.readMinutes} min read
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--emerald)]">
            Read
            <ArrowRight size={12} className="transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}
