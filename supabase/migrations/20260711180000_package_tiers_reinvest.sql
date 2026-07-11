-- Align package tiers (10–25% weekly), open-ended weekly compounding, stop/withdraw flow.

ALTER TABLE public.investment_plans DROP CONSTRAINT IF EXISTS investment_plans_tier_check;
ALTER TABLE public.investment_plans
  ADD CONSTRAINT investment_plans_tier_check
  CHECK (tier IN ('starter', 'growth', 'premium', 'elite'));

ALTER TABLE public.investment_plans
  ADD COLUMN IF NOT EXISTS weekly_roi_bps INTEGER;

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS auto_reinvest BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stop_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS weekly_roi_bps INTEGER,
  ADD COLUMN IF NOT EXISTS last_weekly_settlement_at TIMESTAMPTZ;

ALTER TYPE public.investment_status ADD VALUE IF NOT EXISTS 'stopping';
ALTER TYPE public.investment_status ADD VALUE IF NOT EXISTS 'stopped';

-- Retire legacy sub-plans; seed one plan per package tier.
UPDATE public.investment_plans SET is_active = false, plan_status = 'archived';

INSERT INTO public.investment_plans (
  slug, name, tier, price, min_investment, max_investment,
  cycle_days, projected_daily, first_bonus, description, sort_order,
  is_active, plan_status, visibility, settlement_frequency, weekly_roi_bps, risk_disclosure
) VALUES
  (
    'alto-starter',
    'Alto Starter',
    'starter',
    20000, 20000, 100000,
    365,
    ROUND((20000::numeric * 1000 / 10000) / 7.0, 2),
    0,
    'High-yield savings lock plan — 10% weekly, guaranteed returns, auto-reinvest until you stop.',
    1,
    true, 'active', 'public', 'weekly', 1000,
    'Returns are guaranteed. Earnings auto-reinvest weekly until you stop and withdraw on Monday.'
  ),
  (
    'alto-growth',
    'Alto Growth',
    'growth',
    101000, 101000, 500000,
    365,
    ROUND((101000::numeric * 1500 / 10000) / 7.0, 2),
    0,
    'Agricultural crowdfunding cycle — 15% weekly, guaranteed returns, auto-reinvest until you stop.',
    2,
    true, 'active', 'public', 'weekly', 1500,
    'Returns are guaranteed. Earnings auto-reinvest weekly until you stop and withdraw on Monday.'
  ),
  (
    'alto-premium',
    'Alto Premium',
    'premium',
    501000, 501000, 5000000,
    365,
    ROUND((501000::numeric * 2000 / 10000) / 7.0, 2),
    0,
    'Real estate cooperative banking — 20% weekly, guaranteed returns, auto-reinvest until you stop.',
    3,
    true, 'active', 'public', 'weekly', 2000,
    'Returns are guaranteed. Earnings auto-reinvest weekly until you stop and withdraw on Monday.'
  ),
  (
    'alto-elite',
    'Alto Elite',
    'elite',
    5001000, 5001000, 50000000,
    365,
    ROUND((5001000::numeric * 2500 / 10000) / 7.0, 2),
    0,
    'Hard-currency asset programme — 25% weekly, guaranteed returns, auto-reinvest until you stop.',
    4,
    true, 'active', 'public', 'weekly', 2500,
    'Returns are guaranteed. Earnings auto-reinvest weekly until you stop and withdraw on Monday.'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  price = EXCLUDED.price,
  min_investment = EXCLUDED.min_investment,
  max_investment = EXCLUDED.max_investment,
  cycle_days = EXCLUDED.cycle_days,
  projected_daily = EXCLUDED.projected_daily,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  plan_status = EXCLUDED.plan_status,
  visibility = EXCLUDED.visibility,
  settlement_frequency = EXCLUDED.settlement_frequency,
  weekly_roi_bps = EXCLUDED.weekly_roi_bps,
  risk_disclosure = EXCLUDED.risk_disclosure;

UPDATE public.roi_tiers SET
  min_ngn = 20000, max_ngn = 100000, weekly_roi_bps = 1000, payout_time = '09:00:00'
WHERE name = 'Alto Starter';

UPDATE public.roi_tiers SET
  min_ngn = 101000, max_ngn = 500000, weekly_roi_bps = 1500, payout_time = '09:00:00'
WHERE name = 'Alto Growth';

UPDATE public.roi_tiers SET
  min_ngn = 501000, max_ngn = 5000000, weekly_roi_bps = 2000, payout_time = '09:00:00'
WHERE name = 'Alto Premium';

UPDATE public.roi_tiers SET
  min_ngn = 5001000, max_ngn = 50000000, weekly_roi_bps = 2500, payout_time = '09:00:00'
WHERE name = 'Alto Elite';

INSERT INTO public.roi_tiers (name, min_ngn, max_ngn, weekly_roi_bps, payout_weekday, payout_time)
VALUES
  ('Alto Starter', 20000, 100000, 1000, 1, '09:00:00'),
  ('Alto Growth', 101000, 500000, 1500, 1, '09:00:00'),
  ('Alto Premium', 501000, 5000000, 2000, 1, '09:00:00'),
  ('Alto Elite', 5001000, 50000000, 2500, 1, '09:00:00')
ON CONFLICT (name) DO UPDATE SET
  min_ngn = EXCLUDED.min_ngn,
  max_ngn = EXCLUDED.max_ngn,
  weekly_roi_bps = EXCLUDED.weekly_roi_bps,
  payout_time = EXCLUDED.payout_time;
