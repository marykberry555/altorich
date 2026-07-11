import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type AdminRole = Database["public"]["Enums"]["admin_role"];

export async function getAdminRoleForUser(
  supabase: Client,
  userId: string
): Promise<AdminRole | null> {
  const { data, error } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const role = data?.role as AdminRole | undefined;
  return role ?? null;
}

export async function userIsAdmin(supabase: Client, userId: string): Promise<boolean> {
  const role = await getAdminRoleForUser(supabase, userId);
  return Boolean(role);
}
