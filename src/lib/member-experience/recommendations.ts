import type { DashboardConversionState } from "@/lib/dashboard/conversion";
import type { MemberActivityContext, Recommendation } from "./types";

export function buildSmartRecommendations(
  ctx: MemberActivityContext,
  conversion: DashboardConversionState
): Recommendation[] {
  const items: Recommendation[] = [];

  if (!ctx.profileComplete) {
    items.push({
      id: "rec-complete-profile",
      title: "Complete your profile",
      body: "Add your phone number and location so we can serve you better.",
      href: "/profile",
      priority: "high",
      dismissible: true
    });
  }

  if (!ctx.emailVerified) {
    items.push({
      id: "rec-verify-email",
      title: "Verify your email",
      body: "Confirm your email address to unlock full account features.",
      href: "/settings",
      priority: "high",
      dismissible: true
    });
  }

  if (!ctx.hasDeposit && conversion.pendingDeposits === 0) {
    items.push({
      id: "rec-fund-wallet",
      title: "Fund your wallet",
      body: "Submit a bank transfer to begin your investment journey.",
      href: "/deposits",
      priority: "medium",
      dismissible: true
    });
  }

  if (ctx.hasDeposit && !ctx.hasInvestment) {
    items.push({
      id: "rec-start-investing",
      title: "Explore investment portfolios",
      body: "Your wallet is ready. Review portfolios and allocate to your first position.",
      href: "/investments",
      priority: "medium",
      dismissible: true
    });
  }

  if (conversion.pendingWithdrawals > 0) {
    items.push({
      id: "rec-withdrawal-guide",
      title: "Read the withdrawal guide",
      body: "Understand Monday settlement timing and queue processing.",
      href: "/learn/withdrawal-process",
      priority: "low",
      dismissible: true
    });
  }

  items.push({
    id: "rec-security",
    title: "Review security settings",
    body: "Confirm your PIN and notification preferences are up to date.",
    href: "/settings",
    priority: "low",
    dismissible: true
  });

  items.push({
    id: "rec-knowledge",
    title: "Explore the Knowledge Centre",
    body: "Guides on funding, settlements, security, and financial planning.",
    href: "/learn",
    priority: "low",
    dismissible: true
  });

  if (!ctx.hasReferral) {
    items.push({
      id: "rec-invite",
      title: "Invite friends",
      body: "Share your referral link and earn commissions on verified investors.",
      href: "/team",
      priority: "low",
      dismissible: true
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
  return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
