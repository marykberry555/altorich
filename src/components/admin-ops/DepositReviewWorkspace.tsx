"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ExternalLink, Loader2, MessageSquare, X } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { adminAppPath } from "@/lib/admin-app/constants";
import { Button } from "@/components/ui/Button";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

type DepositRow = {
  id: string;
  user_id: string;
  member_name: string;
  phone: string | null;
  amount: number;
  status: string;
  reference: string;
  receipt_note: string | null;
  payment_provider: string | null;
  created_at: string;
  proofHref: string | null;
  priorDeposits: { id: string; amount: number; status: string; created_at: string }[];
  duplicateReference: boolean;
};

export function DepositReviewWorkspace() {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: string; title: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/deposits?status=pending", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load pending deposits.");
      }
      setDeposits(data.deposits ?? []);
    } catch (err) {
      setDeposits([]);
      setLoadError(err instanceof Error ? err.message : "Could not load pending deposits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(id: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/deposits/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-AltoRich-Client": "admin-app"
        },
        credentials: "same-origin",
        body: JSON.stringify({ status })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Action failed");
      }
      await load();
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 size={16} className="animate-spin" /> Loading pending deposits…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {loadError}
        </div>
      ) : null}
      {!loading && !loadError && deposits.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-8 text-center">
          <p className="text-sm text-zinc-300">No pending deposits awaiting review.</p>
        </div>
      ) : null}
      {deposits.length === 0 ? null : (
        deposits.map((deposit) => (
          <article
            key={deposit.id}
            className="rounded-xl border border-white/10 bg-zinc-900/80 p-5"
            aria-label={`Deposit review ${deposit.reference}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={adminAppPath(`/members/${deposit.user_id}`)} className="font-semibold text-white hover:text-emerald-400">
                  {deposit.member_name}
                </Link>
                <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-400">{formatNaira(Number(deposit.amount))}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Submitted {new Date(deposit.created_at).toLocaleString("en-NG")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {deposit.duplicateReference ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-300">
                    <AlertTriangle size={12} /> Duplicate reference
                  </span>
                ) : null}
                {deposit.priorDeposits.length === 0 ? (
                  <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-300">
                    First deposit
                  </span>
                ) : null}
              </div>
            </div>

            <dl className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Transfer reference</dt>
                <dd className="font-mono text-zinc-300">{deposit.receipt_note?.trim() || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Internal reference</dt>
                <dd className="font-mono text-zinc-300">{deposit.reference}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Bank / provider</dt>
                <dd>{deposit.payment_provider ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Receipt</dt>
                <dd>
                  {deposit.proofHref ? (
                    <a href={deposit.proofHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline">
                      View receipt <ExternalLink size={12} />
                    </a>
                  ) : (
                    "Not attached"
                  )}
                </dd>
              </div>
            </dl>

            {deposit.priorDeposits.length > 0 ? (
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Previous deposits</p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  {deposit.priorDeposits.map((p) => (
                    <li key={p.id}>
                      {formatNaira(Number(p.amount))} · {p.status} · {new Date(p.created_at).toLocaleDateString("en-NG")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <label className="mt-4 block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Admin notes</span>
              <textarea
                value={notes[deposit.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [deposit.id]: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Internal note (not persisted until notes API connected)"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy === deposit.id}
                onClick={() => setConfirm({ id: deposit.id, action: "approved", title: "Approve this deposit?" })}
              >
                <Check size={14} /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy === deposit.id}
                onClick={() => setConfirm({ id: deposit.id, action: "rejected", title: "Reject this deposit?" })}
              >
                <X size={14} /> Reject
              </Button>
              <Button size="sm" variant="outline" disabled title="Requires clarification workflow">
                <MessageSquare size={14} /> Request clarification
              </Button>
            </div>
          </article>
        ))
      )}

      <AdminConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        description="This action will update the deposit status. Confirm to proceed."
        confirmLabel="Confirm"
        destructive={confirm?.action === "rejected"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && void runAction(confirm.id, confirm.action)}
      />
    </div>
  );
}
