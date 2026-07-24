/**
 * Single-field account status policy (three states only).
 *
 * ACTIVE  — full platform access
 * PAUSED  — temporary administrative review; login + deposits OK; invest/withdraw/earnings blocked
 * BLOCKED — no login; sessions revoked; no financial activity
 *
 * Legacy values (suspended / disabled / deactivated) normalize to blocked.
 */

export const ACCOUNT_STATUSES = ["active", "paused", "blocked"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Historical / DB values that map onto the three-status model. */
const LEGACY_BLOCKED = new Set(["suspended", "disabled", "deactivated", "blocked"]);

export const PAUSED_BANNER_MESSAGE = "Your account is temporarily under review.";

export function normalizeAccountStatus(value: string | null | undefined): AccountStatus {
  const v = String(value ?? "active").trim().toLowerCase();
  if (v === "active" || v === "paused") return v;
  if (LEGACY_BLOCKED.has(v)) return "blocked";
  return "active";
}

export function canLogin(status: AccountStatus): boolean {
  return status === "active" || status === "paused";
}

/** Dashboard / profile / notifications — accessible while paused. */
export function canAccessMemberApp(status: AccountStatus): boolean {
  return status === "active" || status === "paused";
}

/**
 * Member may submit deposits while active or paused.
 * Blocked accounts cannot deposit.
 */
export function canDeposit(status: AccountStatus): boolean {
  return status === "active" || status === "paused";
}

/**
 * Invest, withdraw, liquidate, referral payouts, auto-withdraw, etc.
 * ACTIVE only — paused deposits stay locked until resume (no back-pay).
 */
export function canTransact(status: AccountStatus): boolean {
  return status === "active";
}

/** Cron / settlement / referral / welcome bonus / earnings engines. */
export function isEligibleForAutomatedFinance(status: AccountStatus): boolean {
  return status === "active";
}

export function mustRevokeSessions(status: AccountStatus): boolean {
  return status === "blocked";
}

export function loginBlockedMessage(status: AccountStatus): string {
  if (status === "blocked") {
    return "Your account has been blocked. Please contact support for assistance.";
  }
  return "";
}

export function financialBlockedMessage(status: AccountStatus): string {
  if (status === "paused") {
    return PAUSED_BANNER_MESSAGE;
  }
  if (status === "blocked") {
    return "Your account is blocked. Financial activity is not available.";
  }
  return "Financial activity is not available for this account.";
}

export function depositBlockedMessage(status: AccountStatus): string {
  if (status === "blocked") {
    return "Your account is blocked. Deposits are not available.";
  }
  return "Deposits are not available for this account.";
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  paused: "Paused",
  blocked: "Blocked"
};
