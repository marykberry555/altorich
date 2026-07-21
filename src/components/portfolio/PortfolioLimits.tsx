import { formatNaira } from "@/lib/domain";
import { getPortfolioBySlug, type PortfolioSlug } from "@/config/investment-portfolios";

type Props = {
  slug: PortfolioSlug;
  className?: string;
};

export function PortfolioLimits({ slug, className }: Props) {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio) return null;

  return (
    <dl className={className}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <dt className="text-[var(--text-muted)]">Minimum</dt>
        <dd className="currency-ngn font-semibold tabular-nums text-[var(--heading)]">
          {formatNaira(portfolio.minimumInvestment)}
        </dd>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
        <dt className="text-[var(--text-muted)]">Maximum</dt>
        <dd className="currency-ngn font-semibold tabular-nums text-[var(--heading)]">
          {formatNaira(portfolio.maximumInvestment)}
        </dd>
      </div>
    </dl>
  );
}
