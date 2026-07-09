"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { isWithdrawalWindow, nextWithdrawalLabel } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export function WithdrawalForm() {
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const open = isWithdrawalWindow();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberName,
        phone,
        amount: Number(amount),
        bankName,
        accountName,
        accountNumber
      })
    });

    setIsSubmitting(false);
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Unable to submit withdrawal.");
      return;
    }

    setMessage("Withdrawal request submitted. Admin will process during the next payout window.");
    setAmount("");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Badge variant={open ? "emerald" : "gold"}>
        {open ? "Withdrawal window open" : `Closed — ${nextWithdrawalLabel()}`}
      </Badge>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Full name" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>

      <Input label="Amount (₦)" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
        <Input label="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
      </div>

      <Input label="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />

      <Button type="submit" disabled={!open || isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        Request payout
      </Button>

      {message ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
    </form>
  );
}
