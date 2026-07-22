export type ReferralDashboard = {
  inviteCode: string;
  inviteLink: string;
  totalReferrals: number;
  verifiedInvestors: number;
  pendingReferrals: number;
  totalInvestmentGenerated: number;
  currentCommissionRate: number;
  vipLevel: number;
  vipLabel: string;
  nextVipLevel: VipLevelConfig | null;
  verifiedForNextLevel: number;
  requiredForNextLevel: number;
  referralWalletBalance: number;
  pendingRewards: number;
  lifetimeRewards: number;
  alreadyPaid: number;
  minPayoutThreshold: number;
  canRequestPayout: boolean;
  payoutGap: number;
  /** ISO timestamp of next Monday 9:00 AM settlement. */
  nextSettlementAt: string;
  settlementWindowOpen: boolean;
  meetsPayoutThreshold: boolean;
  eligibilityStatus: "eligible" | "below_minimum" | "awaiting_settlement" | "program_disabled";
  eligibilityMessage: string;
  recentReferrals: ReferralActivityRow[];
  recentRewards: ReferralRewardRow[];
  programEnabled: boolean;
};

export type ReferralActivityRow = {
  id: string;
  referredName: string;
  username: string | null;
  avatarUrl: string | null;
  status: string;
  investmentAmount: number | null;
  packageTier: string | null;
  commissionAmount: number;
  createdAt: string;
  verifiedAt: string | null;
};

export type ReferralRewardRow = {
  id: string;
  rewardType: string;
  amount: number;
  status: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type VipLevelConfig = {
  level: number;
  label: string;
  min_members: number;
  commission_percent: number;
  milestone_bonus: number;
  perks: string[];
};
