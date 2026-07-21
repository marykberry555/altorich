import { formatSettlementOpenLabel, mergeSettlementQueueConfig } from "@/lib/payout/settlement-queue";
import type { CalendarEvent } from "./types";
import type { WelcomeBonusMemberView } from "@/services/welcome-bonus/welcome-bonus.service";

export function buildFinancialCalendar(input: {
  nextSettlementAt?: string | null;
  welcomeBonus?: WelcomeBonusMemberView | null;
  qualificationEndsAt?: string | null;
  announcement?: string | null;
  portfolioAnniversaryAt?: string | null;
  maintenanceAt?: string | null;
  maintenanceNote?: string | null;
  settlementQueueConfig?: Partial<import("@/lib/payout/settlement-queue").SettlementQueueConfig> | null;
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const queue = mergeSettlementQueueConfig(input.settlementQueueConfig);

  if (input.nextSettlementAt) {
    events.push({
      id: "settlement-day",
      kind: "settlement",
      title: "Settlement Day",
      description: `Weekly withdrawal processing · ${formatSettlementOpenLabel(queue)}`,
      at: input.nextSettlementAt,
      href: "/withdrawals"
    });
  }

  if (input.welcomeBonus?.expectedUnlockAt) {
    events.push({
      id: "bonus-unlock",
      kind: "bonus_unlock",
      title: "Bonus Unlock",
      description: "Welcome bonus becomes available for withdrawal.",
      at: input.welcomeBonus.expectedUnlockAt,
      href: "/wallet"
    });
  }

  if (input.qualificationEndsAt) {
    events.push({
      id: "qualification-end",
      kind: "qualification_end",
      title: "Qualification Ends",
      description: "Complete qualification requirements before this date.",
      at: input.qualificationEndsAt,
      href: "/wallet"
    });
  }

  events.push({
    id: "withdrawal-window",
    kind: "withdrawal_window",
    title: "Withdrawal Window",
    description: `Settlement opens ${formatSettlementOpenLabel(queue)}.`,
    at: input.nextSettlementAt ?? new Date().toISOString(),
    href: "/withdrawals"
  });

  if (input.maintenanceAt) {
    events.push({
      id: "maintenance",
      kind: "maintenance",
      title: "Scheduled Maintenance",
      description: input.maintenanceNote ?? "Platform maintenance window.",
      at: input.maintenanceAt,
      href: "/announcements"
    });
  }

  if (input.portfolioAnniversaryAt) {
    events.push({
      id: "portfolio-anniversary",
      kind: "portfolio_anniversary",
      title: "Portfolio Anniversary",
      description: "One year since your first investment.",
      at: input.portfolioAnniversaryAt,
      href: "/portfolio"
    });
  }

  if (input.announcement?.trim()) {
    events.push({
      id: "announcement",
      kind: "announcement",
      title: "Platform Announcement",
      description: input.announcement.trim(),
      at: new Date().toISOString(),
      href: "/notifications"
    });
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
