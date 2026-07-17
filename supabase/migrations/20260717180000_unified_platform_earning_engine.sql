-- Unify all investment sectors onto the platform earning engine (5% daily / 35% weekly).
-- Products remain capital-allocation sectors; ROI is no longer product-specific.

UPDATE public.investment_plans
SET
  weekly_roi_bps = 3500,
  projected_daily = ROUND((min_investment::numeric * 3500 / 10000) / 7.0, 2),
  description = CASE slug
    WHEN 'starter' THEN 'High-Yield Savings & Fintech Lock Plans — earn up to the current platform return through structured savings pools and capital preservation strategies.'
    WHEN 'growth' THEN 'Agricultural Crowdfunding & Processing — earn up to the current platform return through Nigerian agricultural production and seasonal value chains.'
    WHEN 'premium' THEN 'Land Banking & Rental Property Cooperatives — earn up to the current platform return through asset-backed real estate and land banking.'
    WHEN 'elite' THEN 'Foreign Exchange & Hard Currency Assets — earn up to the current platform return through diversified hard-currency opportunities.'
    ELSE description
  END,
  risk_disclosure = 'Returns follow the Alto Rich platform earning model (up to 5% daily / 35% weekly equivalent). Earnings auto-reinvest weekly until you stop and withdraw.'
WHERE slug IN ('starter', 'growth', 'premium', 'elite');

-- Existing active investments inherit the unified engine rate on next settlement path.
UPDATE public.investments
SET weekly_roi_bps = 3500
WHERE status IN ('active', 'stopping', 'pending')
  AND (weekly_roi_bps IS DISTINCT FROM 3500);

UPDATE public.roi_tiers
SET weekly_roi_bps = 3500
WHERE name IN ('Alto Starter', 'Alto Growth', 'Alto Premium', 'Alto Elite');
