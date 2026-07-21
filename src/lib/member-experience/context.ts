import type { DashboardConversionState } from "@/lib/dashboard/conversion";
import { resolveAchievements } from "./achievements";
import { buildMemberInsights } from "./insights";
import { resolveMemberJourney } from "./journey";
import { buildContextualEncouragement, buildPersonalizedGreeting } from "./greeting";
import { resolveReputation } from "./reputation";
import { buildSmartRecommendations } from "./recommendations";
import type { MemberActivityContext, TodaySummary } from "./types";

export type ProfileMeta = {
  email_verified_at?: string | null;
  created_at?: string | null;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  location_state_code?: string | null;
};

export function isProfileComplete(profile: ProfileMeta | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.full_name?.trim() &&
      profile.phone?.trim() &&
      profile.location_state_code?.trim()
  );
}

export function buildMemberActivityContext(input: {
  profile: ProfileMeta | null;
  hasDeposit: boolean;
  hasInvestment: boolean;
  hasWithdrawal: boolean;
  hasReferral: boolean;
  welcomeBonusQualified: boolean;
  welcomeBonusWithdrawn: boolean;
  conversion: DashboardConversionState;
}): MemberActivityContext {
  return {
    registeredAt: input.profile?.created_at ?? null,
    emailVerified: Boolean(input.profile?.email_verified_at),
    profileComplete: isProfileComplete(input.profile),
    hasDeposit: input.hasDeposit,
    hasInvestment: input.hasInvestment,
    hasWithdrawal: input.hasWithdrawal,
    hasReferral: input.hasReferral,
    welcomeBonusQualified: input.welcomeBonusQualified,
    welcomeBonusWithdrawn: input.welcomeBonusWithdrawn,
    pendingDeposits: input.conversion.pendingDeposits,
    pendingWithdrawals: input.conversion.pendingWithdrawals,
    totalEarned: input.conversion.totalEarned,
    hasActiveInvestment: input.conversion.hasActiveInvestment
  };
}

export function buildTodaySummary(input: {
  walletBalance: number;
  portfolioValue: number;
  totalEarned: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  unreadNotifications: number;
  earningsTrend: { date: string; value: number }[];
}): TodaySummary {
  const today = new Date();
  const todaysEarnings = input.earningsTrend
    .filter((p) => {
      const d = new Date(p.date);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    })
    .reduce((s, p) => s + p.value, 0);

  return {
    todaysEarnings: todaysEarnings > 0 ? todaysEarnings : null,
    portfolioValue: input.portfolioValue,
    walletBalance: input.walletBalance,
    pendingActions: input.pendingDeposits + input.pendingWithdrawals,
    unreadNotifications: input.unreadNotifications
  };
}

export function buildMemberExperienceBundle(input: {
  fullName: string;
  profile: ProfileMeta | null;
  conversion: DashboardConversionState;
  hasDeposit: boolean;
  hasInvestment: boolean;
  hasWithdrawal: boolean;
  hasReferral: boolean;
  welcomeBonusQualified: boolean;
  welcomeBonusWithdrawn: boolean;
  walletBalance: number;
  portfolioValue: number;
  unreadNotifications: number;
  earningsTrend: { date: string; value: number }[];
  monthlyDeposits: { month: string; value: number }[];
  monthlyWithdrawals: { month: string; value: number }[];
  referralCount: number;
  verifiedReferrals: number;
}) {
  const activity = buildMemberActivityContext({
    profile: input.profile,
    hasDeposit: input.hasDeposit,
    hasInvestment: input.hasInvestment,
    hasWithdrawal: input.hasWithdrawal,
    hasReferral: input.hasReferral,
    welcomeBonusQualified: input.welcomeBonusQualified,
    welcomeBonusWithdrawn: input.welcomeBonusWithdrawn,
    conversion: input.conversion
  });

  const todaySummary = buildTodaySummary({
    walletBalance: input.walletBalance,
    portfolioValue: input.portfolioValue,
    totalEarned: input.conversion.totalEarned,
    pendingDeposits: input.conversion.pendingDeposits,
    pendingWithdrawals: input.conversion.pendingWithdrawals,
    unreadNotifications: input.unreadNotifications,
    earningsTrend: input.earningsTrend
  });

  const encouragement = buildContextualEncouragement(activity, todaySummary);

  return {
    greeting: buildPersonalizedGreeting(input.fullName),
    encouragement,
    todaySummary,
    activity,
    achievements: resolveAchievements(activity),
    reputation: resolveReputation(activity),
    journey: resolveMemberJourney(activity),
    insights: buildMemberInsights({
      totalEarned: input.conversion.totalEarned,
      portfolioValue: input.portfolioValue,
      monthlyDeposits: input.monthlyDeposits,
      monthlyWithdrawals: input.monthlyWithdrawals,
      referralCount: input.referralCount,
      verifiedReferrals: input.verifiedReferrals,
      earningsTrend: input.earningsTrend
    }),
    recommendations: buildSmartRecommendations(activity, input.conversion)
  };
}
