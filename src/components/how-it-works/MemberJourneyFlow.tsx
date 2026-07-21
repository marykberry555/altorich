"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  Banknote,
  CalendarCheck,
  CircleDollarSign,
  MailCheck,
  TrendingUp,
  UserPlus,
  Wallet,
  Landmark
} from "lucide-react";
import type { MEMBER_JOURNEY_STEPS } from "@/content/how-it-works-page";
import { cn } from "@/lib/utils";

type Step = (typeof MEMBER_JOURNEY_STEPS)[number];

const STEP_ICONS: Record<Step["id"], LucideIcon> = {
  register: UserPlus,
  "verify-email": MailCheck,
  "choose-portfolio": Landmark,
  fund: Wallet,
  "deposit-verify": Banknote,
  "investment-active": CircleDollarSign,
  "returns-accrue": TrendingUp,
  "withdrawal-request": ArrowDown,
  "weekly-settlement": CalendarCheck
};

type Props = {
  steps: readonly Step[];
  className?: string;
};

/** Elegant member lifecycle — vertical on mobile, horizontal scroll on large screens. */
export function MemberJourneyFlow({ steps, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      {/* Desktop: horizontal flow */}
      <ol
        className="hidden gap-0 lg:grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        aria-label="Member journey"
      >
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id];
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="relative flex min-w-0 flex-col items-center px-2 text-center">
              {!isLast ? (
                <span
                  className="pointer-events-none absolute left-[calc(50%+1.25rem)] top-5 h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-[var(--emerald)]/60 to-[var(--border)]"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-[1] flex size-10 items-center justify-center rounded-full border-2 border-[var(--emerald)] bg-[var(--surface-raised)] text-[var(--emerald)] shadow-sm">
                <Icon size={18} aria-hidden />
              </span>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--emerald)]">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-sm font-semibold leading-snug text-[var(--heading)]">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{step.description}</p>
            </li>
          );
        })}
      </ol>

      {/* Mobile / tablet: vertical timeline */}
      <ol className="space-y-0 lg:hidden" aria-label="Member journey">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id];
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast ? (
                <span
                  className="absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-[var(--emerald)]/50 to-[var(--border)]"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--emerald)] bg-[var(--surface-raised)] text-[var(--emerald)]">
                <Icon size={18} aria-hidden />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--emerald)]">
                  Step {index + 1}
                </p>
                <h3 className="mt-0.5 font-semibold text-[var(--heading)]">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
