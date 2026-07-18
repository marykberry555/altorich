/** Name fields that members must never change via self-service APIs. */
export const MEMBER_LOCKED_NAME_KEYS = [
  "fullName",
  "full_name",
  "firstName",
  "first_name",
  "lastName",
  "last_name",
  "name"
] as const;

export function bodyContainsLockedNameFields(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const record = body as Record<string, unknown>;
  return MEMBER_LOCKED_NAME_KEYS.some((key) => Object.prototype.hasOwnProperty.call(record, key));
}

export const MEMBER_NAME_LOCKED_MESSAGE =
  "Your registered name cannot be changed from your account. Contact Alto Rich Support if a legal name update is required.";
