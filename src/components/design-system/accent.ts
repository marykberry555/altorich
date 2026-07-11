export type StatAccent = "emerald" | "gold" | "navy" | "sky" | "amber" | "slate";

export const accentStyles: Record<
  StatAccent,
  { bar: string; icon: string; hover: string }
> = {
  emerald: {
    bar: "from-[var(--emerald-light)]/80 via-[var(--emerald-mid)]/40 to-transparent",
    icon: "bg-[var(--emerald-soft)] text-[var(--emerald)] ring-[var(--emerald)]/15",
    hover: "hover:border-[var(--emerald-mid)]/30 hover:shadow-[var(--shadow-glow)]"
  },
  gold: {
    bar: "from-[var(--gold-light)]/80 via-[var(--gold)]/35 to-transparent",
    icon: "bg-[var(--gold-soft)] text-[var(--gold)] ring-[var(--gold)]/15",
    hover: "hover:border-[var(--gold)]/30"
  },
  navy: {
    bar: "from-[var(--navy-mid)]/70 via-[var(--navy)]/35 to-transparent",
    icon: "bg-[var(--navy-soft)] text-[var(--heading)] ring-[var(--navy)]/15",
    hover: "hover:border-[var(--navy-mid)]/30"
  },
  sky: {
    bar: "from-sky-500/70 via-sky-400/35 to-transparent",
    icon: "bg-sky-500/10 text-sky-600 ring-sky-500/15 dark:text-sky-400",
    hover: "hover:border-sky-500/25"
  },
  amber: {
    bar: "from-amber-500/70 via-amber-400/35 to-transparent",
    icon: "bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400",
    hover: "hover:border-amber-500/25"
  },
  slate: {
    bar: "from-[var(--text-subtle)]/40 via-[var(--text-subtle)]/15 to-transparent",
    icon: "bg-[var(--gray-100)] text-[var(--text-muted)] ring-[var(--border)]",
    hover: "hover:border-[var(--border-strong)]"
  }
};

export function accentBar(accent: StatAccent = "emerald"): string {
  return accentStyles[accent].bar;
}
