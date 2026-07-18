"use client";

import { cn } from "@/lib/utils";
import type { PayoutMethod } from "@/lib/payments";

type Props = {
  value: PayoutMethod;
  onChange: (method: PayoutMethod) => void;
  disabled?: boolean;
};

const OPTIONS: { id: PayoutMethod; label: string; symbol: string; description: string }[] = [
  { id: "bank", label: "Bank Account", symbol: "🏦", description: "Nigerian bank account" },
  { id: "usdt", label: "USDT", symbol: "₮", description: "Tether wallet" },
  { id: "usdc", label: "USDC", symbol: "💵", description: "USD Coin wallet" },
  { id: "btc", label: "Bitcoin (BTC)", symbol: "₿", description: "Bitcoin wallet" }
];

export function PayoutMethodSelector({ value, onChange, disabled }: Props) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium text-[var(--text-muted)]">Withdrawal method</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                selected
                  ? "border-[var(--emerald)]/50 bg-[var(--emerald-soft)]/30 ring-1 ring-[var(--emerald)]/25"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--emerald)]/30",
                disabled && "opacity-60"
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {option.symbol}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--heading)]">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{option.description}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
