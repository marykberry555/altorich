-- Launch hardening: close money-path RLS holes, protect profile columns, fix service-role wallet balance.

-- 1) Members must not insert investments/withdrawals directly (anon key + PostgREST).
DROP POLICY IF EXISTS investments_insert_own ON public.investments;
DROP POLICY IF EXISTS withdrawals_insert ON public.withdrawals;

-- 2) Block client updates to sensitive profile columns.
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive ON public.profiles;
CREATE TRIGGER profiles_protect_sensitive
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- 3) Service-role wallet ops must see real balances (auth.uid() is null for service_role).
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
          auth.role() = 'service_role'
          OR w.user_id = auth.uid()
          OR public.has_admin_role()
        )
    ),
    0
  );
$$;

REVOKE ALL ON FUNCTION public.wallet_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO service_role;
