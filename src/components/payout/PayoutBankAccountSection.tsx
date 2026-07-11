"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
};

type Props = {
  onSaved?: (account: BankAccount) => void;
};

export function PayoutBankAccountSection({ onSaved }: Props) {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const primary = data[0] as BankAccount;
          setAccount(primary);
          setBankName(primary.bank_name);
          setAccountName(primary.account_name);
          setAccountNumber(primary.account_number);
        } else {
          setEditing(true);
        }
      })
      .catch(() => setEditing(true))
      .finally(() => setLoading(false));
  }, []);

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName, accountName, accountNumber })
    });

    setSaving(false);
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error ?? "Could not save bank account.");
      return;
    }

    const saved = body as BankAccount;
    setAccount(saved);
    setEditing(false);
    setMessage("Payout bank account saved.");
    onSaved?.(saved);
  }

  if (loading) {
    return (
      <Card variant="elevated" className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-[var(--text-subtle)]" size={24} />
      </Card>
    );
  }

  if (account && !editing) {
    return (
      <Card variant="elevated" className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
              <Building2 size={20} aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-[var(--heading)]">{account.bank_name}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{account.account_name}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[var(--heading)]">
                {account.account_number}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
            <Pencil size={14} />
            Edit
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-[var(--emerald)]">{message}</p> : null}
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-5 sm:p-6">
      <h3 className="font-semibold text-[var(--heading)]">{account ? "Update bank account" : "Add bank account"}</h3>
      <form onSubmit={saveAccount} className="mt-4 space-y-3">
        <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
        <Input label="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
        <Input label="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {account ? "Update bank account" : "Add bank account"}
          </Button>
          {account ? (
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
      </form>
    </Card>
  );
}
