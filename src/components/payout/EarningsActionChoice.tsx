"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw, Wallet } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  availableBalance: number;
  preferredPackageHref?: string;
};

/** After Monday settlement — clear choice: withdraw earnings or reinvest. */
export function EarningsActionChoice({ availableBalance, preferredPackageHref = "/investments" }: Props) {
  if (availableBalance <= 0) return null;

  return (
    <Card variant="elevated" padding="md" className="space-y-4 border-[var(--emerald)]/20 bg-[var(--emerald-soft)]/40">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Available balance</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--heading)]">{formatNaira(availableBalance)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/withdrawals#request" className="block">
          <Button variant="primary" size="md" className="w-full gap-2">
            <Wallet size={16} />
            Withdraw
            <ArrowRight size={14} aria-hidden />
          </Button>
        </Link>
        <Link href={preferredPackageHref} className="block">
          <Button variant="gold" size="md" className="w-full gap-2">
            <RefreshCw size={16} />
            Reinvest
          </Button>
        </Link>
      </div>
    </Card>
  );
}
