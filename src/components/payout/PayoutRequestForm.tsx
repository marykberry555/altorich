"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { trackSmartsuppEvent } from "@/lib/chat/smartsupp";
import { SMARTSUPP_EVENTS } from "@/lib/chat/smartsupp-events";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type SavedBank = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
};

type Props = {
  availableBalance: number;
};

export function PayoutRequestForm({ availableBalance }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bank, setBank] = useState<SavedBank | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBank(data[0] as SavedBank);
      })
      .catch(() => setBank(null));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setSuccess(false);

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setMessage("Enter a valid payout amount.");
      setIsSubmitting(false);
      return;
    }
    if (parsedAmount > availableBalance) {
      setMessage("Amount exceeds available balance.");
      setIsSubmitting(false);
      return;
    }
    if (!bank) {
      setMessage("Add a payout bank account first.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsedAmount,
        bankName: bank.bank_name,
        accountName: bank.account_name,
        accountNumber: bank.account_number,
        note: note.trim() || undefined
      })
    });

    setIsSubmitting(false);
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error ?? "Unable to submit payout request.");
      return;
    }

    setSuccess(true);
    setMessage(body.scheduleMessage ?? "Your payout request has been queued for the next cycle.");
    setAmount("");
    setNote("");
    trackSmartsuppEvent(SMARTSUPP_EVENTS.PAYOUT_REQUESTED, { Amount_NGN: parsedAmount });
  }

  return (
    <Card variant="elevated" className="p-5 sm:p-6">
      {success ? (
        <div className="rounded-xl border border-[var(--emerald)]/20 bg-[var(--emerald-soft)]/30 p-4">
          <p className="font-semibold text-[var(--heading)]">Payout request received</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Available balance</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-[var(--heading)] sm:text-4xl">
              {formatNaira(availableBalance)}
            </p>
          </div>

          <Input
            label={`Payout amount (${NAIRA_SYMBOL})`}
            type="number"
            min={1}
            max={availableBalance || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Bank account</p>
            {bank ? (
              <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--gray-50)] px-4 py-3 dark:bg-[var(--surface)]">
                <p className="font-semibold text-[var(--heading)]">{bank.bank_name}</p>
                <p className="text-sm text-[var(--text-muted)]">{bank.account_name}</p>
                <p className="mt-1 font-mono text-sm tabular-nums">{bank.account_number}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Add a bank account below to request a payout.</p>
            )}
          </div>

          <Input
            label="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reference for your records"
          />

          <Button type="submit" disabled={isSubmitting || !bank} className="w-full gap-2 sm:w-auto">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Request payout
          </Button>

          {message && !success ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
        </form>
      )}
    </Card>
  );
}

export const WithdrawalForm = PayoutRequestForm;
