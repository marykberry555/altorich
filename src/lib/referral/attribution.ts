/** Client + server helpers for referral attribution persistence. */

export const REFERRAL_COOKIE = "ar_ref";
export const REFERRAL_STORAGE_KEY = "altorich:referral_code";
export const REFERRAL_TTL_DAYS = 30;
export const REFERRAL_TTL_SECONDS = REFERRAL_TTL_DAYS * 24 * 60 * 60;

export const REFERRAL_INVALID_MESSAGE = "This referral link is no longer valid.";

export function normalizeReferralCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 3 || code.length > 32) return null;
  return code;
}

export function buildReferralPath(code: string) {
  return `/r/${normalizeReferralCode(code) ?? code}`;
}

export function buildReferralAbsoluteUrl(siteUrl: string, code: string) {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${buildReferralPath(code)}`;
}

export function buildRegisterUrlWithRef(code: string) {
  const normalized = normalizeReferralCode(code);
  return normalized ? `/auth/register?ref=${encodeURIComponent(normalized)}` : "/auth/register";
}

/** Read ref from common query keys. */
export function referralCodeFromSearchParams(params: URLSearchParams | { get(name: string): string | null }) {
  return normalizeReferralCode(params.get("ref") ?? params.get("referral") ?? params.get("invite"));
}
