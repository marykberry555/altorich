import { PayoutScheduleCard } from "@/components/payout/PayoutScheduleCard";
import { PayoutBankAccountSection } from "@/components/payout/PayoutBankAccountSection";
import { AutoWeeklyPayoutToggle } from "@/components/payout/AutoWeeklyPayoutToggle";
import { PayoutRequestForm } from "@/components/payout/PayoutRequestForm";
import { PayoutHistoryTable } from "@/components/payout/PayoutHistoryTable";
import { formatNaira } from "@/lib/domain";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import type { Withdrawal } from "@/types/database";

export default async function WithdrawalsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let balance = 0;
  let withdrawals: Withdrawal[] = [];

  if (user && services) {
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) balance = await services.wallet.getBalance(wallet.id);
    withdrawals = await services.withdrawals.listForUser(user.id, 50);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Payout</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Available balance · <span className="font-semibold tabular-nums text-[var(--heading)]">{formatNaira(balance)}</span>
        </p>
      </header>

      <PayoutScheduleCard />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Payout bank account</h2>
        <PayoutBankAccountSection />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Request payout</h2>
        <PayoutRequestForm availableBalance={balance} />
      </section>

      <AutoWeeklyPayoutToggle />

      <PayoutHistoryTable rows={withdrawals} />
    </div>
  );
}
