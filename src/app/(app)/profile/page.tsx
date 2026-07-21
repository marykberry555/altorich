import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { MemberStatusSummary } from "@/components/financial/MemberStatusSummary";
import { FinancialCalendar } from "@/components/financial/FinancialCalendar";
import { StatementDownloadsPanel, defaultStatementOptions } from "@/components/financial/StatementDownloadsPanel";
import { FinancialTimeline } from "@/components/financial/FinancialTimeline";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { buildMemberStatusSummary } from "@/lib/financial-events/member-status";
import { buildFinancialCalendar } from "@/lib/financial-events/calendar-events";
import { buildUnifiedTimeline } from "@/lib/financial-events/unified-timeline";
import { resolveWelcomeBonusLifecycle } from "@/lib/welcome-bonus/lifecycle";
import { COMPANY } from "@/lib/company";
import { MemberAchievementsPanel } from "@/components/member-experience/MemberAchievementsPanel";
import { MemberReputationBadge } from "@/components/member-experience/MemberReputationBadge";
import { buildMemberActivityContext } from "@/lib/member-experience/context";
import { resolveAchievements } from "@/lib/member-experience/achievements";
import { resolveReputation } from "@/lib/member-experience/reputation";
import { toConversionState } from "@/lib/dashboard/conversion-hints";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let profile = null;
  let dashboard = null;
  let welcomeBonus = null;
  let programmeStatus = null;
  let referralDashboard = null;
  let recentDeposits: Awaited<ReturnType<NonNullable<typeof services>["deposits"]["listForUser"]>> = [];
  let recentWithdrawals: Awaited<ReturnType<NonNullable<typeof services>["withdrawals"]["listForUser"]>> = [];
  let hasTransactions = false;

  if (user && services) {
    const { data } = await services.supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = data;

    [dashboard, welcomeBonus, programmeStatus, referralDashboard, recentDeposits, recentWithdrawals] = await Promise.all([
      services.dashboard.getMemberDashboard(user.id).catch(() => null),
      services.welcomeBonus.getMemberView(user.id).catch(() => null),
      services.welcomeBonus.getPublicProgrammeStatus().catch(() => null),
      services.referrals.getDashboard(user.id, COMPANY.siteUrl).catch(() => null),
      services.deposits.listForUser(user.id, 5).catch(() => []),
      services.withdrawals.listForUser(user.id, 5).catch(() => [])
    ]);

    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) {
      const txs = await services.wallet.getTransactions(wallet.id, 1).catch(() => []);
      hasTransactions = txs.length > 0;
    }
  }

  const fullName = profile?.full_name || user?.email || "Member";

  const welcomeBonusLifecycle =
    welcomeBonus && programmeStatus
      ? resolveWelcomeBonusLifecycle({
          memberView: welcomeBonus,
          programme: programmeStatus,
          emailVerified: Boolean(profile?.email_verified_at),
          registeredAt: profile?.created_at ?? null
        })
      : null;

  const statusItems = buildMemberStatusSummary({
    memberSince: profile?.created_at,
    emailVerified: Boolean(profile?.email_verified_at),
    kycStatus: profile?.kyc_status,
    hasActiveInvestment: (dashboard?.activeInvestments ?? 0) > 0,
    portfolioValue: dashboard?.portfolio?.currentValue,
    pendingWithdrawals: dashboard?.pendingWithdrawals,
    pendingDeposits: dashboard?.pendingDeposits,
    welcomeBonusLifecycle,
    referralCount: referralDashboard?.totalReferrals,
    referralVerified: referralDashboard?.verifiedInvestors
  });

  const calendarEvents = buildFinancialCalendar({
    nextSettlementAt: referralDashboard?.nextSettlementAt,
    welcomeBonus,
    qualificationEndsAt: welcomeBonus?.qualificationEndsAt ?? null,
    announcement: dashboard?.announcement
  });

  const timeline = buildUnifiedTimeline({
    profile,
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
    limit: 8
  });

  const conversionState = toConversionState({
    balance: dashboard?.balance ?? 0,
    pendingDeposits: dashboard?.pendingDeposits ?? 0,
    pendingWithdrawals: dashboard?.pendingWithdrawals ?? 0,
    hasActiveInvestment: (dashboard?.activeInvestments ?? 0) > 0,
    totalEarned: dashboard?.portfolio?.totalEarned ?? 0,
    preferredPackageSlug: profile?.preferred_package_slug ?? null
  });

  const activity = buildMemberActivityContext({
    profile,
    hasDeposit:
      recentDeposits.some((d) => ["approved", "completed"].includes(d.status)) ||
      (dashboard?.balance ?? 0) > 0,
    hasInvestment: (dashboard?.activeInvestments ?? 0) > 0,
    hasWithdrawal: recentWithdrawals.some((w) => ["approved", "paid"].includes(w.status)),
    hasReferral: (referralDashboard?.totalReferrals ?? 0) > 0,
    welcomeBonusQualified:
      welcomeBonus?.status === "available" ||
      welcomeBonus?.status === "withdrawal_requested" ||
      welcomeBonus?.status === "paid" ||
      Boolean(welcomeBonus?.unlockedAt),
    welcomeBonusWithdrawn:
      welcomeBonus?.status === "paid" || welcomeBonus?.status === "withdrawal_requested",
    conversion: conversionState
  });

  const achievements = resolveAchievements(activity);
  const reputation = resolveReputation(activity);

  const links = [
    { href: "/wallet", label: "Wallet" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/deposits", label: "Fund wallet" },
    { href: "/investments", label: "Invest" },
    { href: "/withdrawals", label: "Withdrawals" },
    { href: "/settings", label: "Settings" }
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Your membership overview at a glance.</p>
      </header>

      <ProfileIdentityCard
        fullName={fullName}
        username={profile?.username ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        packageSlug={profile?.preferred_package_slug ?? null}
        memberSince={profile?.created_at ?? null}
        emailVerifiedAt={profile?.email_verified_at ?? null}
        kycStatus={profile?.kyc_status ?? null}
        inviteCode={profile?.invite_code ?? null}
      />

      <MemberStatusSummary items={statusItems} />

      <MemberReputationBadge reputation={reputation} />

      <MemberAchievementsPanel achievements={achievements} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FinancialCalendar events={calendarEvents} />
        <StatementDownloadsPanel statements={defaultStatementOptions(hasTransactions)} />
      </div>

      <FinancialTimeline events={timeline} title="Account timeline" maxItems={6} />

      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card variant="outline" className="transition hover:border-[var(--emerald)] hover:shadow-[var(--shadow-sm)]">
              <span className="text-sm font-semibold">{item.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Link href="/team" className="block">
        <Button className="w-full">Referrals & VIP</Button>
      </Link>
    </div>
  );
}
