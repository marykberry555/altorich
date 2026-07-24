"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABELS,
  normalizeAccountStatus,
  type AccountStatus
} from "@/lib/account-status/policy";
import { cn } from "@/lib/utils";

type Props = {
  memberId: string;
  currentStatus?: string | null;
  disabled?: boolean;
  dark?: boolean;
  onUpdated?: (next: AccountStatus) => void;
  className?: string;
};

/**
 * Single account-status control: Active / Paused / Blocked.
 * Requires reason + confirmation before save.
 */
export function MemberAccountStatusControl({
  memberId,
  currentStatus,
  disabled,
  dark,
  onUpdated,
  className
}: Props) {
  const current = normalizeAccountStatus(currentStatus);
  const [nextStatus, setNextStatus] = useState<AccountStatus>(current);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setNextStatus(normalizeAccountStatus(currentStatus));
    setReason("");
    setMessage(null);
  }, [currentStatus, memberId]);

  const dirty = nextStatus !== current;

  async function save() {
    if (!dirty) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setMessage("A reason is required (at least 3 characters).");
      return;
    }
    const confirmed = window.confirm(
      `Change account status?\n\nCurrent: ${ACCOUNT_STATUS_LABELS[current]}\nNew: ${ACCOUNT_STATUS_LABELS[nextStatus]}\n\nReason: ${trimmed}`
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: nextStatus, reason: trimmed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Status update failed");
      setMessage(`Status updated to ${ACCOUNT_STATUS_LABELS[nextStatus]}`);
      onUpdated?.(nextStatus);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  const field =
    dark
      ? "w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
      : "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]";
  const label = dark ? "text-zinc-400" : "text-[var(--text-muted)]";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={cn("grid gap-1.5 text-sm", label)}>
          <span>Current status</span>
          <input className={field} value={ACCOUNT_STATUS_LABELS[current]} readOnly disabled />
        </label>
        <label className={cn("grid gap-1.5 text-sm", label)}>
          <span>New status</span>
          <select
            className={field}
            value={nextStatus}
            disabled={disabled || busy}
            onChange={(e) => setNextStatus(e.target.value as AccountStatus)}
          >
            {ACCOUNT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ACCOUNT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={cn("grid gap-1.5 text-sm", label)}>
        <span>Reason (required)</span>
        <textarea
          className={cn(field, "min-h-[4.5rem] resize-y")}
          value={reason}
          disabled={disabled || busy || !dirty}
          placeholder={dirty ? "Why is this status changing?" : "Select a new status to enter a reason"}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy || !dirty}
          onClick={() => {
            setNextStatus(current);
            setReason("");
            setMessage(null);
          }}
        >
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={disabled || busy || !dirty} onClick={() => void save()}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        {message ? <p className={cn("text-sm", dark ? "text-zinc-300" : "text-[var(--text-muted)]")}>{message}</p> : null}
      </div>
    </div>
  );
}
