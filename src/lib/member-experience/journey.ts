import type { JourneyMilestone, MemberActivityContext } from "./types";

const MILESTONES: { id: JourneyMilestone["id"]; label: string; description: string }[] = [
  { id: "registration", label: "Registration", description: "Account created on Alto Rich." },
  { id: "verification", label: "Verification", description: "Email confirmed and profile details added." },
  { id: "funding", label: "Funding", description: "Wallet funded via bank transfer." },
  { id: "investment", label: "Investment", description: "First investment position activated." },
  { id: "returns", label: "Returns", description: "Earnings credited from active investments." },
  { id: "withdrawal", label: "Withdrawal", description: "First withdrawal processed." },
  { id: "long_term", label: "Long-Term Membership", description: "Sustained membership over time." }
];

function accountAgeDays(registeredAt: string | null): number {
  if (!registeredAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(registeredAt).getTime()) / (24 * 60 * 60 * 1000)));
}

function resolveMilestoneComplete(id: JourneyMilestone["id"], ctx: MemberActivityContext): boolean {
  switch (id) {
    case "registration":
      return Boolean(ctx.registeredAt);
    case "verification":
      return ctx.emailVerified && ctx.profileComplete;
    case "funding":
      return ctx.hasDeposit;
    case "investment":
      return ctx.hasInvestment || ctx.hasActiveInvestment;
    case "returns":
      return ctx.totalEarned > 0;
    case "withdrawal":
      return ctx.hasWithdrawal;
    case "long_term":
      return accountAgeDays(ctx.registeredAt) >= 365;
    default:
      return false;
  }
}

export function resolveMemberJourney(ctx: MemberActivityContext): JourneyMilestone[] {
  const completedFlags = MILESTONES.map((m) => resolveMilestoneComplete(m.id, ctx));
  const firstIncomplete = completedFlags.findIndex((c) => !c);

  return MILESTONES.map((m, index) => {
    const complete = completedFlags[index];
    const current = firstIncomplete === index;
    return {
      id: m.id,
      label: m.label,
      description: m.description,
      status: complete ? "complete" : current ? "current" : "upcoming"
    };
  });
}

export function journeyProgressPercent(milestones: JourneyMilestone[]): number {
  const complete = milestones.filter((m) => m.status === "complete").length;
  return Math.round((complete / milestones.length) * 100);
}
