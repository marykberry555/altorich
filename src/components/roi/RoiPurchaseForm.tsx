"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatNaira } from "@/lib/domain";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";

type Props = {
  tierId: string;
  tierName: string;
  minNgn: number;
  maxNgn: number;
  weeklyRoiBps: number;
};

export function RoiPurchaseForm({ tierId, tierName, minNgn, maxNgn, weeklyRoiBps }: Props) {
  const router = useRouter();
  const [principalRaw, setPrincipalRaw] = useState(String(minNgn));
  const [currency, setCurrency] = useState<"ngn" | "usdt">("ngn");
  const [payoutMethod, setPayoutMethod] = useState<"bank" | "crypto">("bank");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weeklyPct = useMemo(() => (weeklyRoiBps / 100).toFixed(0), [weeklyRoiBps]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const principalNgn = parseCurrencyInput(principalRaw);
    try {
      const response = await fetch("/api/roi/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId,
          principalNgn,
          currency,
          payoutMethod,
          payoutDestination:
            payoutMethod === "crypto"
              ? { wallet_address: destination }
              : { bank_account_hint: destination }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Investment failed.");
        setLoading(false);
        return;
      }

      router.push("/portfolio");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <p className="text-sm text-[var(--text-muted)]">
        Invest in <strong>{tierName}</strong>. Weekly ROI: <strong>{weeklyPct}%</strong>.
      </p>

      <CurrencyInput
        label={`Amount (${formatNaira(minNgn)} – ${formatNaira(maxNgn)})`}
        prefix="₦"
        value={principalRaw}
        onChange={setPrincipalRaw}
        required
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Pay with</span>
          <select
            className="h-11 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--heading)]"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "ngn" | "usdt")}
          >
            <option value="ngn">NGN</option>
            <option value="usdt">USDT</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Payout method</span>
          <select
            className="h-11 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--heading)]"
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value as "bank" | "crypto")}
          >
            <option value="bank">Bank (NGN)</option>
            <option value="crypto">Crypto wallet</option>
          </select>
        </label>
      </div>

      <Input
        label={payoutMethod === "crypto" ? "Crypto wallet address (USDT/BTC)" : "Bank account (hint)"}
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder={payoutMethod === "crypto" ? "0x… / TRC20…" : "Bank name + last 4 digits"}
        required
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Processing…" : "Confirm investment"}
      </Button>
    </form>
  );
}
