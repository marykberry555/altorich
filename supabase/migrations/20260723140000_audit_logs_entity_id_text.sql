-- Final audit model: entity identifiers are TEXT, not UUID-only.
--
-- Design:
--   entity_type  TEXT  — semantic kind
--     Examples: deposit, withdrawal, investment, wallet, member, profile,
--               settings, payment_rails, announcement, vip_level, system
--   entity_id    TEXT  — row UUID string OR stable key
--     Examples: <uuid>, payment_rails, settlement_queue, system, global, default
--   actor_id     UUID  — performer (was never renamed; maps to "performed_by" in product language)
--   action       TEXT
--   metadata     JSONB
--   created_at   TIMESTAMPTZ
--
-- Why: UUID-only entity_id forced invalid casts for settings keys and aborted
-- successful admin saves when secondary audit logging ran after the primary mutation.
--
-- Also align admin_notifications.entity_id so secondary admin alerts accept keys.
--
-- Scope: ONLY audit_logs + admin_notifications.entity_id type change.
-- Does NOT touch wallets, wallet_transactions, deposits, withdrawals, investments,
-- or any other financial ledger tables. No DROP / DELETE / TRUNCATE.
--
-- Reversibility (manual rollback if needed BEFORE non-UUID keys are relied upon in queries):
--   ALTER TABLE public.audit_logs
--     ALTER COLUMN entity_id TYPE UUID
--     USING CASE
--       WHEN entity_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
--       THEN entity_id::uuid
--       ELSE NULL
--     END;
--   ALTER TABLE public.admin_notifications
--     ALTER COLUMN entity_id TYPE UUID
--     USING CASE
--       WHEN entity_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
--       THEN entity_id::uuid
--       ELSE NULL
--     END;
-- Note: rollback nulls non-UUID keys (payment_rails, …); prefer forward-only after prod writes those keys.
--
-- APPLY deliberately before/with the app deploy that stores non-UUID entity_id values.

ALTER TABLE public.audit_logs
  ALTER COLUMN entity_id TYPE TEXT
  USING entity_id::text;

COMMENT ON COLUMN public.audit_logs.entity_type IS
  'Semantic entity kind: deposit, withdrawal, investment, settings, payment_rails, system, …';

COMMENT ON COLUMN public.audit_logs.entity_id IS
  'Entity reference as TEXT: UUID for row entities, or stable keys (payment_rails, system, global).';

ALTER TABLE public.admin_notifications
  ALTER COLUMN entity_id TYPE TEXT
  USING entity_id::text;

COMMENT ON COLUMN public.admin_notifications.entity_id IS
  'Entity reference as TEXT: UUID for row entities, or optional stable keys.';
