"use client";

import Link from "next/link";
import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { getGreeting } from "@/lib/utils/avatar";
import { cn } from "@/lib/utils";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  pageLabel?: string;
  showPageLabel?: boolean;
  className?: string;
};

export function MemberIdentity({ fullName, avatarUrl, pageLabel, showPageLabel, className }: Props) {
  const displayName = fullName.trim() || "Member";

  return (
    <Link
      href="/profile"
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-xl border border-transparent px-1 py-1 transition hover:border-[var(--border)] hover:bg-[var(--gray-50)]",
        className
      )}
    >
      <MemberAvatar fullName={displayName} avatarUrl={avatarUrl} size="md" href="" />
      <div className="min-w-0 text-left">
        {showPageLabel && pageLabel ? (
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{pageLabel}</p>
        ) : null}
        <p className="truncate text-xs text-[var(--text-muted)]">{getGreeting()}</p>
        <p className="truncate text-sm font-semibold text-[var(--heading)] group-hover:text-[var(--emerald)]">{displayName}</p>
      </div>
    </Link>
  );
}
