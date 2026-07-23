"use client";

import { useMemo, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ResolvedPaymentRails } from "@/config/payment-rails";
import type { PaymentRailsLiveState } from "@/config/payment-rails";
import type { CryptoAssetCode, CryptoNetworkCode, PlatformCryptoAddress } from "@/config/payment-rails";

type Props = {
  initialResolved: ResolvedPaymentRails;
  initialLive: PaymentRailsLiveState;
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-white/10 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-400">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-emerald-500"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function PaymentRailsAdminPanel({ initialResolved, initialLive }: Props) {
  const [bankDeposit, setBankDeposit] = useState(initialResolved.rails.bank.deposit.enabled);
  const [bankWithdrawal, setBankWithdrawal] = useState(initialResolved.rails.bank.withdrawal.enabled);
  const [cryptoDeposit, setCryptoDeposit] = useState(initialResolved.rails.crypto.deposit.enabled);
  const [cryptoWithdrawal, setCryptoWithdrawal] = useState(initialResolved.rails.crypto.withdrawal.enabled);
  const [bankDepositMaint, setBankDepositMaint] = useState(initialResolved.rails.bank.deposit.maintenanceMode);
  const [bankWithdrawMaint, setBankWithdrawMaint] = useState(initialResolved.rails.bank.withdrawal.maintenanceMode);
  const [cryptoDepositMaint, setCryptoDepositMaint] = useState(initialResolved.rails.crypto.deposit.maintenanceMode);
  const [cryptoWithdrawMaint, setCryptoWithdrawMaint] = useState(
    initialResolved.rails.crypto.withdrawal.maintenanceMode
  );

  const [assets, setAssets] = useState(initialResolved.cryptoAssets);
  const [networks, setNetworks] = useState(initialResolved.cryptoNetworks);
  const [addresses, setAddresses] = useState<PlatformCryptoAddress[]>(
    initialResolved.platformAddresses.length
      ? initialResolved.platformAddresses
      : [{ asset: "USDT", network: "TRC20", address: "", label: "Primary USDT" }]
  );
  const [reason, setReason] = useState(initialLive.lastChangeReason ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const summary = useMemo(
    () =>
      [
        bankDeposit ? "Bank deposits ON" : "Bank deposits OFF",
        bankWithdrawal ? "Bank withdrawals ON" : "Bank withdrawals OFF",
        cryptoDeposit ? "Crypto deposits ON" : "Crypto deposits OFF",
        cryptoWithdrawal ? "Crypto withdrawals ON" : "Crypto withdrawals OFF"
      ].join(" · "),
    [bankDeposit, bankWithdrawal, cryptoDeposit, cryptoWithdrawal]
  );

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const trimmedAddresses = addresses.filter((a) => a.address.trim());
      if (cryptoDeposit && trimmedAddresses.length === 0 && initialResolved.platformAddresses.length === 0) {
        setMessage("Add at least one platform receive address before enabling crypto deposits.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/payment-rails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastChangeReason: reason.trim() || null,
          rails: {
            bank: {
              deposit: { enabled: bankDeposit, maintenanceMode: bankDepositMaint },
              withdrawal: { enabled: bankWithdrawal, maintenanceMode: bankWithdrawMaint }
            },
            crypto: {
              deposit: { enabled: cryptoDeposit, maintenanceMode: cryptoDepositMaint },
              withdrawal: { enabled: cryptoWithdrawal, maintenanceMode: cryptoWithdrawMaint }
            }
          },
          cryptoAssets: assets.map((a) => ({
            code: a.code,
            enabled: a.enabled,
            networks: a.networks,
            displayName: a.displayName
          })),
          cryptoNetworks: networks.map((n) => ({
            code: n.code,
            enabled: n.enabled,
            warning: n.warning,
            displayName: n.displayName
          })),
          // Only send addresses when publishing some — never wipe existing rows with an empty save.
          ...(trimmedAddresses.length > 0 ? { platformAddresses: trimmedAddresses } : {})
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Unable to save payment rails.");
        return;
      }
      setMessage(
        cryptoDeposit && trimmedAddresses.length === 0
          ? "Payment rails saved. Crypto deposits stay limited until you publish a receive address."
          : "Payment rails saved — changes are live immediately."
      );
    } catch {
      setMessage("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  function updateAddress(index: number, patch: Partial<PlatformCryptoAddress>) {
    setAddresses((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <Card variant="elevated" padding="md" className="border-white/10 bg-zinc-900/80" id="payment-rails">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-emerald-400" aria-hidden />
        <h2 className="text-lg font-semibold text-white">Payment rails</h2>
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        Enable or disable Bank and Crypto deposit/withdrawal rails independently. Changes apply immediately — no
        rebuild or redeploy.
      </p>
      <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
        {summary}
      </p>

      <div className="mt-6 space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bank rail</legend>
          <ToggleRow
            label="Enable bank deposits"
            description="Show bank transfer instructions and accept bank deposit proofs."
            checked={bankDeposit}
            onChange={setBankDeposit}
          />
          <ToggleRow
            label="Bank deposits maintenance"
            description="Keep bank deposit rail configured but temporarily closed."
            checked={bankDepositMaint}
            onChange={setBankDepositMaint}
            disabled={!bankDeposit}
          />
          <ToggleRow
            label="Enable bank withdrawals"
            description="Allow members to request Naira bank payouts."
            checked={bankWithdrawal}
            onChange={setBankWithdrawal}
          />
          <ToggleRow
            label="Bank withdrawals maintenance"
            description="Temporarily close bank payouts without disabling the rail permanently."
            checked={bankWithdrawMaint}
            onChange={setBankWithdrawMaint}
            disabled={!bankWithdrawal}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Crypto rail</legend>
          <ToggleRow
            label="Enable crypto deposits"
            description="Show wallet addresses and accept crypto deposit submissions."
            checked={cryptoDeposit}
            onChange={setCryptoDeposit}
          />
          <ToggleRow
            label="Crypto deposits maintenance"
            description="Temporarily close crypto funding."
            checked={cryptoDepositMaint}
            onChange={setCryptoDepositMaint}
            disabled={!cryptoDeposit}
          />
          <ToggleRow
            label="Enable crypto withdrawals"
            description="Allow members to request payouts to crypto wallets."
            checked={cryptoWithdrawal}
            onChange={setCryptoWithdrawal}
          />
          <ToggleRow
            label="Crypto withdrawals maintenance"
            description="Temporarily close crypto payouts."
            checked={cryptoWithdrawMaint}
            onChange={setCryptoWithdrawMaint}
            disabled={!cryptoWithdrawal}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Supported assets</legend>
          {assets.map((asset) => (
            <ToggleRow
              key={asset.code}
              label={asset.displayName}
              description={`Networks: ${asset.networks.join(", ")}`}
              checked={asset.enabled}
              onChange={(v) =>
                setAssets((prev) => prev.map((a) => (a.code === asset.code ? { ...a, enabled: v } : a)))
              }
            />
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Networks</legend>
          {networks.map((network) => (
            <ToggleRow
              key={network.code}
              label={network.displayName}
              description={network.warning}
              checked={network.enabled}
              onChange={(v) =>
                setNetworks((prev) => prev.map((n) => (n.code === network.code ? { ...n, enabled: v } : n)))
              }
            />
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Platform receive addresses
          </legend>
          <p className="text-xs text-zinc-400">
            Members only see usable crypto deposit addresses after you publish at least one row below. Leaving rows
            blank when saving will not wipe addresses that are already live.
          </p>
          {addresses.map((row, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-4">
              <label className="grid gap-1 text-xs text-zinc-400">
                Asset
                <select
                  className="field border-white/10 bg-zinc-950 text-white"
                  value={row.asset}
                  onChange={(e) => updateAddress(index, { asset: e.target.value as CryptoAssetCode })}
                >
                  {(["USDT", "USDC", "BTC", "ETH"] as CryptoAssetCode[]).map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-zinc-400">
                Network
                <select
                  className="field border-white/10 bg-zinc-950 text-white"
                  value={row.network}
                  onChange={(e) => updateAddress(index, { network: e.target.value as CryptoNetworkCode })}
                >
                  {(["TRC20", "ERC20", "BEP20", "POLYGON", "BITCOIN"] as CryptoNetworkCode[]).map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-zinc-400 sm:col-span-2">
                Address
                <input
                  className="field border-white/10 bg-zinc-950 font-mono text-white"
                  value={row.address}
                  onChange={(e) => updateAddress(index, { address: e.target.value })}
                  placeholder="Wallet address"
                />
              </label>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-zinc-100"
            onClick={() =>
              setAddresses((prev) => [...prev, { asset: "USDT", network: "TRC20", address: "", label: "" }])
            }
          >
            Add address row
          </Button>
        </fieldset>

        <label className="grid gap-1 text-sm text-zinc-300">
          Change reason (optional, audited)
          <input
            className="field border-white/10 bg-zinc-950 text-white"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Pause bank deposits during reconciliation"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={() => void save()} disabled={saving} className="gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Save payment rails
        </Button>
        {message ? <span className="text-sm text-zinc-400">{message}</span> : null}
      </div>
    </Card>
  );
}
