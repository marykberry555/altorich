-- Simplify member_account_status to: active | paused | blocked
-- Normalize suspended / disabled / deactivated → blocked on profiles only.
-- Historical audit text remains intact.
-- Does NOT touch financial ledger tables.
-- NOT APPLIED AUTOMATICALLY — review and apply deliberately.

-- 1) History table (idempotent)
CREATE TABLE IF NOT EXISTS public.account_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_status_history_user_created
  ON public.account_status_history (user_id, created_at DESC);

ALTER TABLE public.account_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS account_status_history_admin_select ON public.account_status_history;
CREATE POLICY account_status_history_admin_select ON public.account_status_history
  FOR SELECT USING (public.has_admin_role());

REVOKE ALL ON TABLE public.account_status_history FROM PUBLIC;
GRANT SELECT ON TABLE public.account_status_history TO authenticated;
GRANT ALL ON TABLE public.account_status_history TO service_role;

COMMENT ON TABLE public.account_status_history IS
  'Audit trail for profiles.account_status transitions (active/paused/blocked).';

-- 2) Rebuild enum to only active | paused | blocked (via text CASE — safe in one transaction)
CREATE TYPE public.member_account_status_v2 AS ENUM ('active', 'paused', 'blocked');

ALTER TABLE public.profiles
  ALTER COLUMN account_status DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN account_status TYPE public.member_account_status_v2
  USING (
    CASE
      WHEN account_status::text = 'paused' THEN 'paused'::public.member_account_status_v2
      WHEN account_status::text IN ('blocked', 'suspended', 'disabled', 'deactivated')
        THEN 'blocked'::public.member_account_status_v2
      ELSE 'active'::public.member_account_status_v2
    END
  );

DROP TYPE public.member_account_status;
ALTER TYPE public.member_account_status_v2 RENAME TO member_account_status;

ALTER TABLE public.profiles
  ALTER COLUMN account_status SET DEFAULT 'active'::public.member_account_status;

-- 3) Soft-delete / identity release marks blocked (not deactivated)
CREATE OR REPLACE FUNCTION public.admin_prepare_member_hard_delete(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  PERFORM public.admin_detach_member_welcome_bonus(p_user_id);

  PERFORM set_config('altorich.allow_audit_detach', 'on', true);
  UPDATE public.audit_logs
  SET actor_id = NULL
  WHERE actor_id = p_user_id;

  UPDATE public.profiles
  SET
    username = NULL,
    phone = NULL,
    invite_code = 'del_' || replace(p_user_id::text, '-', ''),
    full_name = 'Deleted member',
    account_status = 'blocked',
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.admin_prepare_member_hard_delete(uuid) IS
  'Prepares a member for hard delete: detaches welcome-bonus, nulls audit actors, and frees username/phone/invite_code for re-registration.';
