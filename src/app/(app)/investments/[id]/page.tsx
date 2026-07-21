import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { mapInvestmentRows } from "@/lib/investment/mappers";
import { formatSettlementLabel } from "@/lib/packages/investment-catalog";
import { formatNaira } from "@/lib/domain";
import { InvestmentAccrualPanel } from "@/components/investment/InvestmentAccrualPanel";
import { InvestmentStopPanel } from "@/components/investment/InvestmentStopPanel";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";
import { getPortfolioBySlug, isPortfolioSlug, resolveWeeklyRoiBps } from "@/config/investment-portfolios";
import { PORTFOLIO_TERMS, formatInvestmentRange } from "@/lib/copy/portfolio-terminology";
import { StatusBadge } from "@/components/design-system";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvestmentDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  const services = await getUserServices();

  if (!user || !services) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <EmptyState
          title="Sign in required"
          description="Sign in to view investment details."
          action={
            <Link href="/auth/login">
              <Button>Sign in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { data: investment, error: investmentError } = await services.supabase
    .from("investments")
    .select("*, investment_plans(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (investmentError || !investment) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <EmptyState
          title="Investment not found"
          description="This investment may have been removed or you may not have access to it."
          action={
            <Link href="/portfolio">
              <Button variant="outline">Back to portfolio</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const settlements = await services.settlements.listForInvestment(id).catch(() => []);
  const paidSettlements = settlements.filter((s) => s.status === "paid");
  const lastPaid = paidSettlements.reduce<string | null>((max, s) => {
    if (!s.settled_at) return max;
    return !max || s.settled_at > max ? s.settled_at : max;
  }, null);

  const rows = mapInvestmentRows([investment as Parameters<typeof mapInvestmentRows>[0][0]], settlements);
  const row = rows[0];
  const plan = (investment as { investment_plans?: { name?: string; tier?: string } | null }).investment_plans;
  const portfolio = plan?.tier && isPortfolioSlug(plan.tier) ? getPortfolioBySlug(plan.tier) : undefined;
  const weeklyRoiPercent = portfolio?.weeklyProjectionRate ?? resolveWeeklyRoiBps({
    slug: portfolio?.slug,
    weeklyRoiBps: row.weeklyRoiBps,
    amountNgn: Number(investment.amount)
  }) / 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/portfolio">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft size={14} /> Portfolio
          </Button>
        </Link>
        <Badge variant="outline">{plan?.name ?? "Investment"}</Badge>
        <StatusBadge status={investment.status} />
      </div>

      <header>
        <p className="font-mono text-xs text-[var(--text-subtle)]">{investment.reference ?? investment.id}</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">Portfolio allocation details</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {plan?.name ?? "Investment"} · {portfolio?.strategy ?? "Published portfolio terms"}
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {portfolio ? (
          <Card variant="elevated" padding="md" className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-[var(--text-subtle)]">{PORTFOLIO_TERMS.primaryStrategy}</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--heading)]">{portfolio.strategy}</dd>
            <p className="mt-1 text-sm font-medium text-[var(--heading)]">{portfolio.name}</p>
            <p className="mt-2 text-sm font-medium text-[var(--emerald)]">
              {portfolio.dailyReturnRate}% daily return ·{" "}
              {formatInvestmentRange(portfolio.minimumInvestment, portfolio.maximumInvestment, formatNaira)}
            </p>
          </Card>
        ) : (
          <Card variant="elevated" padding="md">
            <dt className="text-xs text-[var(--text-subtle)]">{PORTFOLIO_TERMS.selectedPortfolio}</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--heading)]">{plan?.name ?? "Investment"}</dd>
          </Card>
        )}
        <Card variant="elevated" padding="md">
          <dt className="text-xs text-[var(--text-subtle)]">Principal</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{formatNaira(Number(investment.amount))}</dd>
        </Card>
        <Card variant="elevated" padding="md">
          <dt className="text-xs text-[var(--text-subtle)]">Investment Date</dt>
          <dd className="mt-1 font-medium">{new Date(investment.started_at).toLocaleString("en-NG")}</dd>
        </Card>
        <Card variant="elevated" padding="md">
          <dt className="text-xs text-[var(--text-subtle)]">{PORTFOLIO_TERMS.dailyReturn}</dt>
          <dd className="mt-1 font-semibold text-[var(--emerald)]">
            {portfolio ? `${portfolio.dailyReturnRate}%` : "—"}
          </dd>
        </Card>
        {portfolio ? (
          <Card variant="elevated" padding="md">
            <dt className="text-xs text-[var(--text-subtle)]">{PORTFOLIO_TERMS.investmentRange}</dt>
            <dd className="currency-ngn mt-1 text-sm font-semibold tabular-nums">
              {formatInvestmentRange(portfolio.minimumInvestment, portfolio.maximumInvestment, formatNaira)}
            </dd>
          </Card>
        ) : null}
        <Card variant="elevated" padding="md">
          <dt className="text-xs text-[var(--text-subtle)]">{PLATFORM_EARNING.settlementScheduleLabel}</dt>
          <dd className="mt-1 font-medium">{formatSettlementLabel(row.settlementFrequency)}</dd>
        </Card>
        <Card variant="elevated" padding="md">
          <dt className="text-xs text-[var(--text-subtle)]">Status</dt>
          <dd className="mt-1">
            <StatusBadge status={investment.status} />
          </dd>
        </Card>
      </dl>

      <InvestmentAccrualPanel row={row} />

      <InvestmentStopPanel
        investmentId={investment.id}
        status={investment.status}
        stopRequestedAt={(investment as { stop_requested_at?: string | null }).stop_requested_at ?? null}
        amount={Number(investment.amount)}
        totalEarned={Number(investment.total_earned ?? 0)}
        weeklyRoiPercent={weeklyRoiPercent}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Credited earnings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">
            {formatNaira(Number(investment.total_earned ?? 0))}
          </p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Current cycle ends</p>
          <p className="mt-1 text-lg font-semibold">{new Date(investment.ends_at).toLocaleString("en-NG")}</p>
        </Card>
      </div>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Settlement history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-subtle)]">
                <th className="pb-2">Scheduled</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-[var(--text-subtle)]">
                    No settlements scheduled yet
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)]">
                    <td className="py-3">{new Date(s.scheduled_for).toLocaleDateString("en-NG")}</td>
                    <td className="py-3 tabular-nums font-medium">{formatNaira(Number(s.amount))}</td>
                    <td className="py-3">
                      <StatusBadge status={s.status === "paid" ? "completed" : s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
