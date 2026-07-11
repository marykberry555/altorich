export type LoginRedirectFlags = {
  isAdmin: boolean;
  mustChangePin: boolean;
  mustChangePassword: boolean;
  fallback?: string;
};

export function resolvePostLoginRedirect(flags: LoginRedirectFlags): string {
  if (flags.mustChangePin) return "/auth/change-pin";
  if (flags.mustChangePassword) {
    return flags.isAdmin ? "/auth/change-password?admin=1" : "/auth/change-password";
  }
  if (flags.isAdmin) return "/hard";
  return flags.fallback ?? "/dashboard";
}
