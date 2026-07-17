import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "gold" | "navy";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: "bg-[var(--emerald)] text-white hover:bg-[var(--emerald-mid)] shadow-[var(--shadow-sm)]",
  secondary: "bg-[var(--gray-100)] text-[var(--text)] hover:bg-[var(--gray-200)]",
  outline: "border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text)] hover:border-[var(--emerald-mid)] hover:text-[var(--emerald)]",
  ghost: "text-[var(--text-muted)] hover:bg-[var(--gray-100)] hover:text-[var(--text)]",
  gold: "bg-[var(--gold)] text-white hover:brightness-110 shadow-[var(--shadow-sm)]",
  navy: "bg-[var(--navy)] text-white hover:bg-[var(--navy-mid)] shadow-[var(--shadow-sm)]"
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-11 px-5 text-sm gap-2 rounded-[var(--radius-sm)]",
  lg: "h-13 px-7 text-base gap-2.5 rounded-[var(--radius)]"
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-[var(--tap-min)] items-center justify-center font-semibold",
        "transition-all duration-[var(--motion-base)] ease-[var(--ease-out)]",
        "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald-mid)]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
