import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/design-system";
import { WalletTransactionList } from "@/components/financial/WalletTransactionList";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedBalance } from "@/components/ui/AnimatedBalance";
import { WelcomeBonusCard } from "@/components/wallet/WelcomeBonusCard";
import { WelcomeBonusSlotCounter } from "@/components/welcome-bonus/WelcomeBonusSlotCounter";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { REFERRAL_WALLET_CURRENCY } from "@/services/wallet/wallet.service";
import { WELCOME_BONUS_WALLET_CURRENCY } from "@/lib/welcome-bonus/config";

export default async function WalletPage() {
  const user = await getSessionUser();
  const services = await getUserServices();
  let balance = 0;
  let transactions: {
    id: string;
    type: "credit" | "debit";
    amount: number;
    reason: string;
    created_at: string;
    status: string;
    reference: string;
    currency?: string;
  }[] = [];
  let welcomeBonus = null as Awaited<
    ReturnType<NonNullable<typeof services>["welcomeBonus"]["getMemberView"]>
  > | null;
  let programmeStatus = null as Awaited<
    ReturnType<NonNullable<typeof services>["welcomeBonus"]["getPublicProgrammeStatus"]>
  > | null;
  let profileMeta: { email_verified_at: string | null; created_at: string } | null = null;

  if (user && services) {
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) {
      balance = await services.wallet.getBalance(wallet.id).catch(() => 0);
      const ngnTxs = await services.wallet.getTransactions(wallet.id, 25).catch(() => []);
      transactions = ngnTxs.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        reason: t.reason,
        created_at: t.created_at,
        status: t.status,
        reference: t.reference,
        currency: "NGN"
      }));
    }

    for (const currency of [WELCOME_BONUS_WALLET_CURRENCY, REFERRAL_WALLET_CURRENCY] as const) {
      const extraWallet = await services.wallet.getWalletByUserId(user.id, currency).catch(() => null);
      if (!extraWallet) continue;
      const txs = await services.wallet.getTransactions(extraWallet.id, 15).catch(() => []);
      transactions.push(
        ...txs.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          reason: t.reason,
          created_at: t.created_at,
          status: t.status,
          reference: t.reference,
          currency
        }))
      );
    }

    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    [welcomeBonus, programmeStatus, profileMeta] = await Promise.all([
      services.welcomeBonus.getMemberView(user.id).catch(() => null),
      services.welcomeBonus.getPublicProgrammeStatus().catch(() => null),
      (async () => {
        try {
          const { data } = await services.supabase
            .from("profiles")
            .select("email_verified_at, created_at")
            .eq("id", user.id)
            .maybeSingle();
          return data;
        } catch {
          return null;
        }
      })()
    ]);
  }

  const primaryHref = balance > 0 ? "/investments" : "/deposits";
  const primaryLabel = balance > 0 ? "Invest now" : "Submit transfer";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Wallet</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">Your naira wallet</h1>
      </header>

      {programmeStatus ? <WelcomeBonusSlotCounter initialStatus={programmeStatus} compact /> : null}

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
              {balance > 0 ? "Fund wallet" : "Request withdrawal"}
            </Button>
          </Link>
        </div>
      </Card>

      {welcomeBonus && programmeStatus ? (
        <WelcomeBonusCard
          memberView={welcomeBonus}
          programme={programmeStatus}
          emailVerified={Boolean(profileMeta?.email_verified_at)}
          registeredAt={profileMeta?.created_at ?? null}
        />
      ) : programmeStatus ? (
        <WelcomeBonusSlotCounter initialStatus={programmeStatus} />
      ) : null}

      <Card variant="elevated" padding="md">
        <SectionHeading title="Transaction history" description="Every credit and debit is recorded — separated by wallet type." />
        <div className="mt-4">
          <WalletTransactionList transactions={transactions} />
        </div>
      </Card>
    </div>
  );
}
