import type { PackageSlug } from "@/content/packages";
import type { DashboardConversionState } from "@/lib/dashboard/conversion";
import type { NextAction } from "@/lib/dashboard/conversion";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export function buildActionHints(state: DashboardConversionState): NotificationRow[] {
  const hints: NotificationRow[] = [];
  const now = new Date().toISOString();

  if (state.pendingDeposits > 0) {
    hints.push({
      id: "hint-deposit",
      title: "Funding awaiting verification",
      body: "Your deposit is being reviewed. We'll notify you when your wallet is credited.",
      created_at: now,
      read_at: null
    });
  } else if (state.walletBalance <= 0) {
    hints.push({
      id: "hint-fund",
      title: "Complete your first funding",
      body: "Fund your wallet to unlock investment packages and start earning.",
      created_at: now,
      read_at: null
    });
  } else if (!state.hasActiveInvestment) {
    hints.push({
      id: "hint-invest",
      title: "Complete your first investment",
      body: "Your wallet is ready. Choose a package and activate your investment.",
      created_at: now,
      read_at: null
    });
  } else if (state.hasActiveInvestment) {
    hints.push({
      id: "hint-track",
      title: "Your investment is active",
      body: "Track live earnings in your portfolio. Payouts follow the Monday schedule.",
      created_at: now,
      read_at: null
    });
  }

  return hints.slice(0, 3);
}

export function toConversionState(input: {
  balance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  hasActiveInvestment: boolean;
  totalEarned: number;
  preferredPackageSlug: string | null;
}): DashboardConversionState {
  return {
    walletBalance: input.balance,
    pendingDeposits: input.pendingDeposits,
    pendingWithdrawals: input.pendingWithdrawals,
    hasActiveInvestment: input.hasActiveInvestment,
    totalEarned: input.totalEarned,
    preferredPackageSlug: (input.preferredPackageSlug as PackageSlug | null) ?? null
  };
}

export type { NextAction };
