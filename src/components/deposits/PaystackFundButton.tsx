"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { contributionTiers, formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  enabled: boolean;
  configured: boolean;
};

export function PaystackFundButton({ enabled, configured }: Props) {
  const [amount, setAmount] = useState<number>(contributionTiers[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function startPayment() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/payments/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Unable to start Paystack checkout.");
      return;
    }

    const body = await response.json();
    if (body.checkoutUrl) {
      window.location.href = body.checkoutUrl;
      return;
    }

    setMessage("Checkout URL was not returned. Try again or use bank transfer.");
  }

  if (!configured) {
    return (
      <Card variant="outline" className="!p-4">
        <p className="text-sm text-[var(--text-muted)]">
          Paystack is not configured yet. Add <code>PAYSTACK_SECRET_KEY</code> and{" "}
          <code>NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code> to enable instant wallet funding.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="!p-6" id="paystack-fund">
      <p className="eyebrow">Instant funding</p>
      <h2 className="section-title mt-1">Pay with Paystack</h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Card or bank transfer via Paystack. Your wallet is credited only after server-side verification.
      </p>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
        {contributionTiers.map((tier) => (
          <Button
            key={tier}
            type="button"
            variant={amount === tier ? "primary" : "secondary"}
            size="sm"
            onClick={() => setAmount(tier)}
            disabled={!enabled || loading}
          >
            {formatNaira(tier)}
          </Button>
        ))}
      </div>

      <Button className="mt-4 w-full" onClick={startPayment} disabled={!enabled || loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Starting checkout…
          </>
        ) : (
          `Pay ${formatNaira(amount)} with Paystack`
        )}
      </Button>

      {message ? <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{message}</p> : null}
    </Card>
  );
}
