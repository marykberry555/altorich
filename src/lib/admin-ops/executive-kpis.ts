import { formatNaira } from "@/lib/domain";
import { adminAppPath } from "@/lib/admin-app/constants";
import type { ExecutiveKpi, KpiComparison } from "./types";
import type { AdminLiveMetrics } from "@/services/admin/live-metrics.service";

function buildComparison(current: number, previous: number | null | undefined): KpiComparison {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return { label: "vs yesterday", direction: "flat", value: "No change" };
  const pct = previous === 0 ? null : Math.round((diff / previous) * 100);
  const direction = diff > 0 ? "up" : "down";
  const value = pct !== null ? `${diff > 0 ? "+" : ""}${pct}%` : `${diff > 0 ? "+" : ""}${Math.abs(diff)}`;
  return { label: "vs yesterday", direction, value };
}

export function buildExecutiveKpis(metrics: AdminLiveMetrics): ExecutiveKpi[] {
  return [
    {
      id: "today-deposits",
      label: "Today's deposits",
      value: formatNaira(metrics.todayDepositsAmount),
      accent: "amber",
      href: adminAppPath("/deposits"),
      comparison: buildComparison(metrics.todayDepositsAmount, metrics.yesterdayDepositsAmount)
    },
    {
      id: "today-withdrawals",
      label: "Today's withdrawals",
      value: formatNaira(metrics.todayWithdrawalsAmount),
      accent: "gold",
      href: adminAppPath("/payouts"),
      comparison: buildComparison(metrics.todayWithdrawalsAmount, metrics.yesterdayWithdrawalsAmount)
    },
    {
      id: "pending-deposit-reviews",
      label: "Pending deposit reviews",
      value: String(metrics.pendingDepositReviews),
      accent: "amber",
      href: adminAppPath("/deposits")
    },
    {
      id: "pending-withdrawals",
      label: "Pending withdrawal requests",
      value: String(metrics.pendingWithdrawals),
      accent: "gold",
      href: adminAppPath("/payouts")
    },
    {
      id: "pending-kyc",
      label: "Pending KYC reviews",
      value: String(metrics.pendingKyc),
      accent: "navy",
      href: adminAppPath("/members")
    },
    {
      id: "new-members",
      label: "New members today",
      value: String(metrics.todayNewMembers),
      accent: "emerald",
      href: adminAppPath("/members"),
      comparison: buildComparison(metrics.todayNewMembers, metrics.yesterdayNewMembers)
    },
    {
      id: "active-members",
      label: "Active members (30d)",
      value: String(metrics.activeMembers30d),
      accent: "sky",
      href: adminAppPath("/members")
    },
    {
      id: "email-verifications",
      label: "Email verifications today",
      value: String(metrics.emailVerificationsToday),
      accent: "emerald",
      href: adminAppPath("/members")
    },
    {
      id: "support-open",
      label: "Support items open",
      value: String(metrics.supportItemsOpen),
      accent: "navy",
      href: adminAppPath("/support")
    },
    {
      id: "referral-activity",
      label: "Referral activity today",
      value: String(metrics.referralActivityToday),
      accent: "emerald",
      href: adminAppPath("/referrals")
    },
    {
      id: "welcome-bonus",
      label: "Welcome bonus allocations",
      value: String(metrics.welcomeBonusAllocations),
      accent: "gold",
      href: adminAppPath("/welcome-bonus")
    },
    {
      id: "settlement-queue",
      label: "Settlement queue size",
      value: String(metrics.settlementQueueSize),
      accent: "gold",
      href: adminAppPath("/settlements")
    }
  ];
}
