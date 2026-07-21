import { getFirstName, getGreeting } from "@/lib/utils/avatar";
import type { ContextualEncouragement, MemberActivityContext, TodaySummary } from "./types";

export function buildPersonalizedGreeting(fullName: string): string {
  const first = getFirstName(fullName);
  const base = getGreeting();
  if (base === "Good morning") return `${base}, ${first} 👋`;
  return `${base}, ${first}`;
}

export function buildContextualEncouragement(
  ctx: MemberActivityContext,
  summary: TodaySummary
): ContextualEncouragement {
  if (summary.pendingActions > 0) {
    return {
      message: "A few items need your attention today.",
      tone: "attention"
    };
  }

  if (ctx.hasActiveInvestment && ctx.totalEarned > 0) {
    return {
      message: "Your portfolio is active.",
      tone: "positive"
    };
  }

  if (ctx.hasActiveInvestment) {
    return {
      message: "You're making steady progress.",
      tone: "positive"
    };
  }

  if (ctx.emailVerified && ctx.profileComplete && !ctx.hasDeposit) {
    return {
      message: "Your account is ready when you are.",
      tone: "neutral"
    };
  }

  if (summary.pendingActions === 0 && ctx.emailVerified) {
    return {
      message: "Everything is up to date.",
      tone: "neutral"
    };
  }

  return {
    message: "Here's what's happening today.",
    tone: "neutral"
  };
}

export function buildTodaySubheading(encouragement: ContextualEncouragement): string {
  return encouragement.message;
}
