import { getPortfolioBySlug, type PortfolioSlug } from "@/config/investment-portfolios";
import { PortfolioBadge } from "@/components/portfolio/PortfolioBadge";
import { PortfolioHierarchy } from "@/components/portfolio/PortfolioHierarchy";
import { PortfolioLimits } from "@/components/portfolio/PortfolioLimits";

type Props = {
  slug: PortfolioSlug;
  className?: string;
};

export function PortfolioSummary({ slug, className }: Props) {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio) return null;

  return (
    <article className={className}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PortfolioHierarchy
          strategy={portfolio.strategy}
          name={portfolio.name}
          dailyReturnPercent={portfolio.dailyReturnRate}
          minNgn={portfolio.minimumInvestment}
          maxNgn={portfolio.maximumInvestment}
          className="min-w-0 flex-1"
        />
        <PortfolioBadge slug={slug} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{portfolio.description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Returns</p>
          <p className="mt-1 text-xl font-bold text-[var(--emerald)]">{portfolio.dailyReturnRate}% daily</p>
          <p className="text-xs text-[var(--text-muted)]">{portfolio.weeklyProjectionRate}% weekly equivalent</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Investment limits</p>
          <PortfolioLimits slug={slug} className="mt-2" />
        </div>
      </div>
    </article>
  );
}
