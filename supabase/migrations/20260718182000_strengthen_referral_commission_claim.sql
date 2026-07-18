-- Strengthen referral commission claim: pending → qualified under FOR UPDATE.
-- Allows retry when status is qualified but commission ledger was never posted.

CREATE OR REPLACE FUNCTION public.claim_referral_for_commission(p_referral_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.referrals;
  claimed BOOLEAN := false;
  prev_status TEXT;
BEGIN
  SELECT * INTO row
  FROM public.referrals
  WHERE id = p_referral_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'referral_not_found' USING ERRCODE = 'P0002';
  END IF;

  prev_status := row.status::text;

  IF row.status::text = 'pending' THEN
    UPDATE public.referrals
    SET status = 'qualified'
    WHERE id = p_referral_id
      AND status = 'pending'
    RETURNING * INTO row;
    claimed := FOUND;
  ELSIF row.status::text = 'qualified' AND row.wallet_transaction_id IS NULL THEN
    -- Prior attempt claimed but did not finish ledger — allow retry.
    claimed := true;
  END IF;

  RETURN jsonb_build_object(
    'claimed', claimed,
    'already_processed', prev_status IN ('verified', 'paid')
      OR (prev_status = 'qualified' AND row.wallet_transaction_id IS NOT NULL AND NOT claimed),
    'previous_status', prev_status,
    'referral', to_jsonb(row)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_for_commission(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral_for_commission(UUID) TO service_role;
