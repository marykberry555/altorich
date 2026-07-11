"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PackageSlug } from "@/content/packages";
import { formatNaira } from "@/lib/domain";
import { defaultSimulatorPackage, weeklyEarningEstimate } from "@/lib/dashboard/conversion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  preferredPackageSlug?: PackageSlug | null;
  className?: string;
};

export function DashboardEarningsPreview({ preferredPackageSlug, className }: Props) {
  const pkg = defaultSimulatorPackage(preferredPackageSlug ?? null);
  const [amount, setAmount] = useState(Math.max(pkg.minNgn, 100_000));

  const weeklyEstimate = useMemo(() => weeklyEarningEstimate(amount, pkg.weeklyRoiBps), [amount, pkg.weeklyRoiBps]);

  return (
    <Card variant="elevated" padding="md" className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Earnings preview</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        If you invest {formatNaira(amount)} in {pkg.title} today, live earnings will begin appearing here after activation.
      </p>
      <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--emerald)]">
        ~{formatNaira(weeklyEstimate)}
        <span className="ml-2 text-sm font-medium text-[var(--text-muted)]">/ week illustration</span>
      </p>

      <label className="mt-4 block text-sm font-medium text-[var(--heading)]">
        Try a different amount
        <input
          type="range"
          min={pkg.minNgn}
          max={Math.min(pkg.maxNgn, 2_000_000)}
          step={1000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--emerald)]"
        />
        <span className="mt-1 block text-xs tabular-nums text-[var(--text-muted)]">{formatNaira(amount)}</span>
      </label>

      <p className="mt-3 text-[11px] text-[var(--text-subtle)]">Illustration only. Actual returns depend on your package and settlement schedule.</p>

      <Link href="/investments" className="mt-4 inline-block">
        <Button variant="gold" size="sm">
          Explore packages
        </Button>
      </Link>
    </Card>
  );
}
