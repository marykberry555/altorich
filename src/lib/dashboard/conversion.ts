import type { PackageSlug } from "@/content/packages";
import { getTierConfig } from "@/lib/packages/tier-config";

export type JourneyStepId = "account" | "fund" | "choose" | "active" | "earning" | "payout";

export type DashboardConversionState = {
  walletBalance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  hasActiveInvestment: boolean;
  totalEarned: number;
  preferredPackageSlug: PackageSlug | null;
};

export type NextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "emerald" | "gold" | "navy";
  /** When set, replaces the default "Your next step" eyebrow. */
  eyebrow?: string;
  secondaryCta?: { href: string; label: string };
};

const JOURNEY_STEPS: { id: JourneyStepId; label: string }[] = [
  { id: "account", label: "Create account" },
  { id: "fund", label: "Fund wallet" },
  { id: "choose", label: "Choose package" },
  { id: "active", label: "Investment active" },
  { id: "earning", label: "Start earning" },
  { id: "payout", label: "Monday withdrawal" }
];

export function resolveCurrentJourneyStep(state: DashboardConversionState): JourneyStepId {
  if (state.hasActiveInvestment) {
    if (state.pendingWithdrawals > 0 || state.totalEarned > 0) return "payout";
    return "earning";
  }
  if (state.walletBalance > 0) return "choose";
  return "fund";
}

export function resolveJourneySteps(state: DashboardConversionState) {
  const current = resolveCurrentJourneyStep(state);
  const currentIndex = JOURNEY_STEPS.findIndex((s) => s.id === current);

  return JOURNEY_STEPS.map((step, index) => ({
    ...step,
    complete: step.id === "account" || index < currentIndex,
    current: step.id === current
  }));
}

export function resolveNextAction(state: DashboardConversionState): NextAction {
  // Active investors always get investment-focused status — never onboarding "Fund your wallet".
  if (state.hasActiveInvestment) {
    if (state.pendingWithdrawals > 0) {
      return {
        eyebrow: "Status",
        title: "Withdrawal in progress",
        description: "Your investment remains active. Track your withdrawal request and Monday settlement schedule.",
        href: "/withdrawals",
        cta: "View withdrawal",
        tone: "navy",
        secondaryCta: { href: "/portfolio", label: "View Portfolio" }
      };
    }

    return {
      eyebrow: "Status",
      title: "Investment Active",
      description:
        "Your capital is working for you. Daily earnings accrue automatically and are settled every Monday at 9:00 AM WAT.",
      href: "/portfolio",
      cta: "View Portfolio",
      tone: "emerald",
      secondaryCta: { href: "/deposits", label: "Fund Wallet" }
    };
  }

  if (state.pendingDeposits > 0) {
    return {
      title: "Funding awaiting verification",
      description: "Your deposit is being reviewed. You'll be notified once funds are credited to your wallet.",
      href: "/deposits",
      cta: "View deposit status",
      tone: "gold"
    };
  }

  if (state.walletBalance <= 0) {
    return {
      title: "Fund your wallet",
      description: "Add naira to your Alto Rich wallet — the first step toward your first investment.",
      href: "/deposits",
      cta: "Fund my account",
      tone: "emerald"
    };
  }

  return {
    title: "Start investing",
    description: "Your wallet is funded. Choose a package and activate your first investment.",
    href: "/investments",
    cta: "Explore packages",
    tone: "gold"
  };
}

export function defaultSimulatorPackage(slug: PackageSlug | null) {
  return getTierConfig(slug ?? "growth") ?? getTierConfig("growth")!;
}

export function weeklyEarningEstimate(amountNgn: number, weeklyRoiBps: number) {
  return Math.round((amountNgn * weeklyRoiBps) / 10_000);
}
