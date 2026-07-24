import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import {
  canAccessMemberApp,
  canDeposit,
  canLogin,
  canTransact,
  depositBlockedMessage,
  financialBlockedMessage,
  isEligibleForAutomatedFinance,
  loginBlockedMessage,
  normalizeAccountStatus,
  type AccountStatus
} from "@/lib/account-status/policy";

type Client = SupabaseClient;

export async function fetchAccountStatus(
  supabase: Client,
  userId: string
): Promise<AccountStatus> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return normalizeAccountStatus(data?.account_status as string | undefined);
}

export async function assertCanLogin(supabase: Client, userId: string): Promise<AccountStatus> {
  const status = await fetchAccountStatus(supabase, userId);
  if (!canLogin(status)) {
    throw new AppError(loginBlockedMessage(status) || "Account access denied.", 403, "ACCOUNT_BLOCKED");
  }
  return status;
}

export async function assertCanAccessMemberApp(
  supabase: Client,
  userId: string
): Promise<AccountStatus> {
  const status = await fetchAccountStatus(supabase, userId);
  if (!canAccessMemberApp(status)) {
    throw new AppError(loginBlockedMessage(status) || "Account access denied.", 403, "ACCOUNT_BLOCKED");
  }
  return status;
}

/** Deposits — ACTIVE or PAUSED. */
export async function assertCanDeposit(supabase: Client, userId: string): Promise<AccountStatus> {
  const status = await fetchAccountStatus(supabase, userId);
  if (!canDeposit(status)) {
    throw new AppError(depositBlockedMessage(status), 403, "ACCOUNT_DEPOSIT_BLOCKED");
  }
  return status;
}

/** Withdraw / invest / payouts / liquidations — ACTIVE only. */
export async function assertCanTransact(supabase: Client, userId: string): Promise<AccountStatus> {
  const status = await fetchAccountStatus(supabase, userId);
  if (!canTransact(status)) {
    throw new AppError(financialBlockedMessage(status), 403, "ACCOUNT_FINANCIAL_BLOCKED");
  }
  return status;
}

export async function assertEligibleForAutomatedFinance(
  supabase: Client,
  userId: string
): Promise<boolean> {
  const status = await fetchAccountStatus(supabase, userId);
  return isEligibleForAutomatedFinance(status);
}

/** Batch helper for cron engines — returns Set of user ids that are ACTIVE. */
export async function filterActiveUserIds(
  supabase: Client,
  userIds: string[]
): Promise<Set<string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Set();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, account_status")
    .in("id", unique);
  if (error) throw error;

  const active = new Set<string>();
  for (const row of data ?? []) {
    if (isEligibleForAutomatedFinance(normalizeAccountStatus(row.account_status as string))) {
      active.add(row.id);
    }
  }
  return active;
}
