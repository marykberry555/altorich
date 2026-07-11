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
  displayName?: string | null;
  fundingInstructions?: string | null;
  isPreferred?: boolean;
};

type Props = {
  account: FundingAccountView;
  className?: string;
};

function bankInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function FundingAccountCard({ account, className }: Props) {
  const title = account.displayName?.trim() || account.bankName;

  return (
    <Card variant="elevated" className={cn("h-full", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-sm font-bold text-[var(--emerald)]">
            {bankInitials(account.bankName)}
          </span>
          <div>
            <p className="font-semibold text-[var(--heading)]">{title}</p>
            <p className="text-sm text-[var(--text-muted)]">{account.bankName}</p>
          </div>
        </div>
        {account.isPreferred ? (
          <Badge variant="gold" className="inline-flex items-center gap-1">
            <Star size={12} aria-hidden />
            Preferred
          </Badge>
        ) : null}
      </div>

      <dl className="mt-5 space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Account name</dt>
          <dd className="mt-1 flex items-center justify-between gap-3">
            <span className="font-semibold text-[var(--heading)]">{account.accountName}</span>
            <CopyButton value={account.accountName} label="Copy name" />
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Account number</dt>
          <dd className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--heading)]">{account.accountNumber}</span>
            <CopyButton value={account.accountNumber} />
          </dd>
        </div>
      </dl>

      {account.fundingInstructions ? (
        <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{account.fundingInstructions}</p>
      ) : null}
    </Card>
  );
}

export function FundingAccountsGrid({ accounts }: { accounts: FundingAccountView[] }) {
  if (accounts.length === 0) {
    return (
      <Card variant="elevated" padding="lg" className="text-center">
        <Building2 className="mx-auto text-[var(--text-subtle)]" size={28} aria-hidden />
        <p className="mt-3 font-semibold text-[var(--heading)]">Funding accounts are being configured</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Please check back shortly or contact support.</p>
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
