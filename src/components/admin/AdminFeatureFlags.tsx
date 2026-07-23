"use client";

import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import type { FeatureFlags } from "@/lib/feature-flags";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  initial: FeatureFlags;
};

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-[var(--border)] px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-[var(--heading)]">{label}</span>
        <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[var(--emerald)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function AdminFeatureFlags({ initial }: Props) {
  const [flags, setFlags] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const payload: FeatureFlags = {
        ...flags,
        // Keep asset flags aligned with the fixed payment-rails catalog.
        enable_usdt: true,
        enable_usdc: true,
        enable_bitcoin: true
      };
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Unable to save settings.");
        return;
      }
      const updated = await res.json();
      setFlags(updated);
      setMessage("Feature flags saved.");
    } catch {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card variant="elevated" padding="md" id="feature-flags">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--heading)]">Feature flags</h2>
      </div>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Prefer <span className="font-medium text-[var(--heading)]">Payment rails</span> for crypto on/off. These
        master switches stay in sync with that page. Supported assets are USDT, USDC, BTC, and ETH.
      </p>

      <div className="mt-5 space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Identity</legend>
          <ToggleRow
            label="Require KYC for withdrawals"
            description="When off, members can request withdrawals without identity verification."
            checked={flags.kyc_required}
            onChange={(v) => setFlags((f) => ({ ...f, kyc_required: v }))}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Crypto</legend>
          <ToggleRow
            label="Enable crypto funding"
            description="Opens crypto deposits for members (same as Payment rails)."
            checked={flags.enable_crypto_funding}
            onChange={(v) => setFlags((f) => ({ ...f, enable_crypto_funding: v }))}
          />
          <ToggleRow
            label="Enable crypto withdrawals"
            description="Opens crypto payouts for members (same as Payment rails)."
            checked={flags.enable_crypto_payouts}
            onChange={(v) => setFlags((f) => ({ ...f, enable_crypto_payouts: v }))}
          />
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Save feature flags
        </Button>
        {message ? <span className="text-sm text-[var(--text-muted)]">{message}</span> : null}
      </div>
    </Card>
  );
}
