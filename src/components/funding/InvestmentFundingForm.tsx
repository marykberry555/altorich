"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Loader2, Upload } from "lucide-react";
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (defaultFullName) setFullName(defaultFullName);
  }, [defaultFullName]);

  async function uploadProofIfNeeded(): Promise<string | undefined> {
    if (!proofFile) return undefined;
    const formData = new FormData();
    formData.append("file", proofFile);
    const res = await fetch("/api/uploads/deposit-proof", { method: "POST", body: formData });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Receipt upload failed.");
    return body.path as string;
  }

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

    try {
      const proofUrl = await uploadProofIfNeeded();
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          paymentReference: reference,
          memberName: name,
          proofUrl
        })
      });

      if (!response.ok) {
        const body = await response.json();
        setMessage(body.error ?? "Unable to submit funding request.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setAmountRaw("");
      setPaymentReference("");
      setProofFile(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit funding request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card variant="elevated" className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
            <Check size={20} aria-hidden />
          </span>
          <div>
            <p className="text-lg font-semibold text-[var(--heading)]">Funding submitted</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Awaiting admin verification. Once approved, your preferred package invests automatically.
            </p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button size="sm">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6 sm:p-8" id="fund">
      <form onSubmit={submitFunding} className="space-y-5">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <CurrencyInput
          label={`Transfer amount (${NAIRA_SYMBOL})`}
          prefix="₦"
          value={amountRaw}
          onChange={setAmountRaw}
          required
          placeholder={formatNaira(MIN_FUNDING_AMOUNT_NGN).replace("₦", "")}
        />

        <Input
          label="Transfer reference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          required
          placeholder="Bank transfer reference"
        />

        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Receipt upload (optional)</span>
          <label className="flex min-h-[var(--tap-min)] cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] bg-[var(--gray-50)] px-4 py-3 text-sm text-[var(--text-muted)] transition hover:border-[var(--emerald)]/40">
            <Upload size={16} aria-hidden />
            <span className="truncate">{proofFile ? proofFile.name : "Upload transfer receipt"}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="sr-only"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="pt-1">
          <Button disabled={!fundingEnabled || isSubmitting} type="submit" className="w-full gap-2 sm:w-auto">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Submit funding
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
