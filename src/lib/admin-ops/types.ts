export type KpiComparison = {
  label: string;
  direction: "up" | "down" | "flat";
  value: string;
} | null;

export type ExecutiveKpi = {
  id: string;
  label: string;
  value: string;
  href?: string;
  accent?: "emerald" | "amber" | "gold" | "navy" | "sky";
  comparison?: KpiComparison;
};

export type OperationsFeedCategory =
  | "deposits"
  | "withdrawals"
  | "members"
  | "support"
  | "security"
  | "system"
  | "all";

export type OperationsFeedEvent = {
  id: string;
  category: OperationsFeedCategory;
  kind: string;
  title: string;
  description?: string;
  actorName?: string | null;
  entityId?: string | null;
  href?: string | null;
  at: string;
};

export type FraudAlertKind =
  | "duplicate_email"
  | "duplicate_phone"
  | "duplicate_bank_account"
  | "suspicious_login"
  | "multiple_devices"
  | "rapid_registration"
  | "failed_logins"
  | "high_risk_activity"
  | "flagged_account";

export type FraudAlert = {
  id: string;
  kind: FraudAlertKind;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  memberId?: string | null;
  memberName?: string | null;
  detectedAt: string;
  href?: string | null;
};

export type ReconciliationSummary = {
  pendingCount: number;
  completedToday: number;
  depositMismatches: number;
  withdrawalMismatches: number;
  dailyDeposits: number;
  dailyWithdrawals: number;
  weeklyDeposits: number;
  weeklyWithdrawals: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
};

export type AdminRoleId =
  | "super_admin"
  | "operations"
  | "finance"
  | "support"
  | "compliance"
  | "marketing"
  | "auditor";

export type AdminRoleDefinition = {
  id: AdminRoleId;
  label: string;
  description: string;
};

export type ExportDefinition = {
  id: string;
  label: string;
  description: string;
  formats: ("csv" | "pdf")[];
  available: boolean;
  href?: string | null;
};

export type SupportOpsMetrics = {
  openTickets: number;
  pendingReplies: number;
  resolvedToday: number;
  averageResolutionHours: number | null;
  commonIssues: { label: string; count: number }[];
};

export type AnnouncementDraftCategory =
  | "general"
  | "maintenance"
  | "security"
  | "promotion"
  | "education"
  | "urgent";

export type AdminAnnouncementDraft = {
  id: string;
  category: AnnouncementDraftCategory;
  title: string;
  body: string;
  scheduledAt?: string | null;
  createdAt: string;
};

export type MemberSearchFilters = {
  q?: string;
  status?: string;
  kycStatus?: string;
  emailVerified?: "yes" | "no";
  registeredFrom?: string;
  registeredTo?: string;
  memberId?: string;
  inviteCode?: string;
  locationState?: string;
};
