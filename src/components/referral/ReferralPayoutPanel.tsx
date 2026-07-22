"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, Lock } from "lucide-react";
import type { ReferralDashboard } from "@/lib/referral/types";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencyInput, parseCurrencyInput } from "@/components/ui/CurrencyInput";
import { Card } from "@/components/ui/Card";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { capAccountNumberInput } from "@/lib/validation/identity";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import { evaluateReferralPayoutEligibility } from "@/lib/referral/settlement";
import { AnimatedCountdownDigit } from "@/components/roi/AnimatedCountdownDigit";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  is_default?: boolean;
};

type Props = {
  dashboard: ReferralDashboard;
  onSuccess?: () => void;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function splitSeconds(total: number) {
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

export function ReferralPayoutPanel({ dashboard, onSuccess }: Props) {
  const now = useLiveNow();
  const liveEligibility = useMemo(
    () =>
      evaluateReferralPayoutEligibility({
        availableBalance: dashboard.referralWalletBalance,
        minPayoutThreshold: dashboard.minPayoutThreshold,
        programEnabled: dashboard.programEnabled,
        now
      }),
    [dashboard.referralWalletBalance, dashboard.minPayoutThreshold, dashboard.programEnabled, now]
  );

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useFlashError();
  const [message, setMessage] = useState("");
  const [queueView, setQueueView] = useState<{
    queuePosition: number;
    estimatedProcessingLabel: string;
    statusLabel: string;
    settlementReference?: string | null;
  } | null>(null);

  const canRequest = liveEligibility.canRequestPayout;
  const remaining = Math.max(
    0,
    Math.floor((liveEligibility.nextSettlementAt.getTime() - now.getTime()) / 1000)
  );
  const { days, hours, minutes, seconds } = splitSeconds(remaining);

  useEffect(() => {
    Promise.all([
      fetch("/api/bank-accounts").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null))
    ])
      .then(([rows, profilePayload]: [BankAccount[], { profile?: { full_name?: string } } | null]) => {
        const registeredName = profilePayload?.profile?.full_name?.trim() ?? "";
        setAccounts(rows);
        const def = rows.find((a) => a.is_default) ?? rows[0];
        if (def) {
          setSelectedId(def.id);
          setBankName(def.bank_name);
          setAccountName(registeredName || def.account_name);
          setAccountNumber(def.account_number);
        } else if (registeredName) {
          setAccountName(registeredName);
        }
      })
      .catch(() => undefined);
  }, []);

  function selectAccount(id: string) {
    setSelectedId(id);
    const acc = accounts.find((a) => a.id === id);
    if (acc) {
      setBankName(acc.bank_name);
      setAccountNumber(acc.account_number);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canRequest) return;
    setLoading(true);
    setError("");
    setMessage("");

    const parsed = parseCurrencyInput(amount);
    const response = await fetch("/api/referrals/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsed,
        bankName,
        accountName,
        accountNumber,
        bankAccountId: selectedId || undefined
      })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Withdrawal request failed.");
      return;
    }

    setQueueView(data.queueView ?? null);
    setMessage(
      data.scheduleMessage ??
        "Withdrawal request queued for Monday settlement. Track queue position below."
    );
    onSuccess?.();
  }

  return (
    <Card variant="elevated" padding="md">
      <h2 className="text-lg font-bold text-[var(--heading)]">Referral withdrawal</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Rewards settle every Monday at 9:00 AM once you meet the minimum.
      </p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Available Rewards</dt>
          <dd className="currency-ngn mt-1 text-lg font-bold tabular-nums text-[var(--emerald)]">
            {formatNaira(dashboard.referralWalletBalance)}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Minimum Required</dt>
          <dd className="currency-ngn mt-1 text-lg font-bold tabular-nums text-[var(--heading)]">
            {formatNaira(dashboard.minPayoutThreshold)}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Next Settlement</dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--heading)]">Monday, 9:00 AM</dd>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Eligibility</dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--heading)]">
            {liveEligibility.eligibilityStatus === "eligible"
              ? "Eligible now"
              : liveEligibility.eligibilityStatus === "below_minimum"
                ? "Below minimum"
                : liveEligibility.eligibilityStatus === "awaiting_settlement"
                  ? "Awaiting Monday"
                  : "Unavailable"}
          </dd>
        </div>
      </dl>

      {liveEligibility.eligibilityStatus === "below_minimum" ? (
        <p className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {liveEligibility.eligibilityMessage}
        </p>
      ) : null}

      {!liveEligibility.settlementWindowOpen ? (
        <div
          className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--navy)]/95 px-4 py-5 text-white sm:px-5"
          role="timer"
          aria-live="polite"
          aria-label={`Next referral settlement Monday 9 AM. ${days} days, ${hours} hours remaining`}
        >
          <div className="flex items-center gap-2 text-white/65">
            <CalendarClock size={15} aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Next Referral Settlement</p>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight">Monday, 9:00 AM</p>
          <p className="text-sm text-emerald-200">{liveEligibility.nextSettlementLabel}</p>

          <div className="mt-4 flex items-center gap-1.5 sm:gap-2">
            <AnimatedCountdownDigit value={String(days)} label="Days" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12" />
            <span className="pb-5 text-lg font-light text-white/35">:</span>
            <AnimatedCountdownDigit value={pad2(hours)} label="Hours" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12" />
            <span className="pb-5 text-lg font-light text-white/35">:</span>
            <AnimatedCountdownDigit value={pad2(minutes)} label="Mins" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12" />
            <span className="pb-5 text-lg font-light text-white/35">:</span>
            <AnimatedCountdownDigit value={pad2(seconds)} label="Secs" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12" />
          </div>

          <Button type="button" disabled className="mt-5 w-full gap-2 sm:w-auto" variant="outline">
            <Lock size={16} aria-hidden />
            Unavailable until settlement opens
          </Button>
        </div>
      ) : null}

      {liveEligibility.settlementWindowOpen ? (
        <form onSubmit={submit} className="mt-5 space-y-4">
          {canRequest ? (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-100">
              Settlement window is open. Request withdrawal of your available referral rewards.
            </p>
          ) : null}

          <CurrencyInput
            label="Requested amount"
            prefix="₦"
            value={amount}
            onChange={setAmount}
            required
            disabled={!canRequest}
          />

          {accounts.length > 0 ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--text-muted)]">Saved bank account</span>
              <select
                className="field"
                value={selectedId}
                onChange={(e) => selectAccount(e.target.value)}
                disabled={!canRequest}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bank_name} · {a.account_number}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <Input label="Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required disabled={!canRequest} />
          <Input
            label="Account name"
            value={accountName}
            readOnly
            disabled
            hint="Locked to your registered full name."
          />
          <Input
            label="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(capAccountNumberInput(e.target.value))}
            required
            disabled={!canRequest}
            maxLength={10}
            inputMode="numeric"
          />

          {error ? <FormFlashError message={error} /> : null}
          {message ? <p className="text-sm text-[var(--emerald)]">{message}</p> : null}
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
                  <dd className="mt-1 font-mono text-sm font-semibold text-[var(--heading)]">
                    {queueView.settlementReference}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <Button type="submit" disabled={loading || !canRequest} className="gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {canRequest ? "Request Withdrawal" : "Unavailable until settlement opens"}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
