-- Lock registered full_name for non-admin / non-service-role profile updates.
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_admin_role() THEN
    RETURN NEW;
  END IF;

  NEW.pin_hash := OLD.pin_hash;
  NEW.account_status := OLD.account_status;
  NEW.vip_level := OLD.vip_level;
  NEW.invite_code := OLD.invite_code;
  NEW.referred_by := OLD.referred_by;
  NEW.email_verified_at := OLD.email_verified_at;
  NEW.must_change_pin := OLD.must_change_pin;
  NEW.must_change_password := OLD.must_change_password;
  NEW.username := OLD.username;
  NEW.full_name := OLD.full_name;
  RETURN NEW;
END;
$$;
