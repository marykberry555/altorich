import type { ComponentProps } from "react";
import { getServiceRoleServices } from "@/lib/services";
import { AdminReferralManagement } from "@/components/admin/AdminReferralManagement";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const services = await getServiceRoleServices();
  let referralAdmin = null;
  if (services) {
    try {
      referralAdmin = {
        config: await services.referrals.getProgramConfig(),
        vipLevels: await services.referrals.listVipLevels(),
        analytics: await services.referrals.getAdminAnalytics(),
        pendingPayouts: await services.referrals.listPendingPayouts(),
        allPayouts: await services.referrals.listPayouts()
      };
    } catch {
      referralAdmin = null;
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Referral programme</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Configure commissions, VIP tiers, and Monday settlement referral withdrawals.
        </p>
      </header>

      {referralAdmin ? (
        <AdminReferralManagement
          initialConfig={referralAdmin.config}
          initialVipLevels={referralAdmin.vipLevels}
          analytics={referralAdmin.analytics}
          pendingPayouts={
            referralAdmin.pendingPayouts as unknown as ComponentProps<
              typeof AdminReferralManagement
            >["pendingPayouts"]
          }
          allPayouts={
            referralAdmin.allPayouts as unknown as ComponentProps<typeof AdminReferralManagement>["allPayouts"]
          }
        />
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Referral programme data unavailable.</p>
      )}
    </div>
  );
}
