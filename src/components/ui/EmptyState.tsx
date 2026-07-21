import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse motion-reduce:animate-none rounded-[var(--radius-sm)] bg-[var(--gray-100)]", className)}
      aria-hidden
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--gray-50)] px-6 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      {Icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--gray-100)] text-[var(--text-subtle)]">
          <Icon size={28} strokeWidth={1.5} aria-hidden />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
