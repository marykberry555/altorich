-- Welcome Bonus programme: first 200 verified members, ₦10,000 promotional reward.
-- Completely separate from NGN investment wallet and REF referral wallet (currency WB).

-- Programme control (singleton)
CREATE TABLE IF NOT EXISTS public.welcome_bonus_programme (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT true,
  amount_ngn NUMERIC(18, 2) NOT NULL DEFAULT 10000 CHECK (amount_ngn > 0),
  max_allocations INTEGER NOT NULL DEFAULT 200 CHECK (max_allocations > 0),
  allocated INTEGER NOT NULL DEFAULT 0 CHECK (allocated >= 0),
  qualification_days INTEGER NOT NULL DEFAULT 35 CHECK (qualification_days > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

INSERT INTO public.welcome_bonus_programme (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Per-member allocation tracking.
-- ON DELETE RESTRICT: deleting/suspending a profile must NEVER free a consumed slot
-- or erase promotional liability. Counter only increases; rows are retained.
CREATE TABLE IF NOT EXISTS public.welcome_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
  allocation_number INTEGER NOT NULL UNIQUE CHECK (allocation_number > 0),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN (
      'locked',
      'available',
      'withdrawal_requested',
      'paid',
      'cancelled'
    )),
  registered_at TIMESTAMPTZ NOT NULL,
  email_verified_at TIMESTAMPTZ NOT NULL,
  qualification_ends_at TIMESTAMPTZ NOT NULL,
  expected_unlock_at TIMESTAMPTZ NOT NULL,
  unlocked_at TIMESTAMPTZ,
  wallet_id UUID REFERENCES public.wallets(id),
  award_tx_id UUID REFERENCES public.wallet_transactions(id),
  unlock_tx_id UUID REFERENCES public.wallet_transactions(id),
  withdrawal_id UUID REFERENCES public.withdrawals(id),
  settlement_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_welcome_bonuses_status ON public.welcome_bonuses (status);
CREATE INDEX IF NOT EXISTS idx_welcome_bonuses_expected_unlock
  ON public.welcome_bonuses (expected_unlock_at)
  WHERE status = 'locked';

-- Dedicated promotional event ledger (audit / reconciliation)
CREATE TABLE IF NOT EXISTS public.welcome_bonus_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welcome_bonus_id UUID NOT NULL REFERENCES public.welcome_bonuses(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'welcome_bonus_awarded',
    'welcome_bonus_locked',
    'welcome_bonus_unlocked',
    'welcome_bonus_withdrawal_requested',
    'welcome_bonus_withdrawal_paid'
  )),
  amount NUMERIC(18, 2),
  reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_welcome_bonus_events_bonus
  ON public.welcome_bonus_events (welcome_bonus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_welcome_bonus_events_user
  ON public.welcome_bonus_events (user_id, created_at DESC);

-- Withdrawals may debit Welcome Bonus (WB) instead of NGN investment wallet
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS fund_source TEXT NOT NULL DEFAULT 'ngn_wallet';

ALTER TABLE public.withdrawals
  DROP CONSTRAINT IF EXISTS withdrawals_fund_source_check;

ALTER TABLE public.withdrawals
  ADD CONSTRAINT withdrawals_fund_source_check
  CHECK (fund_source IN ('ngn_wallet', 'welcome_bonus'));

CREATE INDEX IF NOT EXISTS idx_withdrawals_fund_source
  ON public.withdrawals (fund_source, status);

-- Settings seed (admin kill-switch + display config)
INSERT INTO public.settings (key, value)
VALUES (
  'welcome_bonus',
  jsonb_build_object(
    'enabled', true,
    'amount_ngn', 10000,
    'max_allocations', 200,
    'qualification_days', 35
  )
)
ON CONFLICT (key) DO NOTHING;

-- Atomic slot claim — never exceeds max_allocations
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus_allocation(
  p_user_id UUID,
  p_amount NUMERIC,
  p_registered_at TIMESTAMPTZ,
  p_email_verified_at TIMESTAMPTZ,
  p_qualification_ends_at TIMESTAMPTZ,
  p_expected_unlock_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_max INTEGER;
  v_allocated INTEGER;
  v_amount NUMERIC;
  v_slot INTEGER;
  v_existing public.welcome_bonuses%ROWTYPE;
  v_row public.welcome_bonuses%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_user');
  END IF;

  SELECT * INTO v_existing
  FROM public.welcome_bonuses
  WHERE user_id = p_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'bonus_id', v_existing.id,
      'allocation_number', v_existing.allocation_number,
      'status', v_existing.status
    );
  END IF;

  SELECT enabled, max_allocations, allocated, amount_ngn
  INTO v_enabled, v_max, v_allocated, v_amount
  FROM public.welcome_bonus_programme
  WHERE id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'programme_missing');
  END IF;

  IF NOT v_enabled THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'disabled');
  END IF;

  IF v_allocated >= v_max THEN
    UPDATE public.welcome_bonus_programme
    SET enabled = false, updated_at = now()
    WHERE id = 1 AND enabled = true;
    RETURN jsonb_build_object('ok', false, 'reason', 'sold_out');
  END IF;

  v_slot := v_allocated + 1;
  v_amount := COALESCE(NULLIF(p_amount, 0), v_amount);

  UPDATE public.welcome_bonus_programme
  SET
    allocated = v_slot,
    enabled = CASE WHEN v_slot >= v_max THEN false ELSE enabled END,
    updated_at = now()
  WHERE id = 1;

  INSERT INTO public.welcome_bonuses (
    user_id,
    allocation_number,
    amount,
    status,
    registered_at,
    email_verified_at,
    qualification_ends_at,
    expected_unlock_at
  ) VALUES (
    p_user_id,
    v_slot,
    v_amount,
    'locked',
    p_registered_at,
    p_email_verified_at,
    p_qualification_ends_at,
    p_expected_unlock_at
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'bonus_id', v_row.id,
    'allocation_number', v_row.allocation_number,
    'amount', v_row.amount,
    'status', v_row.status,
    'expected_unlock_at', v_row.expected_unlock_at,
    'qualification_ends_at', v_row.qualification_ends_at,
    'remaining', GREATEST(v_max - v_slot, 0)
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing FROM public.welcome_bonuses WHERE user_id = p_user_id;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'bonus_id', v_existing.id,
        'allocation_number', v_existing.allocation_number,
        'status', v_existing.status
      );
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_welcome_bonus_allocation FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_welcome_bonus_allocation TO service_role;

-- Claim locked bonus for Monday unlock (exactly-once)
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus_for_unlock(
  p_bonus_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.welcome_bonuses%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.welcome_bonuses
  WHERE id = p_bonus_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_row.status <> 'locked' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'claimed', false,
      'status', v_row.status,
      'bonus_id', v_row.id
    );
  END IF;

  IF v_row.expected_unlock_at > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_due', 'expected_unlock_at', v_row.expected_unlock_at);
  END IF;

  UPDATE public.welcome_bonuses
  SET status = 'available', unlocked_at = now(), updated_at = now()
  WHERE id = p_bonus_id AND status = 'locked'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'race');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'claimed', true,
    'bonus_id', v_row.id,
    'user_id', v_row.user_id,
    'amount', v_row.amount,
    'wallet_id', v_row.wallet_id,
    'award_tx_id', v_row.award_tx_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_welcome_bonus_for_unlock FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_welcome_bonus_for_unlock TO service_role;

ALTER TABLE public.welcome_bonus_programme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_bonus_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS welcome_bonus_programme_admin ON public.welcome_bonus_programme;
CREATE POLICY welcome_bonus_programme_admin ON public.welcome_bonus_programme
  FOR ALL USING (public.has_admin_role()) WITH CHECK (public.has_admin_role());

DROP POLICY IF EXISTS welcome_bonuses_select ON public.welcome_bonuses;
CREATE POLICY welcome_bonuses_select ON public.welcome_bonuses
  FOR SELECT USING (auth.uid() = user_id OR public.has_admin_role());

DROP POLICY IF EXISTS welcome_bonus_events_select ON public.welcome_bonus_events;
CREATE POLICY welcome_bonus_events_select ON public.welcome_bonus_events
  FOR SELECT USING (auth.uid() = user_id OR public.has_admin_role());

GRANT SELECT ON public.welcome_bonus_programme TO authenticated;
GRANT SELECT ON public.welcome_bonuses TO authenticated;
GRANT SELECT ON public.welcome_bonus_events TO authenticated;
GRANT ALL ON public.welcome_bonus_programme TO service_role;
GRANT ALL ON public.welcome_bonuses TO service_role;
GRANT ALL ON public.welcome_bonus_events TO service_role;

COMMENT ON TABLE public.welcome_bonuses IS
  'Promotional Welcome Bonus — separate from investment principal, REF wallet, and earnings.';
COMMENT ON COLUMN public.withdrawals.fund_source IS
  'ngn_wallet = investment wallet debit; welcome_bonus = WB promotional wallet debit.';

-- Immutability: programme.allocated must only ever increase (never decrease / reset).
CREATE OR REPLACE FUNCTION public.welcome_bonus_programme_allocated_monotonic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.allocated < OLD.allocated THEN
    RAISE EXCEPTION 'welcome_bonus_programme.allocated is immutable downward (old %, new %)',
      OLD.allocated, NEW.allocated;
  END IF;
  IF NEW.max_allocations < NEW.allocated THEN
    RAISE EXCEPTION 'welcome_bonus_programme.max_allocations (%) cannot be below allocated (%)',
      NEW.max_allocations, NEW.allocated;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_bonus_programme_allocated_monotonic ON public.welcome_bonus_programme;
CREATE TRIGGER trg_welcome_bonus_programme_allocated_monotonic
  BEFORE UPDATE ON public.welcome_bonus_programme
  FOR EACH ROW
  EXECUTE FUNCTION public.welcome_bonus_programme_allocated_monotonic();

-- Immutability: never delete an allocated bonus row (slots are permanent liability).
CREATE OR REPLACE FUNCTION public.welcome_bonuses_forbid_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'welcome_bonuses rows are immutable: deletes are forbidden (slot % for user %)',
    OLD.allocation_number, OLD.user_id;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_bonuses_forbid_delete ON public.welcome_bonuses;
CREATE TRIGGER trg_welcome_bonuses_forbid_delete
  BEFORE DELETE ON public.welcome_bonuses
  FOR EACH ROW
  EXECUTE FUNCTION public.welcome_bonuses_forbid_delete();

-- allocation_number and user_id never change after insert
CREATE OR REPLACE FUNCTION public.welcome_bonuses_forbid_identity_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'welcome_bonuses.user_id is immutable';
  END IF;
  IF NEW.allocation_number IS DISTINCT FROM OLD.allocation_number THEN
    RAISE EXCEPTION 'welcome_bonuses.allocation_number is immutable';
  END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount THEN
    RAISE EXCEPTION 'welcome_bonuses.amount is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_bonuses_forbid_identity_mutation ON public.welcome_bonuses;
CREATE TRIGGER trg_welcome_bonuses_forbid_identity_mutation
  BEFORE UPDATE ON public.welcome_bonuses
  FOR EACH ROW
  EXECUTE FUNCTION public.welcome_bonuses_forbid_identity_mutation();
