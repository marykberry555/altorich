-- Preferred investment package selected at registration (or updated in settings)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_package_slug TEXT
  CHECK (preferred_package_slug IS NULL OR preferred_package_slug IN ('starter', 'growth', 'premium', 'elite'));

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_package ON public.profiles(preferred_package_slug);
