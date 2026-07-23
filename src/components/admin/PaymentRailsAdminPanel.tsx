"use client";

import { useMemo, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ResolvedPaymentRails } from "@/config/payment-rails";
import type { PaymentRailsLiveState } from "@/config/payment-rails";
import type { CryptoAssetCode, CryptoNetworkCode, PlatformCryptoAddress } from "@/config/payment-rails";
import {
  networksForAsset,
  SUPPORTED_CRYPTO_ASSETS,
  SUPPORTED_CRYPTO_NETWORKS
} from "@/config/payment-rails";

type Props = {
  initialResolved: ResolvedPaymentRails;
  initialLive: PaymentRailsLiveState;
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
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-white/10 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-400">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-emerald-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function normalizeAddressRow(row: PlatformCryptoAddress): PlatformCryptoAddress {
  const allowed = networksForAsset(row.asset);
  const network = allowed.includes(row.network) ? row.network : (allowed[0] ?? "TRC20");
  return { ...row, network };
}

export function PaymentRailsAdminPanel({ initialResolved, initialLive }: Props) {
  const [bankDeposit, setBankDeposit] = useState(initialResolved.rails.bank.deposit.enabled);
  const [bankWithdrawal, setBankWithdrawal] = useState(initialResolved.rails.bank.withdrawal.enabled);
  const [cryptoDeposit, setCryptoDeposit] = useState(initialResolved.rails.crypto.deposit.enabled);
  const [cryptoWithdrawal, setCryptoWithdrawal] = useState(initialResolved.rails.crypto.withdrawal.enabled);

  const [addresses, setAddresses] = useState<PlatformCryptoAddress[]>(() => {
    const seed = initialResolved.platformAddresses.length
      ? initialResolved.platformAddresses
      : [{ asset: "USDT" as const, network: "TRC20" as const, address: "", label: "Primary USDT" }];
    return seed.map(normalizeAddressRow);
  });
  const [reason, setReason] = useState(initialLive.lastChangeReason ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const cryptoOpen = cryptoDeposit || cryptoWithdrawal;

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
      const trimmedAddresses = addresses.map(normalizeAddressRow).filter((a) => a.address.trim());
      if (cryptoDeposit && trimmedAddresses.length === 0 && initialResolved.platformAddresses.length === 0) {
        setMessage("Add at least one receive address before enabling crypto deposits.");
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
              deposit: { enabled: bankDeposit, maintenanceMode: false },
              withdrawal: { enabled: bankWithdrawal, maintenanceMode: false }
            },
            crypto: {
              deposit: { enabled: cryptoDeposit, maintenanceMode: false },
              withdrawal: { enabled: cryptoWithdrawal, maintenanceMode: false }
            }
          },
          // Always publish the fixed catalog so member UI stays mapped to USDT/USDC/BTC/ETH.
          cryptoAssets: SUPPORTED_CRYPTO_ASSETS.map((a) => ({
            code: a.code,
            enabled: a.enabled,
            networks: a.networks,
            displayName: a.displayName
          })),
          cryptoNetworks: SUPPORTED_CRYPTO_NETWORKS.map((n) => ({
            code: n.code,
            enabled: n.enabled,
            warning: n.warning,
            displayName: n.displayName
          })),
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
          ? "Saved. Publish a receive address so members can complete crypto deposits."
          : "Payment rails saved — live for members now."
      );
    } catch {
      setMessage("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  function updateAddress(index: number, patch: Partial<PlatformCryptoAddress>) {
    setAddresses((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = normalizeAddressRow({ ...row, ...patch });
        if (patch.asset && patch.asset !== row.asset) {
          const nets = networksForAsset(patch.asset);
          next.network = nets[0] ?? next.network;
        }
        return next;
      })
    );
  }

  return (
    <Card variant="elevated" padding="md" className="border-white/10 bg-zinc-900/80" id="payment-rails">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-emerald-400" aria-hidden />
        <h2 className="text-lg font-semibold text-white">Payment rails</h2>
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        Flip bank or crypto on/off. When crypto is on, publish receive addresses — assets and networks are fixed.
      </p>
      <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
        {summary}
      </p>

      <div className="mt-6 space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bank</legend>
          <ToggleRow
            label="Enable bank deposits"
            description="Show bank transfer instructions and accept deposit proofs."
            checked={bankDeposit}
            onChange={setBankDeposit}
          />
          <ToggleRow
            label="Enable bank withdrawals"
            description="Allow members to request Naira bank payouts."
            checked={bankWithdrawal}
            onChange={setBankWithdrawal}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Crypto</legend>
          <ToggleRow
            label="Enable crypto deposits"
            description="Show Cryptocurrency on Wallet funding and accept crypto proofs."
            checked={cryptoDeposit}
            onChange={setCryptoDeposit}
          />
          <ToggleRow
            label="Enable crypto withdrawals"
            description="Show crypto payout on Withdrawals and allow wallet destinations in Settings."
            checked={cryptoWithdrawal}
            onChange={setCryptoWithdrawal}
          />
        </fieldset>

        {cryptoOpen ? (
          <div className="space-y-5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Supported assets</h3>
              <p className="mt-1 text-xs text-zinc-400">Fixed for members — no extra toggles.</p>
              <ul className="mt-3 space-y-2">
                {SUPPORTED_CRYPTO_ASSETS.map((asset) => (
                  <li
                    key={asset.code}
                    className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200"
                  >
                    <span className="font-medium text-white">{asset.displayName}</span>
                    <span className="mt-0.5 block text-xs text-zinc-400">
                      Networks: {asset.networks.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Network warnings</h3>
              <ul className="mt-3 space-y-2">
                {SUPPORTED_CRYPTO_NETWORKS.map((network) => (
                  <li key={network.code} className="text-xs text-zinc-400">
                    <span className="font-medium text-zinc-200">{network.displayName}</span>
                    <span className="mt-0.5 block">{network.warning}</span>
                  </li>
                ))}
              </ul>
            </div>

            {cryptoDeposit ? (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-white">Platform receive addresses</legend>
                <p className="text-xs text-zinc-400">
                  Required for crypto deposits. Leave blank rows empty when saving — existing live addresses are kept.
                </p>
                {addresses.map((row, index) => {
                  const nets = networksForAsset(row.asset);
                  const warning = SUPPORTED_CRYPTO_NETWORKS.find((n) => n.code === row.network)?.warning;
                  return (
                    <div key={index} className="space-y-2 rounded-lg border border-white/10 p-3">
                      <div className="grid gap-2 sm:grid-cols-4">
                        <label className="grid gap-1 text-xs text-zinc-400">
                          Asset
                          <select
                            className="field border-white/10 bg-zinc-950 text-white"
                            value={row.asset}
                            onChange={(e) => updateAddress(index, { asset: e.target.value as CryptoAssetCode })}
                          >
                            {SUPPORTED_CRYPTO_ASSETS.map((asset) => (
                              <option key={asset.code} value={asset.code}>
                                {asset.code}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs text-zinc-400">
                          Network
                          <select
                            className="field border-white/10 bg-zinc-950 text-white"
                            value={row.network}
                            onChange={(e) =>
                              updateAddress(index, { network: e.target.value as CryptoNetworkCode })
                            }
                          >
                            {nets.map((code) => (
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
                      {warning ? <p className="text-[11px] text-amber-200/90">{warning}</p> : null}
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15 bg-white/5 text-zinc-100"
                  onClick={() =>
                    setAddresses((prev) => [
                      ...prev,
                      normalizeAddressRow({ asset: "USDT", network: "TRC20", address: "", label: "" })
                    ])
                  }
                >
                  Add address
                </Button>
              </fieldset>
            ) : (
              <p className="text-xs text-zinc-400">
                Turn on crypto deposits to publish platform receive addresses. Withdrawals use each member&apos;s
                saved wallet in Settings.
              </p>
            )}
          </div>
        ) : null}

        <label className="grid gap-1 text-sm text-zinc-300">
          Change reason (optional, audited)
          <input
            className="field border-white/10 bg-zinc-950 text-white"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Open crypto deposits for USDT TRC20"
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
