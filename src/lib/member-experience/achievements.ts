import type { AchievementDefinition, AchievementView, MemberActivityContext } from "./types";

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function milestoneDate(iso: string | null | undefined): string | null {
  return iso ?? null;
}

/** Registry — add new achievements here without changing resolver logic. */
export const ACHIEVEMENT_REGISTRY: AchievementDefinition[] = [
  {
    id: "first_login",
    title: "First Login",
    description: "Signed in to your Alto Rich account.",
    iconKey: "log-in",
    evaluate: (ctx) => ({
      unlocked: true,
      earnedAt: ctx.registeredAt
    })
  },
  {
    id: "email_verified",
    title: "Email Verified",
    description: "Confirmed your email address for account security.",
    iconKey: "mail-check",
    evaluate: (ctx) => ({
      unlocked: ctx.emailVerified,
      earnedAt: ctx.emailVerified ? ctx.registeredAt : null
    })
  },
  {
    id: "profile_completed",
    title: "Profile Completed",
    description: "Added your contact details and profile information.",
    iconKey: "user-check",
    evaluate: (ctx) => ({
      unlocked: ctx.profileComplete,
      earnedAt: ctx.profileComplete ? ctx.registeredAt : null
    })
  },
  {
    id: "first_deposit",
    title: "First Deposit",
    description: "Funded your wallet for the first time.",
    iconKey: "arrow-down-to-line",
    evaluate: (ctx) => ({
      unlocked: ctx.hasDeposit,
      earnedAt: null
    })
  },
  {
    id: "first_investment",
    title: "First Investment",
    description: "Activated your first investment position.",
    iconKey: "trending-up",
    evaluate: (ctx) => ({
      unlocked: ctx.hasInvestment,
      earnedAt: null
    })
  },
  {
    id: "first_withdrawal",
    title: "First Withdrawal",
    description: "Completed your first withdrawal request.",
    iconKey: "arrow-up-from-line",
    evaluate: (ctx) => ({
      unlocked: ctx.hasWithdrawal,
      earnedAt: null
    })
  },
  {
    id: "first_referral",
    title: "First Referral",
    description: "Invited someone to join Alto Rich.",
    iconKey: "users",
    evaluate: (ctx) => ({
      unlocked: ctx.hasReferral,
      earnedAt: null
    })
  },
  {
    id: "welcome_bonus_qualified",
    title: "Welcome Bonus Qualified",
    description: "Met the requirements for the welcome bonus programme.",
    iconKey: "gift",
    evaluate: (ctx) => ({
      unlocked: ctx.welcomeBonusQualified,
      earnedAt: null
    })
  },
  {
    id: "welcome_bonus_withdrawn",
    title: "Welcome Bonus Withdrawn",
    description: "Withdrew your welcome bonus allocation.",
    iconKey: "banknote",
    evaluate: (ctx) => ({
      unlocked: ctx.welcomeBonusWithdrawn,
      earnedAt: null
    })
  },
  {
    id: "days_30_active",
    title: "30 Days Active",
    description: "Maintained your membership for 30 days.",
    iconKey: "calendar",
    evaluate: (ctx) => {
      const days = daysSince(ctx.registeredAt);
      return { unlocked: days >= 30, earnedAt: days >= 30 ? ctx.registeredAt : null };
    }
  },
  {
    id: "days_100_active",
    title: "100 Days Active",
    description: "Maintained your membership for 100 days.",
    iconKey: "calendar-days",
    evaluate: (ctx) => {
      const days = daysSince(ctx.registeredAt);
      return { unlocked: days >= 100, earnedAt: days >= 100 ? ctx.registeredAt : null };
    }
  },
  {
    id: "year_member",
    title: "1 Year Member",
    description: "Celebrated one year as an Alto Rich member.",
    iconKey: "award",
    evaluate: (ctx) => {
      const days = daysSince(ctx.registeredAt);
      return { unlocked: days >= 365, earnedAt: days >= 365 ? ctx.registeredAt : null };
    }
  }
];

export function resolveAchievements(ctx: MemberActivityContext): AchievementView[] {
  return ACHIEVEMENT_REGISTRY.map((def) => {
    const result = def.evaluate(ctx);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      iconKey: def.iconKey,
      status: result.unlocked ? "unlocked" : "locked",
      earnedAt: milestoneDate(result.earnedAt)
    };
  });
}

export function countUnlockedAchievements(achievements: AchievementView[]): number {
  return achievements.filter((a) => a.status === "unlocked").length;
}
