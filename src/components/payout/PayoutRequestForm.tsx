"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { Card } from "@/components/ui/Card";
import { COMPANY } from "@/lib/company";
import type { WithdrawalBankAccount } from "@/components/payout/PayoutBankAccountSection";

type Props = {
  availableBalance: number;
  bank: WithdrawalBankAccount | null;
};

export function PayoutRequestForm({ availableBalance, bank }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setSuccess(false);

    const parsedAmount = parseCurrencyInput(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setMessage("Enter a valid withdrawal amount.");
      setIsSubmitting(false);
      return;
    }
    if (parsedAmount > availableBalance) {
      setMessage("Insufficient available balance.");
      setIsSubmitting(false);
      return;
    }
    if (!bank) {
      setMessage("Please add your bank account first.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          bankName: bank.bank_name,
          accountNumber: bank.account_number,
          note: note.trim() || undefined
        })
      });

      const body = await response.json().catch(() => ({}));
      setIsSubmitting(false);

      if (!response.ok) {
        setMessage(
          body.error ??
            `Unable to create withdrawal request. Please contact support at ${COMPANY.supportEmail} if the problem continues.`
        );
        return;
      }

      setSuccess(true);
      setMessage(body.scheduleMessage ?? "Your withdrawal request has been queued for the next cycle.");
      setAmount("");
      setNote("");
      router.refresh();
    } catch {
      setIsSubmitting(false);
      setMessage(
        `Unable to create withdrawal request. Please contact support at ${COMPANY.supportEmail} if the problem continues.`
      );
    }
  }

  return (
    <Card variant="elevated" className="p-5 sm:p-6">
      {success ? (
        <div className="rounded-xl border border-[var(--emerald)]/20 bg-[var(--emerald-soft)]/30 p-4">
          <p className="font-semibold text-[var(--heading)]">Withdrawal request received</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Status: Pending — you can track it in Withdrawal history below.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Available withdrawal balance
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-[var(--heading)] sm:text-4xl">
              {formatNaira(availableBalance)}
            </p>
          </div>

          <CurrencyInput
            label={`Withdrawal amount (${NAIRA_SYMBOL})`}
            prefix="₦"
            value={amount}
            onChange={setAmount}
            required
          />

          {!bank ? (
            <p className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              Please add your bank account first.
            </p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Funds will be sent to <span className="font-medium text-[var(--heading)]">{bank.bank_name}</span> ·{" "}
              <span className="font-mono tabular-nums">{bank.account_number}</span>
            </p>
          )}

          <Input
            label="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reference for your records"
          />

          <Button type="submit" disabled={isSubmitting || !bank} className="w-full gap-2 sm:w-auto">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Request withdrawal
          </Button>

          {message && !success ? <p className="text-sm text-red-600 dark:text-red-400">{message}</p> : null}
        </form>
      )}
    </Card>
  );
}

export const WithdrawalForm = PayoutRequestForm;
