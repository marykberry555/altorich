"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Upload, X } from "lucide-react";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { trackSmartsuppEvent } from "@/lib/chat/smartsupp";
import { SMARTSUPP_EVENTS } from "@/lib/chat/smartsupp-events";
import { MIN_FUNDING_AMOUNT_NGN } from "@/lib/payments";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type Props = {
  fundingEnabled: boolean;
  receiptUploadEnabled?: boolean;
};

export function InvestmentFundingForm({ fundingEnabled, receiptUploadEnabled = false }: Props) {
  const [amount, setAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadProof(file: File) {
    setUploadingProof(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/deposit-proof", {
      method: "POST",
      body: formData
    });

    setUploadingProof(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Unable to upload receipt.");
      return;
    }

    const body = await response.json();
    setProofUrl(body.signedUrl ?? body.path ?? null);
    setProofName(file.name);
  }

  async function submitFunding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setSuccess(false);

    const parsedAmount = Number(amount);
    const reference = paymentReference.trim();

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
        proofUrl: proofUrl ?? undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Unable to submit funding request.");
      return;
    }

    setSuccess(true);
    setAmount("");
    setPaymentReference("");
    setProofUrl(null);
    setProofName("");
    trackSmartsuppEvent(SMARTSUPP_EVENTS.WALLET_FUNDED, { Amount_NGN: parsedAmount });
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
        <Input
          label={`Funding amount (${NAIRA_SYMBOL})`}
          type="number"
          min={MIN_FUNDING_AMOUNT_NGN}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder={`Min. ${formatNaira(MIN_FUNDING_AMOUNT_NGN)}`}
        />

        <Input
          label="Payment reference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          required
          placeholder="Bank transfer reference or narration"
        />

        {receiptUploadEnabled ? (
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Receipt upload (optional)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadProof(file);
              }}
            />
            {proofName ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--gray-50)] px-4 py-3 dark:bg-[var(--surface)]">
                <span className="truncate text-sm text-[var(--heading)]">{proofName}</span>
                <button
                  type="button"
                  className="text-[var(--text-subtle)] hover:text-[var(--heading)]"
                  onClick={() => {
                    setProofUrl(null);
                    setProofName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Remove receipt"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                disabled={uploadingProof}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingProof ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Upload receipt
              </Button>
            )}
          </div>
        ) : null}

        <div className="pt-1">
          <Button disabled={!fundingEnabled || isSubmitting || uploadingProof} type="submit" className="w-full gap-2 sm:w-auto">
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
