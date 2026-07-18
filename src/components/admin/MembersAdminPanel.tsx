"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { capPhoneInput, DUPLICATE_IDENTITY_MESSAGE } from "@/lib/validation/identity";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, SectionHeading, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";
import { MemberActionsMenu, type MemberAction } from "@/components/admin/MemberActionsMenu";
import { MemberDetailPanel } from "@/components/admin/MemberDetailPanel";
import { MemberAvatar } from "@/components/profile/MemberAvatar";

type Member = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  invite_code: string | null;
  account_status: string | null;
  avatar_url: string | null;
  walletBalance: number;
};

const STATUS_BY_ACTION: Partial<Record<MemberAction, string>> = {
  pause: "paused",
  disable: "disabled",
  deactivate: "deactivated"
};

export function MembersAdminPanel({
  profileBasePath,
  dark = false
}: {
  /** When set, row click navigates to `${profileBasePath}/${id}` instead of opening the side panel. */
  profileBasePath?: string;
  dark?: boolean;
} = {}) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useFlashError();
  const [showCreate, setShowCreate] = useState(false);
  const [detailMember, setDetailMember] = useState<{ id: string; name: string } | null>(null);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    pin: "123456"
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/members?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load members");
      setMembers(data.members ?? []);
      setTotal(data.total ?? 0);
      setSelected(new Set());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleAll = () => {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} member(s)? This cannot be undone.`)) return;

    setBusy("bulk-delete");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/members/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setMessage(`Deleted ${selected.size} member(s).`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create");
    setMessage(null);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.code === "IDENTITY_TAKEN" || /already exists|already registered|already taken/i.test(data.error ?? "")
            ? DUPLICATE_IDENTITY_MESSAGE
            : (data.error ?? "Create failed");
        setCreateError(msg);
        return;
      }
      setMessage(`Created ${createForm.username}.`);
      setShowCreate(false);
      setCreateForm({ fullName: "", username: "", email: "", phone: "", pin: "123456" });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (id: string, accountStatus: string) => {
    setBusy(`status-${id}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const walletAction = async (id: string, action: "fund" | "debit") => {
    const raw = window.prompt(action === "fund" ? "Amount to fund (₦):" : "Amount to debit (₦):");
    if (!raw) return;
    const amount = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }
    const note = window.prompt("Note (optional):") ?? undefined;

    setBusy(`wallet-${id}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/members/${id}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount, note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Wallet update failed");
      setMessage(`${action === "fund" ? "Funded" : "Debited"} ${formatNaira(amount)}. New balance: ${formatNaira(data.balance)}`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Wallet update failed");
    } finally {
      setBusy(null);
    }
  };

  const handleMemberAction = (member: Member, action: MemberAction) => {
    if (action === "fund" || action === "debit") {
      void walletAction(member.id, action);
      return;
    }
    const accountStatus = STATUS_BY_ACTION[action];
    if (accountStatus) void setStatus(member.id, accountStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionHeading title="Members" description={`${total} total · tap a name for full profile · select multiple to bulk delete`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
            <UserPlus size={14} />
            Create member
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void bulkDelete()} disabled={selected.size === 0 || busy === "bulk-delete"}>
            {busy === "bulk-delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete selected ({selected.size})
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm text-[var(--text-muted)]">{message}</p>
      ) : null}

      {showCreate ? (
        <Card variant="elevated" padding="md">
          <form onSubmit={createMember} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Full name
              <input className="field" value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Username
              <input className="field" value={createForm.username} onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Email
              <input type="email" className="field" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Phone
              <input
                className="field"
                value={createForm.phone}
                maxLength={11}
                inputMode="numeric"
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: capPhoneInput(e.target.value) }))}
                required
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              PIN (6 digits)
              <input className="field" value={createForm.pin} maxLength={6} onChange={(e) => setCreateForm((f) => ({ ...f, pin: e.target.value }))} required />
            </label>
            {createError ? (
              <div className="sm:col-span-2">
                <FormFlashError message={createError} />
              </div>
            ) : null}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy === "create"}>
                {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card variant="elevated" padding="md" className="min-w-0">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="field min-w-0 max-w-full flex-1 basis-40 sm:max-w-xs"
            placeholder="Search name, username, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Search
          </Button>
        </div>

        {/* Mobile stacked cards */}
        <ul className="space-y-3 md:hidden">
          {loading ? (
            <li className="flex justify-center py-10 text-[var(--text-subtle)]">
              <Loader2 className="animate-spin" size={20} />
            </li>
          ) : members.length === 0 ? (
            <li className="py-10 text-center text-sm text-[var(--text-subtle)]">No members found</li>
          ) : (
            members.map((member) => (
              <li key={member.id} className="min-w-0 rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.has(member.id)}
                    onChange={() => toggleOne(member.id)}
                    aria-label={`Select ${member.full_name}`}
                  />
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => {
                      if (profileBasePath) router.push(`${profileBasePath.replace(/\/$/, "")}/${member.id}`);
                      else setDetailMember({ id: member.id, name: member.full_name || "Member" });
                    }}
                  >
                    <MemberAvatar
                      fullName={member.full_name || "Member"}
                      avatarUrl={member.avatar_url}
                      size="sm"
                      href={null}
                    />
                    <span className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--heading)]">{member.full_name || "—"}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        @{member.username ?? "—"} · {member.email ?? member.phone ?? member.invite_code}
                      </p>
                      <p className="mt-1 tabular-nums text-sm font-semibold text-[var(--emerald)]">
                        {formatNaira(member.walletBalance)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={member.account_status ?? "active"} />
                      </div>
                    </span>
                  </button>
                  <MemberActionsMenu
                    busy={busy === `wallet-${member.id}` || busy === `status-${member.id}`}
                    disabled={Boolean(busy && busy !== `wallet-${member.id}` && busy !== `status-${member.id}`)}
                    onAction={(action) => handleMemberAction(member, action)}
                  />
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Desktop table */}
        <div className="hidden md:block">
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={members.length > 0 && selected.size === members.length} onChange={toggleAll} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-[var(--text-subtle)]">
                      <Loader2 className="mx-auto animate-spin" size={20} />
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-[var(--text-subtle)]">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <input type="checkbox" checked={selected.has(member.id)} onChange={() => toggleOne(member.id)} aria-label={`Select ${member.full_name}`} />
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="flex items-center gap-3 text-left hover:text-[var(--emerald)]"
                          onClick={() => {
                            if (profileBasePath) router.push(`${profileBasePath.replace(/\/$/, "")}/${member.id}`);
                            else setDetailMember({ id: member.id, name: member.full_name || "Member" });
                          }}
                        >
                          <MemberAvatar
                            fullName={member.full_name || "Member"}
                            avatarUrl={member.avatar_url}
                            size="sm"
                            href={null}
                          />
                          <span className="min-w-0">
                            <p className="font-medium underline-offset-2 hover:underline">{member.full_name || "—"}</p>
                            <p className="text-xs text-[var(--text-muted)]">{member.email ?? member.phone ?? member.invite_code}</p>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>{member.username ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{formatNaira(member.walletBalance)}</TableCell>
                      <TableCell>
                        <StatusBadge status={member.account_status ?? "active"} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MemberActionsMenu
                          busy={busy === `wallet-${member.id}` || busy === `status-${member.id}`}
                          disabled={Boolean(busy && busy !== `wallet-${member.id}` && busy !== `status-${member.id}`)}
                          onAction={(action) => handleMemberAction(member, action)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTable>
        </div>
      </Card>

      {detailMember && !profileBasePath ? (
        <MemberDetailPanel memberId={detailMember.id} memberName={detailMember.name} onClose={() => setDetailMember(null)} />
      ) : null}
    </div>
  );
}
