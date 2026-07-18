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

type SubmittedFunding = {
  amount: number;
  reference: string;
  memberName: string;
  hasProof: boolean;
};

export function InvestmentFundingForm({ fundingEnabled, defaultFullName = "" }: Props) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [amountRaw, setAmountRaw] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedFunding | null>(null);

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

      setSubmitted({
        amount: parsedAmount,
        reference,
        memberName: name,
        hasProof: Boolean(proofUrl)
      });
      setSuccess(true);
      setModalOpen(true);
      setAmountRaw("");
      setPaymentReference("");
      setProofFile(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit funding request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {success ? (
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" type="button" variant="outline" onClick={() => setModalOpen(true)}>
                  View funding details
                </Button>
                <Link href="/dashboard">
                  <Button size="sm">Back to dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ) : (
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
      )}

      {modalOpen && submitted ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="funding-submitted-title"
        >
          <Card variant="elevated" padding="lg" className="w-full max-w-md animate-fade-up shadow-2xl">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
                <Check size={28} aria-hidden />
              </span>
              <h2 id="funding-submitted-title" className="mt-4 text-xl font-bold text-[var(--heading)]">
                Funding submitted
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                An Alto Rich admin will verify your transfer. As soon as it is approved, your preferred investment
                sector starts automatically — no extra step needed.
              </p>
            </div>

            <dl className="mt-5 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/60 p-4 dark:bg-[var(--surface)]/50">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">Amount</dt>
                <dd className="text-sm font-semibold tabular-nums text-[var(--heading)]">{formatNaira(submitted.amount)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">Name on transfer</dt>
                <dd className="max-w-[60%] text-right text-sm font-medium text-[var(--text)]">{submitted.memberName}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">Reference</dt>
                <dd className="max-w-[60%] break-all text-right text-sm font-medium text-[var(--text)]">
                  {submitted.reference}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">Receipt</dt>
                <dd className="text-sm font-medium text-[var(--text)]">
                  {submitted.hasProof ? "Uploaded" : "Not attached"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">Status</dt>
                <dd className="text-sm font-semibold text-amber-700 dark:text-amber-300">Pending admin approval</dd>
              </div>
            </dl>

            <p className="mt-4 text-center text-xs leading-relaxed text-[var(--text-subtle)]">
              You will see your wallet credit and investment start immediately after approval.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => setModalOpen(false)}>
                Close
              </Button>
              <Link href="/dashboard" className="w-full">
                <Button type="button" className="w-full">
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}

export const ContributionForm = InvestmentFundingForm;
