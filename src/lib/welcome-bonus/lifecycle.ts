import type { WelcomeBonusMemberView } from "@/services/welcome-bonus/welcome-bonus.service";
import type { WelcomeBonusProgrammeStatus } from "@/lib/welcome-bonus/programme-status";

export type WelcomeBonusLifecycleStage =
  | "promotion_closed"
  | "promotion_full"
  | "not_eligible"
  | "email_pending"
  | "slot_reserved"
  | "qualification_in_progress"
  | "qualification_complete"
  | "waiting_for_monday"
  | "available"
  | "withdrawal_requested"
  | "paid";

export type WelcomeBonusChecklistItem = {
  id: string;
  label: string;
  state: "complete" | "current" | "pending";
};

export type WelcomeBonusLifecycle = {
  stage: WelcomeBonusLifecycleStage;
  title: string;
  description: string;
  tone: "emerald" | "gold" | "navy" | "slate";
  checklist: WelcomeBonusChecklistItem[];
  progressPercent: number;
  daysElapsed: number;
  daysTotal: number;
  nextAction: { label: string; href?: string } | null;
};

export type WelcomeBonusLifecycleInput = {
  memberView: WelcomeBonusMemberView;
  programme: WelcomeBonusProgrammeStatus;
  emailVerified?: boolean;
  registeredAt?: string | null;
};

function formatLagosDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos"
  });
}

function formatLagosDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short"
  });
}

function qualificationProgress(input: WelcomeBonusLifecycleInput) {
  const { memberView, programme, registeredAt } = input;
  const daysTotal = programme.qualificationDays;
  if (!memberView.allocated || !registeredAt || !memberView.qualificationEndsAt) {
    return { daysElapsed: 0, daysTotal, progressPercent: 0 };
  }
  const start = new Date(registeredAt).getTime();
  const end = new Date(memberView.qualificationEndsAt).getTime();
  const totalMs = Math.max(end - start, 1);
  const elapsedMs = Math.min(Math.max(Date.now() - start, 0), totalMs);
  const daysElapsed = Math.min(daysTotal, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)));
  const progressPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
  return { daysElapsed, daysTotal, progressPercent };
}

function buildChecklist(input: WelcomeBonusLifecycleInput, stage: WelcomeBonusLifecycleStage): WelcomeBonusChecklistItem[] {
  const { memberView, emailVerified } = input;
  const allocated = memberView.allocated;
  const verified = emailVerified ?? allocated;

  const qualificationState: WelcomeBonusChecklistItem["state"] =
    stage === "qualification_in_progress" || stage === "qualification_complete" || stage === "waiting_for_monday"
      ? stage === "qualification_in_progress"
        ? "current"
        : "complete"
      : ["available", "withdrawal_requested", "paid"].includes(stage)
        ? "complete"
        : allocated
          ? "pending"
          : "pending";

  return [
    {
      id: "slot",
      label: "Slot reserved",
      state: allocated ? "complete" : stage === "email_pending" ? "current" : "pending"
    },
    {
      id: "email",
      label: "Email verified",
      state: verified ? "complete" : stage === "email_pending" ? "current" : allocated ? "complete" : "pending"
    },
    {
      id: "qualification",
      label: "Qualification",
      state: qualificationState
    },
    {
      id: "unlock",
      label: "Monday unlock",
      state: ["waiting_for_monday"].includes(stage)
        ? "current"
        : ["available", "withdrawal_requested", "paid"].includes(stage)
          ? "complete"
          : "pending"
    }
  ];
}

export function resolveWelcomeBonusLifecycle(input: WelcomeBonusLifecycleInput): WelcomeBonusLifecycle {
  const { memberView, programme, emailVerified } = input;
  const progress = qualificationProgress(input);

  if (!programme.enabled) {
    return {
      stage: "promotion_closed",
      title: "Promotion currently closed",
      description: "The welcome bonus programme is not active right now. Check back later for future promotions.",
      tone: "slate",
      checklist: buildChecklist(input, "promotion_closed"),
      ...progress,
      nextAction: null
    };
  }

  if (!memberView.allocated) {
    if (programme.fullyAllocated) {
      return {
        stage: "promotion_full",
        title: "Promotion fully allocated",
        description: "All welcome bonus slots have been claimed. New registrations are no longer eligible for this promotion.",
        tone: "slate",
        checklist: buildChecklist(input, "promotion_full"),
        ...progress,
        nextAction: null
      };
    }

    if (!emailVerified) {
      return {
        stage: "email_pending",
        title: "Verify your email to reserve a slot",
        description: `Verify your email to claim up to ${programme.remaining} remaining welcome bonus slots.`,
        tone: "gold",
        checklist: buildChecklist(input, "email_pending"),
        ...progress,
        nextAction: { label: "Verify email", href: "/settings" }
      };
    }

    return {
      stage: "not_eligible",
      title: "Welcome bonus unavailable",
      description: "You are not currently enrolled in the welcome bonus programme.",
      tone: "slate",
      checklist: buildChecklist(input, "not_eligible"),
      ...progress,
      nextAction: null
    };
  }

  if (memberView.status === "paid") {
    return {
      stage: "paid",
      title: "Welcome bonus paid",
      description: "Your welcome bonus withdrawal has been settled. Thank you for being an Alto Rich member.",
      tone: "emerald",
      checklist: buildChecklist(input, "paid"),
      ...progress,
      nextAction: null
    };
  }

  if (memberView.status === "withdrawal_requested") {
    return {
      stage: "withdrawal_requested",
      title: "Withdrawal requested",
      description: "Your welcome bonus is in the Monday settlement queue. Track progress on your withdrawals page.",
      tone: "gold",
      checklist: buildChecklist(input, "withdrawal_requested"),
      ...progress,
      nextAction: { label: "Track withdrawal", href: "/withdrawals?source=welcome_bonus" }
    };
  }

  if (memberView.status === "available") {
    return {
      stage: "available",
      title: "Bonus available to withdraw",
      description: "Your welcome bonus has unlocked and is ready for withdrawal via the Monday settlement queue.",
      tone: "emerald",
      checklist: buildChecklist(input, "available"),
      ...progress,
      nextAction: { label: "Request withdrawal", href: "/withdrawals?source=welcome_bonus" }
    };
  }

  if (memberView.status === "locked") {
    if (memberView.daysRemaining <= 0) {
      return {
        stage: "waiting_for_monday",
        title: "Qualification complete — awaiting Monday unlock",
        description: "Your welcome bonus unlocks on the next Monday settlement at 9:00 AM.",
        tone: "navy",
        checklist: buildChecklist(input, "waiting_for_monday"),
        progressPercent: 100,
        daysElapsed: progress.daysTotal,
        daysTotal: progress.daysTotal,
        nextAction: null
      };
    }

    if (progress.daysElapsed <= 1) {
      return {
        stage: "slot_reserved",
        title: "Welcome bonus slot reserved",
        description: `Your ₦${memberView.amount.toLocaleString("en-NG")} welcome bonus is reserved and will unlock on the next eligible Monday settlement.`,
        tone: "emerald",
        checklist: buildChecklist(input, "slot_reserved"),
        ...progress,
        nextAction: null
      };
    }

    return {
      stage: "qualification_in_progress",
      title: "Qualification in progress",
      description: `Keep your account in good standing. Your bonus unlocks on ${formatLagosDate(memberView.expectedUnlockAt)}.`,
      tone: "gold",
      checklist: buildChecklist(input, "qualification_in_progress"),
      ...progress,
      nextAction: null
    };
  }

  return {
    stage: "not_eligible",
    title: "Welcome bonus",
    description: "Your welcome bonus status could not be determined.",
    tone: "slate",
    checklist: buildChecklist(input, "not_eligible"),
    ...progress,
    nextAction: null
  };
}

export function lifecycleMeta(lifecycle: WelcomeBonusLifecycle, memberView: WelcomeBonusMemberView) {
  return {
    qualificationEndsLabel: formatLagosDate(memberView.qualificationEndsAt),
    unlockLabel: formatLagosDateTime(memberView.expectedUnlockAt),
    withdrawable: memberView.status === "available" || memberView.status === "withdrawal_requested"
      ? memberView.withdrawableBalance || memberView.amount
      : memberView.status === "paid"
        ? 0
        : memberView.amount
  };
}
