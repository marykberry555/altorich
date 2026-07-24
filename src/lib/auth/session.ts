import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AppError, Errors } from "@/lib/errors";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";
import {
  assertCanAccessMemberApp,
  assertCanDeposit,
  assertCanTransact,
  fetchAccountStatus
} from "@/lib/account-status/enforce";
import { canAccessMemberApp, type AccountStatus } from "@/lib/account-status/policy";

export type SessionUser = User;

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Authenticated member session that may access the app (active or paused).
 * Blocked accounts are rejected.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw Errors.unauthorized();

  const supabase = await createClient();
  if (supabase) {
    await assertCanAccessMemberApp(supabase, user.id);
  }

  return user;
}

/** Deposits — ACTIVE or PAUSED. */
export async function requireDepositUser(): Promise<SessionUser & { accountStatus: AccountStatus }> {
  const user = await requireSessionUser();
  const supabase = await createClient();
  if (!supabase) throw Errors.notConfigured();
  const accountStatus = await assertCanDeposit(supabase, user.id);
  return Object.assign(user, { accountStatus });
}

/** Withdraw / invest / payouts — ACTIVE only. */
export async function requireFinancialUser(): Promise<SessionUser & { accountStatus: AccountStatus }> {
  const user = await requireSessionUser();
  const supabase = await createClient();
  if (!supabase) throw Errors.notConfigured();
  const accountStatus = await assertCanTransact(supabase, user.id);
  return Object.assign(user, { accountStatus });
}

export async function getSessionAccountStatus(userId: string): Promise<AccountStatus | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  return fetchAccountStatus(supabase, userId);
}

export async function hasAdminRole(
  role?: Database["public"]["Enums"]["admin_role"]
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const user = await getSessionUser();
  if (!user) return false;

  const { data, error } = role
    ? await supabase.rpc("has_admin_role", { check_role: role })
    : await supabase.rpc("has_admin_role");

  if (error) return false;
  return Boolean(data);
}

export async function requireAdmin(
  role?: Database["public"]["Enums"]["admin_role"]
): Promise<SessionUser> {
  // Admins use the same session helper but must not be blocked by member pause rules.
  const user = await getSessionUser();
  if (!user) throw Errors.unauthorized();

  const supabase = await createClient();
  if (supabase) {
    const status = await fetchAccountStatus(supabase, user.id);
    if (!canAccessMemberApp(status)) {
      throw new AppError("This account is not available. Contact support.", 403, "ACCOUNT_BLOCKED");
    }
  }

  const allowed = await hasAdminRole(role);
  if (!allowed) throw Errors.forbidden();
  return user;
}

export async function getServiceClientOrThrow() {
  const client = await createServiceClient();
  if (!client) throw Errors.notConfigured();
  return client;
}

export async function requireAdminService() {
  const user = await requireAdmin();
  const supabase = await getServiceClientOrThrow();
  return { user, supabase };
}
