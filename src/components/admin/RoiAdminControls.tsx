"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function RoiAdminControls(props: {
  exchangeRateNgnPerUsd: number;
  bankEnabled: boolean;
  cryptoEnabled: boolean;
  cryptoAddress: string;
}) {
  const [rate, setRate] = useState(props.exchangeRateNgnPerUsd);
  const [bankEnabled, setBankEnabled] = useState(props.bankEnabled);
  const [cryptoEnabled, setCryptoEnabled] = useState(props.cryptoEnabled);
  const [cryptoAddress, setCryptoAddress] = useState(props.cryptoAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function save() {
    setSaving(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch("/api/admin/roi/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roi_exchange_rate: { ngn_per_usd: Number(rate) },
          roi_payout_destinations: {
            bank_enabled: Boolean(bankEnabled),
            crypto_enabled: Boolean(cryptoEnabled),
            crypto_address: cryptoAddress || undefined
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        setSaving(false);
        return;
      }
      setOk(true);
      setSaving(false);
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }

  async function runSettle() {
    setSaving(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch("/api/admin/roi/settle", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to run settle.");
        setSaving(false);
        return;
      }
      setOk(true);
      setSaving(false);
      alert(`Settled ${data.settled ?? 0} investments`);
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }

  return (
    <Card variant="elevated" padding="md" id="roi">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Weekly ROI controls</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--heading)]">Exchange rate & payout toggles</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">These settings control dual-currency display and payout options.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={runSettle} disabled={saving}>
            Run ROI settle
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save ROI settings"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">NGN per USD</span>
          <input className="field" type="number" min={1} step={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </label>

        <label className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm">
          <input type="checkbox" checked={bankEnabled} onChange={(e) => setBankEnabled(e.target.checked)} />
          <span className="text-[var(--heading)]">Bank payouts enabled</span>
        </label>

        <label className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm">
          <input type="checkbox" checked={cryptoEnabled} onChange={(e) => setCryptoEnabled(e.target.checked)} />
          <span className="text-[var(--heading)]">Crypto payouts enabled</span>
        </label>

        <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Global crypto deposit address</span>
          <input className="field" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} placeholder="USDT address..." />
        </label>
      </div>

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
      {ok ? <p className="mt-3 text-xs text-[var(--emerald)]">Saved.</p> : null}
    </Card>
  );
}

