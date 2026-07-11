import Link from "next/link";
import { BankTransferPanel } from "@/components/funding/BankTransferPanel";
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

  const bank = services
    ? await services.settings.getBankSwitchboard()
    : {
        active_bank_name: "Configure in admin",
        active_account_name: "ALTORICH LTD",
        active_account_number: "00000000",
        payment_instruction: "Transfer the exact amount, then submit your reference for verification.",
        transfer_narration: "Use your registered phone number as transfer narration.",
        contributions_enabled: false
      };

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

  const config = {
    activeBankName: bank.active_bank_name,
    activeAccountName: bank.active_account_name,
    activeAccountNumber: bank.active_account_number,
    paymentInstruction: bank.payment_instruction,
    transferNarration: bank.transfer_narration,
    contributionsEnabled: bank.contributions_enabled
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHero
        eyebrow="Wallet funding"
        title="Fund your investment wallet"
        description="Transfer naira from any Nigerian bank. Once verified, funds are ready to invest across your chosen packages."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Current balance</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatNaira(balance)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Available balance</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">{formatNaira(balance)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Pending funding</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">{formatNaira(pendingFunding)}</p>
        </Card>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Bank details</h2>
        <div className="mt-4">
          <BankTransferPanel
            bankName={config.activeBankName}
            accountName={config.activeAccountName}
            accountNumber={config.activeAccountNumber}
            transferNarration={config.transferNarration}
            paymentInstruction={config.paymentInstruction}
          />
        </div>
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
