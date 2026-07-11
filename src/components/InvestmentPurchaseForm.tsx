"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/domain";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";

type Props = {
  planId: string;
  planName: string;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
};

export function InvestmentPurchaseForm({ planId, planName, minAmount, maxAmount, defaultAmount }: Props) {
  const router = useRouter();
  const [amountRaw, setAmountRaw] = useState(String(defaultAmount));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePurchase(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const amount = parseCurrencyInput(amountRaw);

    try {
      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, amount })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Purchase failed.");
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
    <form onSubmit={handlePurchase} className="grid gap-3">
      <p className="text-sm text-[var(--text-muted)]">
        Invest in <strong>{planName}</strong>.
      </p>
      <CurrencyInput
        label={`Amount (${formatNaira(minAmount)} – ${formatNaira(maxAmount)})`}
        prefix="₦"
        value={amountRaw}
        onChange={setAmountRaw}
        required
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Processing…" : "Confirm purchase"}
      </Button>
    </form>
  );
}
