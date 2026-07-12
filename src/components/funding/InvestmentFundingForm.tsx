"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { MIN_FUNDING_AMOUNT_NGN } from "@/lib/payments";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";

type Props = {
  fundingEnabled: boolean;
  defaultFullName?: string;
};

export function InvestmentFundingForm({ fundingEnabled, defaultFullName = "" }: Props) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [amountRaw, setAmountRaw] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (defaultFullName) setFullName(defaultFullName);
  }, [defaultFullName]);

  async function submitFunding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setSuccess(false);

    const parsedAmount = parseCurrencyInput(amountRaw);
    const reference = paymentReference.trim();
    const name = fullName.trim();

    if (!name) {
      setMessage("Enter your full name.");
      setIsSubmitting(false);
      return;
    }

    if (!parsedAmount || parsedAmount < MIN_FUNDING_AMOUNT_NGN) {
      setMessage(`Minimum funding amount is ${formatNaira(MIN_FUNDING_AMOUNT_NGN)}.`);
      setIsSubmitting(false);
      return;
    }

    if (reference.length < 3) {
      setMessage("Enter your bank payment reference.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsedAmount,
        paymentReference: reference,
        memberName: name
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Unable to submit funding request.");
      return;
    }

    setSuccess(true);
    setAmountRaw("");
    setPaymentReference("");
  }

  if (success) {
    return (
      <Card variant="elevated" className="p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
              <Check size={20} aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-[var(--heading)]">Funding request submitted</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Your wallet will be credited after verification.</p>
            </div>
          </div>
          <Link href="/investments">
            <Button variant="gold" className="gap-2">
              Invest Now
              <ArrowRight size={16} aria-hidden />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="fund">
      <form onSubmit={submitFunding} className="space-y-5">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <CurrencyInput
          label={`Funding amount (${NAIRA_SYMBOL})`}
          prefix="₦"
          value={amountRaw}
          onChange={setAmountRaw}
          required
          placeholder={formatNaira(MIN_FUNDING_AMOUNT_NGN).replace("₦", "")}
        />

        <Input
          label="Payment reference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          required
          placeholder="Bank transfer reference"
        />

        <div className="pt-1">
          <Button disabled={!fundingEnabled || isSubmitting} type="submit" className="w-full gap-2 sm:w-auto">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Submit
          </Button>
          {!fundingEnabled ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Wallet funding is temporarily paused.</p>
          ) : null}
          {message ? <p className="mt-3 text-sm text-[var(--text-muted)]">{message}</p> : null}
        </div>
      </form>
    </Card>
  );
}

export const ContributionForm = InvestmentFundingForm;
