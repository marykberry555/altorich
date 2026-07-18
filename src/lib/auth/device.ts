/** Stable client device identity for trusted-device login (survives UA string churn). */

const DEVICE_ID_KEY = "altorich_trusted_device_id";

/** Legacy UA+language hash — kept for display/fallback only. */
export function getDeviceFingerprint(userAgent: string, acceptLanguage?: string | null): string {
  const raw = `${userAgent}|${acceptLanguage ?? ""}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

/**
 * Privacy-conscious stable device id stored in localStorage.
 * Clearing site data / using a new browser forces OTP again (by design).
 */
export function getStableDeviceId(): string {
  if (typeof window === "undefined") return "fp_server";

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY)?.trim();
    if (existing && /^td_[a-f0-9]{32}$/i.test(existing)) {
      return existing.toLowerCase();
    }

    const id = `td_${crypto.randomUUID().replace(/-/g, "")}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return getDeviceFingerprint(
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      typeof navigator !== "undefined" ? navigator.language : ""
    );
  }
}

/** Fingerprint sent on login / device verify — prefers stable local id. */
export function getClientDeviceFingerprint(): string {
  return getStableDeviceId();
}
