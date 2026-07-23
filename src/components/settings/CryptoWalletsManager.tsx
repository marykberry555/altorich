"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { MemberCryptoWallet } from "@/lib/payments/member-destinations";
import type { CryptoAssetCode, CryptoNetworkCode } from "@/config/payment-rails";
import { networksForAsset, SUPPORTED_CRYPTO_ASSETS } from "@/config/payment-rails";

type Props = {
  initialWallets: MemberCryptoWallet[];
  enabled: boolean;
};

export function CryptoWalletsManager({ initialWallets, enabled }: Props) {
  const [wallets, setWallets] = useState(initialWallets);
  const [asset, setAsset] = useState<CryptoAssetCode>("USDT");
  const [network, setNetwork] = useState<CryptoNetworkCode>("TRC20");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!enabled) {
    return null;
  }

  async function persist(next: MemberCryptoWallet[]) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/member/crypto-wallets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallets: next })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Unable to save wallets.");
        return;
      }
      setWallets(data.wallets ?? next);
      setMessage("Wallets saved.");
      setAddress("");
      setLabel("");
    } catch {
      setMessage("Network error while saving wallets.");
    } finally {
      setSaving(false);
    }
  }

  function addWallet() {
    if (address.trim().length < 8) {
      setMessage("Enter a valid wallet address.");
      return;
    }
    const allowed = networksForAsset(asset);
    if (!allowed.includes(network)) {
      setMessage(`Choose a valid network for ${asset}.`);
      return;
    }
    const next: MemberCryptoWallet[] = [
      ...wallets,
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `w-${Date.now()}`,
        asset,
        network,
        address: address.trim(),
        label: label.trim() || undefined,
        isDefault: wallets.length === 0
      }
    ];
    void persist(next);
  }

  function removeWallet(id: string) {
    void persist(wallets.filter((w) => w.id !== id));
  }

  return (
    <Card variant="elevated" padding="md">
      <h3 className="font-semibold text-[var(--heading)]">Crypto wallets</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Saved destinations for crypto payouts.</p>

      <ul className="mt-4 space-y-2">
        {wallets.length === 0 ? (
          <li className="text-sm text-[var(--text-muted)]">No wallets saved yet.</li>
        ) : (
          wallets.map((w) => (
            <li
              key={w.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--heading)]">
                  {w.asset} · {w.network}
                  {w.isDefault ? " · Default" : ""}
                </p>
                <p className="break-all font-mono text-xs text-[var(--text-muted)]">{w.address}</p>
              </div>
              <button
                type="button"
                className="shrink-0 text-[var(--text-muted)] hover:text-red-600"
                onClick={() => removeWallet(w.id)}
                aria-label="Remove wallet"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Asset
          <select
            className="field"
            value={asset}
            onChange={(e) => {
              const next = e.target.value as CryptoAssetCode;
              setAsset(next);
              const nets = networksForAsset(next);
              if (nets[0]) setNetwork(nets[0]);
            }}
          >
            {SUPPORTED_CRYPTO_ASSETS.map((row) => (
              <option key={row.code} value={row.code}>
                {row.code}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Network
          <select className="field" value={network} onChange={(e) => setNetwork(e.target.value as CryptoNetworkCode)}>
            {networksForAsset(asset).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <Input label="Wallet address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" className="gap-1.5" disabled={saving} onClick={addWallet}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add wallet
        </Button>
        {message ? <span className="text-xs text-[var(--text-muted)]">{message}</span> : null}
      </div>
    </Card>
  );
}
