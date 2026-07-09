"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { contributionTiers, formatNaira, makeReference } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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

export function ContributionForm({ config }: Props) {
  const [amount, setAmount] = useState<number>(contributionTiers[0]);
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const previewReference = phone ? `AR-${phone.replace(/\D/g, "").slice(-6) || "MEMBER"}-PENDING` : "AR-PENDING";
  const currentReference = reference || previewReference;

  async function submitContribution(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    const submittedReference = reference || makeReference(phone);

    const response = await fetch("/api/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberName,
        phone,
        amount,
        receiptNote,
        reference: submittedReference
      })
    });

    setIsSubmitting(false);
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Unable to submit contribution.");
      return;
    }

    setReference(submittedReference);
    setMessage("Contribution submitted. Admin will verify the bank credit and update your ledger.");
    setReceiptNote("");
  }

  return (
    <Card variant="elevated" className="!p-6" id="contribute">
      <p className="eyebrow">Member contribution</p>
      <h2 className="section-title mt-1">Choose a contribution tier</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
        Funds are recorded after admin verification. Distributions follow cooperative rules — not guaranteed returns.
      </p>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2">
        {contributionTiers.map((tier) => (
          <Button
            key={tier}
            type="button"
            variant={amount === tier ? "primary" : "secondary"}
            size="sm"
            onClick={() => setAmount(tier)}
          >
            {formatNaira(tier)}
          </Button>
        ))}
      </div>

      <Card variant="default" padding="md" className="mt-4 bg-[var(--gray-50)]">
        <p className="eyebrow">Receiving account</p>
        <p className="mt-2 text-sm font-semibold">{config.activeBankName}</p>
        <p className="text-xs text-[var(--ar-text-muted)]">{config.activeAccountName}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{config.activeAccountNumber}</p>
        <p className="mt-2 text-xs text-[var(--ar-text-subtle)]">{config.paymentInstruction}</p>
      </Card>

      <form onSubmit={submitContribution} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
          <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-[var(--ar-text-muted)]">Transfer reference or receipt note</span>
          <textarea
            className="field min-h-[80px] resize-y"
            rows={3}
            value={receiptNote}
            onChange={(e) => setReceiptNote(e.target.value)}
            placeholder="Example: GTBank transfer, ₦50,000, 10:43 AM WAT..."
            required
          />
        </label>

        <Card variant="default" padding="sm" className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Your reference</p>
            <p className="text-sm font-semibold">{currentReference}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(currentReference)}>
            <Copy size={14} />
            Copy
          </Button>
        </Card>

        <Button disabled={!config.contributionsEnabled || isSubmitting} type="submit">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Submit for verification
        </Button>
        {message ? <p className="text-xs text-[var(--ar-text-muted)]">{message}</p> : null}
      </form>
    </Card>
  );
}
