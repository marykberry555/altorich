import { getSessionUser } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { COMPANY } from "@/lib/company";
import { ReferralDashboardClient } from "@/components/referral/ReferralDashboardClient";
import { DEFAULT_REFERRAL_PROGRAM } from "@/lib/referral/config";
import type { ReferralDashboard } from "@/lib/referral/types";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getSessionUser();
  const services = await getServiceRoleServices();

  if (!user || !services) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-[var(--text-muted)]">
        Sign in to access your referral dashboard.
      </div>
    );
  }

  let dashboard: ReferralDashboard;
  let vipLevels = await services.referrals.listVipLevels().catch(() => []);

  try {
    dashboard = await services.referrals.getDashboard(user.id, COMPANY.siteUrl);
  } catch {
    const starter = vipLevels[0];
    dashboard = {
      inviteCode: "—",
      inviteLink: `${COMPANY.siteUrl}/auth/register`,
      totalReferrals: 0,
      verifiedInvestors: 0,
      pendingReferrals: 0,
      totalInvestmentGenerated: 0,
      currentCommissionRate: starter?.commission_percent ?? DEFAULT_REFERRAL_PROGRAM.commission_by_package.starter,
      vipLevel: 0,
      vipLabel: "Starter",
      nextVipLevel: vipLevels[1] ?? null,
      verifiedForNextLevel: 0,
      requiredForNextLevel: vipLevels[1]?.min_members ?? 5,
      referralWalletBalance: 0,
      pendingRewards: 0,
      lifetimeRewards: 0,
      alreadyPaid: 0,
      minPayoutThreshold: DEFAULT_REFERRAL_PROGRAM.min_payout_threshold,
      canRequestPayout: false,
      payoutGap: DEFAULT_REFERRAL_PROGRAM.min_payout_threshold,
      recentReferrals: [],
      recentRewards: [],
      programEnabled: DEFAULT_REFERRAL_PROGRAM.enabled
    };
    const { data: profile } = await services.supabase.from("profiles").select("invite_code, vip_level").eq("id", user.id).single();
    if (profile?.invite_code) {
      dashboard.inviteCode = profile.invite_code;
      dashboard.inviteLink = `${COMPANY.siteUrl.replace(/\/$/, "")}/r/${profile.invite_code}`;
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <ReferralDashboardClient initialDashboard={dashboard} vipLevels={vipLevels} />
    </div>
  );
}
