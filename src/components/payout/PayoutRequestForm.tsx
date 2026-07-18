"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { Card } from "@/components/ui/Card";
import { InlineErrorNotice } from "@/components/errors/InlineErrorNotice";
import { ApiRequestError, fetchJson, formatMemberApiError } from "@/lib/api/fetch-json";
import type { WithdrawalBankAccount } from "@/components/payout/PayoutBankAccountSection";

type QueueView = {
  queuePosition: number;
  estimatedProcessingLabel: string;
  statusLabel: string;
  scheduleMessage: string;
  settlementReference?: string | null;
  paused?: boolean;
};

type Props = {
  availableBalance: number;
  bank: WithdrawalBankAccount | null;
};

export function PayoutRequestForm({ availableBalance, bank }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [referenceId, setReferenceId] = useState<string | undefined>();
  const [nextHref, setNextHref] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [queueView, setQueueView] = useState<QueueView | null>(null);
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!withdrawalId || !success) return;
    const timer = setInterval(() => {
      void fetch(`/api/withdrawals/${withdrawalId}/queue`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: QueueView | null) => {
          if (data) setQueueView(data);
        })
        .catch(() => undefined);
    }, 15_000);
    return () => clearInterval(timer);
  }, [withdrawalId, success]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || isSubmitting) return;
    inFlight.current = true;
    setIsSubmitting(true);
    setMessage("");
    setReferenceId(undefined);
    setNextHref(undefined);
    setSuccess(false);
    setQueueView(null);

    const parsedAmount = parseCurrencyInput(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setMessage("Enter a valid withdrawal amount.");
      setIsSubmitting(false);
      inFlight.current = false;
      return;
    }
    if (parsedAmount > availableBalance) {
      setMessage("Insufficient available balance.");
      setNextHref("/deposits");
      setIsSubmitting(false);
      inFlight.current = false;
      return;
    }
    if (!bank) {
      setMessage("Please add your bank account first.");
      setIsSubmitting(false);
      inFlight.current = false;
      return;
    }

    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const body = await fetchJson<{
        id?: string;
        scheduleMessage?: string;
        queueView?: QueueView;
      }>("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          amount: parsedAmount,
          bankName: bank.bank_name,
          accountNumber: bank.account_number,
          note: note.trim() || undefined,
          idempotencyKey
        })
      });

      setSuccess(true);
      setWithdrawalId(body.id ?? null);
      setQueueView(body.queueView ?? null);
      setMessage(body.scheduleMessage ?? "Your withdrawal request has been queued successfully.");
      setAmount("");
      setNote("");
      router.refresh();
    } catch (err) {
      setMessage(formatMemberApiError(err));
      if (err instanceof ApiRequestError) {
        setReferenceId(err.referenceId);
        setNextHref(err.nextAction?.href);
      }
    } finally {
      setIsSubmitting(false);
      inFlight.current = false;
    }
  }

  return (
    <Card variant="elevated" className="p-5 sm:p-6">
      {success ? (
        <div className="space-y-4 rounded-xl border border-[var(--emerald)]/20 bg-[var(--emerald-soft)]/30 p-4">
          <div>
            <p className="font-semibold text-[var(--heading)]">Withdrawal Request Received</p>
            <p className="mt-2 whitespace-pre-line text-sm text-[var(--text-muted)]">{message}</p>
          </div>
          {queueView ? (
            <dl className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Queue Position</dt>
                <dd className="mt-1 text-lg font-bold text-[var(--heading)]">#{queueView.queuePosition}</dd>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Estimated Settlement</dt>
                <dd className="mt-1 font-semibold text-[var(--heading)]">{queueView.estimatedProcessingLabel}</dd>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Status</dt>
                <dd className="mt-1 font-semibold text-[var(--heading)]">{queueView.statusLabel}</dd>
              </div>
              {queueView.settlementReference ? (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Settlement Reference</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold text-[var(--heading)]">{queueView.settlementReference}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          {queueView?.paused ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">Settlement processing is temporarily paused.</p>
          ) : null}
          <p className="text-xs text-[var(--text-subtle)]">Queue position and ETA refresh automatically.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" id="request">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Available withdrawal balance
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[var(--heading)] sm:text-3xl">
              {formatNaira(availableBalance)}
            </p>
          </div>

          <CurrencyInput
            label={`Withdrawal amount (${NAIRA_SYMBOL})`}
            prefix="₦"
            value={amount}
            onChange={setAmount}
            required
          />

          {!bank ? (
            <p className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              Please add your bank account first.
            </p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Funds will be sent to <span className="font-medium text-[var(--heading)]">{bank.bank_name}</span> ·{" "}
              <span className="font-mono tabular-nums">{bank.account_number}</span>
            </p>
          )}

          <Input
            label="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reference for your records"
          />

          <Button type="submit" disabled={isSubmitting || !bank} className="w-full gap-2 sm:w-auto">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Request withdrawal
          </Button>

          {message && !success ? (
            <InlineErrorNotice
              message={message}
              referenceId={referenceId}
              nextAction={nextHref ? { label: "Fund wallet", href: nextHref } : undefined}
              onRetry={() => {
                const form = document.querySelector<HTMLFormElement>("#request");
                form?.requestSubmit();
              }}
            />
          ) : null}
        </form>
      )}
    </Card>
  );
}
