-- RC2: deposit workflow phases, ops visibility, referral payout claim lock.

-- 1) Explicit deposit approval workflow (recoverable intermediate states)
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS workflow_phase TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS workflow_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS workflow_error TEXT;

ALTER TABLE public.deposits
  DROP CONSTRAINT IF EXISTS deposits_workflow_phase_check;

ALTER TABLE public.deposits
  ADD CONSTRAINT deposits_workflow_phase_check
  CHECK (workflow_phase IN (
    'pending',
    'claimed',
    'wallet_credited',
    'investment_created',
    'reconciled',
    'completed',
    'failed'
  ));

CREATE INDEX IF NOT EXISTS idx_deposits_workflow_stuck
  ON public.deposits (workflow_phase, workflow_updated_at)
  WHERE workflow_phase IN ('claimed', 'wallet_credited', 'investment_created', 'reconciled', 'failed');

COMMENT ON COLUMN public.deposits.workflow_phase IS
  'Approval orchestration phase. Recovery job resumes non-terminal intermediate states.';

-- Sync existing rows
UPDATE public.deposits
SET workflow_phase = CASE
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'approved' AND wallet_transaction_id IS NOT NULL THEN 'wallet_credited'
  WHEN status = 'approved' THEN 'claimed'
  WHEN status = 'rejected' THEN 'failed'
  ELSE 'pending'
END
WHERE workflow_phase = 'pending' AND status IS DISTINCT FROM 'pending';

-- 2) Ops event log (reconcile failures, duplicate attempts, stuck recoveries)
CREATE TABLE IF NOT EXISTS public.financial_ops_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'error')),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  reference TEXT,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_ops_events_created
  ON public.financial_ops_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_ops_events_open
  ON public.financial_ops_events (event_type, created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.financial_ops_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS financial_ops_events_admin_select ON public.financial_ops_events;
CREATE POLICY financial_ops_events_admin_select ON public.financial_ops_events
  FOR SELECT USING (public.has_admin_role());

DROP POLICY IF EXISTS financial_ops_events_admin_update ON public.financial_ops_events;
CREATE POLICY financial_ops_events_admin_update ON public.financial_ops_events
  FOR UPDATE USING (public.has_admin_role());

REVOKE ALL ON TABLE public.financial_ops_events FROM PUBLIC;
GRANT SELECT, UPDATE ON TABLE public.financial_ops_events TO authenticated;
GRANT ALL ON TABLE public.financial_ops_events TO service_role;

-- 3) Strengthen deposit claim to set workflow_phase = claimed
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
      reviewed_at = now(),
      workflow_phase = 'claimed',
      workflow_updated_at = now(),
      workflow_error = NULL
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

-- 4) Referral payout mark-paid claim (mirrors withdrawals)
CREATE OR REPLACE FUNCTION public.claim_referral_payout_for_paid(
  p_payout_id UUID,
  p_reviewer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.referral_payouts;
  claimed BOOLEAN := false;
  prev_status TEXT;
BEGIN
  SELECT * INTO row
  FROM public.referral_payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'referral_payout_not_found' USING ERRCODE = 'P0002';
  END IF;

  prev_status := row.status::text;

  IF row.status::text IN ('pending', 'processing', 'approved') THEN
    IF row.status::text IS DISTINCT FROM 'processing' THEN
      UPDATE public.referral_payouts
      SET
        status = 'processing',
        reviewed_by = p_reviewer_id,
        reviewed_at = now()
      WHERE id = p_payout_id
      RETURNING * INTO row;
    END IF;
    claimed := true;
  ELSIF row.status::text = 'paid' THEN
    claimed := false;
  ELSE
    RAISE EXCEPTION 'referral_payout_not_payable' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object(
    'claimed', claimed,
    'previous_status', prev_status,
    'payout', to_jsonb(row)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral_payout_for_paid(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral_payout_for_paid(UUID, UUID) TO service_role;
