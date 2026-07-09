"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
};

export function PinField({
  label = "6-digit pin",
  value,
  onChange,
  id = "pin",
  required,
  autoComplete = "current-password",
  className
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={cn("grid gap-1.5", className)} htmlFor={id}>
      <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required={required}
          autoComplete={autoComplete}
          className={cn(
            "h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-raised)]",
            "px-4 pr-11 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)]",
            "transition-colors focus:border-[var(--emerald-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald-soft)]"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--gray-100)] hover:text-[var(--heading)]"
          aria-label={visible ? "Hide pin" : "Show pin"}
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    </label>
  );
}
