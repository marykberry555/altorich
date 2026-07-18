"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { AnimatedCountdownDigit } from "@/components/roi/AnimatedCountdownDigit";
import { getGreeting } from "@/lib/utils/avatar";
import { getPackageLabel } from "@/lib/packages/constants";
import { formatNaira } from "@/lib/domain";
import { computeWeeklyTicker } from "@/lib/roi/math";
import { weeklyCountdownTarget } from "@/lib/roi/time";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function splitSeconds(total: number) {
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  preferredPackageSlug?: string | null;
  hasActiveInvestment: boolean;
  roi?: {
    principalNgn: number;
    weeklyRoiBps: number;
    cycleStartedAt: string;
    cycleEndsAt: string;
    tierName?: string;
  } | null;
  className?: string;
};

export function DashboardCyclePanel({
  fullName,
  avatarUrl,
  preferredPackageSlug,
  hasActiveInvestment,
  roi,
  className
}: Props) {
  const name = fullName.trim() || "Member";
  const packageLabel = getPackageLabel(preferredPackageSlug);
  const now = useLiveNow();

  const remaining = useMemo(() => weeklyCountdownTarget(now).secondsRemaining, [now]);
  const { days, hours, minutes, seconds } = splitSeconds(remaining);
  const weekProgress = Math.min(100, Math.max(0, ((7 * 86400 - remaining) / (7 * 86400)) * 100));

  const ticker = useMemo(() => {
    if (!roi) return null;
    return computeWeeklyTicker({
      principalNgn: roi.principalNgn,
      weeklyRoiBps: roi.weeklyRoiBps,
      cycleStartedAt: roi.cycleStartedAt,
      cycleEndsAt: roi.cycleEndsAt,
      now
    });
  }, [roi, now]);

  const progress = ticker ? Math.round(ticker.progress * 100) : Math.round(weekProgress);
  const investHref = "/investments";

  return (
    <Card variant="elevated" padding="none" className={cn("overflow-hidden", className)}>
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" href="/profile" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-muted)]">{getGreeting()},</p>
            <p className="mt-0.5 text-xl font-bold tracking-tight text-[var(--heading)] sm:text-2xl">{name}</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">
              {hasActiveInvestment && roi?.tierName ? (
                <span className="text-[var(--heading)]">{roi.tierName}</span>
              ) : (
                <span className="text-[var(--heading)]">{packageLabel}</span>
              )}
            </p>
          </div>
        </div>
        {!hasActiveInvestment ? (
          <Link
            href={investHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--emerald)] hover:underline"
          >
            Invest now
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#0a6b52] to-[#042f24] p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            {ticker ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">Earned this week</p>
                <p className="currency-ngn mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                  {formatNaira(ticker.accrued)}
                </p>
                <p className="currency-ngn mt-1 text-xs tabular-nums text-white/75">
                  {formatNaira(ticker.perSecond)}/s · {formatNaira(ticker.weeklyInterest)} target
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">Weekly earnings</p>
                <p className="mt-1 text-lg font-semibold text-white">Fund a plan to start earning</p>
              </>
            )}

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span>Cycle</span>
                <span className="tabular-nums text-white/90">{progress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-200 transition-[width] duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/65">Settlement Monday · 09:00 WAT</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2" role="timer" aria-live="polite">
            <AnimatedCountdownDigit value={String(days)} label="D" />
            <span className="pb-5 text-xl font-light text-white/35">:</span>
            <AnimatedCountdownDigit value={pad2(hours)} label="H" />
            <span className="pb-5 text-xl font-light text-white/35">:</span>
            <AnimatedCountdownDigit value={pad2(minutes)} label="M" />
            <span className="pb-5 text-xl font-light text-white/35">:</span>
            <AnimatedCountdownDigit value={pad2(seconds)} label="S" />
          </div>
        </div>
      </div>
    </Card>
  );
}
