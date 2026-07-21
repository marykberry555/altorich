import Link from "next/link";
import { Lock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { countUnlockedAchievements } from "@/lib/member-experience/achievements";
import type { AchievementView } from "@/lib/member-experience/types";
import { resolveAchievementIcon } from "./achievement-icons";
import { cn } from "@/lib/utils";

type Props = {
  achievements: AchievementView[];
  className?: string;
  compact?: boolean;
};

function formatEarnedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export function MemberAchievementsPanel({ achievements, className, compact }: Props) {
  const unlocked = countUnlockedAchievements(achievements);
  const display = compact ? achievements.filter((a) => a.status === "unlocked").slice(0, 4) : achievements;

  return (
    <Card variant="elevated" padding="md" className={className}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--gold)]" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Achievements</h2>
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {unlocked} of {achievements.length}
        </span>
      </div>

      <ul className="mt-4 space-y-2" aria-label="Member achievements">
        {display.map((item) => {
          const Icon = resolveAchievementIcon(item.iconKey);
          const earned = formatEarnedDate(item.earnedAt);
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3",
                item.status === "unlocked"
                  ? "border-[var(--emerald)]/20 bg-[var(--emerald)]/5"
                  : "border-[var(--border)] bg-[var(--gray-50)]/30 opacity-75"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  item.status === "unlocked" ? "bg-[var(--emerald)]/15 text-[var(--emerald)]" : "bg-[var(--gray-100)] text-[var(--text-muted)]"
                )}
              >
                {item.status === "unlocked" ? <Icon size={18} aria-hidden /> : <Lock size={16} aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--heading)]">{item.title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{item.description}</p>
                {item.status === "unlocked" && earned ? (
                  <p className="mt-1 text-[10px] font-medium text-[var(--text-subtle)]">Earned {earned}</p>
                ) : item.status === "locked" ? (
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-subtle)]">Locked</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {compact && achievements.length > display.length ? (
        <Link href="/profile" className="mt-3 block text-center text-xs font-medium text-[var(--emerald)] hover:underline">
          View all achievements
        </Link>
      ) : null}
    </Card>
  );
}
