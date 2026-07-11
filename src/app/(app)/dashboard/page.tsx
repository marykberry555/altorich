import { Suspense } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicEnv } from "@/lib/env";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { formatNaira } from "@/lib/domain";
import type { AllocationPoint, ChartPoint } from "@/lib/dashboard/chart-data";
import { COMPANY } from "@/lib/company";
import { DEFAULT_REFERRAL_PROGRAM } from "@/lib/referral/config";
import { resolveNextAction } from "@/lib/dashboard/conversion";
import { buildActionHints, toConversionState } from "@/lib/dashboard/conversion-hints";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardCyclePanel } from "@/components/dashboard/DashboardCyclePanel";
import { DashboardWealthHero, DashboardWealthHeroStatic } from "@/components/dashboard/DashboardWealthHero";
import { DashboardNextStepCard } from "@/components/dashboard/DashboardNextStepCard";
import { DashboardProgressJourney } from "@/components/dashboard/DashboardProgressJourney";
import { DashboardEarningsPreview } from "@/components/dashboard/DashboardEarningsPreview";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardPortfolioSection } from "@/components/dashboard/DashboardPortfolioSection";
import { DashboardReferralStrip } from "@/components/dashboard/DashboardReferralStrip";
import { DashboardNotificationsPreview, filterActionableNotifications } from "@/components/dashboard/DashboardNotificationsPreview";
import { LedgerTable } from "@/components/dashboard/LedgerTable";
import { BalanceHistoryChart, AllocationChart } from "@/components/dashboard/DashboardCharts";
import { DashboardPanelCard, DashboardSection } from "@/components/design-system";
import type { PackageSlug } from "@/content/packages";

import { fetchInvestmentContext } from "@/lib/investment/mappers";

async function DashboardContent() {
  const user = await getSessionUser();
  const services = await getUserServices();
  const env = getPublicEnv();
  const roiEnabled = Boolean(env.NEXT_PUBLIC_ROI_MODE_ENABLED);
  const dashboard =
    user && services
      ? await services.dashboard.getMemberDashboard(user.id).catch(() => null)
      : null;
  const roiState =
    roiEnabled && user && services ? await services.roi.getState(user.id).catch(() => null) : null;
  const investCtx = user && services ? await fetchInvestmentContext(services, user.id) : null;
  const hasActivePlanInvestments =
    investCtx?.rows.some((r) => r.status === "active" || r.status === "stopping") ?? false;
  const showPlanInvestmentUi = Boolean(investCtx) && (!roiEnabled || !roiState?.activeInvestment || hasActivePlanInvestments);

  const balance = dashboard?.balance ?? 0;
  const portfolio = dashboard?.portfolio;
  const preferredPackage = dashboard?.profile?.preferred_package_slug ?? null;
  const hasActiveInvestment = (dashboard?.activeInvestments ?? 0) > 0 || Boolean(roiState?.activeInvestment);
  const fullName = dashboard?.profile?.full_name ?? user?.email ?? "Member";
  const avatarUrl = dashboard?.profile?.avatar_url;

  const conversionState = toConversionState({
    balance,
    pendingDeposits: dashboard?.pendingDeposits ?? 0,
    pendingWithdrawals: dashboard?.pendingWithdrawals ?? 0,
    hasActiveInvestment,
    totalEarned: portfolio?.totalEarned ?? 0,
    preferredPackageSlug: preferredPackage
  });

  const nextAction = resolveNextAction(conversionState);

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

  let referralStrip = {
    vipLabel: "Starter",
    commissionRate: DEFAULT_REFERRAL_PROGRAM.commission_by_package.starter,
    verifiedCount: 0,
    referralCount: dashboard?.referralCount ?? 0,
    nextTier: null as import("@/lib/referral/types").VipLevelConfig | null
  };

  if (user && services) {
    try {
      const [refDashboard, vipLevels] = await Promise.all([
        services.referrals.getDashboard(user.id, COMPANY.siteUrl),
        services.referrals.listVipLevels()
      ]);
      referralStrip = {
        vipLabel: refDashboard.vipLabel,
        commissionRate: refDashboard.currentCommissionRate,
        verifiedCount: refDashboard.verifiedInvestors,
        referralCount: refDashboard.totalReferrals,
        nextTier: refDashboard.nextVipLevel ?? vipLevels.find((v) => v.level === refDashboard.vipLevel + 1) ?? null
      };
    } catch {
      // Referral module may be unavailable before migration
    }
  }

  const dbNotifications =
    user && services ? await services.notifications.listForUser(user.id, 8).catch(() => []) : [];

  const mappedNotifications = dbNotifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    created_at: n.created_at,
    read_at: n.read_at
  }));

  const actionableNotifications = filterActionableNotifications(mappedNotifications);
  const notificationRows =
    actionableNotifications.length > 0 ? actionableNotifications : buildActionHints(conversionState);

  const showCharts = balanceHistory.length > 0 || allocation.length > 0 || hasActiveInvestment;

  return (
    <div className="space-y-8 pb-4">
      {!isSupabaseConfigured() && process.env.NODE_ENV !== "production" ? (
        <div className="rounded-[var(--radius)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Connect Supabase in <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-500/20">.env.local</code> to load live data.
        </div>
      ) : null}

      <DashboardSection className="space-y-5">
        {showPlanInvestmentUi && investCtx ? (
          <DashboardWealthHero
            fullName={fullName}
            avatarUrl={avatarUrl}
            preferredPackageSlug={preferredPackage}
            hasActiveInvestment={hasActiveInvestment}
            walletBalance={investCtx.balance}
            liveInputs={investCtx.liveInputs}
            totalInvested={portfolio?.totalInvested ?? 0}
            totalEarned={portfolio?.totalEarned ?? 0}
          />
        ) : (
          <DashboardWealthHeroStatic
            fullName={fullName}
            avatarUrl={avatarUrl}
            preferredPackageSlug={preferredPackage}
            hasActiveInvestment={hasActiveInvestment}
            walletBalance={balance}
            portfolioValue={portfolio?.currentValue ?? balance}
            totalInvested={portfolio?.totalInvested ?? 0}
            totalEarned={portfolio?.totalEarned ?? 0}
          />
        )}

        <DashboardNextStepCard action={nextAction} />
        <DashboardProgressJourney state={conversionState} />
      </DashboardSection>

      {!hasActiveInvestment ? (
        <DashboardSection>
          <DashboardEarningsPreview preferredPackageSlug={preferredPackage as PackageSlug | null} />
        </DashboardSection>
      ) : null}

      {roiEnabled && roiState?.activeInvestment ? (
        <DashboardCyclePanel
          fullName={fullName}
          avatarUrl={avatarUrl}
          preferredPackageSlug={preferredPackage}
          hasActiveInvestment={hasActiveInvestment}
          roi={{
            principalNgn: Number(roiState.activeInvestment.principal_ngn),
            weeklyRoiBps: Number(roiState.activeInvestment.tier.weekly_roi_bps),
            cycleStartedAt: roiState.activeInvestment.cycle_started_at,
            cycleEndsAt: roiState.activeInvestment.cycle_ends_at,
            tierName: roiState.activeInvestment.tier.name
          }}
        />
      ) : null}

      <DashboardSection title="Quick actions">
        <DashboardQuickActions />
      </DashboardSection>

      {showPlanInvestmentUi && investCtx ? (
        <DashboardPortfolioSection
          liveInputs={investCtx.liveInputs}
          rows={investCtx.rows}
          earningsTrend={earningsTrend}
          totalInvested={portfolio?.totalInvested ?? 0}
          totalEarned={portfolio?.totalEarned ?? 0}
        />
      ) : null}

      <DashboardSection title="Referrals">
        <DashboardReferralStrip
          vipLabel={referralStrip.vipLabel}
          commissionRate={referralStrip.commissionRate}
          verifiedCount={referralStrip.verifiedCount}
          referralCount={referralStrip.referralCount}
          nextTier={referralStrip.nextTier}
        />
      </DashboardSection>

      <DashboardSection title="Recent activity">
        <DashboardPanelCard title="Account activity" href="/wallet" viewLabel="Full wallet history" accent="emerald">
          {(dashboard?.recentTransactions.length ?? 0) === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-[var(--heading)]">Your account activity will appear here once you begin investing.</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Funding, investments, and payouts will show in this feed.</p>
            </div>
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
      </DashboardSection>

      {showCharts ? (
        <DashboardSection title="Performance">
          <div className="grid gap-6 lg:grid-cols-2">
            <BalanceHistoryChart data={balanceHistory} href="/wallet" />
            <AllocationChart data={allocation} href="/portfolio" title="Asset allocation" />
          </div>
        </DashboardSection>
      ) : null}

      {hasActiveInvestment ? (
        <DashboardSection title="Upcoming settlements">
          <DashboardPanelCard title="Next maturities" href="/portfolio" viewLabel="Open portfolio" accent="gold">
            {(dashboard?.upcomingMaturities.length ?? 0) === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-[var(--heading)]">Settlement history becomes available after your first payout.</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Maturity dates for active investments will appear here.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {dashboard!.upcomingMaturities.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/40 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-[var(--heading)]">{m.reference ?? m.id.slice(0, 8)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatNaira(m.amount)} invested</p>
                    </div>
                    <span className="font-medium tabular-nums text-[var(--text-muted)]">
                      {new Date(m.ends_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanelCard>
        </DashboardSection>
      ) : null}

      <DashboardSection title="Alerts">
        <DashboardNotificationsPreview
          notifications={notificationRows}
          unreadCount={dashboard?.unreadNotifications ?? 0}
        />
      </DashboardSection>
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
