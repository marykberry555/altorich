-- AltoRich — Supabase Security Hardening Sprint
-- Addresses Security Advisor findings: mutable search_path, permissive RLS,
-- SECURITY DEFINER RPC exposure, and storage bucket enumeration.

-- ---------------------------------------------------------------------------
-- 1. Secure search_path on all public functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are immutable';
END;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(check_role public.admin_role DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
      AND (check_role IS NULL OR ar.role = check_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.wallet_balance(p_wallet_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT SUM(
        CASE
          WHEN wt.type = 'credit' AND wt.status = 'completed' THEN wt.amount
          WHEN wt.type = 'debit' AND wt.status = 'completed' THEN -wt.amount
          ELSE 0
        END
      )
      FROM public.wallet_transactions wt
      INNER JOIN public.wallets w ON w.id = wt.wallet_id
      WHERE wt.wallet_id = p_wallet_id
        AND (
          w.user_id = auth.uid()
          OR public.has_admin_role()
        )
    ),
    0
  );
$$;

CREATE OR REPLACE FUNCTION public.record_investment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.investment_status_history (investment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.investment_status_history (investment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_invite_code TEXT;
  ref_code TEXT;
  referrer UUID;
BEGIN
  new_invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  ref_code := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')), '');

  IF ref_code IS NOT NULL THEN
    SELECT id INTO referrer FROM public.profiles WHERE invite_code = ref_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    invite_code,
    username,
    pin_hash,
    referred_by,
    must_change_pin,
    must_change_password,
    email_verified_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    new_invite_code,
    NULLIF(lower(trim(COALESCE(NEW.raw_user_meta_data->>'username', ''))), ''),
    NULLIF(NEW.raw_user_meta_data->>'pin_hash', ''),
    referrer,
    COALESCE((NEW.raw_user_meta_data->>'must_change_pin')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END
  );

  INSERT INTO public.wallets (user_id, currency) VALUES (NEW.id, 'NGN');
  INSERT INTO public.wallets (user_id, currency) VALUES (NEW.id, 'REF');

  IF referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    VALUES (referrer, NEW.id, 'pending')
    ON CONFLICT (referred_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. RPC exposure — least privilege EXECUTE grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.has_admin_role(public.admin_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wallet_balance(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_admin_role(public.admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(public.admin_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_investment_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_audit_mutation() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 3. RLS — tighten deposits insert (authenticated members only, own rows)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS deposits_insert ON public.deposits;
CREATE POLICY deposits_insert ON public.deposits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'::public.deposit_status
    AND reviewed_by IS NULL
    AND wallet_transaction_id IS NULL
    AND reviewed_at IS NULL
  );

-- ---------------------------------------------------------------------------
-- 4. Storage — prevent avatar bucket enumeration via Storage API
--    (Direct public URLs still work; listing requires owner or admin)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS storage_avatars_select ON storage.objects;
CREATE POLICY storage_avatars_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_admin_role()
    )
  );

-- Block anonymous storage listing across private buckets
DROP POLICY IF EXISTS storage_deposit_proofs_select ON storage.objects;
CREATE POLICY storage_deposit_proofs_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'deposit-proofs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_admin_role()
    )
  );

DROP POLICY IF EXISTS storage_kyc_select ON storage.objects;
CREATE POLICY storage_kyc_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_admin_role()
    )
  );
