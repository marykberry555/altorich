"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calendar, LineChart, TrendingUp, Wallet } from "lucide-react";
import type { PortfolioPlanCard } from "@/lib/packages/investment-catalog";
import {
  formatExpectedReturnSummary,
  formatPortfolioRange
} from "@/lib/packages/investment-catalog";
import { PORTFOLIO_TERMS } from "@/lib/copy/portfolio-terminology";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InvestFlowSheet } from "@/components/investment/InvestFlowSheet";
import { PortfolioBadge } from "@/components/portfolio/PortfolioBadge";
import { PortfolioHierarchy } from "@/components/portfolio/PortfolioHierarchy";
import { cn } from "@/lib/utils";

type Props = {
  card: PortfolioPlanCard;
  walletBalance: number;
  featured?: boolean;
};

export function InvestmentPortfolioCard({ card, walletBalance, featured }: Props) {
  const [open, setOpen] = useState(false);
  const accent = card.accentGradient;

  const returnSummary = useMemo(() => {
    if (!card.available) return null;
    return formatExpectedReturnSummary({
      slug: card.slug,
      weeklyRoiPercent: card.weeklyRoiPercent,
      minInvestment: card.minInvestment,
      payoutTiming: card.payoutTiming
    });
  }, [card]);

  return (
    <>
      <Card
        variant="elevated"
        className={cn(
          "group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
          featured && "ring-2 ring-[var(--emerald)]/35"
        )}
      >
        <div className={cn("h-1 w-full bg-gradient-to-r", accent)} aria-hidden />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <PortfolioHierarchy
              strategy={card.strategy}
              name={card.title}
              dailyReturnPercent={card.dailyReturnPercent}
              minNgn={card.minInvestment}
              maxNgn={card.maxInvestment}
              className="min-w-0 flex-1"
            />
            <PortfolioBadge slug={card.slug} />
          </div>

          <dl className="mt-5 flex-1 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[var(--text-muted)]">
                <Wallet size={15} aria-hidden />
                {PORTFOLIO_TERMS.investmentRange}
              </dt>
              <dd className="currency-ngn max-w-[58%] text-right text-xs font-semibold tabular-nums leading-snug text-[var(--heading)]">
                {card.available ? formatPortfolioRange(card.slug) : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[var(--text-muted)]">
                <TrendingUp size={15} aria-hidden />
                {PORTFOLIO_TERMS.dailyReturn}
              </dt>
              <dd className="font-semibold text-[var(--emerald)]">
                {card.available ? `${card.dailyReturnPercent}%` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[var(--text-muted)]">
                <Calendar size={15} aria-hidden />
                Settlement
              </dt>
              <dd className="max-w-[58%] text-right text-xs font-semibold leading-snug text-[var(--heading)]">
                {card.available ? card.payoutTiming : "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 border-t border-[var(--border)] pt-3">
              <dt className="flex items-center gap-2 text-[var(--text-muted)]">
                <LineChart size={15} aria-hidden />
                Projection
              </dt>
              <dd className="max-w-[58%] text-right text-xs font-medium leading-snug text-[var(--text-muted)]">
                {returnSummary ?? "—"}
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            className="mt-6 w-full gap-2"
            disabled={!card.available || !card.planId}
            onClick={() => setOpen(true)}
          >
            {PORTFOLIO_TERMS.allocateToPortfolio}
            <ArrowRight size={16} aria-hidden />
          </Button>
        </div>
      </Card>

      {card.planId ? (
        <InvestFlowSheet
          open={open}
          onClose={() => setOpen(false)}
          planId={card.planId}
          portfolioTitle={card.title}
          portfolioSlug={card.slug}
          strategy={card.strategy}
          minAmount={card.minInvestment}
          maxAmount={card.maxInvestment}
          payoutTiming={card.payoutTiming}
          walletBalance={walletBalance}
        />
      ) : null}
    </>
  );
}
