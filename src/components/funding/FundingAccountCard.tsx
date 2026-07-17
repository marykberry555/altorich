"use client";

import { Building2, Star } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type FundingAccountView = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPreferred?: boolean;
};

type Props = {
  account: FundingAccountView;
  className?: string;
};

export function FundingAccountCard({ account, className }: Props) {
  const initials = account.bankName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Card variant="elevated" className={cn("p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--navy)] text-sm font-bold text-white"
            aria-hidden
          >
            {initials || <Building2 size={18} />}
          </span>
          <p className="truncate text-lg font-semibold text-[var(--heading)]">{account.bankName}</p>
        </div>
        {account.isPreferred ? (
          <Badge variant="gold" className="inline-flex shrink-0 items-center gap-1">
            <Star size={12} aria-hidden />
            Preferred
          </Badge>
        ) : null}
      </div>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Account name</dt>
            <dd className="mt-1 truncate font-medium text-[var(--heading)]">{account.accountName}</dd>
          </div>
          <CopyButton value={account.accountName} label="Copy name" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Account number</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[var(--heading)] sm:text-3xl">
              {account.accountNumber}
            </dd>
          </div>
          <CopyButton value={account.accountNumber} />
        </div>
      </dl>

      <p className="mt-4 text-xs text-[var(--text-subtle)]">
        Use your Alto Rich username as your transfer narration for faster payment verification.
      </p>
    </Card>
  );
}

export function FundingAccountsGrid({ accounts }: { accounts: FundingAccountView[] }) {
  if (accounts.length === 0) {
    return (
      <Card variant="elevated" padding="lg" className="text-center">
        <Building2 className="mx-auto text-[var(--text-subtle)]" size={28} aria-hidden />
        <p className="mt-3 font-semibold text-[var(--heading)]">No receiving accounts yet</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {accounts.map((account) => (
        <FundingAccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
