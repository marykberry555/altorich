"use client";

import { WeeklyCountdown } from "@/components/roi/WeeklyCountdown";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { getGreeting } from "@/lib/utils/avatar";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  pageLabel: string;
  isOverview: boolean;
};

export function FloatingMemberBar({ fullName, avatarUrl, pageLabel, isOverview }: Props) {
  const displayName = fullName.trim() || "Member";

  return (
    <div className="pointer-events-none fixed bottom-[4.75rem] left-3 right-3 z-[35] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-xs lg:bottom-6">
      <div
        className="pointer-events-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]/88 px-4 py-3 shadow-lg backdrop-blur-xl"
        style={{ boxShadow: "0 8px 32px rgba(6, 78, 59, 0.12)" }}
      >
        <div className="flex items-center gap-3">
          <AvatarUpload fullName={displayName} avatarUrl={avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            {!isOverview ? (
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                {pageLabel}
              </p>
            ) : null}
            <p className="text-xs font-medium text-[var(--text-muted)]">{getGreeting()}</p>
            <p className="truncate text-base font-semibold text-[var(--heading)]">{displayName}</p>
          </div>
        </div>
        <WeeklyCountdown compact className="mt-3" />
      </div>
    </div>
  );
}
