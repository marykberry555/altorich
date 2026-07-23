import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";
import { DUPLICATE_IDENTITY_MESSAGE, normalizePhone } from "@/lib/validation/identity";

type Client = SupabaseClient<Database>;

const DELETED_EMAIL_SUFFIX = "@deleted.altorich.invalid";

export async function findUserByEmail(supabase: Client, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.endsWith(DELETED_EMAIL_SUFFIX)) return null;

  // Prefer direct lookup when available (avoids paging caps).
  const admin = supabase.auth.admin as any;
  if (typeof admin.getUserByEmail === "function") {
    const { data, error } = await admin.getUserByEmail(normalized);
    if (!error && data?.user?.email?.toLowerCase() === normalized) {
      if (String(data.user.email).toLowerCase().endsWith(DELETED_EMAIL_SUFFIX)) return null;
      return data.user;
    }
  }

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === normalized) ?? null;
    if (match) {
      if (match.email?.toLowerCase().endsWith(DELETED_EMAIL_SUFFIX)) return null;
      return match;
    }
    if (users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return null;
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
