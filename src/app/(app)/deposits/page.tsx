import { FundingAccountsGrid } from "@/components/funding/FundingAccountCard";
import { FundingHistoryTable } from "@/components/funding/FundingHistoryTable";
import { InvestmentFundingForm } from "@/components/funding/InvestmentFundingForm";
import { WalletFundingSummary } from "@/components/funding/WalletFundingSummary";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import type { Deposit } from "@/types/database";

export default async function DepositsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  const fundingAccounts = services
    ? await services.fundingAccounts.listActive().catch(() => [])
    : [];

  const preferred = services ? await services.settings.getBankSwitchboard() : null;

  let balance = 0;
  let pendingFunding = 0;
  let fundingHistory: Deposit[] = [];
  let fullName = "";

  if (user && services) {
    const { data: profile } = await services.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    fullName = profile?.full_name ?? "";
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) {
      balance = await services.wallet.getBalance(wallet.id).catch(() => 0);
      const stats = await services.deposits.getUserStats(user.id).catch(() => ({ approved: 0, pending: 0, count: 0 }));
      pendingFunding = stats.pending;
    }
    fundingHistory = await services.deposits.listForUser(user.id, 10).catch(() => []);
  }

  const accountViews = fundingAccounts.map((account) => ({
    id: account.id,
    bankName: account.bank_name,
    accountName: account.account_name,
    accountNumber: account.account_number,
    isPreferred: account.is_preferred
  }));

  const fundingEnabled = preferred?.contributions_enabled ?? fundingAccounts.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-12 pb-8">
      <header className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Fund Wallet</h1>
        <WalletFundingSummary balance={balance} pendingFunding={pendingFunding} />
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          Choose a receiving account
        </h2>
        <FundingAccountsGrid accounts={accountViews} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          Enter funding amount
        </h2>
        <InvestmentFundingForm fundingEnabled={fundingEnabled} defaultFullName={fullName} />
      </section>

      <FundingHistoryTable rows={fundingHistory} />
    </div>
  );
}
