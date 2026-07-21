import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { journeyProgressPercent } from "@/lib/member-experience/journey";
import type { JourneyMilestone } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  milestones: JourneyMilestone[];
  title?: string;
  className?: string;
};

export function MemberJourneyPanel({ milestones, title = "My journey", className }: Props) {
  const progress = journeyProgressPercent(milestones);

  return (
    <Card variant="elevated" padding="md" className={className}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</p>
        <span className="text-xs font-medium tabular-nums text-[var(--text-muted)]">{progress}% complete</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--gray-100)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--emerald)] to-[var(--emerald-mid)] transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Journey progress"
        />
      </div>

      <ol className="relative mt-5 space-y-0" aria-label="Membership journey">
        {milestones.map((milestone, index) => (
          <li key={milestone.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < milestones.length - 1 ? (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px",
                  milestone.status === "complete" ? "bg-[var(--emerald)]" : "bg-[var(--border)]"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                milestone.status === "complete" && "border-[var(--emerald)] bg-[var(--emerald)] text-white",
                milestone.status === "current" &&
                  "border-[var(--gold)] bg-[var(--gold)] text-white shadow-[var(--shadow-sm)]",
                milestone.status === "upcoming" &&
                  "border-[var(--border)] bg-[var(--gray-50)] text-[var(--text-muted)]"
              )}
            >
              {milestone.status === "complete" ? <Check size={14} aria-hidden /> : index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "font-semibold",
                  milestone.status === "current"
                    ? "text-[var(--heading)]"
                    : milestone.status === "complete"
                      ? "text-[var(--emerald)]"
                      : "text-[var(--text-muted)]"
                )}
              >
                {milestone.label}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{milestone.description}</p>
              {milestone.status === "current" ? (
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--gold)]">Current step</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
