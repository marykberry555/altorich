import Link from "next/link";
import { FundingAccountsGrid } from "@/components/funding/FundingAccountCard";
import { FundingHistoryTable } from "@/components/funding/FundingHistoryTable";
import { FundingSummary, InvestmentFundingForm } from "@/components/funding/InvestmentFundingForm";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
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

  if (user && services) {
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) {
      balance = await services.wallet.getBalance(wallet.id);
      const stats = await services.deposits.getUserStats(user.id);
      pendingFunding = stats.pending;
    }
    fundingHistory = await services.deposits.listForUser(user.id, 10);
  }

  const accountViews = fundingAccounts.map((account) => ({
    id: account.id,
    bankName: account.bank_name,
    accountName: account.account_name,
    accountNumber: account.account_number,
    displayName: account.display_name,
    fundingInstructions: account.funding_instructions,
    isPreferred: account.is_preferred
  }));

  const config = {
    activeBankName: preferred?.active_bank_name ?? (accountViews[0]?.bankName ?? "Funding details pending"),
    activeAccountName: preferred?.active_account_name ?? accountViews[0]?.accountName ?? "ALTORICH LTD",
    activeAccountNumber: preferred?.active_account_number ?? accountViews[0]?.accountNumber ?? "—",
    paymentInstruction:
      preferred?.payment_instruction ??
      accountViews[0]?.fundingInstructions ??
      "Transfer the exact amount, then submit your reference for verification.",
    transferNarration: preferred?.transfer_narration ?? "Use your registered phone number as transfer narration.",
    contributionsEnabled: preferred?.contributions_enabled ?? fundingAccounts.length > 0
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHero
        eyebrow="Wallet funding"
        title="Fund your investment wallet"
        description="Transfer naira from any Nigerian bank below. Once verified, funds are ready to invest."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Wallet balance</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatNaira(balance)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Pending funding</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">{formatNaira(pendingFunding)}</p>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Transfer to any account</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Choose any active account. {config.transferNarration}
          </p>
        </div>
        <FundingAccountsGrid accounts={accountViews} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <InvestmentFundingForm config={config} />
        </div>
        <div className="lg:col-span-2">
          <FundingSummary balance={balance} pendingFunding={pendingFunding} fundingEnabled={config.contributionsEnabled} />
        </div>
      </div>

      <FundingHistoryTable rows={fundingHistory} />

      <Card variant="elevated" padding="md" className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--heading)]">Ready to invest?</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Choose a package and allocate from your wallet balance.</p>
        </div>
        <Link href="/investments" className="text-sm font-semibold text-[var(--emerald)] hover:underline">
          Explore investment packages →
        </Link>
      </Card>
    </div>
  );
}
