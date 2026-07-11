"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ReferralProgramConfig } from "@/lib/referral/config";
import type { VipLevelConfig } from "@/lib/referral/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";

type Props = {
  initialConfig: ReferralProgramConfig;
  initialVipLevels: VipLevelConfig[];
  analytics: {
    totalReferrals: number;
    verifiedReferrals: number;
    topReferrers: { referrerId: string; name: string; inviteCode: string; total: number }[];
  };
  pendingPayouts: Array<{
    id: string;
    amount: number;
    status: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    created_at: string;
    profiles?: { full_name?: string; phone?: string };
  }>;
};

export function AdminReferralManagement({ initialConfig, initialVipLevels, analytics, pendingPayouts }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [vipLevels, setVipLevels] = useState(initialVipLevels);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/referrals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, vipLevels })
    });
    setSaving(false);
    setMessage(response.ok ? "Referral settings saved." : "Save failed.");
  }

  async function payoutAction(id: string, action: "approve" | "reject" | "paid") {
    const rejectionReason = action === "reject" ? "Rejected by admin" : undefined;
    await fetch(`/api/admin/referrals/payouts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectionReason })
    });
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <Card variant="elevated" padding="md" id="referrals">
        <h2 className="text-lg font-bold text-[var(--heading)]">Referral programme</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Configure commissions, VIP tiers, and payout rules</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            Enable referral programme
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.milestone_bonuses_enabled}
              onChange={(e) => setConfig({ ...config, milestone_bonuses_enabled: e.target.checked })}
            />
            Enable milestone bonuses
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.recurring_commissions_enabled}
              onChange={(e) => setConfig({ ...config, recurring_commissions_enabled: e.target.checked })}
            />
            Recurring commissions (disabled by default)
          </label>
          <Input
            label="Minimum payout threshold"
            type="number"
            value={config.min_payout_threshold}
            onChange={(e) => setConfig({ ...config, min_payout_threshold: Number(e.target.value) })}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["starter", "growth", "elite", "premium"] as const).map((tier) => (
            <Input
              key={tier}
              label={`${tier} commission %`}
              type="number"
              step="0.1"
              value={config.commission_by_package[tier]}
              onChange={(e) =>
                setConfig({
                  ...config,
                  commission_by_package: { ...config.commission_by_package, [tier]: Number(e.target.value) }
                })
              }
            />
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-[var(--heading)]">VIP levels</h3>
          {vipLevels.map((tier, index) => (
            <div key={tier.level} className="grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-4">
              <Input label="Label" value={tier.label} onChange={(e) => updateVip(index, { label: e.target.value })} />
              <Input
                label="Verified investors required"
                type="number"
                value={tier.min_members}
                onChange={(e) => updateVip(index, { min_members: Number(e.target.value) })}
              />
              <Input
                label="Commission %"
                type="number"
                value={tier.commission_percent}
                onChange={(e) => updateVip(index, { commission_percent: Number(e.target.value) })}
              />
              <Input
                label="Milestone bonus"
                type="number"
                value={tier.milestone_bonus}
                onChange={(e) => updateVip(index, { milestone_bonus: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>

        <Button type="button" className="mt-6 gap-2" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Save referral settings
        </Button>
        {message ? <p className="mt-2 text-sm text-[var(--emerald)]">{message}</p> : null}
      </Card>

      <Card variant="elevated" padding="md">
        <h3 className="font-semibold text-[var(--heading)]">Referral analytics</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {analytics.totalReferrals} total · {analytics.verifiedReferrals} verified
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {analytics.topReferrers.map((r) => (
            <li key={r.referrerId} className="flex justify-between gap-3">
              <span>
                {r.name} <span className="text-[var(--text-subtle)]">({r.inviteCode})</span>
              </span>
              <span className="currency-ngn font-semibold tabular-nums">{formatNaira(r.total)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {pendingPayouts.length > 0 ? (
        <Card variant="elevated" padding="md" id="referral-payouts">
          <h3 className="font-semibold text-[var(--heading)]">Pending referral payouts ({pendingPayouts.length})</h3>
          <ul className="mt-4 space-y-4">
            {pendingPayouts.map((p) => (
              <li key={p.id} className="rounded-xl border border-[var(--border)] p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--heading)]">{p.profiles?.full_name ?? "Member"}</p>
                    <p className="currency-ngn tabular-nums text-[var(--emerald)]">{formatNaira(Number(p.amount))}</p>
                    <p className="text-[var(--text-muted)]">
                      {p.bank_name} · {p.account_name} · {p.account_number}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => payoutAction(p.id, "approve")}>
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => payoutAction(p.id, "paid")}>
                      Mark paid
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => payoutAction(p.id, "reject")}>
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );

  function updateVip(index: number, patch: Partial<VipLevelConfig>) {
    setVipLevels((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
}
