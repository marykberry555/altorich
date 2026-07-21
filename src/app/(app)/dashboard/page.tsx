import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KnowledgeArticleCard } from "@/components/knowledge/KnowledgeArticleCard";
import { getPopularArticles } from "@/content/knowledge";
import { isSupabaseConfigured, getPublicEnv } from "@/lib/env";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { formatNaira } from "@/lib/domain";
import { resolveWeeklyRoiBps } from "@/config/investment-portfolios";
import { COMPANY } from "@/lib/company";
import { DEFAULT_REFERRAL_PROGRAM } from "@/lib/referral/config";
import { buildActionHints, toConversionState } from "@/lib/dashboard/conversion-hints";
import { resolveNextAction, shouldShowNextAction } from "@/lib/dashboard/conversion";
import { mergeSmartAlerts } from "@/lib/dashboard/smart-alerts";
import { resolveWelcomeBonusLifecycle } from "@/lib/welcome-bonus/lifecycle";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardCyclePanel } from "@/components/dashboard/DashboardCyclePanel";
import { DashboardWealthHero, DashboardWealthHeroStatic } from "@/components/dashboard/DashboardWealthHero";
import { DashboardNextStepCard } from "@/components/dashboard/DashboardNextStepCard";
import { DashboardPortfolioSection } from "@/components/dashboard/DashboardPortfolioSection";
import { DashboardReferralStrip } from "@/components/dashboard/DashboardReferralStrip";
import { DashboardNotificationsPreview, filterActionableNotifications } from "@/components/dashboard/DashboardNotificationsPreview";
import { DashboardSmartAlerts } from "@/components/dashboard/DashboardSmartAlerts";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardPersonalizedLayout } from "@/components/member-experience/DashboardPersonalizedLayout";
import { PersonalizedHomeHeader } from "@/components/member-experience/PersonalizedHomeHeader";
import { TodaySummaryStrip } from "@/components/member-experience/TodaySummaryStrip";
import { SmartRecommendationsPanel } from "@/components/member-experience/SmartRecommendationsPanel";
import { PersonalizedInsightsPanel } from "@/components/member-experience/PersonalizedInsightsPanel";
import { MemberAchievementsPanel } from "@/components/member-experience/MemberAchievementsPanel";
import { MemberJourneyPanel } from "@/components/member-experience/MemberJourneyPanel";
import { AnnouncementCentre } from "@/components/member-experience/AnnouncementCentre";
import { FinancialCalendar } from "@/components/financial/FinancialCalendar";
import { buildFinancialCalendar } from "@/lib/financial-events/calendar-events";
import { settlementWindowStart } from "@/lib/payout/settlement-queue";
import { buildMemberExperienceBundle } from "@/lib/member-experience/context";
import { PLATFORM_ANNOUNCEMENTS } from "@/lib/member-experience/announcements";
import type { DashboardWidgetId } from "@/lib/member-experience/types";
import { FinancialTimeline } from "@/components/financial/FinancialTimeline";
import { buildUnifiedTimeline } from "@/lib/financial-events/unified-timeline";
import { WelcomeBonusCard } from "@/components/wallet/WelcomeBonusCard";
import { WelcomeBonusSlotCounter } from "@/components/welcome-bonus/WelcomeBonusSlotCounter";
import { BalanceHistoryChart, AllocationChart } from "@/components/dashboard/DashboardCharts";
import { DashboardPanelCard, DashboardSection } from "@/components/design-system";

import { fetchInvestmentContext } from "@/lib/investment/mappers";

async function fetchProfileMeta(
  services: NonNullable<Awaited<ReturnType<typeof getUserServices>>>,
  userId: string
) {
  try {
    const { data } = await services.supabase
      .from("profiles")
      .select("email_verified_at, created_at, full_name, phone, avatar_url, location_state_code")
      .eq("id", userId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

async function DashboardContent() {
  const user = await getSessionUser();
  const services = await getUserServices();
  const env = getPublicEnv();
  const roiEnabled = Boolean(env.NEXT_PUBLIC_ROI_MODE_ENABLED);

  const dashboard =
    user && services
      ? await services.dashboard.getMemberDashboard(user.id).catch(() => null)
      : null;

  const [roiState, investCtx, analytics, referralBundle, dbNotifications, welcomeBonusView, programmeStatus, profileMeta, recentDeposits, recentWithdrawals] =
    await Promise.all([
    roiEnabled && user && services ? services.roi.getState(user.id).catch(() => null) : Promise.resolve(null),
    user && services ? fetchInvestmentContext(services, user.id) : Promise.resolve(null),
    user && services ? services.analytics.getMemberAnalytics(user.id).catch(() => null) : Promise.resolve(null),
    user && services
      ? Promise.all([
          services.referrals.getDashboard(user.id, COMPANY.siteUrl),
          services.referrals.listVipLevels()
        ]).catch(() => null)
      : Promise.resolve(null),
    user && services ? services.notifications.listForUser(user.id, 8).catch(() => []) : Promise.resolve([]),
    user && services ? services.welcomeBonus.getMemberView(user.id).catch(() => null) : Promise.resolve(null),
    user && services ? services.welcomeBonus.getPublicProgrammeStatus().catch(() => null) : Promise.resolve(null),
    user && services ? fetchProfileMeta(services, user.id) : Promise.resolve(null),
    user && services ? services.deposits.listForUser(user.id, 10).catch(() => []) : Promise.resolve([]),
    user && services ? services.withdrawals.listForUser(user.id, 10).catch(() => []) : Promise.resolve([])
  ]);

  const hasActivePlanInvestments =
    investCtx?.rows.some((r: { status: string }) => r.status === "active" || r.status === "stopping") ?? false;
  const showPlanInvestmentUi = Boolean(investCtx) && (!roiEnabled || !roiState?.activeInvestment || hasActivePlanInvestments);

  const balance = dashboard?.balance ?? 0;
  const portfolio = dashboard?.portfolio;
  const preferredPackage = dashboard?.profile?.preferred_package_slug ?? null;
  const hasActiveInvestment = (dashboard?.activeInvestments ?? 0) > 0 || Boolean(roiState?.activeInvestment);
  const fullName = dashboard?.profile?.full_name ?? user?.email ?? "Member";
  const username = dashboard?.profile?.username ?? null;
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
  const showNextAction = shouldShowNextAction(conversionState);
  const primaryCta = { href: nextAction.href, label: nextAction.cta };

  const balanceHistory = analytics?.balanceHistory ?? [];
  const earningsTrend = analytics?.earningsTrend ?? [];
  const allocation = analytics?.allocation ?? [];

  let referralStrip = {
    vipLabel: "Starter",
    commissionRate: DEFAULT_REFERRAL_PROGRAM.commission_by_package.starter,
    verifiedCount: 0,
    referralCount: dashboard?.referralCount ?? 0,
    nextTier: null as import("@/lib/referral/types").VipLevelConfig | null
  };

  if (referralBundle) {
    const [refDashboard, vipLevels] = referralBundle;
    referralStrip = {
      vipLabel: refDashboard.vipLabel,
      commissionRate: refDashboard.currentCommissionRate,
      verifiedCount: refDashboard.verifiedInvestors,
      referralCount: refDashboard.totalReferrals,
      nextTier: refDashboard.nextVipLevel ?? vipLevels.find((v: { level: number }) => v.level === refDashboard.vipLevel + 1) ?? null
    };
  }

  const mappedNotifications = (dbNotifications ?? []).map((n: (typeof dbNotifications)[number]) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    created_at: n.created_at,
    read_at: n.read_at
  }));

  const actionableNotifications = filterActionableNotifications(mappedNotifications);
  const notificationRows =
    actionableNotifications.length > 0 ? actionableNotifications : buildActionHints(conversionState);

  const welcomeBonusLifecycle =
    welcomeBonusView && programmeStatus
      ? resolveWelcomeBonusLifecycle({
          memberView: welcomeBonusView,
          programme: programmeStatus,
          emailVerified: Boolean(profileMeta?.email_verified_at),
          registeredAt: profileMeta?.created_at ?? null
        })
      : null;

  const smartAlerts = mergeSmartAlerts({
    notifications: mappedNotifications,
    conversionState,
    welcomeBonusLifecycle,
    welcomeBonusAmount: welcomeBonusView?.amount
  });

  const activityItems = buildUnifiedTimeline({
    profile: profileMeta,
    deposits: recentDeposits,
    withdrawals: recentWithdrawals,
    transactions: (dashboard?.recentTransactions ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      reason: t.reason,
      created_at: t.created_at,
      amount: Number(t.amount),
      reference: t.reference
    })),
    limit: 12
  });

  const showCharts = balanceHistory.length > 0 || allocation.length > 0 || hasActiveInvestment;

  const hasDeposit =
    recentDeposits.some((d) => ["approved", "completed"].includes(d.status)) ||
    balance > 0 ||
    conversionState.pendingDeposits > 0;
  const hasWithdrawal = recentWithdrawals.some((w) => ["approved", "paid"].includes(w.status));
  const hasReferral = referralStrip.referralCount > 0;
  const welcomeBonusQualified =
    welcomeBonusView?.status === "available" ||
    welcomeBonusView?.status === "withdrawal_requested" ||
    welcomeBonusView?.status === "paid" ||
    Boolean(welcomeBonusView?.unlockedAt);
  const welcomeBonusWithdrawn =
    welcomeBonusView?.status === "paid" || welcomeBonusView?.status === "withdrawal_requested";

  const firstInvestmentAt =
    investCtx?.rows
      .filter((r) => !["cancelled", "pending"].includes(r.status))
      .map((r) => r.startedAt)
      .filter(Boolean)
      .sort()[0] ?? null;

  let portfolioAnniversaryAt: string | null = null;
  if (firstInvestmentAt) {
    const anniversary = new Date(firstInvestmentAt);
    anniversary.setFullYear(anniversary.getFullYear() + 1);
    const now = new Date();
    if (anniversary.getTime() >= now.getTime()) {
      portfolioAnniversaryAt = anniversary.toISOString();
    }
  }

  const calendarEvents = buildFinancialCalendar({
    nextSettlementAt: settlementWindowStart().toISOString(),
    welcomeBonus: welcomeBonusView,
    qualificationEndsAt: welcomeBonusView?.qualificationEndsAt,
    announcement: dashboard?.announcement,
    portfolioAnniversaryAt
  });

  const experience = buildMemberExperienceBundle({
    fullName,
    profile: profileMeta,
    conversion: conversionState,
    hasDeposit,
    hasInvestment: hasActiveInvestment,
    hasWithdrawal,
    hasReferral,
    welcomeBonusQualified,
    welcomeBonusWithdrawn,
    walletBalance: balance,
    portfolioValue: portfolio?.currentValue ?? balance,
    unreadNotifications: dashboard?.unreadNotifications ?? 0,
    earningsTrend,
    monthlyDeposits: analytics?.monthlyDeposits ?? [],
    monthlyWithdrawals: analytics?.monthlyWithdrawals ?? [],
    referralCount: referralStrip.referralCount,
    verifiedReferrals: referralStrip.verifiedCount
  });

  const widgetSlots: { id: DashboardWidgetId; node: React.ReactNode }[] = [
    {
      id: "greeting",
      node: (
        <PersonalizedHomeHeader
          greeting={experience.greeting}
          encouragement={experience.encouragement}
          reputation={experience.reputation}
        />
      )
    },
    {
      id: "today_summary",
      node: <TodaySummaryStrip summary={experience.todaySummary} />
    },
    {
      id: "recommendations",
      node: (
        <>
          <DashboardSmartAlerts alerts={smartAlerts} />
          <SmartRecommendationsPanel recommendations={experience.recommendations} />
        </>
      )
    },
    {
      id: "wealth_hero",
      node:
        showPlanInvestmentUi && investCtx ? (
          <DashboardWealthHero
            fullName={fullName}
            username={username}
            avatarUrl={avatarUrl}
            preferredPackageSlug={preferredPackage}
            hasActiveInvestment={hasActiveInvestment}
            walletBalance={investCtx.balance}
            liveInputs={investCtx.liveInputs}
            totalInvested={portfolio?.totalInvested ?? 0}
            totalEarned={portfolio?.totalEarned ?? 0}
            primaryCta={primaryCta}
          />
        ) : (
          <DashboardWealthHeroStatic
            fullName={fullName}
            username={username}
            avatarUrl={avatarUrl}
            preferredPackageSlug={preferredPackage}
            hasActiveInvestment={hasActiveInvestment}
            walletBalance={balance}
            portfolioValue={portfolio?.currentValue ?? balance}
            totalInvested={portfolio?.totalInvested ?? 0}
            totalEarned={portfolio?.totalEarned ?? 0}
            primaryCta={primaryCta}
          />
        )
    },
    {
      id: "next_step",
      node: showNextAction ? <DashboardNextStepCard action={nextAction} /> : null
    },
    {
      id: "journey",
      node: <MemberJourneyPanel milestones={experience.journey} />
    },
    {
      id: "quick_actions",
      node: <DashboardQuickActions walletBalance={balance} hasActiveInvestment={hasActiveInvestment} />
    },
    {
      id: "welcome_bonus",
      node: programmeStatus ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <WelcomeBonusSlotCounter initialStatus={programmeStatus} />
          {welcomeBonusView ? (
            <WelcomeBonusCard
              memberView={welcomeBonusView}
              programme={programmeStatus}
              emailVerified={Boolean(profileMeta?.email_verified_at)}
              registeredAt={profileMeta?.created_at ?? null}
            />
          ) : null}
        </div>
      ) : null
    },
    {
      id: "portfolio",
      node: (
        <>
          {roiEnabled && roiState?.activeInvestment ? (
            <DashboardCyclePanel
              fullName={fullName}
              avatarUrl={avatarUrl}
              preferredPackageSlug={preferredPackage}
              hasActiveInvestment={hasActiveInvestment}
              roi={{
                principalNgn: Number(roiState.activeInvestment.principal_ngn),
                weeklyRoiBps: resolveWeeklyRoiBps({
                  amountNgn: Number(roiState.activeInvestment.principal_ngn),
                  weeklyRoiBps: roiState.activeInvestment.tier.weekly_roi_bps
                }),
                cycleStartedAt: roiState.activeInvestment.cycle_started_at,
                cycleEndsAt: roiState.activeInvestment.cycle_ends_at,
                tierName: roiState.activeInvestment.tier.name
              }}
            />
          ) : null}
          {showPlanInvestmentUi && investCtx ? (
            <DashboardPortfolioSection
              liveInputs={investCtx.liveInputs}
              rows={investCtx.rows}
              earningsTrend={earningsTrend}
              totalInvested={portfolio?.totalInvested ?? 0}
              totalEarned={portfolio?.totalEarned ?? 0}
            />
          ) : null}
        </>
      )
    },
    {
      id: "insights",
      node: <PersonalizedInsightsPanel metrics={experience.insights} />
    },
    {
      id: "calendar",
      node: (
        <div className="grid gap-4 lg:grid-cols-2">
          <FinancialCalendar events={calendarEvents} />
          <AnnouncementCentre announcements={PLATFORM_ANNOUNCEMENTS} compact />
        </div>
      )
    },
    {
      id: "achievements",
      node: <MemberAchievementsPanel achievements={experience.achievements} compact />
    },
    {
      id: "referrals",
      node: (
        <DashboardSection title="Referrals">
          <DashboardReferralStrip
            vipLabel={referralStrip.vipLabel}
            commissionRate={referralStrip.commissionRate}
            verifiedCount={referralStrip.verifiedCount}
            referralCount={referralStrip.referralCount}
            nextTier={referralStrip.nextTier}
          />
        </DashboardSection>
      )
    },
    {
      id: "activity",
      node: (
        <DashboardSection title="Recent activity">
          <FinancialTimeline events={activityItems} title="Activity timeline" maxItems={8} />
        </DashboardSection>
      )
    },
    {
      id: "charts",
      node: showCharts ? (
        <DashboardSection title="Performance">
          <div className="grid gap-6 lg:grid-cols-2">
            <BalanceHistoryChart data={balanceHistory} href="/wallet" />
            <AllocationChart data={allocation} href="/portfolio" title="Asset allocation" />
          </div>
        </DashboardSection>
      ) : null
    },
    {
      id: "settlements",
      node: hasActiveInvestment ? (
        <DashboardSection title="Upcoming settlements">
          <DashboardPanelCard title="Next maturities" href="/portfolio" viewLabel="Open portfolio" accent="gold">
            {(dashboard?.upcomingMaturities.length ?? 0) === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-[var(--heading)]">
                  Settlement history becomes available after your first settlement.
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Maturity dates for active investments will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {dashboard!.upcomingMaturities.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/40 px-4 py-3 text-sm"
                  >
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
      ) : null
    },
    {
      id: "knowledge",
      node: (
        <DashboardSection title="Knowledge Center">
          <Card variant="elevated" padding="md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--emerald)]/10 text-[var(--emerald)]">
                  <BookOpen size={20} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-[var(--heading)]">Learn before you invest</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Guides on funding, settlements, security, and financial planning.
                  </p>
                </div>
              </div>
              <Link href="/learn">
                <Button size="sm" variant="outline" className="gap-1.5">
                  Browse all
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </Link>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {getPopularArticles()
                .slice(0, 4)
                .map((article) => (
                  <li key={article.slug}>
                    <KnowledgeArticleCard article={article} compact />
                  </li>
                ))}
            </ul>
          </Card>
        </DashboardSection>
      )
    },
    {
      id: "notifications",
      node: (
        <DashboardSection title="Alerts">
          <DashboardNotificationsPreview
            notifications={notificationRows}
            unreadCount={dashboard?.unreadNotifications ?? 0}
          />
        </DashboardSection>
      )
    }
  ].filter((slot) => slot.node != null) as { id: DashboardWidgetId; node: React.ReactNode }[];

  return (
    <>
      {!isSupabaseConfigured() && process.env.NODE_ENV !== "production" ? (
        <div className="mb-6 rounded-[var(--radius)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Connect Supabase in <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-500/20">.env.local</code> to load live data.
        </div>
      ) : null}

      <DashboardPersonalizedLayout slots={widgetSlots} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
