"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  PayoutBankAccountSection,
  type WithdrawalBankAccount
} from "@/components/payout/PayoutBankAccountSection";
import { PayoutRequestForm } from "@/components/payout/PayoutRequestForm";

type Props = {
  availableBalance: number;
  registeredFullName: string;
  initialBank: WithdrawalBankAccount | null;
};

export function WithdrawalWorkspace({ availableBalance, registeredFullName, initialBank }: Props) {
  const [bank, setBank] = useState<WithdrawalBankAccount | null>(initialBank);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBank(initialBank);
  }, [initialBank]);

  useEffect(() => {
    if (initialBank) return;
    setLoading(true);
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBank(data[0] as WithdrawalBankAccount);
      })
      .catch(() => setBank(null))
      .finally(() => setLoading(false));
  }, [initialBank]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[var(--text-subtle)]" size={24} />
      </div>
    );
  }

  return (
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
  );
}
