-- Member hard-delete must be able to null audit_logs.actor_id (ON DELETE SET NULL).
-- The immutable trigger currently blocks that UPDATE and cascades into auth.deleteUser failures.

CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs are immutable';
  END IF;

  -- Controlled detach during admin member purge / profile ON DELETE SET NULL.
  IF current_setting('altorich.allow_audit_detach', true) = 'on'
     AND NEW.actor_id IS NULL
     AND OLD.actor_id IS NOT NULL
     AND NEW.id IS NOT DISTINCT FROM OLD.id
     AND NEW.action IS NOT DISTINCT FROM OLD.action
     AND NEW.entity_type IS NOT DISTINCT FROM OLD.entity_type
     AND NEW.entity_id IS NOT DISTINCT FROM OLD.entity_id
     AND NEW.metadata IS NOT DISTINCT FROM OLD.metadata
     AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'audit_logs are immutable';
END;
$$;

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
END;
$$;

REVOKE ALL ON FUNCTION public.admin_prepare_member_hard_delete(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_prepare_member_hard_delete(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_prepare_member_hard_delete(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_prepare_member_hard_delete(uuid) TO service_role;

COMMENT ON FUNCTION public.admin_prepare_member_hard_delete(uuid) IS
  'Prepares a member for hard delete: detaches welcome-bonus slot and nulls audit actor refs.';
