"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PayoutBankAccountSection,
  type WithdrawalBankAccount
} from "@/components/payout/PayoutBankAccountSection";
import { PayoutRequestForm } from "@/components/payout/PayoutRequestForm";
import { CryptoPayoutRequestForm } from "@/components/payout/CryptoPayoutRequestForm";
import type { PublicPaymentRailsSnapshot } from "@/lib/payments/payment-rails";
import type { MemberCryptoWallet } from "@/lib/payments/member-destinations";
import { cn } from "@/lib/utils";

type Props = {
  availableBalance: number;
  registeredFullName: string;
  initialBank: WithdrawalBankAccount | null;
  rails: PublicPaymentRailsSnapshot;
  wallets: MemberCryptoWallet[];
};

export function WithdrawalWorkspace({
  availableBalance,
  registeredFullName,
  initialBank,
  rails: initialRails,
  wallets
}: Props) {
  const [rails, setRails] = useState(initialRails);
  const [bank, setBank] = useState<WithdrawalBankAccount | null>(initialBank);
  const [loading, setLoading] = useState(false);
  const methods = rails.withdrawalMethods;
  const [method, setMethod] = useState<"bank" | "crypto">(
    (methods[0] as "bank" | "crypto" | undefined) ?? "bank"
  );

  useEffect(() => {
    setRails(initialRails);
  }, [initialRails]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/payment-rails", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data === "object" && Array.isArray(data.withdrawalMethods)) {
          setRails(data as PublicPaymentRailsSnapshot);
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setBank(initialBank);
  }, [initialBank]);

  useEffect(() => {
    if (!methods.includes(method) && methods[0]) {
      setMethod(methods[0] as "bank" | "crypto");
    }
  }, [methods, method]);

  useEffect(() => {
    if (initialBank || !rails.bankWithdrawalOpen) return;
    setLoading(true);
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBank(data[0] as WithdrawalBankAccount);
      })
      .catch(() => setBank(null))
      .finally(() => setLoading(false));
  }, [initialBank, rails.bankWithdrawalOpen]);

  if (!rails.anyWithdrawalOpen) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-sm text-[var(--text-muted)]">
        {rails.messages.bothWithdrawalsDisabled}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[var(--text-subtle)]" size={24} />
      </div>
    );
  }

  const active = methods.includes(method) ? method : methods[0]!;
  const cryptoOnly = rails.cryptoWithdrawalOpen && !rails.bankWithdrawalOpen;

  return (
    <>
      {cryptoOnly ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--emerald)]/25 bg-[var(--emerald-soft)]/40 px-4 py-3 text-sm text-[var(--heading)]">
          {rails.messages.cryptoOnlyWithdrawal}
        </p>
      ) : null}

      {methods.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {methods.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setMethod(id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                active === id
                  ? "border-[var(--emerald)] bg-[var(--emerald-soft)] text-[var(--heading)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--emerald)]/40"
              )}
            >
              {id === "bank" ? "Bank payout" : "Crypto payout"}
            </button>
          ))}
        </div>
      ) : null}

      {active === "bank" && rails.bankWithdrawalOpen ? (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Withdrawal bank account
            </h2>
            <PayoutBankAccountSection
              registeredFullName={registeredFullName}
              account={bank}
              onAccountChange={setBank}
            />
          </section>
          <section id="request" className="space-y-4 scroll-mt-24">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Request withdrawal
            </h2>
            <PayoutRequestForm availableBalance={availableBalance} bank={bank} />
          </section>
        </>
      ) : null}

      {active === "crypto" && rails.cryptoWithdrawalOpen ? (
        <section id="request" className="space-y-4 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Request crypto payout
          </h2>
          <CryptoPayoutRequestForm availableBalance={availableBalance} rails={rails} wallets={wallets} />
        </section>
      ) : null}
    </>
  );
}
