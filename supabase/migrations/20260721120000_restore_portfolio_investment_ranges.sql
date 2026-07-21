-- Restore published portfolio investment ranges + weekly ROI bps.
-- Application SSOT: src/config/investment-portfolios.ts
-- Starter 5% (35% wk) ₦30k–₦500k | Growth 6% (42%) ₦500k–₦3M
-- Premium 7% (49%) ₦3M–₦10M | Elite 8% (56%) ₦10M–₦50M

UPDATE public.investment_plans SET
  min_investment = 30000,
  max_investment = 500000,
  weekly_roi_bps = 3500,
  price = CASE WHEN price < 30000 THEN 30000 ELSE price END
WHERE tier = 'starter';

UPDATE public.investment_plans SET
  min_investment = 500000,
  max_investment = 3000000,
  weekly_roi_bps = 4200,
  price = CASE WHEN price < 500000 THEN 500000 ELSE price END
WHERE tier = 'growth';

UPDATE public.investment_plans SET
  min_investment = 3000000,
  max_investment = 10000000,
  weekly_roi_bps = 4900,
  price = CASE WHEN price < 3000000 THEN 3000000 ELSE price END
WHERE tier = 'premium';

UPDATE public.investment_plans SET
  min_investment = 10000000,
  max_investment = 50000000,
  weekly_roi_bps = 5600,
  price = CASE WHEN price < 10000000 THEN 10000000 ELSE price END
WHERE tier = 'elite';

COMMENT ON COLUMN public.investment_plans.max_investment IS
  'Portfolio ceiling from investment-portfolios config. Enforced by application validation.';

UPDATE public.roi_tiers SET
  min_ngn = 30000,
  max_ngn = 500000,
  weekly_roi_bps = 3500
WHERE name = 'Alto Starter';

UPDATE public.roi_tiers SET
  min_ngn = 500000,
  max_ngn = 3000000,
  weekly_roi_bps = 4200
WHERE name = 'Alto Growth';

UPDATE public.roi_tiers SET
  min_ngn = 3000000,
  max_ngn = 10000000,
  weekly_roi_bps = 4900
WHERE name = 'Alto Premium';

UPDATE public.roi_tiers SET
  min_ngn = 10000000,
  max_ngn = 50000000,
  weekly_roi_bps = 5600
WHERE name = 'Alto Elite';

COMMENT ON COLUMN public.roi_tiers.max_ngn IS
  'Portfolio ceiling aligned with investment-portfolios config. Enforced by application validation.';
