"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, Send } from "lucide-react";
import { formatNaira, isWithdrawalWindow, nextWithdrawalLabel, NAIRA_SYMBOL } from "@/lib/domain";
import { trackSmartsuppEvent } from "@/lib/chat/smartsupp";
import { SMARTSUPP_EVENTS } from "@/lib/chat/smartsupp-events";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type SavedBank = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  is_default?: boolean;
};

type Props = {
  availableBalance: number;
  processingWindow: string;
};

export function PayoutRequestForm({ availableBalance, processingWindow }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [savedBanks, setSavedBanks] = useState<SavedBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [saveAccount, setSaveAccount] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const open = isWithdrawalWindow();

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSavedBanks(data);
      })
      .catch(() => setSavedBanks([]));
  }, []);

  useEffect(() => {
    if (!selectedBankId) return;
    const bank = savedBanks.find((b) => b.id === selectedBankId);
    if (bank) {
      setBankName(bank.bank_name);
      setAccountName(bank.account_name);
      setAccountNumber(bank.account_number);
    }
  }, [selectedBankId, savedBanks]);

  async function persistBankAccount() {
    if (!saveAccount || !bankName || !accountName || !accountNumber) return;
    const exists = savedBanks.some((b) => b.account_number === accountNumber);
    if (exists) return;
    await fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName, accountName, accountNumber, isDefault: savedBanks.length === 0 })
    }).catch(() => null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

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
    if (!bankName.trim() || !accountName.trim() || accountNumber.replace(/\D/g, "").length < 10) {
      setMessage("Enter valid Nigerian bank account details.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsedAmount,
        bankName: bankName.trim(),
        accountName: note ? `${accountName.trim()} — ${note.trim()}` : accountName.trim(),
        accountNumber: accountNumber.trim()
      })
    });

    setIsSubmitting(false);
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Unable to submit payout request.");
      return;
    }

    await persistBankAccount();
    setMessage("Payout request submitted. We will process it during the next payout window.");
    setAmount("");
    setNote("");
    trackSmartsuppEvent(SMARTSUPP_EVENTS.PAYOUT_REQUESTED, { Amount_NGN: parsedAmount });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Badge variant={open ? "emerald" : "gold"}>
        {open ? "Payout window open" : `Closed — ${nextWithdrawalLabel()}`}
      </Badge>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
        <p className="text-xs text-[var(--text-subtle)]">Available balance</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--heading)]">{formatNaira(availableBalance)}</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Processing window: {processingWindow}</p>
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

      <div className="rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
          <Building2 size={16} className="text-[var(--emerald)]" aria-hidden />
          Nigerian bank account
        </div>

        {savedBanks.length > 0 ? (
          <label className="mt-4 grid gap-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">Saved account</span>
            <select className="field" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)}>
              <option value="">Enter new account</option>
              {savedBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_name} · {bank.account_number}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
          <Input label="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
        </div>
        <Input
          label="Account number"
          className="mt-3"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          required
        />
      </div>

      <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference for your records" />

      <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <input type="checkbox" checked={saveAccount} onChange={(e) => setSaveAccount(e.target.checked)} />
        Save this bank account for future payouts
      </label>

      <Button type="submit" disabled={!open || isSubmitting} className="w-full sm:w-auto gap-2">
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        Request payout
      </Button>

      {message ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
    </form>
  );
}

export const WithdrawalForm = PayoutRequestForm;
