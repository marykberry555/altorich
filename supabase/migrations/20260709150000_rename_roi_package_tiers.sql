-- Rename ROI tiers to match product package nomenclature
UPDATE public.roi_tiers SET name = 'Alto Starter' WHERE name = 'Tier 1';
UPDATE public.roi_tiers SET name = 'Alto Growth' WHERE name = 'Tier 2';
UPDATE public.roi_tiers SET name = 'Alto Premium' WHERE name = 'Tier 3';
UPDATE public.roi_tiers SET name = 'Alto Elite' WHERE name = 'Tier 4';

INSERT INTO public.roi_tiers (name, min_ngn, max_ngn, weekly_roi_bps, payout_weekday, payout_time)
VALUES
  ('Alto Starter', 30000, 100000, 2000, 1, '10:00:00'),
  ('Alto Growth', 101000, 500000, 2500, 1, '10:00:00'),
  ('Alto Premium', 501000, 5000000, 3000, 1, '10:00:00'),
  ('Alto Elite', 5001000, 50000000, 4000, 1, '10:00:00')
ON CONFLICT (name) DO UPDATE SET
  min_ngn = EXCLUDED.min_ngn,
  max_ngn = EXCLUDED.max_ngn,
  weekly_roi_bps = EXCLUDED.weekly_roi_bps;
