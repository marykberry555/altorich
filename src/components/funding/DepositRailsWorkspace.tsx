"use client";

import { useEffect, useState } from "react";
import { FundingAccountsGrid } from "@/components/funding/FundingAccountCard";
import { InvestmentFundingForm } from "@/components/funding/InvestmentFundingForm";
import { CryptoDepositForm } from "@/components/funding/CryptoDepositForm";
import type { PublicPaymentRailsSnapshot } from "@/lib/payments/payment-rails";
import { cn } from "@/lib/utils";

type AccountView = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPreferred: boolean;
};

type Props = {
  rails: PublicPaymentRailsSnapshot;
  bankAccounts: AccountView[];
};

export function DepositRailsWorkspace({ rails: initialRails, bankAccounts }: Props) {
  const [rails, setRails] = useState(initialRails);

  useEffect(() => {
    setRails(initialRails);
  }, [initialRails]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/payment-rails", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data === "object" && Array.isArray(data.depositMethods)) {
          setRails(data as PublicPaymentRailsSnapshot);
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const methods = rails.depositMethods;
  const [method, setMethod] = useState<"bank" | "crypto">(
    (methods[0] as "bank" | "crypto" | undefined) ?? "bank"
  );

  useEffect(() => {
    if (!methods.includes(method) && methods[0]) {
      setMethod(methods[0] as "bank" | "crypto");
    }
  }, [methods, method]);

  if (!rails.anyDepositOpen) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-sm text-[var(--text-muted)]">
        {rails.messages.bothDepositsDisabled}
      </div>
    );
  }

  const showPicker = methods.length > 1;
  const active = methods.includes(method) ? method : methods[0]!;

  return (
    <div className="space-y-6">
      {showPicker ? (
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
              {id === "bank" ? rails.rails.bank.displayName : rails.rails.crypto.displayName}
            </button>
          ))}
        </div>
      ) : null}

      {active === "bank" ? (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Choose a receiving account
            </h2>
            <FundingAccountsGrid accounts={bankAccounts} />
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Enter deposit amount
            </h2>
            <InvestmentFundingForm fundingEnabled={rails.bankDepositOpen} />
          </section>
        </>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Crypto deposit
          </h2>
          <CryptoDepositForm rails={rails} enabled={rails.cryptoDepositOpen} />
        </section>
      )}
    </div>
  );
}
