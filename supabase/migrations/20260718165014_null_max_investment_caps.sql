-- Treat NULL as unlimited principal. Drop legacy NOT NULL / CHECK that force a max.

ALTER TABLE public.investment_plans
  DROP CONSTRAINT IF EXISTS investment_plans_min_max;

ALTER TABLE public.investment_plans
  ALTER COLUMN max_investment DROP NOT NULL;

UPDATE public.investment_plans
SET max_investment = NULL;

ALTER TABLE public.investment_plans
  ADD CONSTRAINT investment_plans_min_check CHECK (min_investment > 0);

ALTER TABLE public.investment_plans
  ADD CONSTRAINT investment_plans_max_null_or_gte_min
  CHECK (max_investment IS NULL OR max_investment >= min_investment);

COMMENT ON COLUMN public.investment_plans.max_investment IS
  'Legacy optional ceiling. NULL means unlimited. Application MUST ignore this for allocation.';

-- ROI tiers: allow NULL max_ngn = unlimited
ALTER TABLE public.roi_tiers
  DROP CONSTRAINT IF EXISTS roi_tiers_max_ngn_check;

ALTER TABLE public.roi_tiers
  ALTER COLUMN max_ngn DROP NOT NULL;

UPDATE public.roi_tiers
SET max_ngn = NULL;

ALTER TABLE public.roi_tiers
  ADD CONSTRAINT roi_tiers_max_null_or_gte_min
  CHECK (max_ngn IS NULL OR max_ngn >= min_ngn);

COMMENT ON COLUMN public.roi_tiers.max_ngn IS
  'Legacy optional ceiling. NULL means unlimited. Application MUST ignore this for allocation.';

-- Settlement public references for withdrawals + referral payouts
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS settlement_reference TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_settlement_reference
  ON public.withdrawals (settlement_reference)
  WHERE settlement_reference IS NOT NULL;

ALTER TABLE public.referral_payouts
  ADD COLUMN IF NOT EXISTS settlement_reference TEXT,
  ADD COLUMN IF NOT EXISTS queue_number INTEGER,
  ADD COLUMN IF NOT EXISTS batch_number INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_processing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_payouts_settlement_reference
  ON public.referral_payouts (settlement_reference)
  WHERE settlement_reference IS NOT NULL;

-- Daily sequence for ALT-YYYYMMDD-NNNNNN references
CREATE TABLE IF NOT EXISTS public.settlement_reference_counters (
  day_key DATE PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.next_settlement_reference(p_day date DEFAULT (timezone('Africa/Lagos', now()))::date)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq INTEGER;
BEGIN
  INSERT INTO public.settlement_reference_counters (day_key, last_seq)
  VALUES (p_day, 1)
  ON CONFLICT (day_key) DO UPDATE
    SET last_seq = public.settlement_reference_counters.last_seq + 1,
        updated_at = now()
  RETURNING last_seq INTO seq;

  RETURN 'ALT-' || to_char(p_day, 'YYYYMMDD') || '-' || lpad(seq::text, 6, '0');
END;
$$;
