"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatNaira } from "@/lib/domain";
import { DataTable, SectionHeading, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { InvestmentPlan } from "@/types/database";

type Props = {
  initialPlans: InvestmentPlan[];
};

type FormState = {
  slug: string;
  name: string;
  tier: string;
  category: string;
  price: string;
  minInvestment: string;
  maxInvestment: string;
  cycleDays: string;
  projectedDaily: string;
  settlementFrequency: "daily" | "weekly" | "monthly" | "maturity";
  description: string;
  riskDisclosure: string;
};

const emptyForm = (): FormState => ({
  slug: "",
  name: "",
  tier: "starter",
  category: "general",
  price: "",
  minInvestment: "",
  maxInvestment: "",
  cycleDays: "30",
  projectedDaily: "0",
  settlementFrequency: "weekly",
  description: "Member investment package administered by AltoRich operations.",
  riskDisclosure: "Returns are cooperative estimates, not guarantees. Capital is subject to pool performance and admin-approved settlements."
});

export function PlansAdminPanel({ initialPlans }: Props) {
  const [plans, setPlans] = useState(initialPlans);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/plans");
    const data = await res.json();
    if (res.ok) setPlans(data);
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
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          name: form.name.trim(),
          tier: form.tier,
          category: form.category,
          price: Number(form.price),
          min_investment: Number(form.minInvestment || form.price),
          max_investment: Number(form.maxInvestment || form.price),
          cycle_days: Number(form.cycleDays),
          projected_daily: Number(form.projectedDaily),
          first_bonus: 0,
          description: form.description,
          settlement_frequency: form.settlementFrequency,
          plan_status: "active",
          visibility: "members",
          is_active: true,
          sort_order: plans.length,
          risk_disclosure: form.riskDisclosure
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setMessage(`Created package "${form.name}".`);
      setShowCreate(false);
      setForm(emptyForm());
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
        <SectionHeading title={`Investment plans (${plans.length})`} />
        <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={14} />
          Add package
        </Button>
      </div>

      {message ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm text-[var(--text-muted)]">
          {message}
        </p>
      ) : null}

      {showCreate ? (
        <Card variant="elevated" padding="md">
          <form onSubmit={createPlan} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Slug
              <input className="field" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Name
              <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Tier
              <select className="field" value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Category
              <input className="field" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Price (₦)
              <input className="field" type="number" min="1" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Min investment (₦)
              <input className="field" type="number" min="1" value={form.minInvestment} onChange={(e) => setForm((f) => ({ ...f, minInvestment: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              Max investment (₦)
              <input className="field" type="number" min="1" value={form.maxInvestment} onChange={(e) => setForm((f) => ({ ...f, maxInvestment: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              Cycle (days)
              <input className="field" type="number" min="1" value={form.cycleDays} onChange={(e) => setForm((f) => ({ ...f, cycleDays: e.target.value }))} required />
            </label>
            <label className="grid gap-1 text-sm">
              Projected daily (₦)
              <input className="field" type="number" min="0" value={form.projectedDaily} onChange={(e) => setForm((f) => ({ ...f, projectedDaily: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              Settlement
              <select
                className="field"
                value={form.settlementFrequency}
                onChange={(e) => setForm((f) => ({ ...f, settlementFrequency: e.target.value as FormState["settlementFrequency"] }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="maturity">Maturity</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Description
              <textarea className="field min-h-20" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy === "create"}>
                {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create package
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
              <TableHead>Min–Max</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="tabular-nums">
                  {formatNaira(Number(p.min_investment ?? p.price))} – {formatNaira(Number(p.max_investment ?? p.price))}
                </TableCell>
                <TableCell className="capitalize">{p.settlement_frequency ?? "daily"}</TableCell>
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
