import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AppError, Errors } from "@/lib/errors";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";

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

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw Errors.unauthorized();

  const supabase = await createClient();
  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", user.id)
      .maybeSingle();

    const status = profile?.account_status;
    if (status && status !== "active") {
      throw new AppError("This account is not active. Contact support.", 403, "ACCOUNT_INACTIVE");
    }
  }

  return user;
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
  const user = await requireSessionUser();
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
