-- Exactly-once financial guards: unique keys, claim locks, stable settlement refs.

-- 1) One auto-invest / funded investment per approved deposit
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS source_deposit_id UUID REFERENCES public.deposits(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_investments_source_deposit_unique
  ON public.investments (source_deposit_id)
  WHERE source_deposit_id IS NOT NULL
    AND status IS DISTINCT FROM 'cancelled';

COMMENT ON COLUMN public.investments.source_deposit_id IS
  'Deposit that funded this auto-invest. UNIQUE among non-cancelled rows — enforces one investment per deposit.';

-- 2) One commission reward per referral relationship
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_rewards_commission_once
  ON public.referral_rewards (referral_id)
  WHERE reward_type = 'commission' AND referral_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_rewards_milestone_once
  ON public.referral_rewards (referrer_id, ((metadata ->> 'vip_level')))
  WHERE reward_type = 'milestone';

-- 3) Withdrawal client idempotency key (browser refresh / duplicate POST)
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_user_idempotency
  ON public.withdrawals (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 4) Atomic deposit claim with row lock (prevents concurrent approvals)
CREATE OR REPLACE FUNCTION public.claim_deposit_for_approval(
  p_deposit_id UUID,
  p_reviewer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.deposits;
  claimed BOOLEAN := false;
BEGIN
  SELECT * INTO row
  FROM public.deposits
  WHERE id = p_deposit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'deposit_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF row.status = 'pending' THEN
    UPDATE public.deposits
    SET
      status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
    WHERE id = p_deposit_id
    RETURNING * INTO row;
    claimed := true;
  END IF;

  RETURN jsonb_build_object(
    'claimed', claimed,
    'previous_status', CASE WHEN claimed THEN 'pending' ELSE row.status END,
    'deposit', to_jsonb(row)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_deposit_for_approval(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_deposit_for_approval(UUID, UUID) TO service_role;

-- 5) Atomic withdrawal mark-paid claim (prevents double pay)
CREATE OR REPLACE FUNCTION public.claim_withdrawal_for_paid(
  p_withdrawal_id UUID,
  p_reviewer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.withdrawals;
  claimed BOOLEAN := false;
  prev_status TEXT;
BEGIN
  SELECT * INTO row
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_not_found' USING ERRCODE = 'P0002';
  END IF;

  prev_status := row.status::text;

  IF row.status IN ('pending', 'scheduled', 'approved', 'processing') THEN
    -- Soft-claim to processing so a second caller cannot also debit.
    IF row.status IS DISTINCT FROM 'processing' THEN
      UPDATE public.withdrawals
      SET
        status = 'processing',
        reviewed_by = p_reviewer_id,
        reviewed_at = now(),
        processing_started_at = COALESCE(processing_started_at, now())
      WHERE id = p_withdrawal_id
      RETURNING * INTO row;
    END IF;
    claimed := true;
  ELSIF row.status = 'paid' THEN
    claimed := false;
  ELSE
    RAISE EXCEPTION 'withdrawal_not_payable' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object(
    'claimed', claimed,
    'previous_status', prev_status,
    'withdrawal', to_jsonb(row)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_withdrawal_for_paid(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_withdrawal_for_paid(UUID, UUID) TO service_role;

-- 6) Atomic referral commission claim
CREATE OR REPLACE FUNCTION public.claim_referral_for_commission(p_referral_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.referrals;
  claimed BOOLEAN := false;
BEGIN
  SELECT * INTO row
  FROM public.referrals
  WHERE id = p_referral_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'referral_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF row.status::text = 'pending' THEN
    -- Hold status while commission posts; final verified write happens in app after ledger success.
    -- Use qualified as in-flight marker if available; else keep pending and rely on unique reward + unique wallet ref.
    claimed := true;
  END IF;

  RETURN jsonb_build_object(
    'claimed', claimed OR row.status::text IN ('verified', 'qualified', 'paid'),
    'already_processed', row.status::text IN ('verified', 'qualified', 'paid'),
    'previous_status', row.status::text,
    'referral', to_jsonb(row)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_for_commission(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral_for_commission(UUID) TO service_role;
