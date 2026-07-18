"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/domain";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { InlineErrorNotice } from "@/components/errors/InlineErrorNotice";
import { ApiRequestError, fetchJson, formatMemberApiError } from "@/lib/api/fetch-json";

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
  const [referenceId, setReferenceId] = useState<string | undefined>();
  const [nextHref, setNextHref] = useState<string | undefined>();
  const inFlight = useRef(false);

  async function handlePurchase(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || loading) return;
    inFlight.current = true;
    setLoading(true);
    setError("");
    setReferenceId(undefined);
    setNextHref(undefined);

    const amount = parseCurrencyInput(amountRaw);
    if (!amount || amount < minAmount || amount > maxAmount) {
      setError(`Enter an amount between ${formatNaira(minAmount)} and ${formatNaira(maxAmount)}.`);
      setLoading(false);
      inFlight.current = false;
      return;
    }

    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      await fetchJson("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({ planId, amount, idempotencyKey })
      });

      router.push("/portfolio");
      router.refresh();
    } catch (err) {
      setError(formatMemberApiError(err));
      if (err instanceof ApiRequestError) {
        setReferenceId(err.referenceId);
        setNextHref(err.nextAction?.href);
      }
      setLoading(false);
      inFlight.current = false;
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
      {error ? (
        <InlineErrorNotice
          message={error}
          referenceId={referenceId}
          nextAction={nextHref ? { label: "Continue", href: nextHref } : undefined}
        />
      ) : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Processing…" : "Confirm purchase"}
      </Button>
    </form>
  );
}
