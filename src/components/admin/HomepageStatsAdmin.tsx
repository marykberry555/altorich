"use client";

import { useState, type ReactNode } from "react";
import type { HomepageStatsConfig } from "@/lib/homepage/homepage-stats";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/design-system";

type Props = {
  initial: HomepageStatsConfig;
};

export function HomepageStatsAdmin({ initial }: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof HomepageStatsConfig>(key: K, value: HomepageStatsConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/homepage-stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifiedMembers: form.verifiedMembers,
          verifiedMembersSuffix: form.verifiedMembersSuffix,
          verifiedMembersLabel: form.verifiedMembersLabel,
          transactedTodayStart: form.transactedTodayStart,
          transactedTodayTarget: form.transactedTodayTarget,
          transactedTodayMax: form.transactedTodayMax,
          transactedTodayLabel: form.transactedTodayLabel,
          transactedTodaySuffix: form.transactedTodaySuffix,
          memberSatisfactionPercent: form.memberSatisfactionPercent,
          memberSatisfactionLabel: form.memberSatisfactionLabel,
          platformAvailabilityPercent: form.platformAvailabilityPercent,
          platformAvailabilityLabel: form.platformAvailabilityLabel,
          platformAvailabilitySupport: form.platformAvailabilitySupport,
          wealthGrowthStart: form.wealthGrowthStart,
          wealthGrowthTarget: form.wealthGrowthTarget,
          wealthGrowthSpeed: form.wealthGrowthSpeed,
          wealthGrowthHeadline: form.wealthGrowthHeadline,
          wealthGrowthDescription: form.wealthGrowthDescription,
          wealthGrowthSupport: form.wealthGrowthSupport,
          calculatorMinInvestment: form.calculatorMinInvestment,
          calculatorDailyRatePercent: form.calculatorDailyRatePercent,
          calculatorWeeklyRatePercent: form.calculatorWeeklyRatePercent,
          calculatorTitle: form.calculatorTitle,
          calculatorDescription: form.calculatorDescription,
          calculatorDisclaimer: form.calculatorDisclaimer,
          opsGraphSpeed: form.opsGraphSpeed,
          opsGraphBaseline: form.opsGraphBaseline,
          opsGraphFluctuation: form.opsGraphFluctuation,
          opsStatusLabel: form.opsStatusLabel,
          opsHeadline: form.opsHeadline,
          opsDescription: form.opsDescription,
          resetHourLagos: form.resetHourLagos,
          resetMinuteLagos: form.resetMinuteLagos
        })
      });
      const data = (await res.json()) as { stats?: HomepageStatsConfig; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save homepage stats.");
      if (data.stats) setForm(data.stats);
      setMessage("Homepage statistics saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card variant="elevated" padding="md" className="border-white/10 bg-zinc-900/80" id="homepage-stats">
      <SectionHeading title="Homepage interactive experience" />
      <p className="mb-4 text-sm text-zinc-400">
        Growth counter, earnings calculator, and live operations — Africa/Lagos reset.
      </p>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Growth counter</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Starting value (₦)">
          <input
            type="number"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.wealthGrowthStart}
            onChange={(e) => update("wealthGrowthStart", Number(e.target.value))}
          />
        </Field>
        <Field label="Ending value (₦)">
          <input
            type="number"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.wealthGrowthTarget}
            onChange={(e) => update("wealthGrowthTarget", Number(e.target.value))}
          />
        </Field>
        <Field label="Growth speed (1 = full day)">
          <input
            type="number"
            step="0.1"
            min={0.25}
            max={4}
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.wealthGrowthSpeed}
            onChange={(e) => update("wealthGrowthSpeed", Number(e.target.value))}
          />
        </Field>
        <Field label="Headline">
          <input
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.wealthGrowthHeadline}
            onChange={(e) => update("wealthGrowthHeadline", e.target.value)}
          />
        </Field>
        <Field label="Reset hour (Lagos)">
          <input
            type="number"
            min={0}
            max={23}
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.resetHourLagos}
            onChange={(e) => update("resetHourLagos", Number(e.target.value))}
          />
        </Field>
        <Field label="Reset minute (Lagos)">
          <input
            type="number"
            min={0}
            max={59}
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.resetMinuteLagos}
            onChange={(e) => update("resetMinuteLagos", Number(e.target.value))}
          />
        </Field>
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-emerald-400">Calculator</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Minimum investment (₦)">
          <input
            type="number"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.calculatorMinInvestment}
            onChange={(e) => update("calculatorMinInvestment", Number(e.target.value))}
          />
        </Field>
        <Field label="Daily rate (%)">
          <input
            type="number"
            step="0.1"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.calculatorDailyRatePercent}
            onChange={(e) => update("calculatorDailyRatePercent", Number(e.target.value))}
          />
        </Field>
        <Field label="Weekly rate (%)">
          <input
            type="number"
            step="0.1"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.calculatorWeeklyRatePercent}
            onChange={(e) => update("calculatorWeeklyRatePercent", Number(e.target.value))}
          />
        </Field>
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        Live operations graph
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Animation speed">
          <input
            type="number"
            step="0.1"
            min={0.25}
            max={3}
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.opsGraphSpeed}
            onChange={(e) => update("opsGraphSpeed", Number(e.target.value))}
          />
        </Field>
        <Field label="Baseline level (0–1)">
          <input
            type="number"
            step="0.01"
            min={0.05}
            max={0.9}
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.opsGraphBaseline}
            onChange={(e) => update("opsGraphBaseline", Number(e.target.value))}
          />
        </Field>
        <Field label="Fluctuation intensity">
          <input
            type="number"
            step="0.01"
            min={0.01}
            max={0.25}
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.opsGraphFluctuation}
            onChange={(e) => update("opsGraphFluctuation", Number(e.target.value))}
          />
        </Field>
        <Field label="Status label">
          <input
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.opsStatusLabel}
            onChange={(e) => update("opsStatusLabel", e.target.value)}
          />
        </Field>
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        Platform numbers
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Verified members">
          <input
            type="number"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.verifiedMembers}
            onChange={(e) => update("verifiedMembers", Number(e.target.value))}
          />
        </Field>
        <Field label="Transacted today — start (₦)">
          <input
            type="number"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.transactedTodayStart}
            onChange={(e) => update("transactedTodayStart", Number(e.target.value))}
          />
        </Field>
        <Field label="Transacted today — target (₦)">
          <input
            type="number"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.transactedTodayTarget}
            onChange={(e) => update("transactedTodayTarget", Number(e.target.value))}
          />
        </Field>
        <Field label="Transacted today — max (₦)">
          <input
            type="number"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.transactedTodayMax}
            onChange={(e) => update("transactedTodayMax", Number(e.target.value))}
          />
        </Field>
        <Field label="Member satisfaction (%)">
          <input
            type="number"
            step="0.1"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.memberSatisfactionPercent}
            onChange={(e) => update("memberSatisfactionPercent", Number(e.target.value))}
          />
        </Field>
        <Field label="Platform availability (%)">
          <input
            type="number"
            step="0.01"
            className="field border-white/10 bg-zinc-950 text-white"
            value={form.platformAvailabilityPercent}
            onChange={(e) => update("platformAvailabilityPercent", Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving…" : "Save homepage stats"}
        </Button>
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm text-zinc-300">
      {label}
      {children}
    </label>
  );
}
