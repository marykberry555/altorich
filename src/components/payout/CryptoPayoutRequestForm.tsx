"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { Card } from "@/components/ui/Card";
import { InlineErrorNotice } from "@/components/errors/InlineErrorNotice";
import { SecureConfirmDialog } from "@/components/trust/SecureConfirmDialog";
import { ApiRequestError, fetchJson, formatMemberApiError } from "@/lib/api/fetch-json";
import type { PublicPaymentRailsSnapshot } from "@/lib/payments/payment-rails";
import type { MemberCryptoWallet } from "@/lib/payments/member-destinations";

type Props = {
  availableBalance: number;
  rails: PublicPaymentRailsSnapshot;
  wallets: MemberCryptoWallet[];
};

export function CryptoPayoutRequestForm({ availableBalance, rails, wallets }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const inFlight = useRef(false);

  const selected = wallets.find((w) => w.id === walletId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsedAmount = parseCurrencyInput(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setMessage("Enter a valid withdrawal amount.");
      return;
    }
    if (parsedAmount > availableBalance) {
      setMessage("Insufficient available balance.");
      return;
    }
    if (!selected) {
      setMessage("Add a crypto wallet in Settings before requesting a payout.");
      return;
    }
    setPendingAmount(parsedAmount);
    setConfirmOpen(true);
  }

  async function confirm() {
    if (inFlight.current || pendingAmount == null || !selected) return;
    inFlight.current = true;
    setIsSubmitting(true);
    setMessage("");
    setConfirmOpen(false);

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await fetchJson("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          amount: pendingAmount,
          rail: "crypto",
          asset: selected.asset,
          network: selected.network,
          walletAddress: selected.address,
          note: note.trim() || undefined,
          idempotencyKey
        })
      });
      setSuccess(true);
      setAmount("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? formatMemberApiError(err) : formatMemberApiError(err));
    } finally {
      setIsSubmitting(false);
      inFlight.current = false;
      setPendingAmount(null);
    }
  }

  if (!rails.cryptoWithdrawalOpen) {
    return (
      <Card variant="elevated" padding="md">
        <p className="text-sm text-[var(--text-muted)]">
          {rails.rails.crypto.withdrawal.displayMessage || "Crypto withdrawals are currently unavailable."}
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card variant="elevated" padding="md">
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          {wallets.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Add a crypto wallet under Settings before requesting a crypto payout.
            </p>
          ) : (
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[var(--heading)]">Payout wallet</span>
              <select className="field" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.asset} · {w.network} · {w.address.slice(0, 8)}…{w.address.slice(-6)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <CurrencyInput label={`Amount (${NAIRA_SYMBOL})`} value={amount} onChange={setAmount} required />
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {message ? <InlineErrorNotice message={message} /> : null}
          {success ? (
            <p className="text-sm font-medium text-[var(--emerald)]">Crypto payout request submitted.</p>
          ) : null}
          <Button type="submit" disabled={isSubmitting || wallets.length === 0} className="gap-2">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Request crypto payout
          </Button>
        </form>
      </Card>

      <SecureConfirmDialog
        open={confirmOpen}
        title="Confirm crypto payout"
        description={
          pendingAmount != null && selected
            ? `Send ${formatNaira(pendingAmount)} to ${selected.asset} (${selected.network}) wallet ${selected.address}?`
            : "Confirm this payout request."
        }
        confirmLabel="Submit request"
        onConfirm={() => void confirm()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
