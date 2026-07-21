import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { KnowledgeIcon } from "./KnowledgeIcon";

type Props = {
  title: string;
  description: string;
  icon: string;
  href: string;
  articleCount: number;
};

export function KnowledgeCategoryCard({ title, description, icon, href, articleCount }: Props) {
  return (
    <Link href={href} className="group block h-full">
      <Card
        variant="elevated"
        className="flex h-full flex-col transition hover:border-[var(--emerald)]/40 hover:shadow-[var(--shadow-md)]"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--emerald)]/10 text-[var(--emerald)] transition group-hover:scale-105">
          <KnowledgeIcon name={icon} size={24} />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-[var(--heading)]">{title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
        <p className="mt-4 text-xs font-medium text-[var(--text-subtle)]">
          {articleCount} {articleCount === 1 ? "article" : "articles"}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--emerald)]">
          Explore
          <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Card>
    </Link>
  );
}
