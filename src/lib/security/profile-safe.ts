/**
 * Safe profile columns for API/admin responses.
 * NEVER include pin_hash or other credential material.
 */
export const PROFILE_SAFE_COLUMNS =
  "id, username, full_name, phone, avatar_url, preferred_package_slug, location_state_code, location_city_area, account_status, vip_level, invite_code, referred_by, email_verified_at, must_change_pin, must_change_password, notification_preferences, auto_weekly_payout, kyc_status, created_at, updated_at" as const;

const PROFILE_SAFE_KEYS = PROFILE_SAFE_COLUMNS.split(",").map((k) => k.trim());

const FORBIDDEN_KEYS = new Set(["pin_hash", "pinHash", "password", "password_hash", "passwordHash"]);

/** Whitelist-only profile projection for member/admin JSON responses. */
export function toPublicProfile(row: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const key of PROFILE_SAFE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      out[key] = row[key];
    }
  }
  return out;
}

/** Recursively strip forbidden credential keys from any payload. */
export function stripSensitiveFields<T>(value: T): T {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    out[key] = stripSensitiveFields(val);
  }
  return out as T;
}

export function payloadContainsPinHash(payload: unknown): boolean {
  if (payload == null) return false;
  if (typeof payload !== "object") return false;
  const json = JSON.stringify(payload);
  return json.includes('"pin_hash"') || json.includes('"pinHash"');
}
