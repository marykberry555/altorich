"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PackageSlug } from "@/content/packages";
import { formatNaira } from "@/lib/domain";
import { PACKAGE_TIER_CONFIG, getTierConfig } from "@/lib/packages/tier-config";
import { DataTable, SectionHeading, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { InvestmentPlan } from "@/types/database";

type Props = {
  initialPlans: InvestmentPlan[];
};

type FormState = {
  name: string;
  tier: PackageSlug;
  minInvestment: string;
};

function formForTier(tier: PackageSlug): FormState {
  const config = getTierConfig(tier)!;
  return {
    name: "",
    tier,
    minInvestment: String(config.minNgn)
  };
}

export function PlansAdminPanel({ initialPlans }: Props) {
  const [plans, setPlans] = useState(initialPlans);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(() => formForTier("starter"));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const tierPreview = useMemo(() => getTierConfig(form.tier), [form.tier]);

  const reload = async () => {
    const res = await fetch("/api/admin/plans");
    const data = await res.json();
    if (res.ok) setPlans(data);
  };

  const setTier = (tier: PackageSlug) => {
    setForm(formForTier(tier));
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          tier: form.tier,
          min_investment: parseCurrencyInput(form.minInvestment)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setMessage(`Created "${data.name}".`);
      setShowCreate(false);
      setForm(formForTier("starter"));
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(null);
    }
  };

  const deletePlan = async (plan: InvestmentPlan) => {
    if (!window.confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    setBusy(`delete-${plan.id}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setMessage(`Deleted "${plan.name}".`);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading title={`Investment sectors (${plans.length})`} />
        <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={14} />
          Add sector
        </Button>
      </div>

      {message ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm text-[var(--text-muted)]">
          {message}
        </p>
      ) : null}

      {showCreate ? (
        <Card variant="elevated" padding="md">
          <form onSubmit={createPlan} className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
              Sectors define minimum entry only — principal is unlimited. Earnings use the global Platform Earning
              Model (up to 5% daily) and cannot be set per sector.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Sector name
                <input
                  className="field"
                  placeholder={tierPreview?.title ?? "Alto Starter"}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Investment sector
                <select className="field" value={form.tier} onChange={(e) => setTier(e.target.value as PackageSlug)}>
                  {PACKAGE_TIER_CONFIG.map((tier) => (
                    <option key={tier.slug} value={tier.slug}>
                      {tier.title}
                    </option>
                  ))}
                </select>
              </label>
              <CurrencyInput
                label="Minimum Entry (₦)"
                prefix="₦"
                value={form.minInvestment}
                onChange={(v) => setForm((f) => ({ ...f, minInvestment: v }))}
                required
              />
            </div>

            {tierPreview ? (
              <p className="rounded-[var(--radius-sm)] bg-[var(--gray-100)] px-3 py-2 text-xs text-[var(--text-muted)]">
                {tierPreview.subtitle} · Weekly settlement · {tierPreview.payoutTiming} · Open-ended ({365}-day cycle)
              </p>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={busy === "create"}>
                {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create sector
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Investment Sector</TableHead>
              <TableHead>Minimum Entry</TableHead>
              <TableHead>Platform Earning Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="capitalize">{p.tier}</TableCell>
                <TableCell className="tabular-nums">{formatNaira(Number(p.min_investment ?? p.price))}</TableCell>
                <TableCell>Up to 5% daily</TableCell>
                <TableCell>
                  <StatusBadge status={p.plan_status ?? "active"} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void deletePlan(p)}
                    disabled={Boolean(busy)}
                  >
                    {busy === `delete-${p.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}
