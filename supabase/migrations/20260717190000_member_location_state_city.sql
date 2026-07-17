-- Member location for social proof and future regional features.
-- Stable state_code supports analytics/heatmaps without schema churn.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_state_code TEXT,
  ADD COLUMN IF NOT EXISTS location_city_area TEXT;

COMMENT ON COLUMN public.profiles.location_state_code IS
  'Canonical Nigerian state/FCT code from app location catalog (e.g. LA, FC).';
COMMENT ON COLUMN public.profiles.location_city_area IS
  'Canonical city/area name within location_state_code (no free text).';

CREATE INDEX IF NOT EXISTS idx_profiles_location_state
  ON public.profiles (location_state_code)
  WHERE location_state_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location_city
  ON public.profiles (location_state_code, location_city_area)
  WHERE location_city_area IS NOT NULL;
