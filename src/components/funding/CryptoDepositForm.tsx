"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { InlineErrorNotice } from "@/components/errors/InlineErrorNotice";
import { ApiRequestError, fetchJson, formatMemberApiError } from "@/lib/api/fetch-json";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { MIN_FUNDING_AMOUNT_NGN } from "@/lib/payments";
import type { PublicPaymentRailsSnapshot } from "@/lib/payments/payment-rails";

type Props = {
  rails: PublicPaymentRailsSnapshot;
  enabled: boolean;
};

export function CryptoDepositForm({ rails, enabled }: Props) {
  const assets = rails.cryptoAssets;
  const [asset, setAsset] = useState(assets[0]?.code ?? "USDT");
  const networks = useMemo(
    () => rails.cryptoNetworks.filter((n) => (assets.find((a) => a.code === asset)?.networks ?? []).includes(n.code)),
    [rails.cryptoNetworks, assets, asset]
  );
  const [network, setNetwork] = useState(networks[0]?.code ?? "TRC20");
  const receive = rails.platformAddresses.find((a) => a.asset === asset && a.network === network);
  const warning = rails.cryptoNetworks.find((n) => n.code === network)?.warning;

  const [amountRaw, setAmountRaw] = useState("");
  const [txRef, setTxRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const inFlight = useRef(false);

  async function copyAddress() {
    if (!receive?.address) return;
    await navigator.clipboard.writeText(receive.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!enabled || inFlight.current || isSubmitting) return;
    const amount = parseCurrencyInput(amountRaw);
    if (!amount || amount < MIN_FUNDING_AMOUNT_NGN) {
      setMessage(`Minimum deposit amount is ${formatNaira(MIN_FUNDING_AMOUNT_NGN)}.`);
      return;
    }
    if (!receive?.address) {
      setMessage("No receive address is configured for this asset and network.");
      return;
    }
    if (!txRef.trim()) {
      setMessage("Enter your transaction / TxID reference.");
      return;
    }

    inFlight.current = true;
    setIsSubmitting(true);
    setMessage("");
    setSuccess(false);

    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        const body = await fetchJson<{ path: string }>("/api/uploads/deposit-proof", {
          method: "POST",
          body: formData
        });
        proofUrl = body.path;
      }

      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await fetchJson("/api/deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          amount,
          paymentReference: txRef.trim(),
          proofUrl,
          rail: "crypto",
          asset,
          network,
          idempotencyKey
        })
      });

      setSuccess(true);
      setAmountRaw("");
      setTxRef("");
      setProofFile(null);
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? formatMemberApiError(err) : formatMemberApiError(err));
    } finally {
      setIsSubmitting(false);
      inFlight.current = false;
    }
  }

  if (!enabled) {
    return null;
  }

  return (
    <Card variant="elevated" padding="md">
      <form onSubmit={(e) => void submit(e)} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--heading)]">Cryptocurrency</span>
          <select
            className="field"
            value={asset}
            onChange={(e) => {
              setAsset(e.target.value as typeof asset);
              const nextNets = rails.cryptoAssets.find((a) => a.code === e.target.value)?.networks ?? [];
              if (nextNets[0]) setNetwork(nextNets[0]);
            }}
          >
            {assets.map((a) => (
              <option key={a.code} value={a.code}>
                {a.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--heading)]">Network</span>
          <select className="field" value={network} onChange={(e) => setNetwork(e.target.value as typeof network)}>
            {networks.map((n) => (
              <option key={n.code} value={n.code}>
                {n.displayName}
              </option>
            ))}
          </select>
        </label>

        {warning ? (
          <p className="rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            {warning}
          </p>
        ) : null}

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Send to</p>
          <p className="mt-1 break-all font-mono text-sm text-[var(--heading)]">
            {receive?.address || "Address not configured — contact support"}
          </p>
          {receive?.address ? (
            <Button type="button" size="sm" variant="outline" className="mt-2 gap-1.5" onClick={() => void copyAddress()}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy address"}
            </Button>
          ) : null}
          <p className="mt-2 text-xs text-[var(--text-muted)]">{rails.rails.crypto.processingInstructions}</p>
        </div>

        <CurrencyInput
          label={`Amount (${NAIRA_SYMBOL} equivalent)`}
          value={amountRaw}
          onChange={setAmountRaw}
          required
        />
        <Input
          label="Transaction / TxID reference"
          value={txRef}
          onChange={(e) => setTxRef(e.target.value)}
          required
          placeholder="Paste your blockchain transaction ID"
        />
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--heading)]">Proof (optional)</span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            className="text-xs text-[var(--text-muted)]"
          />
        </label>

        {message ? <InlineErrorNotice message={message} /> : null}
        {success ? (
          <p className="text-sm font-medium text-[var(--emerald)]">
            Crypto deposit submitted for review. You can track it below.
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting || !receive?.address} className="gap-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Submit crypto deposit
        </Button>
      </form>
    </Card>
  );
}
