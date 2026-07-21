"use client";

import { useMemo, useState } from "react";
import {
  calculateAnnualProjection,
  calculateDailyReturn,
  calculateMonthlyProjection,
  calculateSixMonthProjection,
  calculateThreeMonthProjection,
  calculateWeeklyProjection,
  getAvailablePortfolios,
  getPortfolioBySlug,
  type PortfolioSlug
} from "@/config/investment-portfolios";
import { formatNaira } from "@/lib/domain";
import { PORTFOLIO_TERMS, formatInvestmentRange } from "@/lib/copy/portfolio-terminology";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

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

type Props = {
  className?: string;
  defaultSlug?: PortfolioSlug;
  defaultAmount?: number;
};

/** Portfolio-aware earnings calculator — all values from centralized config. */
export function PortfolioCalculator({
  className,
  defaultSlug = "starter",
  defaultAmount = 100_000
}: Props) {
  const portfolios = getAvailablePortfolios();
  const [slug, setSlug] = useState<PortfolioSlug>(defaultSlug);
  const [amountDigits, setAmountDigits] = useState(String(defaultAmount));

  const portfolio = getPortfolioBySlug(slug);
  const amount = toAmount(amountDigits);
  const displayValue = withCommas(amountDigits);

  const validation = useMemo(() => {
    if (!portfolio || amount <= 0) return { ok: true as const, message: null };
    if (amount < portfolio.minimumInvestment) {
      return {
        ok: false as const,
        message: `Minimum for ${portfolio.name} is ${formatNaira(portfolio.minimumInvestment)}.`
      };
    }
    if (amount > portfolio.maximumInvestment) {
      return {
        ok: false as const,
        message: `Maximum for ${portfolio.name} is ${formatNaira(portfolio.maximumInvestment)}.`
      };
    }
    return { ok: true as const, message: null };
  }, [portfolio, amount]);

  const projections = useMemo(
    () => ({
      daily: calculateDailyReturn(slug, amount),
      weekly: calculateWeeklyProjection(slug, amount),
      monthly: calculateMonthlyProjection(slug, amount),
      threeMonth: calculateThreeMonthProjection(slug, amount),
      sixMonth: calculateSixMonthProjection(slug, amount),
      annual: calculateAnnualProjection(slug, amount)
    }),
    [slug, amount]
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-[var(--border)] bg-[var(--gray-50)] section-pad",
        className
      )}
      aria-labelledby="portfolio-calculator-heading"
    >
      <div className="container-ar relative">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
              Portfolio calculator
            </p>
            <h2
              id="portfolio-calculator-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl"
            >
              Preview your allocation
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
              Select a portfolio and amount to see illustrative earnings based on published portfolio parameters.
            </p>
          </div>

          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                  {PORTFOLIO_TERMS.selectedPortfolio}
                </span>
                <select
                  className="field w-full"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value as PortfolioSlug)}
                >
                  {portfolios.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.strategy} — {p.name} — {p.dailyReturnRate}% daily
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                  {PORTFOLIO_TERMS.investmentAmount} (₦)
                </span>
                <div className="flex h-12 items-center gap-1 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface)] px-3">
                  <span className="text-[var(--text-muted)]" aria-hidden>
                    ₦
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={displayValue}
                    onChange={(e) => setAmountDigits(digitsOnly(e.target.value))}
                    className="w-full bg-transparent text-lg font-semibold tabular-nums outline-none"
                  />
                </div>
              </label>
            </div>

            {portfolio ? (
              <dl className="mt-5 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-50)] p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--text-subtle)]">{PORTFOLIO_TERMS.primaryStrategy}</dt>
                  <dd className="mt-0.5 font-medium text-[var(--heading)]">{portfolio.strategy}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-subtle)]">{PORTFOLIO_TERMS.investmentRange}</dt>
                  <dd className="currency-ngn mt-0.5 font-medium tabular-nums text-[var(--heading)]">
                    {formatInvestmentRange(
                      portfolio.minimumInvestment,
                      portfolio.maximumInvestment,
                      formatNaira
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-subtle)]">{PORTFOLIO_TERMS.dailyReturn}</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--emerald)]">{portfolio.dailyReturnRate}%</dd>
                </div>
              </dl>
            ) : null}

            {!validation.ok && validation.message ? (
              <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">{validation.message}</p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ProjectionCard label={PORTFOLIO_TERMS.dailyEarnings} value={projections.daily} />
              <ProjectionCard label={PORTFOLIO_TERMS.weeklyProjection} value={projections.weekly} />
              <ProjectionCard label={PORTFOLIO_TERMS.monthlyProjection} value={projections.monthly} />
              <ProjectionCard label={PORTFOLIO_TERMS.threeMonthProjection} value={projections.threeMonth} />
              <ProjectionCard label={PORTFOLIO_TERMS.sixMonthProjection} value={projections.sixMonth} />
              <ProjectionCard label={PORTFOLIO_TERMS.annualProjection} value={projections.annual} />
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-[var(--text-subtle)]">
              {PORTFOLIO_TERMS.illustrativeOnly} Review portfolio terms before allocating.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectionCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="elevated" padding="sm" className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-subtle)]">{label}</p>
      <p className="currency-ngn mt-1.5 text-lg font-bold tabular-nums text-[var(--heading)]">
        {formatNaira(value)}
      </p>
    </Card>
  );
}
