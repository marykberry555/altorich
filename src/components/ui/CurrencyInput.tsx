"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatIntegerWithCommas, parseFormattedNumber, sanitizeNumericInput } from "@/lib/format/number-input";

type Props = {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (rawValue: string) => void;
  prefix?: string;
  allowDecimal?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  inputMode?: "numeric" | "decimal";
};

export const CurrencyInput = forwardRef<HTMLInputElement, Props>(function CurrencyInput(
  {
    label,
    hint,
    error,
    value,
    onChange,
    prefix,
    allowDecimal = false,
    placeholder,
    required,
    disabled,
    id,
    className,
    inputMode = "numeric"
  },
  ref
) {
  const [display, setDisplay] = useState(() => formatIntegerWithCommas(value));

  useEffect(() => {
    const formatted = formatIntegerWithCommas(value);
    if (parseFormattedNumber(formatted) === parseFormattedNumber(display)) {
      if (value === "" && display !== "") setDisplay("");
      return;
    }
    setDisplay(formatted);
  }, [value, display]);

  const handleChange = useCallback(
    (next: string) => {
      const raw = sanitizeNumericInput(next, allowDecimal);
      onChange(raw);
      setDisplay(formatIntegerWithCommas(raw));
    },
    [allowDecimal, onChange]
  );

  return (
    <label className="grid gap-1.5" htmlFor={id}>
      {label ? <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span> : null}
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--text-muted)]">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 text-sm tabular-nums",
            "text-[var(--text)] placeholder:text-[var(--text-subtle)]",
            "transition-colors focus:border-[var(--emerald-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald-soft)]",
            prefix && "pl-9",
            error && "border-red-500",
            className
          )}
        />
      </div>
      {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
      {hint && !error ? <span className="text-xs text-[var(--text-subtle)]">{hint}</span> : null}
    </label>
  );
});

export function parseCurrencyInput(value: string): number {
  return parseFormattedNumber(value);
}
