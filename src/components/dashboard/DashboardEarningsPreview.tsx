"use client";

import { useMemo, useState } from "react";
import type { PackageSlug } from "@/content/packages";
import { PACKAGE_CONFIG } from "@/lib/packages/package-config";
import { formatNaira } from "@/lib/domain";
import { weeklyEarningEstimate } from "@/lib/dashboard/conversion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";

type Props = {
  preferredPackageSlug?: PackageSlug | null;
  className?: string;
};

export function DashboardEarningsPreview({ preferredPackageSlug, className }: Props) {
  const packages = PACKAGE_CONFIG;
  const defaultSlug = preferredPackageSlug ?? packages[0]?.slug ?? "starter";
  const [packageSlug, setPackageSlug] = useState<PackageSlug>(defaultSlug);
  const [amountRaw, setAmountRaw] = useState("100000");

  const selected = packages.find((p) => p.slug === packageSlug) ?? packages[0];
  const amount = parseCurrencyInput(amountRaw) || selected.minNgn;

  const weekly = useMemo(
    () => weeklyEarningEstimate(amount, selected.weeklyRoiBps),
    [amount, selected.weeklyRoiBps]
  );
  const monthly = weekly * 4;

  return (
    <Card variant="elevated" padding="md" className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Estimated earnings</p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Select a package and enter an amount to see an illustration of your projected returns.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[var(--text-muted)]">Package</span>
          <select
            value={packageSlug}
            onChange={(e) => setPackageSlug(e.target.value as PackageSlug)}
            className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--text)]"
          >
            {packages.map((pkg) => (
              <option key={pkg.slug} value={pkg.slug}>
                {pkg.title}
              </option>
            ))}
          </select>
        </label>

        <CurrencyInput
          label="Investment amount"
          prefix="₦"
          value={amountRaw}
          onChange={setAmountRaw}
          placeholder={formatNaira(selected.minNgn).replace("₦", "")}
        />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/50 px-4 py-3 dark:bg-[var(--surface)]/40">
          <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">Estimated weekly return</dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--emerald)]">{formatNaira(weekly)}</dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/50 px-4 py-3 dark:bg-[var(--surface)]/40">
          <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">Estimated monthly return</dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--heading)]">{formatNaira(monthly)}</dd>
        </div>
      </dl>

      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setAmountRaw(String(amount))}>
        Update illustration
      </Button>

      <p className="mt-3 text-[11px] text-[var(--text-subtle)]">*Illustration only.</p>
    </Card>
  );
}
