"use client";

import { useEffect } from "react";
import {
  REFERRAL_COOKIE,
  REFERRAL_STORAGE_KEY,
  REFERRAL_TTL_DAYS,
  REFERRAL_TTL_SECONDS,
  normalizeReferralCode,
  referralCodeFromSearchParams
} from "@/lib/referral/attribution";

function writeCookie(code: string) {
  const maxAge = REFERRAL_TTL_SECONDS;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function writeStorage(code: string) {
  try {
    const payload = JSON.stringify({
      code,
      expiresAt: Date.now() + REFERRAL_TTL_DAYS * 24 * 60 * 60 * 1000
    });
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, payload);
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export function readStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { code?: string; expiresAt?: number };
      const code = normalizeReferralCode(parsed.code);
      if (code && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
        return code;
      }
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_COOKIE}=([^;]*)`));
  if (match?.[1]) {
    return normalizeReferralCode(decodeURIComponent(match[1]));
  }

  return null;
}

export function persistReferralCode(raw: string | null | undefined) {
  const code = normalizeReferralCode(raw);
  if (!code || typeof window === "undefined") return null;
  writeCookie(code);
  writeStorage(code);
  return code;
}

/**
 * Captures ?ref= / ?referral= / /r/CODE into cookie + localStorage (30 days).
 * Mount once in the root layout.
 */
export function ReferralAttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = referralCodeFromSearchParams(params);
    const pathMatch = window.location.pathname.match(/^\/r\/([A-Za-z0-9_-]+)/i);
    const fromPath = normalizeReferralCode(pathMatch?.[1] ?? null);
    const code = fromQuery ?? fromPath;
    if (code) persistReferralCode(code);
  }, []);

  return null;
}
