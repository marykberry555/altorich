import { ADMIN_APP_HOME } from "@/lib/admin-app/constants";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

export type AdminLoginIntent = "ops" | "admin-app";

export type LoginRedirectFlags = {
  isAdmin: boolean;
  mustChangePin: boolean;
  mustChangePassword: boolean;
  fallback?: string;
  /** Dedicated admin entry points can prefer ops (/hard) or the admin-app portal. */
  intent?: AdminLoginIntent;
};

export function resolvePostLoginRedirect(flags: LoginRedirectFlags): string {
  if (flags.mustChangePin) return "/auth/change-pin";
  if (flags.mustChangePassword) {
    return flags.isAdmin ? "/auth/change-password?admin=1" : "/auth/change-password";
  }
  if (flags.isAdmin) {
    if (flags.intent === "ops") return HARD_OPS_HOME;
    return ADMIN_APP_HOME;
  }
  return flags.fallback ?? "/dashboard";
}
