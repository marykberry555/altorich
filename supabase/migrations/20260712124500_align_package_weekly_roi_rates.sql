-- Align active package weekly ROI rates with centralized product config (data-only).
-- Starter 15%, Growth 20%, Premium 30%, Elite 25%.

UPDATE public.investment_plans SET
  weekly_roi_bps = 1500,
  projected_daily = ROUND((min_investment::numeric * 1500 / 10000) / 7.0, 2),
  description = 'High-yield savings lock plan — 15% weekly, guaranteed returns, auto-reinvest until you stop.'
WHERE tier = 'starter' AND is_active = true;

UPDATE public.investment_plans SET
  weekly_roi_bps = 2000,
  projected_daily = ROUND((min_investment::numeric * 2000 / 10000) / 7.0, 2),
  description = 'Agricultural crowdfunding cycle — 20% weekly, guaranteed returns, auto-reinvest until you stop.'
WHERE tier = 'growth' AND is_active = true;

UPDATE public.investment_plans SET
  weekly_roi_bps = 3000,
  projected_daily = ROUND((min_investment::numeric * 3000 / 10000) / 7.0, 2),
  description = 'Real estate cooperative banking — 30% weekly, guaranteed returns, auto-reinvest until you stop.'
WHERE tier = 'premium' AND is_active = true;

UPDATE public.investment_plans SET
  weekly_roi_bps = 2500,
  projected_daily = ROUND((min_investment::numeric * 2500 / 10000) / 7.0, 2),
  description = 'Hard-currency asset programme — 25% weekly, guaranteed returns, auto-reinvest until you stop.'
WHERE tier = 'elite' AND is_active = true;

UPDATE public.roi_tiers SET weekly_roi_bps = 1500 WHERE name = 'Alto Starter';
UPDATE public.roi_tiers SET weekly_roi_bps = 2000 WHERE name = 'Alto Growth';
UPDATE public.roi_tiers SET weekly_roi_bps = 3000 WHERE name = 'Alto Premium';
UPDATE public.roi_tiers SET weekly_roi_bps = 2500 WHERE name = 'Alto Elite';
