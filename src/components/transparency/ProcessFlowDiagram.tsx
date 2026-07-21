import { cn } from "@/lib/utils";

type Step = {
  title: string;
  description: string;
};

type Props = {
  steps: readonly Step[];
  className?: string;
  ariaLabel: string;
};

export function ProcessFlowDiagram({ steps, className, ariaLabel }: Props) {
  return (
    <ol className={cn("relative space-y-0", className)} aria-label={ariaLabel}>
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
          {index < steps.length - 1 ? (
            <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-[var(--emerald)]/50 to-[var(--border)]" aria-hidden />
          ) : null}
          <span className="relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--emerald)] bg-[var(--surface-raised)] text-xs font-bold text-[var(--emerald)]">
            {index + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <h3 className="font-semibold text-[var(--heading)]">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
