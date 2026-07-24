import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { unknownErrorMessage } from "@/lib/errors";

type Client = SupabaseClient;

/**
 * Invalidate all Supabase Auth sessions for a member (suspend / disable).
 * Failures are logged — status change must still succeed.
 */
export async function revokeMemberSessions(supabase: Client, userId: string): Promise<void> {
  try {
    const admin = supabase.auth.admin as {
      signOut?: (id: string, scope?: "global" | "local" | "others") => Promise<{ error: Error | null }>;
    };
    if (typeof admin.signOut === "function") {
      const { error } = await admin.signOut(userId, "global");
      if (error) {
        logger.error("Failed to revoke member sessions", {
          userId,
          message: error.message
        });
      }
      return;
    }

    // Fallback: delete refresh tokens via auth schema is not exposed; update user ban as soft lock.
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876600h"
    } as never);
    if (error) {
      logger.error("Failed to ban member after status change", {
        userId,
        message: error.message
      });
    }
  } catch (error) {
    logger.error("Session revocation failed (fail-soft)", {
      userId,
      message: unknownErrorMessage(error)
    });
  }
}

/** Clear temporary ban when re-enabling an account. */
export async function clearMemberAuthBan(supabase: Client, userId: string): Promise<void> {
  try {
    await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" } as never);
  } catch (error) {
    logger.error("Failed to clear member auth ban", {
      userId,
      message: unknownErrorMessage(error)
    });
  }
}
