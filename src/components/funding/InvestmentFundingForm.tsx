"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { formatNaira, makeReference, NAIRA_SYMBOL } from "@/lib/domain";
import { trackSmartsuppEvent } from "@/lib/chat/smartsupp";
import { SMARTSUPP_EVENTS } from "@/lib/chat/smartsupp-events";
import { MIN_FUNDING_AMOUNT_NGN } from "@/lib/payments";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";

type BankConfig = {
  activeBankName: string;
  activeAccountName: string;
  activeAccountNumber: string;
  paymentInstruction: string;
  transferNarration: string;
  contributionsEnabled: boolean;
};

type Props = {
  config: BankConfig;
};

export function InvestmentFundingForm({ config }: Props) {
  const [amount, setAmount] = useState("");
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const previewReference = phone ? `AR-${phone.replace(/\D/g, "").slice(-6) || "MEMBER"}-PENDING` : "AR-PENDING";
  const currentReference = reference || previewReference;

  async function submitFunding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount < MIN_FUNDING_AMOUNT_NGN) {
      setMessage(`Minimum funding amount is ${formatNaira(MIN_FUNDING_AMOUNT_NGN)}.`);
      setIsSubmitting(false);
      return;
    }

    const submittedReference = reference || makeReference(phone);

    const response = await fetch("/api/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberName,
        phone,
        amount: parsedAmount,
        receiptNote: receiptNote,
        reference: submittedReference
      })
    });

    setIsSubmitting(false);
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Unable to submit funding request.");
      return;
    }

    setReference(submittedReference);
    setMessage("Submitted. Your wallet will be credited after verification.");
    setReceiptNote("");
    trackSmartsuppEvent(SMARTSUPP_EVENTS.WALLET_FUNDED, { Amount_NGN: parsedAmount });
  }

  return (
    <Card variant="elevated" className="!p-6" id="fund">
      <p className="eyebrow">Submit reference</p>
      <h2 className="section-title mt-1">Confirm your transfer</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Transfer from any Nigerian bank, then submit your payment reference below.
      </p>

      <form onSubmit={submitFunding} className="mt-6 grid gap-4">
        <Input
          label={`Funding amount (${NAIRA_SYMBOL})`}
          type="number"
          min={MIN_FUNDING_AMOUNT_NGN}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder={`Min. ${formatNaira(MIN_FUNDING_AMOUNT_NGN)}`}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
          <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-[var(--text-muted)]">Payment reference</span>
          <textarea
            className="field min-h-[80px] resize-y"
            rows={3}
            value={receiptNote}
            onChange={(e) => setReceiptNote(e.target.value)}
            placeholder="Bank name, amount, transfer time, and narration used"
            required
          />
        </label>

        <Card variant="default" padding="sm" className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Your reference</p>
            <p className="text-sm font-semibold">{currentReference}</p>
          </div>
          <CopyButton value={currentReference} />
        </Card>

        <Button disabled={!config.contributionsEnabled || isSubmitting} type="submit" className="w-full sm:w-auto gap-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Submit for verification
        </Button>
        {message ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
      </form>
    </Card>
  );
}

type SummaryProps = {
  balance: number;
  pendingFunding: number;
  fundingEnabled: boolean;
};

export function FundingSummary({ balance, pendingFunding, fundingEnabled }: SummaryProps) {
  const available = Math.max(0, balance);

  return (
    <div className="space-y-4">
      <Card variant="elevated" className="bg-gradient-to-br from-[var(--navy)] to-[var(--navy-mid)] text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Wallet summary</p>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-xs text-white/70">Current balance</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{formatNaira(balance)}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/70">Pending funding</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-amber-200">{formatNaira(pendingFunding)}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/70">Available balance</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{formatNaira(available)}</dd>
          </div>
        </dl>
      </Card>

      <Card variant="elevated">
        <h3 className="font-semibold text-[var(--heading)]">Funding instructions</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-[var(--text-muted)]">
          <li>Transfer naira to the bank account shown.</li>
          <li>Use your registered phone number as the transfer narration.</li>
          <li>Submit your reference for verification.</li>
          <li>Funds appear in your wallet after confirmation.</li>
        </ol>
        {!fundingEnabled ? (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Wallet funding is temporarily paused.</p>
        ) : null}
      </Card>

      <Link href="/investments">
        <Button variant="primary" className="w-full gap-2">
          Explore investment packages
          <ArrowRight size={14} aria-hidden />
        </Button>
      </Link>
    </div>
  );
}

export const ContributionForm = InvestmentFundingForm;
