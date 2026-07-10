import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Clock,
  Layers,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicEnv } from "@/lib/env";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { formatNaira } from "@/lib/domain";
import type { AllocationPoint, ChartPoint } from "@/lib/dashboard/chart-data";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardWelcomeHero } from "@/components/dashboard/DashboardWelcomeHero";
import { PendingPackageBanner } from "@/components/dashboard/PendingPackageBanner";
import { LedgerTable } from "@/components/dashboard/LedgerTable";
import { BalanceHistoryChart, AllocationChart, EarningsTrendChart } from "@/components/dashboard/DashboardCharts";
import { DashboardPanelCard, DashboardSection, MetricStatCard } from "@/components/design-system";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EarningsTicker } from "@/components/roi/EarningsTicker";
import { PremiumPayoutCountdown } from "@/components/roi/PremiumPayoutCountdown";

async function DashboardContent() {
  const user = await getSessionUser();
  const services = await getUserServices();
  const env = getPublicEnv();
  const roiEnabled = Boolean(env.NEXT_PUBLIC_ROI_MODE_ENABLED);
  const dashboard = user && services ? await services.dashboard.getMemberDashboard(user.id) : null;
  const roiState =
    roiEnabled && user && services ? await services.roi.getState(user.id).catch(() => null) : null;

  const balance = dashboard?.balance ?? 0;
  const portfolio = dashboard?.portfolio;
  const preferredPackage = dashboard?.profile?.preferred_package_slug ?? null;
  const hasActiveInvestment = (dashboard?.activeInvestments ?? 0) > 0 || Boolean(roiState?.activeInvestment);

  let balanceHistory: ChartPoint[] = [];
  let earningsTrend: ChartPoint[] = [];
  let allocation: AllocationPoint[] = [];

  if (user && services) {
    const analytics = await services.analytics.getMemberAnalytics(user.id).catch(() => null);
    if (analytics) {
      balanceHistory = analytics.balanceHistory;
      earningsTrend = analytics.earningsTrend;
      allocation = analytics.allocation;
    }
  }

  return (
    <div className="space-y-8">
      {!isSupabaseConfigured() ? (
        <div className="rounded-[var(--radius)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Connect Supabase in <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-500/20">.env.local</code> to load live data.
        </div>
      ) : null}

      <DashboardWelcomeHero
        fullName={dashboard?.profile?.full_name ?? user?.email ?? "Member"}
        avatarUrl={dashboard?.profile?.avatar_url}
        preferredPackageSlug={preferredPackage}
        hasActiveInvestment={hasActiveInvestment}
      />

      {!hasActiveInvestment && preferredPackage ? (
        <PendingPackageBanner preferredPackageSlug={preferredPackage} />
      ) : null}

      <PremiumPayoutCountdown />

      <DashboardSection title="At a glance">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricStatCard
            title="Wallet balance"
            value={formatNaira(balance)}
            description="Available to invest or withdraw"
            icon={<Wallet />}
            href="/wallet"
            actionLabel="Open wallet"
            accent="emerald"
          />
          <MetricStatCard
            title="Total investments"
            value={formatNaira(portfolio?.totalInvested ?? 0)}
            description={`${portfolio?.activeCount ?? 0} active · ${portfolio?.completedCount ?? 0} completed`}
            icon={<Layers />}
            href="/portfolio"
            actionLabel="View portfolio"
            accent="navy"
          />
          <MetricStatCard
            title="Active investment"
            value={String(dashboard?.activeInvestments ?? 0)}
            description={hasActiveInvestment ? "Earning this cycle" : "Fund a plan to start"}
            icon={<TrendingUp />}
            href="/packages"
            actionLabel="Browse packages"
            accent="sky"
          />
          <MetricStatCard
            title="Pending withdrawals"
            value={String(dashboard?.pendingWithdrawals ?? 0)}
            description={`${formatNaira(dashboard?.pendingDeposits ?? 0)} deposits pending`}
            icon={<Clock />}
            href="/withdrawals"
            actionLabel="Track payouts"
            accent="amber"
          />
        </div>
      </DashboardSection>

      {roiEnabled && roiState?.activeInvestment ? (
        <DashboardSection title="Investment progress">
          <Card variant="elevated" className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Active tier</p>
              <p className="mt-1 text-lg font-semibold text-[var(--heading)]">{roiState.activeInvestment.tier.name}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Principal{" "}
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

      <DashboardSection title="Cash flow">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricStatCard
            title="Portfolio value"
            value={formatNaira(portfolio?.currentValue ?? 0)}
            icon={<TrendingUp />}
            href="/portfolio"
            accent="emerald"
          />
          <MetricStatCard
            title="Total earned"
            value={formatNaira(portfolio?.totalEarned ?? 0)}
            icon={<ArrowDownLeft />}
            href="/portfolio"
            accent="gold"
          />
          <MetricStatCard
            title="Referrals"
            value={String(dashboard?.referralCount ?? 0)}
            icon={<Users />}
            href="/team"
            accent="sky"
          />
          <MetricStatCard
            title="Unread alerts"
            value={String(dashboard?.unreadNotifications ?? 0)}
            icon={<Bell />}
            href="/notifications"
            accent="slate"
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Performance">
        <div className="grid gap-6 lg:grid-cols-2">
          <BalanceHistoryChart data={balanceHistory} href="/wallet" />
          <EarningsTrendChart data={earningsTrend} href="/portfolio" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <AllocationChart data={allocation} href="/portfolio" />
          <DashboardPanelCard title="Upcoming maturities" href="/portfolio" viewLabel="View portfolio" accent="gold">
            {(dashboard?.upcomingMaturities.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No active cycles maturing soon.</p>
            ) : (
              <ul className="space-y-2">
                {dashboard!.upcomingMaturities.map((m) => (
                  <li key={m.id} className="flex justify-between text-sm">
                    <span className="font-medium">{m.reference ?? m.id.slice(0, 8)}</span>
                    <span className="text-[var(--text-muted)]">{new Date(m.ends_at).toLocaleDateString("en-NG")}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanelCard>
        </div>
      </DashboardSection>

      <DashboardSection title="Recent activity">
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanelCard title="Ledger" href="/wallet" viewLabel="Full wallet history" accent="emerald">
            {(dashboard?.recentTransactions.length ?? 0) === 0 ? (
              <EmptyState title="No transactions yet" description="Fund your wallet to see ledger entries here." />
            ) : (
              <LedgerTable
                compact
                rows={dashboard!.recentTransactions.map((t) => ({
                  id: t.id,
                  type: t.type,
                  amount: Number(t.amount),
                  reason: t.reason,
                  created_at: t.created_at,
                  status: t.status
                }))}
              />
            )}
          </DashboardPanelCard>

          <DashboardPanelCard title="Recent earnings" href="/portfolio" viewLabel="View portfolio" accent="gold">
            {(dashboard?.recentEarnings.length ?? 0) === 0 ? (
              <EmptyState title="No settlements yet" description="Earnings appear when cooperative settlements are posted." />
            ) : (
              <ul className="space-y-2">
                {dashboard!.recentEarnings.map((e, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">{new Date(e.created_at).toLocaleDateString("en-NG")}</span>
                    <span className="font-semibold text-[var(--emerald)]">+{formatNaira(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanelCard>
        </div>
      </DashboardSection>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Quick actions</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Fund, invest, or withdraw — everything in one tap.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/deposits">
            <Button variant="outline" size="sm">
              Fund wallet <ArrowRight size={14} />
            </Button>
          </Link>
          <Link href="/packages">
            <Button variant="outline" size="sm">
              Invest <ArrowRight size={14} />
            </Button>
          </Link>
          <Link href="/withdrawals">
            <Button variant="outline" size="sm">
              Withdraw <ArrowUpRight size={14} />
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              Change package
            </Button>
          </Link>
          <Link href="/notifications">
            <Button variant="outline" size="sm">
              Alerts ({dashboard?.unreadNotifications ?? 0})
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
