"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ReferralDashboard } from "@/lib/referral/types";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { Card } from "@/components/ui/Card";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { capAccountNumberInput } from "@/lib/validation/identity";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  is_default?: boolean;
};

type Props = {
  dashboard: ReferralDashboard;
  onSuccess?: () => void;
};

export function ReferralPayoutPanel({ dashboard, onSuccess }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useFlashError();
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/bank-accounts").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null))
    ])
      .then(([rows, profilePayload]: [BankAccount[], { profile?: { full_name?: string } } | null]) => {
        const registeredName = profilePayload?.profile?.full_name?.trim() ?? "";
        setAccounts(rows);
        const def = rows.find((a) => a.is_default) ?? rows[0];
        if (def) {
          setSelectedId(def.id);
          setBankName(def.bank_name);
          setAccountName(registeredName || def.account_name);
          setAccountNumber(def.account_number);
        } else if (registeredName) {
          setAccountName(registeredName);
        }
      })
      .catch(() => undefined);
  }, []);

  function selectAccount(id: string) {
    setSelectedId(id);
    const acc = accounts.find((a) => a.id === id);
    if (acc) {
      setBankName(acc.bank_name);
      setAccountNumber(acc.account_number);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const parsed = parseCurrencyInput(amount);
    const response = await fetch("/api/referrals/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsed,
        bankName,
        accountName,
        accountNumber,
        bankAccountId: selectedId || undefined
      })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Withdrawal request failed.");
      return;
    }

    setMessage("Withdrawal request submitted. Track status in your notifications.");
    onSuccess?.();
  }

  const disabledReason = !dashboard.canRequestPayout
    ? dashboard.payoutGap > 0
      ? `You need ${formatNaira(dashboard.payoutGap)} more in referral rewards before requesting a withdrawal.`
      : `Minimum withdrawal threshold is ${formatNaira(dashboard.minPayoutThreshold)}.`
    : "";

  return (
    <Card variant="elevated" padding="md">
      <h2 className="text-lg font-bold text-[var(--heading)]">Request withdrawal</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Transfer referral rewards to your Nigerian bank account</p>

      {disabledReason ? (
        <p className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {disabledReason}
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <CurrencyInput
          label="Requested amount"
          prefix="₦"
          value={amount}
          onChange={setAmount}
          required
          disabled={!dashboard.canRequestPayout}
        />

        {accounts.length > 0 ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[var(--text-muted)]">Saved bank account</span>
            <select
              className="field"
              value={selectedId}
              onChange={(e) => selectAccount(e.target.value)}
              disabled={!dashboard.canRequestPayout}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bank_name} · {a.account_number}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <Input label="Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required disabled={!dashboard.canRequestPayout} />
        <Input
          label="Account name"
          value={accountName}
          readOnly
          disabled
          hint="Locked to your registered full name."
        />
        <Input label="Account number" value={accountNumber} onChange={(e) => setAccountNumber(capAccountNumberInput(e.target.value))} required disabled={!dashboard.canRequestPayout} maxLength={10} inputMode="numeric" />

        {error ? <FormFlashError message={error} /> : null}
        {message ? <p className="text-sm text-[var(--emerald)]">{message}</p> : null}

        <Button type="submit" disabled={loading || !dashboard.canRequestPayout || !dashboard.programEnabled} className="gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Submit request
        </Button>
      </form>
    </Card>
  );
}
