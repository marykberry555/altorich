"use client";

import { useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { getAvailablePortfolios, type PortfolioSlug } from "@/config/investment-portfolios";
import { PortfolioBadge } from "@/components/portfolio/PortfolioBadge";
import { cn } from "@/lib/utils";

type Props = {
  value: PortfolioSlug | "";
  onChange: (slug: PortfolioSlug) => void;
  disabled?: boolean;
  error?: string;
  /** Registration uses plain "Select package" for clarity in Nigeria. */
  label?: string;
  placeholder?: string;
};

export function PortfolioSelector({
  value,
  onChange,
  disabled,
  error,
  label = "Select package",
  placeholder = "Tap to choose a package"
}: Props) {
  const [open, setOpen] = useState(false);
  const options = getAvailablePortfolios();
  const selected = options.find((p) => p.slug === value);

  return (
    <fieldset className="min-w-0 space-y-2 overflow-hidden" disabled={disabled}>
      <legend className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[var(--heading)]">
        <Sparkles size={14} className="shrink-0 text-[var(--emerald)]" aria-hidden />
        <span>{label}</span>
        <span className="text-red-500" aria-hidden>
          *
        </span>
      </legend>

      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]",
          selected
            ? "border-[var(--emerald)]/40 bg-[var(--emerald-soft)]/30 ring-1 ring-[var(--emerald)]/25"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--emerald)]/30",
          open && "border-[var(--emerald)]/50 shadow-sm",
          disabled && "opacity-60"
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--emerald)] text-white">
              <Check className="h-3 w-3" aria-hidden />
            </span>
          ) : null}
          <span
            className={cn(
              "min-w-0 break-words text-sm",
              selected ? "font-semibold text-[var(--heading)]" : "text-[var(--text-muted)]"
            )}
          >
            {selected ? `${selected.strategy} · ${selected.name}` : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Investment packages"
          className="max-h-[min(52vh,22rem)] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 shadow-[var(--shadow-md)]"
        >
          <div className="flex flex-col gap-1">
            {options.map((portfolio) => {
              const isSelected = value === portfolio.slug;
              return (
                <button
                  key={portfolio.slug}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  onClick={() => {
                    onChange(portfolio.slug);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full min-w-0 items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-[var(--emerald-soft)]/50" : "hover:bg-[var(--gray-50)]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      isSelected ? "border-[var(--emerald)] bg-[var(--emerald)]" : "border-[var(--border)]"
                    )}
                    aria-hidden
                  >
                    {isSelected ? <Check className="h-3 w-3 text-white" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--emerald)]">
                      {portfolio.strategy}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--heading)]">{portfolio.name}</span>
                      <PortfolioBadge slug={portfolio.slug} />
                    </span>
                    <span className="mt-1 block break-words text-xs font-medium text-[var(--emerald)]">
                      {portfolio.dailyReturnRate}% daily · ₦{portfolio.minimumInvestment.toLocaleString("en-NG")}–₦
                      {portfolio.maximumInvestment.toLocaleString("en-NG")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {selected && !open ? (
        <div
          className="rounded-xl border border-emerald-700/20 bg-[var(--emerald-soft)]/40 px-3 py-2.5 dark:border-emerald-400/25 dark:bg-emerald-500/10"
          role="status"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Check size={14} className="shrink-0" aria-hidden />
            Package selected
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-[var(--heading)]">
            {selected.strategy} · {selected.name}
          </p>
          <p className="mt-0.5 break-words text-xs font-medium text-[var(--emerald)]">
            {selected.dailyReturnRate}% daily · ₦{selected.minimumInvestment.toLocaleString("en-NG")}–₦
            {selected.maximumInvestment.toLocaleString("en-NG")}
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </fieldset>
  );
}
