/**
 * Normalize identifiers for audit_logs / admin_notifications.
 *
 * Final model (requires migration `20260723140000_audit_logs_entity_id_text.sql`):
 *   entity_type — semantic kind (deposit, withdrawal, settings, payment_rails, …)
 *   entity_id   — TEXT: row UUID **or** stable key (payment_rails, system, global, …)
 *
 * Do not invent fake UUIDs for settings/system entities.
 */
export function normalizeAuditEntityId(entityId: string | null | undefined): string | null {
  if (entityId == null) return null;
  const trimmed = String(entityId).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** @deprecated Prefer normalizeAuditEntityId — kept for call-site compatibility. */
export function coerceAuditEntityId(entityId: string | null | undefined): {
  entityId: string | null;
  entityKey: string | null;
} {
  return { entityId: normalizeAuditEntityId(entityId), entityKey: null };
}

/** UUID v1–v5 (and nil) — useful for callers that need to detect row ids. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}
