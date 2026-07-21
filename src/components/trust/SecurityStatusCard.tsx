import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  status?: "good" | "neutral" | "warning" | "unavailable";
  hint?: string;
  className?: string;
};

const STATUS_BADGE: Record<NonNullable<Props["status"]>, { label: string; variant: "emerald" | "default" | "gold" }> = {
  good: { label: "Verified", variant: "emerald" },
  neutral: { label: "Active", variant: "default" },
  warning: { label: "Action needed", variant: "gold" },
  unavailable: { label: "Unavailable", variant: "default" }
};

export function SecurityStatusCard({ label, value, status = "neutral", hint, className }: Props) {
  const badge = STATUS_BADGE[status];

  return (
    <Card variant="elevated" padding="md" className={cn("h-full", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="font-semibold text-[var(--heading)]">{value}</p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      {hint ? <p className="mt-2 text-sm text-[var(--text-muted)]">{hint}</p> : null}
    </Card>
  );
}
