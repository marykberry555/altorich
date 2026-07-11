import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";
import { DUPLICATE_IDENTITY_MESSAGE, normalizePhone } from "@/lib/validation/identity";

type Client = SupabaseClient<Database>;

export async function findUserByEmail(supabase: Client, email: string) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === normalized) ?? null;
}

export async function assertIdentityAvailable(
  supabase: Client,
  input: { email?: string; username?: string; phone?: string; excludeUserId?: string }
) {
  const excludeUserId = input.excludeUserId;

  if (input.username) {
    const username = input.username.trim().toLowerCase();
    const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (data && data.id !== excludeUserId) {
      throw new AppError(DUPLICATE_IDENTITY_MESSAGE, 409, "IDENTITY_TAKEN", DUPLICATE_IDENTITY_MESSAGE);
    }
  }

  if (input.email) {
    const existing = await findUserByEmail(supabase, input.email);
    if (existing && existing.id !== excludeUserId) {
      throw new AppError(DUPLICATE_IDENTITY_MESSAGE, 409, "IDENTITY_TAKEN", DUPLICATE_IDENTITY_MESSAGE);
    }
  }

  if (input.phone) {
    const phone = normalizePhone(input.phone);
    const { data } = await supabase.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (data && data.id !== excludeUserId) {
      throw new AppError(DUPLICATE_IDENTITY_MESSAGE, 409, "IDENTITY_TAKEN", DUPLICATE_IDENTITY_MESSAGE);
    }
  }
}
