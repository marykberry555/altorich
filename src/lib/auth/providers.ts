/**
 * Auth provider scaffolding for future OAuth and phone OTP.
 * Current production auth uses email/password via Supabase Auth.
 */

export const AUTH_PROVIDERS = {
  email: { enabled: true, label: "Email & password" },
  google: { enabled: true, label: "Google", oauthProvider: "google" as const },
  phone: { enabled: false, label: "Phone OTP", note: "Enable in Supabase Auth when ready" }
} as const;

export type AuthProviderKey = keyof typeof AUTH_PROVIDERS;

export function isProviderEnabled(provider: AuthProviderKey): boolean {
  return AUTH_PROVIDERS[provider].enabled;
}
