"use client";

import { Building2 } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Card } from "@/components/ui/Card";

type Props = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferNarration: string;
  paymentInstruction?: string;
};

export function BankTransferPanel({
  bankName,
  accountName,
  accountNumber,
  transferNarration,
  paymentInstruction
}: Props) {
  return (
    <Card variant="elevated" className="h-full">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--emerald-soft)] text-[var(--emerald)]">
          <Building2 size={18} aria-hidden />
        </span>
        <h2 className="font-semibold text-[var(--heading)]">Bank Transfer</h2>
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        {paymentInstruction || "Transfer to the account below. Use your registered phone or generated reference as narration."}
      </p>
      <dl className="mt-5 space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Bank name</dt>
          <dd className="mt-1 text-base font-semibold text-[var(--heading)]">{bankName}</dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Account name</dt>
          <dd className="mt-1 text-base font-semibold text-[var(--heading)]">{accountName}</dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Account number</dt>
          <dd className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--heading)]">{accountNumber}</span>
            <CopyButton value={accountNumber} />
          </dd>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--emerald)]/30 bg-[var(--emerald-soft)]/20 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--emerald)]">Reference instructions</dt>
          <dd className="mt-1 text-sm text-[var(--text-muted)]">{transferNarration}</dd>
        </div>
      </dl>
    </Card>
  );
}
