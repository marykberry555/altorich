import { formatNaira } from "@/lib/domain";
import {
  formatDailyReturnLabel,
  formatPortfolioOfferLine,
  PORTFOLIO_TERMS
} from "@/lib/copy/portfolio-terminology";
import { cn } from "@/lib/utils";

type Props = {
  strategy: string;
  name: string;
  dailyReturnPercent: number;
  minNgn: number;
  maxNgn: number;
  /** When true, strategy is the visual headline and name is secondary. */
  strategyAsTitle?: boolean;
  /** When false, omit min/max investment range from the offer line. */
  showInvestmentRange?: boolean;
  className?: string;
  nameClassName?: string;
  offerClassName?: string;
};

/**
 * Canonical portfolio presentation order everywhere:
 * 1. Strategy focus
 * 2. Portfolio name
 * 3. Daily return (+ optional investment range)
 */
export function PortfolioHierarchy({
  strategy,
  name,
  dailyReturnPercent,
  minNgn,
  maxNgn,
  strategyAsTitle = true,
  showInvestmentRange = true,
  className,
  nameClassName,
  offerClassName
}: Props) {
  const offer = showInvestmentRange
    ? formatPortfolioOfferLine({
        dailyReturnPercent,
        minNgn,
        maxNgn,
        format: formatNaira
      })
    : formatDailyReturnLabel(dailyReturnPercent);

  if (strategyAsTitle) {
    return (
      <div className={cn(className)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--emerald)]">
          {PORTFOLIO_TERMS.primaryStrategy}
        </p>
        <h3 className={cn("mt-1.5 text-base font-bold leading-snug text-[var(--heading)] sm:text-lg", nameClassName)}>
          {strategy}
        </h3>
        <p className="mt-1 text-sm font-semibold text-[var(--heading)]">{name}</p>
        <p className={cn("mt-2 text-sm font-medium text-[var(--emerald)]", offerClassName)}>{offer}</p>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--emerald)]">{strategy}</p>
      <h3 className={cn("mt-1.5 font-bold text-[var(--heading)]", nameClassName)}>{name}</h3>
      <p className={cn("mt-2 text-sm font-medium text-[var(--emerald)]", offerClassName)}>{offer}</p>
    </div>
  );
}
