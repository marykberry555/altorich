"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { COMPANY } from "@/lib/company";
import { capAccountNumberInput } from "@/lib/validation/identity";

export type WithdrawalBankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
};

type Props = {
  registeredFullName: string;
  account: WithdrawalBankAccount | null;
  onAccountChange: (account: WithdrawalBankAccount | null) => void;
};

export function PayoutBankAccountSection({ registeredFullName, account, onAccountChange }: Props) {
  const [editing, setEditing] = useState(!account);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [bankName, setBankName] = useState(account?.bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState(account?.account_number ?? "");
  const [resolvedName, setResolvedName] = useState(registeredFullName);
  const [message, setMessage] = useState("");
  const [error, setError] = useFlashError();

  useEffect(() => {
    if (account) {
      setBankName(account.bank_name);
      setAccountNumber(account.account_number);
      setResolvedName(account.account_name || registeredFullName);
      setEditing(false);
    } else {
      setEditing(true);
      setResolvedName(registeredFullName);
    }
  }, [account, registeredFullName]);

  const resolveName = useCallback(
    async (number: string) => {
      if (number.length !== 10 || !registeredFullName) {
        setResolvedName(registeredFullName);
        return;
      }
      setResolving(true);
      setError("");
      try {
        const res = await fetch("/api/bank-accounts/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountNumber: number })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not resolve account name.");
          setResolvedName("");
          return;
        }
        setResolvedName(data.accountName ?? registeredFullName);
      } catch {
        setError("Could not resolve account name.");
        setResolvedName("");
      } finally {
        setResolving(false);
      }
    },
    [registeredFullName, setError]
  );

  async function onAccountNumberChange(value: string) {
    const next = capAccountNumberInput(value);
    setAccountNumber(next);
    if (next.length === 10) {
      await resolveName(next);
    } else {
      setResolvedName(registeredFullName);
    }
  }

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    if (accountNumber.length === 10 && !resolvedName) {
      setError("Account name could not be resolved. Check the account number and try again.");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName,
        accountNumber,
        accountName: resolvedName || registeredFullName
      })
    });

    setSaving(false);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Could not save bank account.");
      return;
    }

    const saved = body as WithdrawalBankAccount;
    onAccountChange(saved);
    setEditing(false);
    setMessage("Withdrawal bank account saved.");
  }

  if (!editing && account) {
    return (
      <Card variant="elevated" className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
              <Building2 size={20} aria-hidden />
            </span>
            <div className="min-w-0 space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Bank</p>
                <p className="font-semibold text-[var(--heading)]">{account.bank_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                  Account name
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--heading)]">
                  <Lock size={12} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
                  <span className="truncate">{account.account_name || registeredFullName}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                  Account number
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-[var(--heading)]">
                  {account.account_number}
                </p>
              </div>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
            <Pencil size={14} />
            Edit
          </Button>
        </div>
        <p className="mt-3 text-xs text-[var(--text-subtle)]">
          For your security, withdrawals can only be made to a bank account that matches your registered name.
        </p>
        {message ? <p className="mt-3 text-sm text-[var(--emerald)]">{message}</p> : null}
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-5 sm:p-6">
      <h3 className="font-semibold text-[var(--heading)]">
        {account ? "Update withdrawal bank account" : "Add withdrawal bank account"}
      </h3>
      <form onSubmit={saveAccount} className="mt-4 space-y-3">
        <Input label="Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
        <Input
          label="Account number"
          value={accountNumber}
          onChange={(e) => void onAccountNumberChange(e.target.value)}
          required
          maxLength={10}
          inputMode="numeric"
        />
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Account name</span>
          <div
            className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--heading)]"
            aria-readonly="true"
          >
            <Lock size={14} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
            <span className="truncate font-medium">
              {resolving ? "Resolving…" : resolvedName || registeredFullName || "—"}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-subtle)]">
            Locked to your registered full name. After you enter your account number, we confirm the account name
            matches your verified identity.
          </p>
          <p className="text-xs leading-relaxed text-[var(--text-subtle)]">
            Need to update your registered name? Please contact our support team by email at{" "}
            <a className="underline underline-offset-2" href={`mailto:${COMPANY.supportEmail}`}>
              {COMPANY.supportEmail}
            </a>
            . For your protection, identity verification is required before any name change can be approved.
          </p>
        </div>
        {error ? <FormFlashError message={error} /> : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="submit"
            disabled={saving || resolving || !registeredFullName || accountNumber.length !== 10 || !resolvedName}
            className="gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {account ? "Update bank account" : "Save bank account"}
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
