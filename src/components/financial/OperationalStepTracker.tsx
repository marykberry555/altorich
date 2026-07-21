import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFinancialDateTime } from "@/lib/financial-events/format";
import type { OperationalStep } from "@/lib/financial-events/types";

type Props = {
  steps: OperationalStep[];
  orientation?: "vertical" | "horizontal";
  className?: string;
  label?: string;
};

function StepIcon({ status }: { status: OperationalStep["status"] }) {
  if (status === "complete") return <Check size={14} className="text-[var(--emerald)]" aria-hidden />;
  if (status === "current") return <Loader2 size={14} className="animate-spin text-[var(--navy)]" aria-hidden />;
  if (status === "failed") return <Circle size={14} className="text-red-500" aria-hidden />;
  return <Circle size={14} className="text-[var(--text-subtle)]" aria-hidden />;
}

export function OperationalStepTracker({ steps, orientation = "vertical", className, label = "Progress" }: Props) {
  if (orientation === "horizontal") {
    return (
      <ol className={cn("flex flex-wrap gap-2", className)} aria-label={label}>
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex min-w-[120px] flex-1 flex-col rounded-xl border px-3 py-2 transition-colors",
              step.status === "current" && "border-[var(--emerald)]/40 bg-[var(--emerald)]/5",
              step.status === "complete" && "border-[var(--border)] bg-[var(--surface-raised)]",
              step.status === "pending" && "border-[var(--border)] bg-[var(--gray-50)]/50 opacity-80",
              step.status === "failed" && "border-red-500/30 bg-red-500/5"
            )}
          >
            <div className="flex items-center gap-2">
              <StepIcon status={step.status} />
              <span className="text-xs font-semibold text-[var(--heading)]">{step.label}</span>
            </div>
            {step.timestamp ? (
              <time className="mt-1 text-[10px] text-[var(--text-subtle)]" dateTime={step.timestamp}>
                {formatFinancialDateTime(step.timestamp)}
              </time>
            ) : null}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn("space-y-0", className)} aria-label={label}>
      {steps.map((step, index) => (
        <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < steps.length - 1 ? (
            <span
              className={cn(
                "absolute left-[11px] top-6 h-[calc(100%-0.75rem)] w-px",
                step.status === "complete" ? "bg-[var(--emerald)]/40" : "bg-[var(--border)]"
              )}
              aria-hidden
            />
          ) : null}
          <span
            className={cn(
              "relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full border bg-[var(--surface-raised)]",
              step.status === "current" && "border-[var(--emerald)]",
              step.status === "complete" && "border-[var(--emerald)]/50",
              step.status === "failed" && "border-red-500/50"
            )}
          >
            <StepIcon status={step.status} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={cn(
                "text-sm font-medium",
                step.status === "pending" ? "text-[var(--text-subtle)]" : "text-[var(--heading)]"
              )}
            >
              {step.label}
            </p>
            {step.timestamp ? (
              <time className="text-xs text-[var(--text-subtle)]" dateTime={step.timestamp}>
                {formatFinancialDateTime(step.timestamp)}
              </time>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
