"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calendar, TrendingUp, Wallet } from "lucide-react";
import type { PackagePlanCard } from "@/lib/packages/investment-catalog";
import { formatExpectedReturnSummary } from "@/lib/packages/investment-catalog";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InvestFlowSheet } from "@/components/investment/InvestFlowSheet";
import { cn } from "@/lib/utils";

type Props = {
  card: PackagePlanCard;
  walletBalance: number;
  featured?: boolean;
};

export function InvestmentPackageCard({ card, walletBalance, featured }: Props) {
  const [open, setOpen] = useState(false);
  const accent = card.accentGradient;

  const returnSummary = useMemo(() => {
    if (!card.available) return null;
    return formatExpectedReturnSummary({
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
          <h3 className="text-lg font-bold tracking-tight text-[var(--heading)]">{card.title}</h3>
          {card.keyBenefits.length ? (
            <ul className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
              {card.keyBenefits.slice(0, 2).map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[var(--emerald)]" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>
          ) : null}

          <dl className="mt-5 flex-1 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[var(--text-muted)]">
                <Wallet size={15} aria-hidden />
                Minimum Entry
              </dt>
              <dd className="currency-ngn text-right text-xs font-semibold tabular-nums text-[var(--heading)]">
                {card.available ? formatNaira(card.minInvestment) : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[var(--text-muted)]">
                <TrendingUp size={15} aria-hidden />
                Platform Earning Model
              </dt>
              <dd className="font-semibold text-[var(--emerald)]">
                {card.available ? `${card.dailyReturnPercent}% daily` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[var(--text-muted)]">
                <Calendar size={15} aria-hidden />
                Withdrawal
              </dt>
              <dd className="max-w-[58%] text-right text-xs font-semibold leading-snug text-[var(--heading)]">
                {card.available ? card.payoutTiming : "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 border-t border-[var(--border)] pt-3">
              <dt className="text-[var(--text-muted)]">Returns</dt>
              <dd className="max-w-[58%] text-right text-xs font-medium leading-snug text-[var(--emerald)]">
                {returnSummary ?? "Guaranteed"}
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            className="mt-6 w-full gap-2"
            disabled={!card.available || !card.planId}
            onClick={() => setOpen(true)}
          >
            Invest now
            <ArrowRight size={16} aria-hidden />
          </Button>
        </div>
      </Card>

      {card.planId ? (
        <InvestFlowSheet
          open={open}
          onClose={() => setOpen(false)}
          planId={card.planId}
          packageTitle={card.title}
          minAmount={card.minInvestment}
          payoutTiming={card.payoutTiming}
          walletBalance={walletBalance}
        />
      ) : null}
    </>
  );
}
