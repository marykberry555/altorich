import type { MemberActivityContext, ReputationTier, ReputationView } from "./types";

function accountAgeDays(registeredAt: string | null): number {
  if (!registeredAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(registeredAt).getTime()) / (24 * 60 * 60 * 1000)));
}

const TIER_META: Record<ReputationTier, { label: string; description: string }> = {
  new: {
    label: "New Member",
    description: "Welcome to Alto Rich. Complete verification and explore your dashboard."
  },
  verified: {
    label: "Verified Member",
    description: "Your email is confirmed. You have access to full platform features."
  },
  active: {
    label: "Active Member",
    description: "You engage regularly with your account and investments."
  },
  established: {
    label: "Established Member",
    description: "A consistent track record of funding and platform activity."
  },
  long_term: {
    label: "Long-Term Member",
    description: "A sustained relationship with Alto Rich over time."
  },
  trusted: {
    label: "Trusted Member",
    description: "Verified identity, complete profile, and meaningful platform engagement."
  }
};

/**
 * Derives a trust indicator from meaningful activity.
 * Internal scoring is never exposed — only the resulting tier label.
 */
export function resolveReputation(ctx: MemberActivityContext): ReputationView {
  const ageDays = accountAgeDays(ctx.registeredAt);

  const isTrusted =
    ctx.emailVerified &&
    ctx.profileComplete &&
    ctx.hasInvestment &&
    ageDays >= 90 &&
    (ctx.hasDeposit || ctx.totalEarned > 0);

  if (isTrusted) {
    return { tier: "trusted", ...TIER_META.trusted };
  }

  if (ageDays >= 365) {
    return { tier: "long_term", ...TIER_META.long_term };
  }

  if (ageDays >= 100 && ctx.hasDeposit) {
    return { tier: "long_term", ...TIER_META.long_term };
  }

  if (ageDays >= 30 && (ctx.hasDeposit || ctx.hasInvestment)) {
    return { tier: "established", ...TIER_META.established };
  }

  if (ctx.hasActiveInvestment || ctx.hasDeposit || ctx.totalEarned > 0) {
    return { tier: "active", ...TIER_META.active };
  }

  if (ctx.emailVerified) {
    return { tier: "verified", ...TIER_META.verified };
  }

  return { tier: "new", ...TIER_META.new };
}
