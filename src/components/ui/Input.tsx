import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, label, hint, error, id, ...props }, ref) => (
    <label className="grid gap-1.5" htmlFor={id}>
      {label ? <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          "h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 text-sm",
          "text-[var(--text)] placeholder:text-[var(--text-subtle)]",
          "transition-colors focus:border-[var(--emerald-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald-soft)]",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
      {hint && !error ? <span className="text-xs text-[var(--text-subtle)]">{hint}</span> : null}
    </label>
  )
);
Input.displayName = "Input";
