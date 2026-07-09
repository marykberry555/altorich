import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function StatCard({ label, value, change, icon: Icon, trend = "neutral", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">{label}</p>
        {Icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--emerald-soft)]">
            <Icon size={18} className="text-[var(--emerald)]" />
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)] tabular-nums">{value}</p>
      {change ? (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trend === "up" && "text-[var(--emerald-mid)]",
            trend === "down" && "text-red-600",
            trend === "neutral" && "text-[var(--text-subtle)]"
          )}
        >
          {change}
        </p>
      ) : null}
    </div>
  );
}
