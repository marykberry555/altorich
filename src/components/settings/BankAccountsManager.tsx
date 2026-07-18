"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  is_default?: boolean;
};

export function BankAccountsManager({ initialAccounts }: { initialAccounts: BankAccount[] }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function remove(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete account.");

      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setMessage("Bank account deleted successfully.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete account.");
    } finally {
      setBusyId(null);
    }
  }

  if (accounts.length === 0) {
    return <p className="mt-2 text-sm text-[var(--text-muted)]">No saved accounts. Add one when requesting a withdrawal.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {message ? <p className="text-sm text-[var(--emerald)]">{message}</p> : null}
      <ul className="space-y-2 text-sm">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 rounded border border-[var(--border)] px-3 py-2">
            <div>
              <p className="font-medium text-[var(--heading)]">
                {a.bank_name} · {a.account_number}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{a.account_name}</p>
            </div>
            <div className="flex items-center gap-2">
              {a.is_default ? <Badge variant="emerald">Default</Badge> : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-red-600"
                disabled={busyId === a.id}
                onClick={() => void remove(a.id)}
              >
                {busyId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
