import type { Metadata } from "next";
import { DepositHistoryList } from "@/components/financial/DepositHistoryList";
import { DepositTrackerCard } from "@/components/financial/DepositTrackerCard";
import { WalletFundingSummary } from "@/components/funding/WalletFundingSummary";
import { DepositRailsWorkspace } from "@/components/funding/DepositRailsWorkspace";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { buildDepositTrackerView, findActiveDeposit } from "@/lib/financial-events/deposit-tracker";
import type { Deposit } from "@/types/database";
import { loadPublicPaymentRailsSnapshot } from "@/lib/payments/load-public-rails";
import { memberPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = memberPageMetadata(
  "Deposits",
  "/deposits",
  "Submit a deposit, track verification status, and view your deposit history."
);

export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  const fundingAccounts = services
    ? await services.fundingAccounts.listActive().catch(() => [])
    : [];

  const rails = await loadPublicPaymentRailsSnapshot();

  let balance = 0;
  let pendingFunding = 0;
  let fundingHistory: Deposit[] = [];

  if (user && services) {
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) {
      balance = await services.wallet.getBalance(wallet.id).catch(() => 0);
      const stats = await services.deposits.getUserStats(user.id).catch(() => ({ approved: 0, pending: 0, count: 0 }));
      pendingFunding = stats.pending;
    }
    fundingHistory = await services.deposits.listForUser(user.id, 10).catch(() => []);
  }

  const activeDeposit = findActiveDeposit(fundingHistory);
  const activeDepositTracker = activeDeposit ? buildDepositTrackerView(activeDeposit) : null;

  const accountViews = fundingAccounts.map((account) => ({
    id: account.id,
    bankName: account.bank_name,
    accountName: account.account_name,
    accountNumber: account.account_number,
    isPreferred: account.is_preferred
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-12 pb-8">
      <header className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Deposits</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {rails.cryptoDepositOpen && rails.bankDepositOpen
            ? "Fund via bank transfer or cryptocurrency, then submit proof for review."
            : rails.cryptoDepositOpen
              ? "Send crypto to the published address, then submit your transaction for review."
              : "Transfer to an Alto Rich account, then submit your proof for review."}
        </p>
        <WalletFundingSummary balance={balance} pendingFunding={pendingFunding} />
      </header>

      <DepositRailsWorkspace rails={rails} bankAccounts={accountViews} />

      {activeDepositTracker ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Live tracker</h2>
          <DepositTrackerCard tracker={activeDepositTracker} />
        </section>
      ) : null}

      <DepositHistoryList rows={fundingHistory} />
    </div>
  );
}
