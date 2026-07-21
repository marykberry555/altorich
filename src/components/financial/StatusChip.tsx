import { cn } from "@/lib/utils";
import type { MemberQueueStatus } from "@/lib/payout/settlement-queue";

type Props = {
  label: string;
  variant?: "emerald" | "gold" | "navy" | "outline" | "amber" | "slate";
  className?: string;
};

export function StatusChip({ label, variant = "outline", className }: Props) {
  const styles = {
    emerald: "border-[var(--emerald)]/30 bg-[var(--emerald)]/10 text-[var(--emerald)]",
    gold: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    navy: "border-[var(--navy)]/20 bg-[var(--navy)]/5 text-[var(--navy)] dark:text-sky-200",
    outline: "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)]",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    slate: "border-[var(--border)] bg-[var(--gray-50)] text-[var(--text-subtle)]"
  } satisfies Record<NonNullable<Props["variant"]>, string>;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        styles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

export function payoutStatusToChipVariant(label: MemberQueueStatus | string): Props["variant"] {
  if (label === "Paid") return "emerald";
  if (label === "Rejected" || label === "Cancelled") return "slate";
  if (label === "Processing" || label === "Under Review") return "navy";
  return "gold";
}
