-- Free username / phone / invite_code on member hard-delete so the same
-- credentials can register again immediately (even if auth delete is slow).
-- Also enforce unique phone among active profiles.

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

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

  -- 1) Detach welcome-bonus liability without freeing allocation counters.
  PERFORM public.admin_detach_member_welcome_bonus(p_user_id);

  -- 2) Null immutable audit actor refs so profile/auth delete can proceed.
  PERFORM set_config('altorich.allow_audit_detach', 'on', true);
  UPDATE public.audit_logs
  SET actor_id = NULL
  WHERE actor_id = p_user_id;

  -- 3) Release signup identity immediately (username UNIQUE + phone unique index).
  UPDATE public.profiles
  SET
    username = NULL,
    phone = NULL,
    invite_code = 'del_' || replace(p_user_id::text, '-', ''),
    full_name = 'Deleted member',
    account_status = 'deactivated',
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.admin_prepare_member_hard_delete(uuid) IS
  'Prepares a member for hard delete: detaches welcome-bonus, nulls audit actors, and frees username/phone/invite_code for re-registration.';
