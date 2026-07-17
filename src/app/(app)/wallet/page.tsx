import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/design-system";
import { LedgerTable } from "@/components/dashboard/LedgerTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AnimatedBalance } from "@/components/ui/AnimatedBalance";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";

export default async function WalletPage() {
  const user = await getSessionUser();
  const services = await getUserServices();
  let balance = 0;
  let transactions: { id: string; type: string; amount: number; reason: string; created_at: string; status: string }[] = [];

  if (user && services) {
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) {
      balance = await services.wallet.getBalance(wallet.id).catch(() => 0);
      const txs = await services.wallet.getTransactions(wallet.id, 25).catch(() => []);
      transactions = txs.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        reason: t.reason,
        created_at: t.created_at,
        status: t.status
      }));
    }
  }

  const primaryHref = balance > 0 ? "/investments" : "/deposits";
  const primaryLabel = balance > 0 ? "Invest now" : "Submit transfer";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Wallet</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">Your naira wallet</h1>
      </header>

      <Card
        variant="elevated"
        padding="lg"
        className="overflow-hidden bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-mid)] text-white"
      >
        <p className="text-sm text-white/80">Available balance</p>
        <p className="mt-2 text-4xl font-bold tabular-nums sm:text-5xl">
          <AnimatedBalance value={balance} className="text-white" />
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={primaryHref}>
            <Button variant="gold" size="md" className="gap-2">
              {primaryLabel}
              <ArrowRight size={16} aria-hidden />
            </Button>
          </Link>
          <Link href={balance > 0 ? "/deposits" : "/withdrawals"}>
            <Button variant="outline" size="md" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              {balance > 0 ? "Fund wallet" : "Request payout"}
            </Button>
          </Link>
        </div>
      </Card>

      <Card variant="elevated" padding="md">
        <SectionHeading title="Transaction history" description="Every credit and debit is recorded." />
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Fund your wallet to get started."
            action={
              <Link href="/deposits">
                <Button size="sm" className="gap-1.5">
                  Submit transfer
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </Link>
            }
          />
        ) : (
          <LedgerTable rows={transactions} />
        )}
      </Card>
    </div>
  );
}
