import { BadgeCheck, Shield } from "lucide-react";
import type { ReputationView } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  reputation: ReputationView;
  compact?: boolean;
  className?: string;
};

const tierStyles: Record<ReputationView["tier"], string> = {
  new: "border-[var(--border)] bg-[var(--gray-50)]/80 text-[var(--text-muted)]",
  verified: "border-blue-200/80 bg-blue-50/80 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
  active: "border-[var(--emerald)]/30 bg-[var(--emerald)]/5 text-[var(--emerald)]",
  established: "border-[var(--gold)]/30 bg-[var(--gold-soft)]/60 text-[var(--heading)]",
  long_term: "border-[var(--navy)]/20 bg-[var(--navy)]/5 text-[var(--navy)] dark:text-[var(--sidebar-text)]",
  trusted: "border-[var(--emerald)]/40 bg-[var(--emerald)]/10 text-[var(--emerald)]"
};

export function MemberReputationBadge({ reputation, compact, className }: Props) {
  const Icon = reputation.tier === "trusted" ? BadgeCheck : Shield;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
          tierStyles[reputation.tier],
          className
        )}
        title={reputation.description}
      >
        <Icon size={14} aria-hidden />
        {reputation.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border px-4 py-3",
        tierStyles[reputation.tier],
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={18} aria-hidden />
        <p className="font-semibold">{reputation.label}</p>
      </div>
      <p className="mt-1 text-sm leading-relaxed opacity-90">{reputation.description}</p>
    </div>
  );
}
