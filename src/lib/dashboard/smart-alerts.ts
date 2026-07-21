import type { DashboardConversionState } from "@/lib/dashboard/conversion";
import type { WelcomeBonusLifecycle } from "@/lib/welcome-bonus/lifecycle";

export type SmartAlert = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  priority: "critical" | "important" | "informational";
  href?: string;
  dismissible?: boolean;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

function inferPriority(title: string, body: string): SmartAlert["priority"] {
  const text = `${title} ${body}`.toLowerCase();
  if (/kyc|verify|security|failed|rejected|action required/.test(text)) return "critical";
  if (/deposit|withdraw|bonus|settlement|pending|unlock/.test(text)) return "important";
  return "informational";
}

function inferHref(title: string, body: string): string | undefined {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("withdraw")) return "/withdrawals";
  if (text.includes("deposit") || text.includes("fund")) return "/deposits";
  if (text.includes("bonus")) return "/wallet";
  if (text.includes("referral")) return "/team";
  if (text.includes("profile") || text.includes("kyc")) return "/profile";
  if (text.includes("invest")) return "/investments";
  return "/notifications";
}

export function mapNotificationToSmartAlert(n: NotificationRow): SmartAlert {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    created_at: n.created_at,
    read_at: n.read_at,
    priority: inferPriority(n.title, n.body),
    href: inferHref(n.title, n.body),
    dismissible: true
  };
}

export function buildConversionAlerts(state: DashboardConversionState): SmartAlert[] {
  const now = new Date().toISOString();
  const alerts: SmartAlert[] = [];

  if (state.pendingDeposits > 0) {
    alerts.push({
      id: "conv-deposit-pending",
      title: "Deposit awaiting approval",
      body: "Your transfer is being verified. We will notify you once your wallet is credited.",
      created_at: now,
      priority: "important",
      href: "/deposits",
      dismissible: true
    });
  }

  if (state.pendingWithdrawals > 0) {
    alerts.push({
      id: "conv-withdrawal-pending",
      title: "Withdrawal processing",
      body: "Your withdrawal request is in the Monday settlement queue.",
      created_at: now,
      priority: "important",
      href: "/withdrawals",
      dismissible: true
    });
  }

  if (!state.hasActiveInvestment && state.walletBalance <= 0 && state.pendingDeposits === 0) {
    alerts.push({
      id: "conv-fund-wallet",
      title: "Fund your wallet to begin",
      body: "Submit a transfer to start your investment journey with Alto Rich.",
      created_at: now,
      priority: "informational",
      href: "/deposits",
      dismissible: true
    });
  }

  if (!state.hasActiveInvestment && state.walletBalance > 0) {
    alerts.push({
      id: "conv-start-investing",
      title: "Your wallet is ready",
      body: "Choose an investment portfolio and activate your first allocation.",
      created_at: now,
      priority: "informational",
      href: "/investments",
      dismissible: true
    });
  }

  return alerts;
}

export function buildWelcomeBonusAlert(lifecycle: WelcomeBonusLifecycle, amount: number): SmartAlert | null {
  if (["email_pending", "available", "waiting_for_monday"].includes(lifecycle.stage)) {
    return {
      id: `wb-${lifecycle.stage}`,
      title: lifecycle.title,
      body: lifecycle.description,
      created_at: new Date().toISOString(),
      priority: lifecycle.stage === "available" ? "important" : "informational",
      href: lifecycle.nextAction?.href ?? "/wallet",
      dismissible: lifecycle.stage !== "available"
    };
  }
  if (lifecycle.stage === "withdrawal_requested") {
    return {
      id: "wb-withdrawal",
      title: "Welcome bonus withdrawal in queue",
      body: `Your ₦${amount.toLocaleString("en-NG")} welcome bonus is awaiting Monday settlement.`,
      created_at: new Date().toISOString(),
      priority: "informational",
      href: "/withdrawals?source=welcome_bonus",
      dismissible: true
    };
  }
  return null;
}

export function mergeSmartAlerts(input: {
  notifications: NotificationRow[];
  conversionState: DashboardConversionState;
  welcomeBonusLifecycle?: WelcomeBonusLifecycle | null;
  welcomeBonusAmount?: number;
}): SmartAlert[] {
  const fromNotifications = input.notifications.map(mapNotificationToSmartAlert);
  const fromConversion = buildConversionAlerts(input.conversionState);
  const bonusAlert =
    input.welcomeBonusLifecycle && input.welcomeBonusAmount != null
      ? buildWelcomeBonusAlert(input.welcomeBonusLifecycle, input.welcomeBonusAmount)
      : null;

  const merged = [...fromNotifications, ...fromConversion, ...(bonusAlert ? [bonusAlert] : [])];
  const seen = new Set<string>();
  return merged.filter((alert) => {
    if (seen.has(alert.id)) return false;
    seen.add(alert.id);
    return true;
  });
}
