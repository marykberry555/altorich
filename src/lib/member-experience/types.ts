import type { LucideIcon } from "lucide-react";

export type AchievementStatus = "locked" | "unlocked";

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  /** Lucide icon key resolved at render time */
  iconKey: string;
  evaluate: (ctx: MemberActivityContext) => { unlocked: boolean; earnedAt?: string | null };
};

export type AchievementView = {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  status: AchievementStatus;
  earnedAt?: string | null;
};

export type ReputationTier =
  | "new"
  | "verified"
  | "active"
  | "established"
  | "long_term"
  | "trusted";

export type ReputationView = {
  tier: ReputationTier;
  label: string;
  description: string;
};

export type MemberActivityContext = {
  registeredAt: string | null;
  emailVerified: boolean;
  profileComplete: boolean;
  hasDeposit: boolean;
  hasInvestment: boolean;
  hasWithdrawal: boolean;
  hasReferral: boolean;
  welcomeBonusQualified: boolean;
  welcomeBonusWithdrawn: boolean;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalEarned: number;
  hasActiveInvestment: boolean;
};

export type InsightMetric = {
  id: string;
  label: string;
  value: string;
  comparison?: {
    label: string;
    direction: "up" | "down" | "flat";
    value: string;
  } | null;
};

export type Recommendation = {
  id: string;
  title: string;
  body: string;
  href: string;
  priority: "high" | "medium" | "low";
  dismissible: boolean;
};

export type JourneyMilestoneId =
  | "registration"
  | "verification"
  | "funding"
  | "investment"
  | "returns"
  | "withdrawal"
  | "long_term";

export type JourneyMilestone = {
  id: JourneyMilestoneId;
  label: string;
  description: string;
  status: "complete" | "current" | "upcoming";
};

export type AnnouncementCategory =
  | "feature"
  | "maintenance"
  | "policy"
  | "education"
  | "notice";

export type PlatformAnnouncement = {
  id: string;
  category: AnnouncementCategory;
  title: string;
  body: string;
  publishedAt: string;
  href?: string | null;
};

export type DashboardWidgetId =
  | "greeting"
  | "today_summary"
  | "recommendations"
  | "wealth_hero"
  | "next_step"
  | "journey"
  | "quick_actions"
  | "welcome_bonus"
  | "portfolio"
  | "referrals"
  | "calendar"
  | "insights"
  | "achievements"
  | "reputation"
  | "activity"
  | "charts"
  | "settlements"
  | "knowledge"
  | "notifications";

export type DashboardWidgetConfig = {
  id: DashboardWidgetId;
  label: string;
  visible: boolean;
};

export type DocumentCategory = "statements" | "reports" | "tax" | "bonus" | "referral" | "security";

export type DocumentItem = {
  id: string;
  category: DocumentCategory;
  title: string;
  description: string;
  available: boolean;
  href?: string | null;
};

export type TodaySummary = {
  todaysEarnings: number | null;
  portfolioValue: number;
  walletBalance: number;
  pendingActions: number;
  unreadNotifications: number;
};

export type ContextualEncouragement = {
  message: string;
  tone: "neutral" | "positive" | "attention";
};

export type IconKeyMap = Record<string, LucideIcon>;
