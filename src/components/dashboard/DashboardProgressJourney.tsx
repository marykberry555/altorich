import { Check } from "lucide-react";
import type { DashboardConversionState } from "@/lib/dashboard/conversion";
import { resolveJourneySteps } from "@/lib/dashboard/conversion";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  state: DashboardConversionState;
  className?: string;
};

export function DashboardProgressJourney({ state, className }: Props) {
  const steps = resolveJourneySteps(state);

  return (
    <Card variant="elevated" padding="md" className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Your journey</p>
      <ol className="relative mt-5 space-y-0" aria-label="Member journey progress">
        {steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px",
                  step.complete ? "bg-[var(--emerald)]" : "bg-[var(--border)]"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                step.complete && "border-[var(--emerald)] bg-[var(--emerald)] text-white",
                step.current && !step.complete && "animate-pulse border-[var(--gold)] bg-[var(--gold)] text-white shadow-[var(--shadow-sm)]",
                !step.complete && !step.current && "border-[var(--border)] bg-[var(--gray-50)] text-[var(--text-muted)]"
              )}
            >
              {step.complete ? <Check size={14} aria-hidden /> : index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "font-semibold",
                  step.current ? "text-[var(--heading)]" : step.complete ? "text-[var(--emerald)]" : "text-[var(--text-muted)]"
                )}
              >
                {step.label}
              </p>
              {step.current ? (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">You are here</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
