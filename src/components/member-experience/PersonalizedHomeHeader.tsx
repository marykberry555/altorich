import { MemberReputationBadge } from "./MemberReputationBadge";
import type { ContextualEncouragement, ReputationView } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  greeting: string;
  encouragement: ContextualEncouragement;
  reputation: ReputationView;
  className?: string;
};

export function PersonalizedHomeHeader({ greeting, encouragement, reputation, className }: Props) {
  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--heading)] sm:text-3xl">{greeting}</h1>
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed",
              encouragement.tone === "attention" && "text-[var(--gold)]",
              encouragement.tone === "positive" && "text-[var(--emerald)]",
              encouragement.tone === "neutral" && "text-[var(--text-muted)]"
            )}
          >
            {encouragement.message}
          </p>
        </div>
        <MemberReputationBadge reputation={reputation} compact />
      </div>
    </header>
  );
}
