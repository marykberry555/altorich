"use client";

import { Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/domain";
import { mapWalletTransaction, walletKindLabel } from "@/lib/financial-events/wallet-transaction";
import { formatFinancialDate, formatFinancialTime } from "@/lib/financial-events/format";
import type { WalletKind, WalletTransactionView } from "@/lib/financial-events/types";
import { StatusChip } from "./StatusChip";

type Props = {
  transactions: Array<{
    id: string;
    type: "credit" | "debit";
    amount: number;
    reference: string;
    reason: string;
    status: string;
    created_at: string;
    currency?: string;
    metadata?: Record<string, unknown> | null;
  }>;
};

const FILTERS: Array<{ id: "all" | WalletKind; label: string }> = [
  { id: "all", label: "All wallets" },
  { id: "ngn", label: "NGN Wallet" },
  { id: "welcome_bonus", label: "Welcome Bonus" },
  { id: "referral", label: "Referral Wallet" }
];

export function WalletTransactionList({ transactions }: Props) {
  const [filter, setFilter] = useState<"all" | WalletKind>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const views = useMemo(
    () => transactions.map((t) => mapWalletTransaction(t)),
    [transactions]
  );

  const filtered = filter === "all" ? views : views.filter((v) => v.walletKind === filter);

  if (views.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Your wallet is empty. Fund your account to begin your investment journey."
        action={
          <Link href="/deposits">
            <Button size="sm">Fund wallet</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Wallet filter">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.id
                ? "border-[var(--emerald)] bg-[var(--emerald)]/10 text-[var(--emerald)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--emerald)]/40"
            )}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">No transactions for this wallet yet.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((row) => (
            <TransactionRow
              key={row.id}
              row={row}
              open={expandedId === row.id}
              onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TransactionRow({
  row,
  open,
  onToggle
}: {
  row: WalletTransactionView;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <Card variant="outline" padding="md" className="transition-shadow hover:shadow-[var(--shadow-sm)]">
        <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={onToggle} aria-expanded={open}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-[var(--heading)]">{row.transactionType}</p>
              <StatusChip label={row.walletLabel} variant="outline" />
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {formatFinancialDate(row.created_at)} · {formatFinancialTime(row.created_at)}
            </p>
          </div>
          <p
            className={cn(
              "shrink-0 text-base font-semibold tabular-nums",
              row.type === "credit" ? "text-[var(--emerald)]" : "text-[var(--heading)]"
            )}
          >
            {row.type === "credit" ? "+" : "−"}
            {formatNaira(row.amount)}
          </p>
        </button>

        {open ? (
          <dl className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-2">
            <Detail label="Reference" value={row.reference} mono />
            <Detail label="Status" value={row.status} />
            <Detail label="Source" value={row.source ?? "—"} />
            <Detail label="Destination" value={row.destination ?? "—"} />
            <Detail label="Wallet" value={walletKindLabel(row.walletKind)} />
            <Detail label="Type" value={row.type} />
            <Detail label="Reason" value={row.reason.replace(/_/g, " ")} className="sm:col-span-2 capitalize" />
          </dl>
        ) : null}
      </Card>
    </li>
  );
}

function Detail({
  label,
  value,
  mono,
  className
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-[var(--text-subtle)]">{label}</dt>
      <dd className={cn("mt-0.5 font-medium capitalize text-[var(--heading)]", mono && "font-mono text-xs normal-case")}>
        {value}
      </dd>
    </div>
  );
}
