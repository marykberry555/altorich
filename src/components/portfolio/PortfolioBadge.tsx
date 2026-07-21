import { getPortfolioBySlug, type PortfolioSlug } from "@/config/investment-portfolios";
import { cn } from "@/lib/utils";

type Props = {
  slug: PortfolioSlug;
  className?: string;
};

export function PortfolioBadge({ slug, className }: Props) {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio?.badge) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--emerald-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--emerald)]",
        className
      )}
    >
      {portfolio.badge}
    </span>
  );
}
