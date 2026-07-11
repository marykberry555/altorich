import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]/20",
  approved: "bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]/20",
  completed: "bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]/20",
  paid: "bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]/20",
  pending: "bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/20",
  processing: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
  cancelled: "bg-[var(--gray-100)] text-[var(--text-muted)] border-[var(--border)]",
  matured: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  disabled: "bg-red-500/10 text-red-700 border-red-500/20",
  deactivated: "bg-[var(--gray-100)] text-[var(--text-muted)] border-[var(--border)]",
  failed: "bg-red-500/10 text-red-700 border-red-500/20"
};

const fallback = "bg-[var(--gray-100)] text-[var(--text-muted)] border-[var(--border)]";

type Props = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: Props) {
  const key = String(status).toLowerCase();
  const styles = statusStyles[key] ?? fallback;
  const display = label ?? key.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        styles,
        className
      )}
    >
      {display}
    </span>
  );
}
