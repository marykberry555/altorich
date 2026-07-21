import type { Metadata } from "next";
import { PayoutScheduleCard } from "@/components/payout/PayoutScheduleCard";
import { AutoWeeklyPayoutToggle } from "@/components/payout/AutoWeeklyPayoutToggle";
import { WithdrawalHistoryList } from "@/components/financial/WithdrawalHistoryList";
import { WithdrawalTrackerCard } from "@/components/financial/WithdrawalTrackerCard";
import { EarningsActionChoice } from "@/components/payout/EarningsActionChoice";
import { WithdrawalWorkspace } from "@/components/payout/WithdrawalWorkspace";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { buildWithdrawalTrackerView, findActiveWithdrawal } from "@/lib/financial-events/withdrawal-tracker";
import type { Withdrawal } from "@/types/database";

import { memberPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = memberPageMetadata(
  "Withdrawals",
  "/withdrawals",
  "Request a withdrawal to your bank account, view settlement schedule, and track withdrawal history."
);

export default async function WithdrawalsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let balance = 0;
  let preferredHref = "/investments";
  let withdrawals: Withdrawal[] = [];
  let registeredFullName = "";
  let initialBank: {
    id: string;
    bank_name: string;
    account_name: string;
    account_number: string;
  } | null = null;

  if (user && services) {
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) balance = await services.wallet.getBalance(wallet.id).catch(() => 0);
    withdrawals = await services.withdrawals.listForUser(user.id, 50).catch(() => []);
    const banks = await services.profile.listBankAccounts(user.id).catch(() => []);
    initialBank = banks[0]
      ? {
          id: banks[0].id,
          bank_name: banks[0].bank_name,
          account_name: banks[0].account_name,
          account_number: banks[0].account_number
        }
      : null;
    const { data: profile } = await services.supabase
      .from("profiles")
      .select("preferred_package_slug, full_name")
      .eq("id", user.id)
      .maybeSingle();
    registeredFullName = profile?.full_name?.trim() ?? "";
    if (profile?.preferred_package_slug) {
      preferredHref = "/investments";
    }
  }

  const activeWithdrawal = findActiveWithdrawal(withdrawals);
  const activeTracker = activeWithdrawal ? buildWithdrawalTrackerView(activeWithdrawal) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Withdrawals</h1>
        <p className="text-sm text-[var(--text-muted)]">Request a withdrawal to your bank account or reinvest your earnings.</p>
      </header>

      <EarningsActionChoice availableBalance={balance} preferredPackageHref={preferredHref} />

      <PayoutScheduleCard />

      <WithdrawalWorkspace
        availableBalance={balance}
        registeredFullName={registeredFullName}
        initialBank={initialBank}
      />

      <AutoWeeklyPayoutToggle />

      {activeTracker ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Live tracker</h2>
          <WithdrawalTrackerCard tracker={activeTracker} />
        </section>
      ) : null}

      <WithdrawalHistoryList rows={withdrawals} />
    </div>
  );
}
