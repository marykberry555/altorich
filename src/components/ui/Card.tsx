import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "outline" | "navy";
  padding?: "none" | "sm" | "md" | "lg";
  /** Subtle lift on hover — use for interactive surfaces only */
  interactive?: boolean;
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  interactive = false,
  children,
  ...props
}: Props) {
  const variants = {
    default: "bg-[var(--surface-raised)] border border-[var(--border)]",
    elevated: "bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-md)]",
    outline: "bg-transparent border border-[var(--border-strong)]",
    navy: "bg-[var(--navy)] text-white border border-white/10"
  };
  const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

  return (
    <div
      className={cn(
        "rounded-[var(--radius)]",
        variants[variant],
        paddings[padding],
        interactive && "card-lift cursor-pointer hover:border-[var(--emerald)]/25",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
