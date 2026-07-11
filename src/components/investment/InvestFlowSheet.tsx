"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import type { SettlementFrequency } from "@/lib/investment";
import { formatNaira } from "@/lib/domain";
import { refreshSmartsuppIdentity, trackSmartsuppEvent } from "@/lib/chat/smartsupp";
import { SMARTSUPP_EVENTS } from "@/lib/chat/smartsupp-events";
import { Button } from "@/components/ui/Button";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Step = "amount" | "review" | "success";

type Props = {
  open: boolean;
  onClose: () => void;
  planId: string;
  packageTitle: string;
  minAmount: number;
  maxAmount: number;
  weeklyRoiPercent: number;
  payoutTiming: string;
  cycleDays: number;
  settlementFrequency: SettlementFrequency;
  projectedDaily: number;
  walletBalance: number;
};

const STEPS: { id: Step; label: string }[] = [
  { id: "amount", label: "Amount" },
  { id: "review", label: "Review" },
  { id: "success", label: "Done" }
];

function StepIndicator({ current }: { current: Step }) {
  const index = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center gap-2" aria-label="Investment steps">
      {STEPS.map((step, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                done || active ? "bg-[var(--emerald)] text-white" : "bg-[var(--gray-100)] text-[var(--text-subtle)]"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={cn("hidden text-xs font-medium sm:inline", active ? "text-[var(--heading)]" : "text-[var(--text-subtle)]")}>
              {step.label}
            </span>
            {i < STEPS.length - 1 ? <span className="h-px w-4 bg-[var(--border-strong)]" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function InvestFlowSheet({
  open,
  onClose,
  planId,
  packageTitle,
  minAmount,
  maxAmount,
  weeklyRoiPercent,
  payoutTiming,
  cycleDays,
  settlementFrequency,
  projectedDaily,
  walletBalance
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(String(minAmount));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStep("amount");
      setAmount(String(minAmount));
      setError("");
      setLoading(false);
    }
  }, [open, minAmount]);

  const parsedAmount = parseCurrencyInput(amount);
  const validAmount = parsedAmount >= minAmount && parsedAmount <= maxAmount;
  const sufficientBalance = walletBalance >= parsedAmount;

  async function confirmInvest() {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, amount: parsedAmount })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Investment could not be completed.");
        setLoading(false);
        return;
      }

      setStep("success");
      setLoading(false);
      trackSmartsuppEvent(SMARTSUPP_EVENTS.INVESTMENT_STARTED, {
        Amount_NGN: parsedAmount,
        Package: packageTitle
      });
      refreshSmartsuppIdentity();
      setTimeout(() => {
        onClose();
        router.push("/dashboard");
        router.refresh();
      }, 2200);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="invest-flow-title">
      <Card variant="elevated" className="flex max-h-[92dvh] w-full max-w-lg animate-fade-up flex-col overflow-hidden !rounded-b-none !p-0 sm:!rounded-[var(--radius)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            {step !== "success" ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Select package</p>
                <h2 id="invest-flow-title" className="truncate text-lg font-bold text-[var(--heading)]">
                  {packageTitle}
                </h2>
              </>
            ) : (
              <h2 id="invest-flow-title" className="text-lg font-bold text-[var(--heading)]">
                Investment activated
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--gray-100)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {step !== "success" ? (
          <div className="border-b border-[var(--border)] px-5 py-3">
            <StepIndicator current={step} />
          </div>
        ) : null}

        {step === "success" ? (
          <div className="flex flex-col items-center gap-4 px-5 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--emerald-soft)]">
              <CheckCircle2 size={36} className="text-[var(--emerald)]" aria-hidden />
            </div>
            <p className="text-xl font-bold text-[var(--heading)]">You&apos;re all set</p>
            <p className="currency-ngn text-sm text-[var(--text-muted)]">
              {formatNaira(parsedAmount)} invested in {packageTitle}
            </p>
            <Link href="/dashboard" className="mt-2">
              <Button className="gap-2">
                Return to dashboard
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        ) : step === "amount" ? (
          <div className="space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-[var(--heading)]">Choose investment amount</p>
              <p className="currency-ngn mt-1 text-sm text-[var(--text-muted)]">
                Wallet: {formatNaira(walletBalance)}
              </p>
            </div>

            <CurrencyInput
              label={`Amount (${formatNaira(minAmount)} – ${formatNaira(maxAmount)})`}
              prefix="₦"
              value={amount}
              onChange={setAmount}
              required
            />

            {!sufficientBalance && validAmount ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Insufficient balance.{" "}
                <Link href="/deposits" className="font-semibold underline">
                  Fund wallet
                </Link>
              </p>
            ) : null}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2"
                disabled={!validAmount || !sufficientBalance}
                onClick={() => setStep("review")}
              >
                Continue
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto px-5 py-5">
            <p className="text-sm font-semibold text-[var(--heading)]">Review</p>

            <dl className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] text-sm">
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Package</dt>
                <dd className="font-semibold text-[var(--heading)]">{packageTitle}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Amount</dt>
                <dd className="currency-ngn font-bold tabular-nums text-[var(--heading)]">{formatNaira(parsedAmount)}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Weekly ROI</dt>
                <dd className="font-semibold text-[var(--emerald)]">{weeklyRoiPercent}%</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Payout</dt>
                <dd className="max-w-[55%] text-right text-xs font-semibold">{payoutTiming}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Auto-reinvest</dt>
                <dd className="text-right text-xs font-medium">Until you stop · guaranteed</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">This week at your amount</dt>
                <dd className="currency-ngn font-bold tabular-nums text-[var(--emerald)]">
                  {formatNaira(Math.round((parsedAmount * weeklyRoiPercent) / 100))}
                </dd>
              </div>
            </dl>

            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("amount")} className="gap-2" disabled={loading}>
                <ArrowLeft size={16} />
                Back
              </Button>
              <Button type="button" className="flex-1 gap-2" onClick={confirmInvest} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirm investment
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
