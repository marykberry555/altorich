"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { adminAppPath } from "@/lib/admin-app/constants";
import { Button } from "@/components/ui/Button";
import { AdminQuickActions, type AdminQuickAction } from "@/components/admin-app/AdminQuickActions";
import type { Database } from "@/types/database";

type MemberDetail = {
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  email: string | null;
  walletBalance: number;
  walletTransactions: Database["public"]["Tables"]["wallet_transactions"]["Row"][];
  investments: Array<
    Database["public"]["Tables"]["investments"]["Row"] & {
      investment_plans: { name: string; slug: string; settlement_frequency: string | null } | null;
    }
  >;
  withdrawals: Database["public"]["Tables"]["withdrawals"]["Row"][];
  deposits: Database["public"]["Tables"]["deposits"]["Row"][];
  referrals: Database["public"]["Tables"]["referrals"]["Row"][];
  bankAccounts: Database["public"]["Tables"]["bank_accounts"]["Row"][];
  loginActivity: Database["public"]["Tables"]["login_activity"]["Row"][];
  auditLogs: Database["public"]["Tables"]["audit_logs"]["Row"][];
  vipLevels: Array<{ level: number; name: string; min_referrals: number }>;
};

type AdminNote = {
  id: string;
  body: string;
  author_name?: string;
  created_at: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminMemberProfileView({ memberId }: { memberId: string }) {
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, notesRes] = await Promise.all([
        fetch(`/api/admin/members/${memberId}`, { cache: "no-store" }),
        fetch(`/api/admin/members/${memberId}/notes`, { cache: "no-store" })
      ]);
      const detailData = await detailRes.json();
      if (!detailRes.ok) throw new Error(detailData.error ?? "Failed to load member");
      setDetail(detailData);
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load member");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runWalletAction(action: "fund" | "debit") {
    const raw = window.prompt(`Enter amount to ${action} (₦):`);
    if (!raw) return;
    const amount = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Wallet action failed");
      setMessage(`Wallet updated · balance ${formatNaira(data.balance)}`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function runQuickAction(action: AdminQuickAction) {
    setBusy(true);
    setMessage(null);
    try {
      if (action === "fund") {
        await runWalletAction("fund");
        return;
      }
      if (action === "debit") {
        await runWalletAction("debit");
        return;
      }

      if (action === "approve_deposit" || action === "reject_deposit") {
        const pending = detail?.deposits.find((d) => d.status === "pending");
        if (!pending) throw new Error("No pending deposit");
        const res = await fetch(`/api/deposits/${pending.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "approve_deposit" ? "approved" : "rejected",
            rejectionReason: action === "reject_deposit" ? window.prompt("Rejection reason") ?? "Not approved" : undefined
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Deposit action failed");
        setMessage("Deposit updated");
        await load();
        return;
      }

      if (action === "approve_withdrawal" || action === "reject_withdrawal") {
        const pending = detail?.withdrawals.find((w) => w.status === "pending" || w.status === "scheduled");
        if (!pending) throw new Error("No pending withdrawal");
        const res = await fetch(`/api/admin/withdrawals/${pending.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "approve_withdrawal" ? "approved" : "rejected",
            rejectionReason: action === "reject_withdrawal" ? window.prompt("Rejection reason") ?? "Not approved" : undefined
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Withdrawal action failed");
        setMessage("Withdrawal updated");
        await load();
        return;
      }

      const payload: Record<string, unknown> = { action };

      if (action === "assign_package" || action === "change_package") {
        const slug = window.prompt("Package slug");
        if (!slug) return;
        payload.packageSlug = slug;
      }

      const map: Partial<Record<AdminQuickAction, string>> = {
        suspend: "suspend",
        unsuspend: "unsuspend",
        reset_pin: "reset_pin",
        reset_password: "reset_password",
        disable_login: "disable_login",
        enable_login: "enable_login",
        assign_package: "assign_package",
        change_package: "change_package"
      };

      if (map[action]) payload.action = map[action];
      else if (!payload.action) return;

      const res = await fetch(`/api/admin/members/${memberId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage("Action completed");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save note");
      setNoteDraft("");
      setNotes((prev) => [data.note, ...prev]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setBusy(false);
    }
  }

  const vipLevel = detail?.profile.vip_level ?? 0;
  const nextVip = detail?.vipLevels.find((v) => v.level > vipLevel);
  const referralCount = detail?.referrals.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={adminAppPath("/members")} className="mb-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline">
            <ArrowLeft size={14} />
            Back to members
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Member profile</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{detail?.profile.full_name ?? "Member"}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {detail?.email ?? detail?.profile.phone ?? detail?.profile.username ?? detail?.profile.invite_code}
          </p>
        </div>
        <AdminQuickActions busy={busy} onAction={(action) => void runQuickAction(action)} />
      </header>

      {message ? <p className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-200">{message}</p> : null}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-zinc-400" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : detail ? (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
              <p className="text-xs text-zinc-400">Wallet balance</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white">{formatNaira(detail.walletBalance)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
              <p className="text-xs text-zinc-400">Account status</p>
              <p className="mt-1 text-xl font-semibold capitalize text-white">{detail.profile.account_status}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
              <p className="text-xs text-zinc-400">VIP level</p>
              <p className="mt-1 text-xl font-semibold text-white">Level {vipLevel}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
              <p className="text-xs text-zinc-400">Referrals</p>
              <p className="mt-1 text-xl font-semibold text-white">{referralCount}</p>
            </div>
          </section>

          {nextVip ? (
            <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
              <h2 className="text-sm font-semibold text-white">VIP progress</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {referralCount} / {nextVip.min_referrals} referrals toward {nextVip.name}
              </p>
            </section>
          ) : null}

          <ProfileSection title="Investments">
            {detail.investments.length === 0 ? (
              <EmptyRow />
            ) : (
              detail.investments.map((inv) => (
                <Row key={inv.id} primary={inv.investment_plans?.name ?? "Investment"} secondary={`${formatNaira(inv.amount)} · ${inv.status}`} meta={formatDate(inv.created_at)} />
              ))
            )}
          </ProfileSection>

          <ProfileSection title="Funding history">
            {detail.deposits.length === 0 ? (
              <EmptyRow />
            ) : (
              detail.deposits.map((d) => (
                <Row key={d.id} primary={formatNaira(d.amount)} secondary={d.status} meta={formatDate(d.created_at)} />
              ))
            )}
          </ProfileSection>

          <ProfileSection title="Withdrawal history">
            {detail.withdrawals.length === 0 ? (
              <EmptyRow />
            ) : (
              detail.withdrawals.map((w) => (
                <Row key={w.id} primary={formatNaira(w.amount)} secondary={w.status} meta={formatDate(w.created_at)} />
              ))
            )}
          </ProfileSection>

          <ProfileSection title="Referral tree">
            {detail.referrals.length === 0 ? (
              <EmptyRow />
            ) : (
              detail.referrals.map((r) => (
                <Row
                  key={String(r.id)}
                  primary={`Referred ${String(r.referred_id).slice(0, 8)}…`}
                  secondary={String(r.status)}
                  meta={formatDate(String(r.created_at))}
                />
              ))
            )}
          </ProfileSection>

          <ProfileSection title="Bank accounts">
            {detail.bankAccounts.length === 0 ? (
              <EmptyRow />
            ) : (
              detail.bankAccounts.map((b) => (
                <Row key={b.id} primary={b.bank_name ?? "Bank"} secondary={b.account_number ?? ""} meta={formatDate(b.created_at)} />
              ))
            )}
          </ProfileSection>

          <ProfileSection title="Activity timeline">
            {[...detail.loginActivity.map((a) => ({ type: "login", at: a.created_at, label: `Login · ${a.browser} / ${a.operating_system}` })), ...detail.auditLogs.map((a) => ({ type: "audit", at: a.created_at, label: a.action }))]
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
              .slice(0, 20)
              .map((item, idx) => (
                <Row key={`${item.type}-${idx}`} primary={item.label} secondary={item.type} meta={formatDate(item.at)} />
              ))}
          </ProfileSection>

          <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <h2 className="text-sm font-semibold text-white">Admin notes</h2>
            <p className="mt-1 text-xs text-zinc-500">Private to admins — never visible to members.</p>
            <form onSubmit={(e) => void saveNote(e)} className="mt-3 space-y-2">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="Add an internal note…"
              />
              <Button type="submit" size="sm" disabled={busy || !noteDraft.trim()}>
                Save note
              </Button>
            </form>
            <ul className="mt-4 space-y-2">
              {notes.length === 0 ? (
                <li className="text-sm text-zinc-400">No notes yet</li>
              ) : (
                notes.map((note) => (
                  <li key={note.id} className="rounded-lg border border-white/5 px-3 py-2">
                    <p className="text-sm text-zinc-100">{note.body}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
                      {note.author_name ?? "Admin"} · {formatDate(note.created_at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function Row({ primary, secondary, meta }: { primary: string; secondary: string; meta: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-white">{primary}</p>
        <p className="text-xs text-zinc-400">{secondary}</p>
      </div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{meta}</p>
    </li>
  );
}

function EmptyRow() {
  return <li className="text-sm text-zinc-400">None recorded</li>;
}
