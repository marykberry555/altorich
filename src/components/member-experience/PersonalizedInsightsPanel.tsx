import { ArrowDown, ArrowUp, Minus, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { InsightMetric } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  metrics: InsightMetric[];
  title?: string;
  className?: string;
};

function ComparisonBadge({ comparison }: { comparison: NonNullable<InsightMetric["comparison"]> }) {
  const Icon =
    comparison.direction === "up" ? ArrowUp : comparison.direction === "down" ? ArrowDown : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        comparison.direction === "up" && "bg-[var(--emerald)]/10 text-[var(--emerald)]",
        comparison.direction === "down" && "bg-red-500/10 text-red-600 dark:text-red-400",
        comparison.direction === "flat" && "bg-[var(--gray-100)] text-[var(--text-muted)]"
      )}
    >
      <Icon size={10} aria-hidden />
      {comparison.value}
    </span>
  );
}

export function PersonalizedInsightsPanel({ metrics, title = "Insights", className }: Props) {
  if (metrics.length === 0) return null;

  return (
    <Card variant="elevated" padding="md" className={className}>
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-[var(--text-muted)]">This month at a glance.</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <li
            key={metric.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/40 px-4 py-3 dark:bg-white/[0.02]"
          >
            <p className="text-xs font-medium text-[var(--text-subtle)]">{metric.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--heading)]">{metric.value}</p>
            {metric.comparison ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ComparisonBadge comparison={metric.comparison} />
                <span className="text-[10px] text-[var(--text-muted)]">{metric.comparison.label}</span>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
