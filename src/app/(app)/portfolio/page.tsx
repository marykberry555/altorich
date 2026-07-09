import Link from "next/link";
import { DashboardSection, MetricStatCard, StatusBadge } from "@/components/design-system";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { EarningsTicker } from "@/components/roi/EarningsTicker";

export default async function PortfolioPage() {
  const user = await getSessionUser();
  const services = await getUserServices();
  const env = getPublicEnv();
  const roiEnabled = Boolean(env.NEXT_PUBLIC_ROI_MODE_ENABLED);

  const roiState = roiEnabled && user && services ? await services.roi.getState(user.id).catch(() => null) : null;
  const investments = !roiEnabled && user && services ? await services.investments.listUserInvestments(user.id) : [];
  const portfolio = !roiEnabled && user && services ? await services.investments.getPortfolioSummary(user.id) : null;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Portfolio</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">Your investments</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Live positions, earnings, and maturity dates.</p>
      </header>

      {roiEnabled ? (
        <DashboardSection title="Weekly ROI">
          {roiState?.activeInvestment ? (
            <Card variant="elevated" className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Active tier</p>
                <p className="mt-1 text-lg font-semibold text-[var(--heading)]">{roiState.activeInvestment.tier.name}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Principal:{" "}
                  <span className="font-semibold text-[var(--heading)]">{formatNaira(Number(roiState.activeInvestment.principal_ngn))}</span>
                </p>
              </div>
              <EarningsTicker
                principalNgn={Number(roiState.activeInvestment.principal_ngn)}
                weeklyRoiBps={Number(roiState.activeInvestment.tier.weekly_roi_bps)}
                cycleStartedAt={roiState.activeInvestment.cycle_started_at}
                cycleEndsAt={roiState.activeInvestment.cycle_ends_at}
              />
            </Card>
          ) : (
            <EmptyState
              title="No active weekly ROI investment"
              description="Choose a tier to start your weekly cycle and watch earnings tick live."
              action={
                <Link href="/packages">
                  <Button>Browse ROI tiers</Button>
                </Link>
              }
            />
          )}
        </DashboardSection>
      ) : (
        <DashboardSection title="Summary">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricStatCard title="Active" value={String(portfolio?.activeCount ?? 0)} accent="emerald" />
            <MetricStatCard title="Total invested" value={formatNaira(portfolio?.totalInvested ?? 0)} accent="navy" />
            <MetricStatCard title="Total earned" value={formatNaira(portfolio?.totalEarned ?? 0)} accent="gold" />
            <MetricStatCard title="Current value" value={formatNaira(portfolio?.currentValue ?? 0)} accent="sky" />
          </div>
        </DashboardSection>
      )}

      <div>
        {!roiEnabled && investments.length === 0 ? (
          <EmptyState
            title="No investments yet"
            description="Fund your wallet and purchase a plan to start your first cooperative cycle."
            action={
              <Link href="/packages">
                <Button>Browse investment plans</Button>
              </Link>
            }
          />
        ) : !roiEnabled ? (
          <Card variant="elevated">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-subtle)]">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Earned</th>
                  <th className="pb-3">Maturity</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => {
                  const plan = (inv as { investment_plans?: { name?: string } | null }).investment_plans;
                  return (
                    <tr key={inv.id} className="border-b border-[var(--border)]">
                      <td className="py-3">
                        <p className="font-medium">{inv.reference ?? inv.id.slice(0, 8)}</p>
                        <p className="text-xs text-[var(--text-subtle)]">{plan?.name ?? "Plan"}</p>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 tabular-nums">{formatNaira(Number(inv.amount))}</td>
                      <td className="py-3 tabular-nums text-[var(--emerald)]">{formatNaira(Number(inv.total_earned ?? 0))}</td>
                      <td className="py-3">{new Date(inv.ends_at).toLocaleDateString("en-NG")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
