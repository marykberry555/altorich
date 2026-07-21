"use client";

import Link from "next/link";
import {
  Check,
  Circle,
  Clock,
  Gift,
  Loader2
} from "lucide-react";
import { formatNaira } from "@/lib/domain";
import {
  lifecycleMeta,
  resolveWelcomeBonusLifecycle,
  type WelcomeBonusLifecycleInput
} from "@/lib/welcome-bonus/lifecycle";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = WelcomeBonusLifecycleInput & {
  className?: string;
};

const toneBadge = {
  emerald: "emerald" as const,
  gold: "gold" as const,
  navy: "navy" as const,
  slate: "outline" as const
};

function ChecklistIcon({ state }: { state: "complete" | "current" | "pending" }) {
  if (state === "complete") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--emerald)] text-white">
        <Check size={12} strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-white">
        <Loader2 size={12} className="animate-spin" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--gray-50)]">
      <Circle size={10} className="text-[var(--text-subtle)]" aria-hidden />
    </span>
  );
}

export function WelcomeBonusCard({ memberView, programme, emailVerified, registeredAt, className }: Props) {
  const lifecycle = resolveWelcomeBonusLifecycle({ memberView, programme, emailVerified, registeredAt });
  const meta = lifecycleMeta(lifecycle, memberView);

  const showProgramme = programme.enabled && (memberView.allocated || !programme.fullyAllocated);
  if (!showProgramme && lifecycle.stage === "promotion_closed") return null;

  return (
    <Card variant="elevated" padding="md" className={cn("overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <Gift size={20} aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Welcome Bonus
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-[var(--heading)]">
              {formatNaira(memberView.allocated ? memberView.amount : programme.amount)}
            </p>
          </div>
        </div>
        <Badge variant={toneBadge[lifecycle.tone]}>{lifecycle.title.split("—")[0]?.trim() ?? "Status"}</Badge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{lifecycle.description}</p>

      {memberView.allocated || lifecycle.stage === "email_pending" ? (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">Status</p>
          <ul className="space-y-2.5" aria-label="Welcome bonus progress">
            {lifecycle.checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <ChecklistIcon state={item.state} />
                <span
                  className={cn(
                    item.state === "complete" && "font-medium text-[var(--heading)]",
                    item.state === "current" && "font-semibold text-[var(--heading)]",
                    item.state === "pending" && "text-[var(--text-muted)]"
                  )}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lifecycle.stage === "qualification_in_progress" || lifecycle.stage === "slot_reserved" ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              {lifecycle.daysElapsed} / {lifecycle.daysTotal} days
            </span>
            <span>{lifecycle.progressPercent}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]"
            role="progressbar"
            aria-valuenow={lifecycle.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Qualification progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--emerald)] to-[var(--gold)] transition-all duration-500"
              style={{ width: `${lifecycle.progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {memberView.allocated ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/60 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
              Qualification ends
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--heading)]">{meta.qualificationEndsLabel}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/60 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">Unlock</dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--heading)]">
              <Clock size={12} className="mr-1 inline text-[var(--emerald)]" aria-hidden />
              {meta.unlockLabel}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/60 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
              Withdrawable
            </dt>
            <dd className="mt-1 text-sm font-bold tabular-nums text-[var(--heading)]">
              {formatNaira(meta.withdrawable)}
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="mt-4 text-xs text-[var(--text-subtle)]">
        Promotional reward — separate from your investment wallet. Never earns ROI and cannot be invested.
      </p>

      {lifecycle.nextAction?.href ? (
        <div className="mt-4">
          <Link href={lifecycle.nextAction.href}>
            <Button size="sm">{lifecycle.nextAction.label}</Button>
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
