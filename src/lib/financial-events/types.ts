import type { LucideIcon } from "lucide-react";

export type FinancialEventKind =
  | "account"
  | "deposit"
  | "withdrawal"
  | "investment"
  | "settlement"
  | "referral"
  | "bonus"
  | "security"
  | "announcement"
  | "adjustment"
  | "other";

export type StepStatus = "complete" | "current" | "pending" | "failed";

export type FinancialTimelineEvent = {
  id: string;
  kind: FinancialEventKind;
  title: string;
  description?: string;
  status?: string;
  reference?: string | null;
  timestamp: string;
  amount?: number | null;
  href?: string | null;
};

export type OperationalStep = {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  timestamp?: string | null;
};

export type WalletKind = "ngn" | "welcome_bonus" | "referral";

export type WalletTransactionView = {
  id: string;
  walletKind: WalletKind;
  walletLabel: string;
  type: "credit" | "debit";
  amount: number;
  reason: string;
  transactionType: string;
  reference: string;
  status: string;
  created_at: string;
  source?: string | null;
  destination?: string | null;
  metadata?: Record<string, unknown>;
};

export type NotificationCategory =
  | "deposits"
  | "withdrawals"
  | "investment"
  | "bonus"
  | "referral"
  | "security"
  | "announcements"
  | "all";

export type CalendarEventKind =
  | "settlement"
  | "bonus_unlock"
  | "qualification_end"
  | "withdrawal_window"
  | "maintenance"
  | "announcement"
  | "portfolio_anniversary"
  | "report";

export type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  description?: string;
  at: string;
  href?: string | null;
};

export type StatementType =
  | "monthly"
  | "transactions"
  | "investment"
  | "bonus"
  | "referral";

export type StatementOption = {
  id: StatementType;
  title: string;
  description: string;
  available: boolean;
  href?: string | null;
};

export type MemberStatusItem = {
  id: string;
  label: string;
  value: string;
  tone?: "emerald" | "gold" | "navy" | "slate";
  href?: string | null;
};

export type ReferralProgressStep = {
  id: string;
  label: string;
  status: StepStatus;
};

export type ReferralProgressView = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  joinedAt: string;
  steps: ReferralProgressStep[];
  outcomeLabel: string;
  outcomeTone: "emerald" | "gold" | "slate";
  commissionAmount?: number;
};

export type IconResolver = (kind: FinancialEventKind) => LucideIcon;
