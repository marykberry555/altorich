-- Allow admin hard-delete of members without destroying welcome-bonus slot liability.
-- Slots remain (allocation_number + programme.allocated); member FK is detached.

ALTER TABLE public.welcome_bonuses
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.welcome_bonuses
  DROP CONSTRAINT IF EXISTS welcome_bonuses_user_id_fkey;

ALTER TABLE public.welcome_bonuses
  ADD CONSTRAINT welcome_bonuses_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.welcome_bonus_events
  DROP CONSTRAINT IF EXISTS welcome_bonus_events_user_id_fkey;

ALTER TABLE public.welcome_bonus_events
  ADD CONSTRAINT welcome_bonus_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.welcome_bonus_events
  ALTER COLUMN user_id DROP NOT NULL;

-- Allow controlled detach of user_id (NULL only) when session flag is set.
CREATE OR REPLACE FUNCTION public.welcome_bonuses_forbid_identity_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.allocation_number IS DISTINCT FROM OLD.allocation_number THEN
    RAISE EXCEPTION 'welcome_bonuses.allocation_number is immutable';
  END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount THEN
    RAISE EXCEPTION 'welcome_bonuses.amount is immutable';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    IF current_setting('altorich.allow_welcome_bonus_detach', true) = 'on'
       AND NEW.user_id IS NULL THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'welcome_bonuses.user_id is immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- Deletes remain forbidden (slot liability is permanent).
CREATE OR REPLACE FUNCTION public.welcome_bonuses_forbid_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'welcome_bonuses rows are immutable: deletes are forbidden (slot % for user %)',
    OLD.allocation_number, OLD.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_detach_member_welcome_bonus(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  PERFORM set_config('altorich.allow_welcome_bonus_detach', 'on', true);

  -- Clear FKs that block wallet / wallet_transaction / withdrawal deletion.
  UPDATE public.welcome_bonuses
  SET
    award_tx_id = NULL,
    unlock_tx_id = NULL,
    wallet_id = NULL,
    withdrawal_id = NULL,
    user_id = NULL,
    status = CASE
      WHEN status IN ('paid', 'cancelled') THEN status
      ELSE 'cancelled'
    END,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Events can be removed; bonus slot rows stay for liability / audit.
  DELETE FROM public.welcome_bonus_events
  WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_detach_member_welcome_bonus(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_detach_member_welcome_bonus(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_detach_member_welcome_bonus(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_detach_member_welcome_bonus(uuid) TO service_role;

COMMENT ON FUNCTION public.admin_detach_member_welcome_bonus(uuid) IS
  'Detaches welcome-bonus slot from a member for admin hard-delete without freeing allocation counters.';
