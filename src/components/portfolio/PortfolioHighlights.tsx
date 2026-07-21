import { getPortfolioBySlug, type PortfolioSlug } from "@/config/investment-portfolios";
import { cn } from "@/lib/utils";

type Props = {
  slug: PortfolioSlug;
  compact?: boolean;
  limit?: number;
  className?: string;
};

export function PortfolioHighlights({ slug, compact, limit = 3, className }: Props) {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio?.highlights.length) return null;

  const items = portfolio.highlights.slice(0, limit);

  return (
    <ul className={cn(`space-y-1.5 text-xs text-[var(--text-muted)]`, className)}>
      {items.map((benefit) => (
        <li key={benefit} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--emerald)]" aria-hidden />
          <span className={compact ? "line-clamp-2" : undefined}>{benefit}</span>
        </li>
      ))}
    </ul>
  );
}
