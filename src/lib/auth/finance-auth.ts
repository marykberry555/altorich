import "server-only";

import { createClient } from "@/lib/supabase/server";
import { AppError, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/observability/request-context";
import {
  getSessionUser,
  requireSessionUser,
  type SessionUser
} from "@/lib/auth/session";
import { FINANCE_CAPABLE_ROLES, isFinanceCapableRole } from "@/lib/auth/finance-roles";
import type { Database } from "@/types/database";

type AdminRole = Database["public"]["Enums"]["admin_role"];

export { FINANCE_CAPABLE_ROLES } from "@/lib/auth/finance-roles";

export async function getAdminRolesForUser(userId: string): Promise<AdminRole[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("admin_roles").select("role").eq("user_id", userId);
  if (error || !data) return [];
  return data.map((r) => r.role as AdminRole);
}

export async function hasFinanceCapability(userId?: string): Promise<boolean> {
  const user = userId ? { id: userId } : await getSessionUser();
  if (!user) return false;
  const roles = await getAdminRolesForUser(user.id);
  return roles.some((role) => isFinanceCapableRole(role));
}

/**
 * Require an authenticated admin with finance capability
 * (super_admin | admin | finance). Logs every denial.
 */
export async function requireFinanceAdmin(action = "financial_operation"): Promise<SessionUser> {
  const user = await requireSessionUser();
  const roles = await getAdminRolesForUser(user.id);
  const allowed = roles.some((role) => isFinanceCapableRole(role));

  if (!allowed) {
    logger.warn("Financial authorization denied", {
      requestId: getRequestId(),
      userId: user.id,
      action,
      roles,
      classification: "authorization",
      severity: "warn"
    });
    throw new AppError(
      "Finance operator access required",
      403,
      "FINANCE_FORBIDDEN",
      "You do not have permission to perform this financial action.",
      "authentication"
    );
  }

  return user;
}

export async function requireFinanceAdminService(action = "financial_operation") {
  const user = await requireFinanceAdmin(action);
  const { getServiceClientOrThrow } = await import("@/lib/auth/session");
  const supabase = await getServiceClientOrThrow();
  return { user, supabase };
}

/** Soft check used by read-only admin finance dashboards (any admin). */
export async function requireAdminOrThrow(): Promise<SessionUser> {
  const { requireAdmin } = await import("@/lib/auth/session");
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AppError && error.status === 403) {
      logger.warn("Admin authorization denied", {
        requestId: getRequestId(),
        action: "admin_access",
        classification: "authorization"
      });
    }
    throw error ?? Errors.forbidden();
  }
}
