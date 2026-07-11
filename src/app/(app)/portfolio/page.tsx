import Link from "next/link";
import { DashboardSection, MetricStatCard } from "@/components/design-system";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/design-system";
import { formatNaira } from "@/lib/domain";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { fetchInvestmentContext } from "@/lib/investment/mappers";
import { LivePortfolioPanel } from "@/components/investment/LivePortfolioPanel";
import { ActiveInvestmentsList } from "@/components/investment/ActiveInvestmentCard";
import { AllocationChart, EarningsTrendChart, BalanceHistoryChart } from "@/components/dashboard/DashboardCharts";
import { EarningsTicker } from "@/components/roi/EarningsTicker";

export default async function PortfolioPage() {
  const user = await getSessionUser();
  const services = await getUserServices();
  const env = getPublicEnv();
  const roiEnabled = Boolean(env.NEXT_PUBLIC_ROI_MODE_ENABLED);

  const investCtx = user && services ? await fetchInvestmentContext(services, user.id) : null;
  const portfolio = user && services ? await services.investments.getPortfolioSummary(user.id) : null;
  const roiState =
    roiEnabled && user && services ? await services.roi.getState(user.id).catch(() => null) : null;

  const hasRoiInvestment = Boolean(roiState?.activeInvestment);
  const hasPlanInvestments = (investCtx?.investments.length ?? 0) > 0;
  const hasActivePlans = investCtx?.rows.some((r) => ["active", "stopping"].includes(r.status)) ?? false;

  let balanceHistory: { date: string; value: number }[] = [];
  let earningsTrend: { date: string; value: number }[] = [];
  let allocation: { name: string; value: number }[] = [];

  if (user && services) {
    const analytics = await services.analytics.getMemberAnalytics(user.id).catch(() => null);
    if (analytics) {
      balanceHistory = analytics.balanceHistory;
      earningsTrend = analytics.earningsTrend;
      allocation = analytics.allocation;
    }
  }

  if (investCtx?.rows.length) {
    const byPlan = new Map<string, number>();
    for (const row of investCtx.rows.filter((r) => r.status === "active" || r.status === "stopping")) {
      byPlan.set(row.planName, (byPlan.get(row.planName) ?? 0) + row.amount);
    }
    const planAllocation = Array.from(byPlan.entries()).map(([name, value]) => ({ name, value }));
    if (planAllocation.length > 0) allocation = planAllocation;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Portfolio</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">Investment overview</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Track positions, live earnings, and settlement history.</p>
        </div>
        <Link href="/investments">
          <Button size="sm">Invest now</Button>
        </Link>
      </header>

      {roiEnabled && hasRoiInvestment && roiState?.activeInvestment ? (
        <DashboardSection title="Weekly ROI">
          <Card variant="elevated" className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Active tier</p>
              <p className="mt-1 text-lg font-semibold text-[var(--heading)]">{roiState.activeInvestment.tier.name}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Principal:{" "}
                <span className="font-semibold text-[var(--heading)]">
                  {formatNaira(Number(roiState.activeInvestment.principal_ngn))}
                </span>
              </p>
            </div>
            <EarningsTicker
              principalNgn={Number(roiState.activeInvestment.principal_ngn)}
              weeklyRoiBps={Number(roiState.activeInvestment.tier.weekly_roi_bps)}
              cycleStartedAt={roiState.activeInvestment.cycle_started_at}
              cycleEndsAt={roiState.activeInvestment.cycle_ends_at}
            />
          </Card>
        </DashboardSection>
      ) : null}

      {hasPlanInvestments || hasActivePlans ? (
        <>
          {investCtx ? <LivePortfolioPanel walletBalance={investCtx.balance} investments={investCtx.liveInputs} /> : null}

          <DashboardSection title="Portfolio summary">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricStatCard title="Active" value={String(portfolio?.activeCount ?? 0)} accent="emerald" />
              <MetricStatCard title="Total invested" value={formatNaira(portfolio?.totalInvested ?? 0)} accent="navy" />
              <MetricStatCard title="Total earned" value={formatNaira(portfolio?.totalEarned ?? 0)} accent="gold" />
              <MetricStatCard title="Portfolio value" value={formatNaira(portfolio?.currentValue ?? 0)} accent="sky" />
            </div>
          </DashboardSection>

          <DashboardSection title="Performance">
            <div className="grid gap-6 lg:grid-cols-2">
              <BalanceHistoryChart data={balanceHistory} href="/wallet" />
              <EarningsTrendChart data={earningsTrend} />
            </div>
            <div className="mt-6">
              <AllocationChart data={allocation} title="Package distribution" />
            </div>
          </DashboardSection>

          {investCtx ? <ActiveInvestmentsList investments={investCtx.rows} /> : null}

          <DashboardSection title="Upcoming settlements">
            {(portfolio?.upcomingMaturities.length ?? 0) === 0 ? (
              <Card variant="elevated" padding="md">
                <p className="text-sm text-[var(--text-muted)]">No maturities scheduled in the near term.</p>
              </Card>
            ) : (
              <Card variant="elevated" padding="md">
                <ul className="space-y-3">
                  {portfolio!.upcomingMaturities.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{m.reference ?? m.id.slice(0, 8)}</span>
                      <span className="text-[var(--text-muted)]">
                        {formatNaira(m.amount)} · {new Date(m.ends_at).toLocaleDateString("en-NG")}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </DashboardSection>

          <DashboardSection title="All investments">
            {!investCtx || investCtx.investments.length === 0 ? (
              <EmptyState
                title="No investments yet"
                description="Fund your wallet and purchase a plan to start your first cycle."
                action={
                  <Link href="/investments">
                    <Button>Browse packages</Button>
                  </Link>
                }
              />
            ) : (
              <Card variant="elevated">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-subtle)]">
                        <th className="px-4 pb-3">Reference</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Earned</th>
                        <th className="pb-3">Maturity</th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {investCtx.investments.map((inv) => {
                        const plan = (inv as { investment_plans?: { name?: string } | null }).investment_plans;
                        return (
                          <tr key={inv.id} className="border-b border-[var(--border)]">
                            <td className="px-4 py-3">
                              <p className="font-medium">{inv.reference ?? inv.id.slice(0, 8)}</p>
                              <p className="text-xs text-[var(--text-subtle)]">{plan?.name ?? "Plan"}</p>
                            </td>
                            <td className="py-3">
                              <StatusBadge status={inv.status} />
                            </td>
                            <td className="py-3 tabular-nums">{formatNaira(Number(inv.amount))}</td>
                            <td className="py-3 tabular-nums text-[var(--emerald)]">
                              {formatNaira(Number(inv.total_earned ?? 0))}
                            </td>
                            <td className="py-3">{new Date(inv.ends_at).toLocaleDateString("en-NG")}</td>
                            <td className="py-3">
                              <Link href={`/investments/${inv.id}`} className="text-xs font-semibold text-[var(--emerald)]">
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </DashboardSection>
        </>
      ) : !hasRoiInvestment ? (
        <EmptyState
          title="No investments yet"
          description="Fund your wallet and choose a package to start earning."
          action={
            <Link href="/investments">
              <Button>Browse packages</Button>
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
