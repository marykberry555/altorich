-- Remove legacy package investment ceilings.
-- Sectors qualify by minimum entry only; principal is unlimited within the sector.

-- Sentinel "unlimited" ceiling kept for NOT NULL + CHECK (max >= min) compatibility.
-- Application code MUST ignore max_investment / max_ngn for allocation.

UPDATE public.investment_plans
SET max_investment = 999999999999.99
WHERE max_investment IS DISTINCT FROM 999999999999.99;

UPDATE public.roi_tiers
SET max_ngn = 999999999999.99
WHERE max_ngn IS DISTINCT FROM 999999999999.99;

COMMENT ON COLUMN public.investment_plans.max_investment IS
  'Legacy column. Ignored by investment allocation — sectors have minimum entry only (unlimited principal).';

COMMENT ON COLUMN public.roi_tiers.max_ngn IS
  'Legacy column. Ignored by ROI allocation — tiers have minimum entry only (unlimited principal).';
