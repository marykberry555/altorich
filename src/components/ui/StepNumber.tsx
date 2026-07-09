import { cn } from "@/lib/utils";

type Props = {
  value: string;
  size?: "md" | "lg";
  className?: string;
};

export function StepNumber({ value, size = "md", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--emerald)] bg-[var(--surface-raised)] font-bold text-[var(--emerald)] shadow-[var(--shadow-xs)]",
        size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm",
        className
      )}
      aria-hidden
    >
      {value}
    </span>
  );
}
