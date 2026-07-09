import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "emerald" | "gold" | "navy" | "outline";
  className?: string;
};

const variants = {
  default: "bg-[var(--gray-100)] text-[var(--text-muted)]",
  emerald: "bg-[var(--emerald-soft)] text-[var(--emerald)]",
  gold: "bg-[var(--gold-soft)] text-[var(--gold)]",
  navy: "bg-[var(--navy-soft)] text-[var(--navy)]",
  outline: "border border-[var(--border)] text-[var(--text-muted)]"
};

export function Badge({ children, variant = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
