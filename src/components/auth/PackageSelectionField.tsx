"use client";

import { useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import type { PackageSlug } from "@/content/packages";
import { PREFERRED_PACKAGE_OPTIONS } from "@/lib/packages/constants";
import { cn } from "@/lib/utils";

type Props = {
  value: PackageSlug | "";
  onChange: (slug: PackageSlug) => void;
  disabled?: boolean;
  error?: string;
};

export function PackageSelectionField({ value, onChange, disabled, error }: Props) {
  const [open, setOpen] = useState(false);
  const selected = PREFERRED_PACKAGE_OPTIONS.find((p) => p.slug === value);

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[var(--heading)]">
        <Sparkles size={14} className="text-[var(--emerald)]" aria-hidden />
        Preferred investment package
        <span className="text-red-500" aria-hidden>
          *
        </span>
      </legend>
      <p className="mb-2 text-xs text-[var(--text-muted)]">
        Choose the plan that fits your goals. You can change this later in Settings.
      </p>

      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]",
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
          <span className={cn("truncate text-sm", selected ? "font-semibold text-[var(--heading)]" : "text-[var(--text-muted)]")}>
            {selected ? selected.title : "Tap to select a package"}
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
          className="flex flex-col gap-1.5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 shadow-[var(--shadow-md)]"
        >
          {PREFERRED_PACKAGE_OPTIONS.map((pkg) => {
            const isSelected = value === pkg.slug;
            return (
              <button
                key={pkg.slug}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={disabled}
                onClick={() => {
                  onChange(pkg.slug);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
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
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--heading)]">{pkg.title}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{pkg.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </fieldset>
  );
}
