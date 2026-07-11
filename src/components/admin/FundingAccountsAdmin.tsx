"use client";

import { useMemo, useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";
import type { FundingAccount } from "@/services/funding/funding-account.service";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Props = {
  initialAccounts: FundingAccount[];
};

type FormState = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode: string;
  displayName: string;
  fundingInstructions: string;
  displayOrder: string;
  status: "active" | "inactive" | "maintenance";
  isPreferred: boolean;
};

const emptyForm = (): FormState => ({
  bankName: "",
  accountName: "",
  accountNumber: "",
  sortCode: "",
  displayName: "",
  fundingInstructions: "",
  displayOrder: "0",
  status: "active",
  isPreferred: false
});

function statusBadge(status: FundingAccount["status"]) {
  if (status === "active") return <Badge variant="emerald">Active</Badge>;
  if (status === "maintenance") return <Badge variant="gold">Maintenance</Badge>;
  return <Badge variant="outline">Inactive</Badge>;
}

export function FundingAccountsAdmin({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        if (a.is_preferred !== b.is_preferred) return a.is_preferred ? -1 : 1;
        return a.display_order - b.display_order;
      }),
    [accounts]
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setOpen(true);
  }

  function openEdit(account: FundingAccount) {
    setEditingId(account.id);
    setForm({
      bankName: account.bank_name,
      accountName: account.account_name,
      accountNumber: account.account_number,
      sortCode: account.sort_code ?? "",
      displayName: account.display_name ?? "",
      fundingInstructions: account.funding_instructions ?? "",
      displayOrder: String(account.display_order),
      status: account.status,
      isPreferred: account.is_preferred
    });
    setError("");
    setOpen(true);
  }

  async function refresh() {
    const res = await fetch("/api/admin/funding-accounts");
    const data = await res.json();
    if (res.ok) setAccounts(data.accounts ?? []);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      bankName: form.bankName,
      accountName: form.accountName,
      accountNumber: form.accountNumber,
      sortCode: form.sortCode || undefined,
      displayName: form.displayName || undefined,
      fundingInstructions: form.fundingInstructions || undefined,
      displayOrder: Number(form.displayOrder) || 0,
      status: form.status,
      isPreferred: form.isPreferred
    };

    const res = await fetch(editingId ? `/api/admin/funding-accounts/${editingId}` : "/api/admin/funding-accounts", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save account.");
      return;
    }

    setOpen(false);
    await refresh();
  }

  async function setPreferred(id: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/funding-accounts/${id}/prefer`, { method: "POST" });
    setLoading(false);
    if (res.ok) await refresh();
  }

  async function disableAccount(id: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/funding-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "inactive" })
    });
    setLoading(false);
    if (res.ok) await refresh();
  }

  async function deleteAccount(id: string) {
    if (!window.confirm("Delete this funding account?")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/funding-accounts/${id}`, { method: "DELETE" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not delete account.");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Funding accounts</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Bank receiving accounts</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage multiple Nigerian bank accounts shown to members on the funding page.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add account
        </Button>
      </div>

      {error && !open ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4">
        {sortedAccounts.map((account) => (
          <Card key={account.id} variant="elevated" padding="md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--heading)]">{account.display_name || account.bank_name}</h2>
                  {statusBadge(account.status)}
                  {account.is_preferred ? (
                    <Badge variant="gold" className="inline-flex items-center gap-1">
                      <Star size={12} aria-hidden />
                      Preferred
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {account.bank_name} · {account.account_name} · {account.account_number}
                </p>
                {account.funding_instructions ? (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{account.funding_instructions}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {!account.is_preferred ? (
                  <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => setPreferred(account.id)}>
                    Set default
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => openEdit(account)}>
                  <Pencil size={14} />
                  Edit
                </Button>
                {account.status === "active" ? (
                  <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => disableAccount(account.id)}>
                    Disable
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() =>
                      fetch(`/api/admin/funding-accounts/${account.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "active" })
                      }).then(refresh)
                    }
                  >
                    Activate
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => deleteAccount(account.id)}>
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Close" />
          <Card variant="elevated" padding="lg" className="relative z-10 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-[var(--heading)]">{editingId ? "Edit account" : "Add account"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <Input label="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
              <Input label="Account name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} required />
              <Input label="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
              <Input label="Sort code (optional)" value={form.sortCode} onChange={(e) => setForm({ ...form, sortCode: e.target.value })} />
              <Input label="Display name (optional)" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              <label className="grid gap-1 text-sm">
                Funding instructions (optional)
                <textarea
                  className="field min-h-20"
                  value={form.fundingInstructions}
                  onChange={(e) => setForm({ ...form, fundingInstructions: e.target.value })}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Display order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
                <label className="grid gap-1 text-sm">
                  Status
                  <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPreferred} onChange={(e) => setForm({ ...form, isPreferred: e.target.checked })} />
                Mark as preferred account
              </label>
              {error ? <p className="text-xs text-red-600">{error}</p> : null}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Saving..." : "Save account"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
