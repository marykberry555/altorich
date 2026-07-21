"use client";

import { useMemo, useState } from "react";
import {
  calculateAnnualProjection,
  calculateDailyReturn,
  calculateMonthlyProjection,
  calculateWeeklyProjection,
  getAvailablePortfolios,
  getPortfolioByInvestmentAmount,
  getPortfolioBySlug,
  type PortfolioSlug
} from "@/config/investment-portfolios";
import { formatNaira } from "@/lib/domain";
import { PORTFOLIO_TERMS } from "@/lib/copy/portfolio-terminology";
import type { HomepageStatsConfig } from "@/lib/homepage/homepage-stats";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const CALCULATOR_DEFAULT = 100_000;

type Props = {
  config?: HomepageStatsConfig;
  className?: string;
};

function digitsOnly(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 12);
}

function withCommas(digits: string) {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toAmount(digits: string) {
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Homepage earnings calculator — rates follow the selected / matched portfolio
 * (5% / 6% / 7% / 8%), not a single platform flat rate.
 */
export function WealthGrowthExperience({ config, className }: Props) {
  const portfolios = getAvailablePortfolios();
  const [slug, setSlug] = useState<PortfolioSlug>("starter");
  const [amountDigits, setAmountDigits] = useState(() =>
    String(config?.calculatorMinInvestment ?? CALCULATOR_DEFAULT)
  );

  const amount = toAmount(amountDigits);
  const displayValue = withCommas(amountDigits);

  // Keep portfolio selection aligned with amount when the amount enters another band.
  const matched = amount > 0 ? getPortfolioByInvestmentAmount(amount) : undefined;
  const activeSlug = (matched?.slug ?? slug) as PortfolioSlug;
  const portfolio = getPortfolioBySlug(activeSlug);

  const projections = useMemo(
    () => ({
      daily: calculateDailyReturn(activeSlug, amount),
      weekly: calculateWeeklyProjection(activeSlug, amount),
      monthly: calculateMonthlyProjection(activeSlug, amount),
      threeMonth: calculateDailyReturn(activeSlug, amount) * 90,
      sixMonth: calculateDailyReturn(activeSlug, amount) * 180,
      annual: calculateAnnualProjection(activeSlug, amount)
    }),
    [activeSlug, amount]
  );

  const belowMin = Boolean(portfolio && amount > 0 && amount < portfolio.minimumInvestment);
  const aboveMax = Boolean(portfolio && amount > portfolio.maximumInvestment);

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-[var(--border)] bg-[var(--gray-50)] section-pad-sm",
        className
      )}
      aria-labelledby="earnings-calculator-heading"
    >
      <div className="container-ar relative">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-7">
          <h2
            id="earnings-calculator-heading"
            className="text-center text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl"
          >
            {config?.calculatorTitle ?? "Portfolio calculator"}
          </h2>
          <p className="mx-auto mt-2.5 max-w-lg text-center text-sm leading-relaxed text-[var(--text-muted)]">
            {config?.calculatorDescription ??
              "Select a portfolio and amount to preview earnings from published portfolio rates."}
          </p>

          <div className="mx-auto mt-5 grid max-w-lg gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                {PORTFOLIO_TERMS.selectedPortfolio}
              </span>
              <select
                className="field w-full"
                value={activeSlug}
                onChange={(e) => setSlug(e.target.value as PortfolioSlug)}
              >
                {portfolios.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.strategy} — {p.name} — {p.dailyReturnRate}%
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Investment Amount (₦)
              </span>
              <div
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-1 rounded-[var(--radius)]",
                  "border border-[var(--border-strong)] bg-[var(--surface)] px-4",
                  "transition focus-within:border-[var(--emerald)] focus-within:ring-2 focus-within:ring-[var(--emerald)]/25"
                )}
              >
                <span className="shrink-0 select-none text-lg font-semibold text-[var(--text-muted)]" aria-hidden>
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={displayValue}
                  onChange={(e) => setAmountDigits(digitsOnly(e.target.value))}
                  placeholder="100,000"
                  className="w-full bg-transparent text-center text-lg font-semibold tabular-nums outline-none"
                  aria-invalid={belowMin || aboveMax || undefined}
                />
              </div>
            </label>
          </div>

          {portfolio ? (
            <p className="mt-3 text-center text-xs font-medium text-[var(--emerald)]">
              {portfolio.dailyReturnRate}% daily return
            </p>
          ) : null}

          {belowMin || aboveMax ? (
            <p className="mt-2 text-center text-xs text-amber-800 dark:text-amber-300">
              {belowMin
                ? `Minimum for ${portfolio?.name} is ${formatNaira(portfolio!.minimumInvestment)}.`
                : `Maximum for ${portfolio?.name} is ${formatNaira(portfolio!.maximumInvestment)}.`}
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
            <ResultCard label="Today's Earnings" value={formatNaira(projections.daily)} />
            <ResultCard label="Weekly Earnings" value={formatNaira(projections.weekly)} />
            <ResultCard label="Monthly Projection" value={formatNaira(projections.monthly)} />
            <ResultCard label="3-Month Projection" value={formatNaira(projections.threeMonth)} />
            <ResultCard label="6-Month Projection" value={formatNaira(projections.sixMonth)} />
            <ResultCard label="Annual Projection" value={formatNaira(projections.annual)} />
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-[var(--text-subtle)]">
            {PORTFOLIO_TERMS.illustrativeOnly} Projections use the selected portfolio&apos;s published daily rate.
          </p>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="elevated" padding="sm" className="text-center transition-shadow duration-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">{label}</p>
      <p
        key={value}
        className="currency-ngn mt-1.5 animate-fade-in text-xl font-bold tabular-nums tracking-tight text-[var(--emerald)] sm:text-2xl"
      >
        {value}
      </p>
    </Card>
  );
}
