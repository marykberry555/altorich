import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { PayoutRequestForm } from "@/components/payout/PayoutRequestForm";
import { PayoutHistoryTable } from "@/components/payout/PayoutHistoryTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import type { Withdrawal } from "@/types/database";

export default async function WithdrawalsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();
  const processingWindow = services ? await services.settings.getWithdrawalWindows() : "Mondays and Thursdays, 8:00 AM WAT";

  let balance = 0;
  let withdrawals: Withdrawal[] = [];
  let pendingPayouts = 0;
  let totalPaidOut = 0;
  let recentPayout: Withdrawal | null = null;

  if (user && services) {
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) balance = await services.wallet.getBalance(wallet.id);
    withdrawals = await services.withdrawals.listForUser(user.id, 50);
    pendingPayouts = withdrawals.filter((w) => w.status === "pending" || w.status === "approved").length;
    totalPaidOut = withdrawals.filter((w) => w.status === "paid").reduce((s, w) => s + Number(w.amount), 0);
    recentPayout = withdrawals[0] ?? null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHero
        eyebrow="Payout"
        title="Request a payout"
        description={`Transfer returns to your Nigerian bank account. Payout windows: ${processingWindow}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Available balance</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatNaira(balance)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Pending payouts</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{pendingPayouts}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Recent payout</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {recentPayout ? formatNaira(Number(recentPayout.amount)) : "—"}
          </p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Total paid out</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">{formatNaira(totalPaidOut)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="elevated" padding="lg">
          <h2 className="font-semibold text-[var(--heading)]">Request payout</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Payouts are sent to your Nigerian bank account only.
          </p>
          <div className="mt-6">
            <PayoutRequestForm availableBalance={balance} processingWindow={processingWindow} />
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-[var(--heading)]">Payout history</h2>
            <Link href="/wallet">
              <Button variant="outline" size="sm" className="gap-1">
                Wallet <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          <div className="mt-4">
            <PayoutHistoryTable rows={withdrawals} />
          </div>
        </Card>
      </div>
    </div>
  );
}
