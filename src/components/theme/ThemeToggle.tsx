"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

type Props = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-[var(--border)]",
        "bg-[var(--surface-raised)] text-[var(--text-muted)] shadow-[var(--shadow-xs)]",
        "transition-all duration-300 hover:border-[var(--emerald-mid)] hover:text-[var(--emerald)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald-mid)]",
        compact ? "h-9 w-9" : "h-10 w-10",
        className
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Sun
        size={compact ? 16 : 18}
        className={cn(
          "absolute transition-all duration-500",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
        aria-hidden
      />
      <Moon
        size={compact ? 16 : 18}
        className={cn(
          "absolute transition-all duration-500",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
        aria-hidden
      />
    </button>
  );
}
