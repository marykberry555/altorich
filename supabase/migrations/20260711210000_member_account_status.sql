CREATE TYPE public.member_account_status AS ENUM ('active', 'paused', 'disabled', 'deactivated');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.member_account_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
