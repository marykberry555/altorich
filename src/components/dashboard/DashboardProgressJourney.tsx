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
      <ol className="mt-4 flex flex-col gap-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-2 sm:gap-0">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                step.complete && "bg-[var(--emerald-soft)] text-[var(--emerald)]",
                step.current && !step.complete && "bg-[var(--navy)] text-white shadow-[var(--shadow-sm)]",
                !step.complete && !step.current && "bg-[var(--gray-100)] text-[var(--text-muted)]"
              )}
            >
              {step.complete ? (
                <Check size={14} aria-hidden />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/15 text-[10px]">{index + 1}</span>
              )}
              {step.label}
            </div>
            {index < steps.length - 1 ? (
              <span className="mx-1 hidden text-[var(--text-subtle)] sm:inline" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
