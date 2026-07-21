"use client";

import { useMemo } from "react";
import {
  calculateAnnualProjection,
  calculateDailyReturn,
  calculateMonthlyProjection,
  calculateWeeklyProjection,
  getPortfolioBySlug,
  type PortfolioSlug
} from "@/config/investment-portfolios";
import { formatNaira } from "@/lib/domain";

type Props = {
  slug: PortfolioSlug;
  amountNgn: number;
  className?: string;
};

export function PortfolioProjection({ slug, amountNgn, className }: Props) {
  const portfolio = getPortfolioBySlug(slug);
  const projections = useMemo(
    () => ({
      daily: calculateDailyReturn(slug, amountNgn),
      weekly: calculateWeeklyProjection(slug, amountNgn),
      monthly: calculateMonthlyProjection(slug, amountNgn),
      annual: calculateAnnualProjection(slug, amountNgn)
    }),
    [slug, amountNgn]
  );

  if (!portfolio) return null;

  return (
    <dl className={className}>
      <div className="flex justify-between gap-4 py-2 text-sm">
        <dt className="text-[var(--text-muted)]">Daily ({portfolio.dailyReturnRate}%)</dt>
        <dd className="currency-ngn font-semibold tabular-nums text-[var(--emerald)]">{formatNaira(projections.daily)}</dd>
      </div>
      <div className="flex justify-between gap-4 py-2 text-sm">
        <dt className="text-[var(--text-muted)]">Weekly ({portfolio.weeklyProjectionRate}%)</dt>
        <dd className="currency-ngn font-semibold tabular-nums text-[var(--emerald)]">{formatNaira(projections.weekly)}</dd>
      </div>
      <div className="flex justify-between gap-4 py-2 text-sm">
        <dt className="text-[var(--text-muted)]">Monthly (est.)</dt>
        <dd className="currency-ngn font-semibold tabular-nums">{formatNaira(projections.monthly)}</dd>
      </div>
      <div className="flex justify-between gap-4 py-2 text-sm">
        <dt className="text-[var(--text-muted)]">Annual (est.)</dt>
        <dd className="currency-ngn font-semibold tabular-nums">{formatNaira(projections.annual)}</dd>
      </div>
    </dl>
  );
}
