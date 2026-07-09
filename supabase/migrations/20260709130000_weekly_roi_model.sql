-- Weekly ROI model (tiers, investments, payouts) + admin-controlled exchange rate

DO $$ BEGIN
  CREATE TYPE public.investment_currency AS ENUM ('ngn', 'usdt', 'btc');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_method AS ENUM ('bank', 'crypto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.roi_investment_status AS ENUM ('active', 'paused', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.roi_payout_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.roi_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_ngn NUMERIC(18, 2) NOT NULL CHECK (min_ngn > 0),
  max_ngn NUMERIC(18, 2) NOT NULL CHECK (max_ngn >= min_ngn),
  weekly_roi_bps INTEGER NOT NULL CHECK (weekly_roi_bps >= 0),
  payout_weekday SMALLINT NOT NULL DEFAULT 1 CHECK (payout_weekday BETWEEN 0 AND 6), -- 1 = Monday
  payout_time TIME NOT NULL DEFAULT '10:00:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_roi_tiers_bounds ON public.roi_tiers(min_ngn, max_ngn);

CREATE TABLE IF NOT EXISTS public.roi_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  tier_id UUID NOT NULL REFERENCES public.roi_tiers(id) ON DELETE RESTRICT,
  principal_ngn NUMERIC(18, 2) NOT NULL CHECK (principal_ngn > 0),
  currency public.investment_currency NOT NULL DEFAULT 'ngn',
  principal_usd NUMERIC(18, 2),
  exchange_rate_ngn_per_usd NUMERIC(18, 4),
  payout_method public.payout_method NOT NULL DEFAULT 'bank',
  payout_destination JSONB NOT NULL DEFAULT '{}',
  status public.roi_investment_status NOT NULL DEFAULT 'active',
  cycle_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cycle_ends_at TIMESTAMPTZ NOT NULL,
  accrued_ngn NUMERIC(18, 2) NOT NULL DEFAULT 0,
  last_ticker_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roi_investments_user ON public.roi_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_roi_investments_status ON public.roi_investments(status);
CREATE INDEX IF NOT EXISTS idx_roi_investments_cycle ON public.roi_investments(cycle_ends_at DESC);

CREATE TABLE IF NOT EXISTS public.roi_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  investment_id UUID NOT NULL REFERENCES public.roi_investments(id) ON DELETE CASCADE,
  amount_ngn NUMERIC(18, 2) NOT NULL CHECK (amount_ngn >= 0),
  amount_usd NUMERIC(18, 2),
  method public.payout_method NOT NULL,
  destination_snapshot JSONB NOT NULL DEFAULT '{}',
  status public.roi_payout_status NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_roi_payouts_user ON public.roi_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_roi_payouts_status ON public.roi_payouts(status);
CREATE INDEX IF NOT EXISTS idx_roi_payouts_created ON public.roi_payouts(created_at DESC);

-- updated_at triggers
DROP TRIGGER IF EXISTS roi_tiers_updated_at ON public.roi_tiers;
CREATE TRIGGER roi_tiers_updated_at BEFORE UPDATE ON public.roi_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS roi_investments_updated_at ON public.roi_investments;
CREATE TRIGGER roi_investments_updated_at BEFORE UPDATE ON public.roi_investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed tiers (idempotent by name)
INSERT INTO public.roi_tiers (name, min_ngn, max_ngn, weekly_roi_bps, payout_weekday, payout_time)
VALUES
  ('Tier 1', 30000, 100000, 2000, 1, '10:00:00'),
  ('Tier 2', 101000, 500000, 2500, 1, '10:00:00'),
  ('Tier 3', 501000, 5000000, 3000, 1, '10:00:00'),
  ('Tier 4', 5001000, 50000000, 4000, 1, '10:00:00')
ON CONFLICT (name) DO UPDATE SET
  min_ngn = EXCLUDED.min_ngn,
  max_ngn = EXCLUDED.max_ngn,
  weekly_roi_bps = EXCLUDED.weekly_roi_bps,
  payout_weekday = EXCLUDED.payout_weekday,
  payout_time = EXCLUDED.payout_time;

-- RLS
ALTER TABLE public.roi_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roi_tiers_select ON public.roi_tiers;
CREATE POLICY roi_tiers_select ON public.roi_tiers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS roi_investments_select ON public.roi_investments;
CREATE POLICY roi_investments_select ON public.roi_investments FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role());

DROP POLICY IF EXISTS roi_investments_insert ON public.roi_investments;
CREATE POLICY roi_investments_insert ON public.roi_investments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS roi_investments_update_admin ON public.roi_investments;
CREATE POLICY roi_investments_update_admin ON public.roi_investments FOR UPDATE
  USING (public.has_admin_role('admin') OR public.has_admin_role('finance') OR public.has_admin_role('super_admin'));

DROP POLICY IF EXISTS roi_payouts_select ON public.roi_payouts;
CREATE POLICY roi_payouts_select ON public.roi_payouts FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role());

DROP POLICY IF EXISTS roi_payouts_insert_admin ON public.roi_payouts;
CREATE POLICY roi_payouts_insert_admin ON public.roi_payouts FOR INSERT
  WITH CHECK (public.has_admin_role('admin') OR public.has_admin_role('finance') OR public.has_admin_role('super_admin'));

DROP POLICY IF EXISTS roi_payouts_update_admin ON public.roi_payouts;
CREATE POLICY roi_payouts_update_admin ON public.roi_payouts FOR UPDATE
  USING (public.has_admin_role('admin') OR public.has_admin_role('finance') OR public.has_admin_role('super_admin'));

