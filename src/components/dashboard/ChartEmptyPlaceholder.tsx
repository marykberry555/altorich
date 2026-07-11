import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  message?: string;
};

export function ChartEmptyPlaceholder({ className, message = "Your earnings history will grow here once you begin investing." }: Props) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center px-6 text-center", className)}>
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--emerald-soft)]/60 to-[var(--gray-100)] ring-1 ring-[var(--border)]"
        aria-hidden
      >
        <BarChart3 className="h-7 w-7 text-[var(--emerald)]/70" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-[var(--heading)]">{message}</p>
    </div>
  );
}
